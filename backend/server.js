const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables FIRST (before importing supabase)
dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env'), override: true });

// NOW import supabase (after env vars are loaded)
const supabase = require('./config/supabase');

const app = express();
const PORT = process.env.PORT || 5002;
const HOST = process.env.HOST || 'localhost';
const JWT_SECRET = process.env.JWT_SECRET || 'change_me_dev_only';

// Middleware
app.use(cors());
app.use(express.json());

// ============================================
// HELPER FUNCTIONS
// ============================================

// Convert camelCase to snake_case for database
const toSnakeCase = (obj) => {
  const snakeObj = {};
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    snakeObj[snakeKey] = value;
  }
  return snakeObj;
};

// Convert snake_case to camelCase for API responses
const toCamelCase = (obj) => {
  if (!obj) return obj;
  const camelObj = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    camelObj[camelKey] = value;
  }
  return camelObj;
};

// Helper function to check if donor is eligible (90 days since last donation)
const isDonorEligible = (lastDonationDate) => {
  if (!lastDonationDate) return true;
  const daysSinceLastDonation = (new Date() - new Date(lastDonationDate)) / (1000 * 60 * 60 * 24);
  return daysSinceLastDonation >= 90;
};

// Helper function to get days until eligible
const getDaysUntilEligible = (lastDonationDate) => {
  if (!lastDonationDate) return 0;
  const daysSinceLastDonation = (new Date() - new Date(lastDonationDate)) / (1000 * 60 * 60 * 24);
  return Math.max(0, Math.ceil(90 - daysSinceLastDonation));
};

// Seed default admin from env if missing
async function ensureDefaultAdmin() {
  try {
    const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

    const { data: existing, error } = await supabase
      .from('admins')
      .select('*')
      .eq('username', ADMIN_USERNAME)
      .single();

    if (!existing) {
      const hashed = await bcrypt.hash(ADMIN_PASSWORD, 10);
      await supabase.from('admins').insert({ username: ADMIN_USERNAME, password: hashed });
      console.log('✅ Default admin user created');
    }
  } catch (err) {
    console.error('Failed to ensure default admin:', err);
  }
}

// Initialize database
ensureDefaultAdmin();

// ============================================
// AUTHENTICATION MIDDLEWARE
// ============================================

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    const { data: donor, error } = await supabase
      .from('donors')
      .select('*')
      .eq('id', decoded.donorId)
      .single();

    if (!donor || error) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    req.donor = donor;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid token' });
  }
};

// ============================================
// ROUTES
// ============================================

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'Blood Donation Management System API - Supabase Edition' });
});

// ============================================
// AUTH ROUTES
// ============================================

// Check if email is already registered
app.get('/api/auth/check-email', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ message: 'Email is required' });
    }

    const lookup = String(email).trim();
    const { data, error } = await supabase
      .from('donors')
      .select('id')
      .eq('email', lookup)
      .single();

    return res.json({ exists: !!data });
  } catch (error) {
    console.error('Check email error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Check if phone number is already registered
app.get('/api/auth/check-phone', async (req, res) => {
  try {
    const { phone } = req.query;
    if (!phone || typeof phone !== 'string') {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    const lookup = String(phone).trim();
    const { data, error } = await supabase
      .from('donors')
      .select('id')
      .eq('phone_number', lookup)
      .single();

    return res.json({ exists: !!data });
  } catch (error) {
    console.error('Check phone error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Donor Signup
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password, bloodGroup, location, phoneNumber } = req.body;

    // Check if donor already exists
    const { data: existingEmail } = await supabase
      .from('donors')
      .select('id')
      .eq('email', email)
      .single();

    if (existingEmail) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    // Check if phone number already exists
    const { data: existingPhone } = await supabase
      .from('donors')
      .select('id')
      .eq('phone_number', phoneNumber)
      .single();

    if (existingPhone) {
      return res.status(400).json({ message: 'Phone number already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new donor
    const { data: donor, error } = await supabase
      .from('donors')
      .insert({
        name,
        email,
        password: hashedPassword,
        blood_group: bloodGroup,
        location,
        phone_number: phoneNumber
      })
      .select()
      .single();

    if (error) {
      console.error('Signup error:', error);
      return res.status(500).json({ message: 'Server error during registration' });
    }

    res.status(201).json({ 
      message: 'Donor registered successfully',
      donorId: donor.id 
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Donor Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find donor by email
    const { data: donor, error } = await supabase
      .from('donors')
      .select('*')
      .eq('email', email)
      .single();

    if (!donor || error) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, donor.password);
    if (!isValidPassword) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign({ donorId: donor.id }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      message: 'Login successful',
      token,
      donor: {
        id: donor.id,
        name: donor.name,
        email: donor.email,
        bloodGroup: donor.blood_group,
        location: donor.location,
        phoneNumber: donor.phone_number
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Donor: Change password
app.post('/api/auth/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'currentPassword and newPassword are required' });
    }
    
    if (String(newPassword).length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    const { data: donor } = await supabase
      .from('donors')
      .select('*')
      .eq('id', req.donor.id)
      .single();

    if (!donor) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, donor.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    
    const { error } = await supabase
      .from('donors')
      .update({ password: hashed })
      .eq('id', req.donor.id);

    if (error) {
      return res.status(500).json({ message: 'Server error during password change' });
    }

    return res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error during password change' });
  }
});

// ============================================
// DONOR PROFILE ROUTES
// ============================================

// Get donor profile
app.get('/api/donor/profile', authenticateToken, async (req, res) => {
  try {
    const donor = req.donor;
    const eligible = isDonorEligible(donor.last_donation_date);
    const daysUntilEligible = getDaysUntilEligible(donor.last_donation_date);
    
    res.json({
      _id: donor.id,
      id: donor.id,
      name: donor.name,
      email: donor.email,
      bloodGroup: donor.blood_group,
      location: donor.location,
      phoneNumber: donor.phone_number,
      lastDonationDate: donor.last_donation_date,
      eligible: eligible,
      daysUntilEligible: daysUntilEligible
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update donor profile
app.put('/api/donor/profile', authenticateToken, async (req, res) => {
  try {
    const { name, location, phoneNumber } = req.body;
    
    const { data: updatedDonor, error } = await supabase
      .from('donors')
      .update({ 
        name, 
        location, 
        phone_number: phoneNumber 
      })
      .eq('id', req.donor.id)
      .select()
      .single();

    if (error) {
      console.error('Profile update error:', error);
      return res.status(500).json({ message: 'Server error during profile update' });
    }

    const eligible = isDonorEligible(updatedDonor.last_donation_date);
    const daysUntilEligible = getDaysUntilEligible(updatedDonor.last_donation_date);
    
    res.json({
      _id: updatedDonor.id,
      id: updatedDonor.id,
      name: updatedDonor.name,
      email: updatedDonor.email,
      bloodGroup: updatedDonor.blood_group,
      location: updatedDonor.location,
      phoneNumber: updatedDonor.phone_number,
      lastDonationDate: updatedDonor.last_donation_date,
      eligible: eligible,
      daysUntilEligible: daysUntilEligible
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Server error during profile update' });
  }
});

// Check donor eligibility
app.get('/api/donor/eligibility/:donorId', authenticateToken, async (req, res) => {
  try {
    const { data: donor, error } = await supabase
      .from('donors')
      .select('*')
      .eq('id', req.params.donorId)
      .single();

    if (!donor || error) {
      return res.status(404).json({ message: 'Donor not found' });
    }

    const eligible = isDonorEligible(donor.last_donation_date);
    const daysUntilEligible = getDaysUntilEligible(donor.last_donation_date);

    res.json({
      donorId: donor.id,
      eligible: eligible,
      daysUntilEligible: daysUntilEligible,
      lastDonationDate: donor.last_donation_date
    });
  } catch (error) {
    console.error('Eligibility check error:', error);
    res.status(500).json({ message: 'Server error during eligibility check' });
  }
});

// ============================================
// DONOR SEARCH & REQUESTS
// ============================================

// Search donors
app.get('/api/donor/search', authenticateToken, async (req, res) => {
  try {
    const { location, bloodGroup } = req.query;

    let query = supabase
      .from('donors')
      .select('*')
      .neq('id', req.donor.id); // Exclude current user

    if (location) {
      query = query.ilike('location', `%${location}%`);
    }

    if (bloodGroup) {
      query = query.eq('blood_group', bloodGroup);
    }

    const { data: donors, error } = await query;

    if (error) {
      console.error('Search error:', error);
      return res.status(500).json({ message: 'Server error during search' });
    }

    if (!donors || donors.length === 0) {
      return res.json([]);
    }

    // Get ratings for donors
    const donorIds = donors.map(d => d.id);
    const { data: requests } = await supabase
      .from('blood_requests')
      .select('donor_id, rating')
      .in('donor_id', donorIds)
      .eq('status', 'completed')
      .gte('rating', 1);

    // Calculate average ratings
    const ratingMap = new Map();
    if (requests) {
      requests.forEach(r => {
        if (!ratingMap.has(r.donor_id)) {
          ratingMap.set(r.donor_id, { sum: 0, count: 0 });
        }
        const stats = ratingMap.get(r.donor_id);
        stats.sum += r.rating;
        stats.count += 1;
      });
    }

    // Filter and map donors
    const result = donors
      .map(d => {
        const eligible = isDonorEligible(d.last_donation_date);
        const daysUntilEligible = getDaysUntilEligible(d.last_donation_date);
        const ratingStats = ratingMap.get(d.id);
        
        return {
          _id: d.id,
          id: d.id,
          name: d.name,
          email: d.email,
          bloodGroup: d.blood_group,
          location: d.location,
          phoneNumber: d.phone_number,
          avgRating: ratingStats ? Math.round((ratingStats.sum / ratingStats.count) * 10) / 10 : null,
          ratingCount: ratingStats ? ratingStats.count : 0,
          eligible: eligible,
          daysUntilEligible: daysUntilEligible,
          lastDonationDate: d.last_donation_date
        };
      })
      .filter(donor => donor.eligible === true);

    res.json(result);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ message: 'Server error during search' });
  }
});

// Send blood request
app.post('/api/donor/request', authenticateToken, async (req, res) => {
  try {
    const { donorId } = req.body;
    const requester = req.donor;

    // Find the donor being requested
    const { data: donor, error: donorError } = await supabase
      .from('donors')
      .select('*')
      .eq('id', donorId)
      .single();

    if (!donor || donorError) {
      return res.status(404).json({ message: 'Donor not found' });
    }

    // Check if donor is eligible
    if (!isDonorEligible(donor.last_donation_date)) {
      const daysUntilEligible = getDaysUntilEligible(donor.last_donation_date);
      return res.status(400).json({ 
        message: `Donor is not eligible to donate yet. Please wait ${daysUntilEligible} more days.`,
        daysUntilEligible: daysUntilEligible
      });
    }

    // Check for existing pending request
    const { data: existing } = await supabase
      .from('blood_requests')
      .select('*')
      .eq('requester_id', requester.id)
      .eq('donor_id', donorId)
      .eq('status', 'pending')
      .single();

    if (existing) {
      return res.status(400).json({ message: 'A pending request to this user already exists' });
    }

    // Create blood request
    const { data: bloodRequest, error: requestError } = await supabase
      .from('blood_requests')
      .insert({
        requester_id: requester.id,
        donor_id: donorId,
        requester_name: requester.name,
        donor_name: donor.name,
        blood_group: donor.blood_group,
        location: donor.location
      })
      .select()
      .single();

    if (requestError) {
      console.error('Blood request error:', requestError);
      return res.status(500).json({ message: 'Server error during blood request' });
    }

    res.status(201).json({ 
      message: 'Blood request sent successfully',
      requestId: bloodRequest.id 
    });
  } catch (error) {
    console.error('Blood request error:', error);
    res.status(500).json({ message: 'Server error during blood request' });
  }
});

// Get donor's own blood requests
app.get('/api/donor/requests', authenticateToken, async (req, res) => {
  try {
    const { type } = req.query;
    const me = req.donor.id;

    let query = supabase.from('blood_requests').select('*');

    if (type === 'sent') {
      query = query.eq('requester_id', me);
    } else if (type === 'received') {
      query = query.eq('donor_id', me);
    } else {
      query = query.or(`requester_id.eq.${me},donor_id.eq.${me}`);
    }

    const { data: items, error } = await query.order('created_at', { ascending: false }).limit(100);

    if (error) {
      console.error('Requests fetch error:', error);
      return res.status(500).json({ message: 'Server error fetching requests' });
    }

    // Convert to camelCase for API response
    const convertedItems = items.map(item => ({
      _id: item.id,
      id: item.id,
      requesterId: item.requester_id,
      donorId: item.donor_id,
      requesterName: item.requester_name,
      donorName: item.donor_name,
      bloodGroup: item.blood_group,
      location: item.location,
      status: item.status,
      note: item.note,
      rating: item.rating,
      createdAt: item.created_at,
      updatedAt: item.updated_at
    }));

    res.json(convertedItems);
  } catch (error) {
    console.error('Requests fetch error:', error);
    res.status(500).json({ message: 'Server error fetching requests' });
  }
});

// Reject a blood request
app.patch('/api/donor/requests/:id/reject', authenticateToken, async (req, res) => {
  try {
    const me = req.donor.id;
    const { note } = req.body;

    const { data: request, error: fetchError } = await supabase
      .from('blood_requests')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (!request || fetchError) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (request.donor_id !== me) {
      return res.status(403).json({ message: 'Not authorized to reject this request' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending requests can be rejected' });
    }

    const { data: updated, error } = await supabase
      .from('blood_requests')
      .update({ status: 'rejected', note: note || '' })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) {
      console.error('Reject error:', error);
      return res.status(500).json({ message: 'Server error during request rejection' });
    }

    // Convert to camelCase
    const convertedUpdated = {
      _id: updated.id,
      id: updated.id,
      requesterId: updated.requester_id,
      donorId: updated.donor_id,
      requesterName: updated.requester_name,
      donorName: updated.donor_name,
      bloodGroup: updated.blood_group,
      location: updated.location,
      status: updated.status,
      note: updated.note,
      rating: updated.rating,
      createdAt: updated.created_at,
      updatedAt: updated.updated_at
    };

    return res.json(convertedUpdated);
  } catch (error) {
    console.error('Reject request error:', error);
    res.status(500).json({ message: 'Server error during request rejection' });
  }
});

// Accept a blood request
app.patch('/api/donor/requests/:id/accept', authenticateToken, async (req, res) => {
  try {
    const me = req.donor.id;

    const { data: request, error: fetchError } = await supabase
      .from('blood_requests')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (!request || fetchError) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (request.donor_id !== me) {
      return res.status(403).json({ message: 'Not authorized to accept this request' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending requests can be accepted' });
    }

    const { data: updated, error } = await supabase
      .from('blood_requests')
      .update({ status: 'accepted' })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) {
      console.error('Accept error:', error);
      return res.status(500).json({ message: 'Server error during request acceptance' });
    }

    // Convert to camelCase
    const convertedUpdated = {
      _id: updated.id,
      id: updated.id,
      requesterId: updated.requester_id,
      donorId: updated.donor_id,
      requesterName: updated.requester_name,
      donorName: updated.donor_name,
      bloodGroup: updated.blood_group,
      location: updated.location,
      status: updated.status,
      note: updated.note,
      rating: updated.rating,
      createdAt: updated.created_at,
      updatedAt: updated.updated_at
    };

    return res.json(convertedUpdated);
  } catch (error) {
    console.error('Accept request error:', error);
    res.status(500).json({ message: 'Server error during request acceptance' });
  }
});

// Cancel a blood request
app.patch('/api/donor/requests/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const me = req.donor.id;
    const { note } = req.body;

    const { data: request, error: fetchError } = await supabase
      .from('blood_requests')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (!request || fetchError) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (request.requester_id !== me) {
      return res.status(403).json({ message: 'Not authorized to cancel this request' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending requests can be cancelled' });
    }

    const { data: updated, error } = await supabase
      .from('blood_requests')
      .update({ status: 'cancelled', note: note || request.note })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) {
      console.error('Cancel error:', error);
      return res.status(500).json({ message: 'Server error during request cancellation' });
    }

    // Convert to camelCase
    const convertedUpdated = {
      _id: updated.id,
      id: updated.id,
      requesterId: updated.requester_id,
      donorId: updated.donor_id,
      requesterName: updated.requester_name,
      donorName: updated.donor_name,
      bloodGroup: updated.blood_group,
      location: updated.location,
      status: updated.status,
      note: updated.note,
      rating: updated.rating,
      createdAt: updated.created_at,
      updatedAt: updated.updated_at
    };

    return res.json(convertedUpdated);
  } catch (error) {
    console.error('Cancel request error:', error);
    res.status(500).json({ message: 'Server error during request cancellation' });
  }
});

// Complete a blood request
app.patch('/api/donor/requests/:id/complete', authenticateToken, async (req, res) => {
  try {
    const me = req.donor.id;

    const { data: request, error: fetchError } = await supabase
      .from('blood_requests')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (!request || fetchError) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (request.requester_id !== me && request.donor_id !== me) {
      return res.status(403).json({ message: 'Not authorized to complete this request' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending requests can be completed' });
    }

    // Only the requester can mark as completed
    if (request.donor_id === me) {
      return res.status(403).json({ message: 'Only the requester can mark this request as completed' });
    }

    // Require rating from requester
    const { rating } = req.body || {};
    const r = Number(rating);
    if (!r || r < 1 || r > 5) {
      return res.status(400).json({ message: 'Rating (1-5) is required when requester completes' });
    }

    const { data: updated, error } = await supabase
      .from('blood_requests')
      .update({ status: 'completed', rating: r })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) {
      console.error('Complete error:', error);
      return res.status(500).json({ message: 'Server error during request completion' });
    }

    // Update donor's last donation date
    await supabase
      .from('donors')
      .update({ last_donation_date: new Date().toISOString() })
      .eq('id', request.donor_id);

    // Convert to camelCase
    const convertedUpdated = {
      _id: updated.id,
      id: updated.id,
      requesterId: updated.requester_id,
      donorId: updated.donor_id,
      requesterName: updated.requester_name,
      donorName: updated.donor_name,
      bloodGroup: updated.blood_group,
      location: updated.location,
      status: updated.status,
      note: updated.note,
      rating: updated.rating,
      createdAt: updated.created_at,
      updatedAt: updated.updated_at
    };

    return res.json(convertedUpdated);
  } catch (error) {
    console.error('Complete request error:', error);
    res.status(500).json({ message: 'Server error during request completion' });
  }
});

// Donation history
app.get('/api/donor/history', authenticateToken, async (req, res) => {
  try {
    const me = req.donor.id;

    const { data: items, error } = await supabase
      .from('blood_requests')
      .select('*')
      .in('status', ['completed', 'accepted'])
      .or(`requester_id.eq.${me},donor_id.eq.${me}`)
      .order('updated_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('History fetch error:', error);
      return res.status(500).json({ message: 'Server error fetching donation history' });
    }

    // Convert to camelCase
    const convertedItems = items.map(item => ({
      _id: item.id,
      id: item.id,
      requesterId: item.requester_id,
      donorId: item.donor_id,
      requesterName: item.requester_name,
      donorName: item.donor_name,
      bloodGroup: item.blood_group,
      location: item.location,
      status: item.status,
      note: item.note,
      rating: item.rating,
      createdAt: item.created_at,
      updatedAt: item.updated_at
    }));

    res.json(convertedItems);
  } catch (error) {
    console.error('Donation history fetch error:', error);
    res.status(500).json({ message: 'Server error fetching donation history' });
  }
});

// ============================================
// DEBUG ROUTES
// ============================================

app.get('/api/debug/requests', authenticateToken, async (req, res) => {
  try {
    const { id } = req.query;
    
    if (id) {
      const { data: item, error } = await supabase
        .from('blood_requests')
        .select('*')
        .eq('id', id)
        .single();

      if (!item || error) {
        return res.status(404).json({ message: 'Request not found' });
      }
      
      return res.json(item);
    }

    const { data: items, error } = await supabase
      .from('blood_requests')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      return res.status(500).json({ message: 'Server error' });
    }

    return res.json(items);
  } catch (error) {
    console.error('Debug requests error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============================================
// MESSAGING ROUTES
// ============================================

// Send a message
app.post('/api/messages', authenticateToken, async (req, res) => {
  try {
    const senderId = req.donor.id;
    const { receiverId, text } = req.body;

    if (!receiverId || !text) {
      return res.status(400).json({ message: 'receiverId and text are required' });
    }

    const { data: receiver, error: receiverError } = await supabase
      .from('donors')
      .select('id')
      .eq('id', receiverId)
      .single();

    if (!receiver || receiverError) {
      return res.status(404).json({ message: 'Receiver not found' });
    }

    const { data: msg, error } = await supabase
      .from('messages')
      .insert({ sender_id: senderId, receiver_id: receiverId, text })
      .select()
      .single();

    if (error) {
      console.error('Send message error:', error);
      return res.status(500).json({ message: 'Server error sending message' });
    }

    // Convert to camelCase
    const convertedMsg = {
      _id: msg.id,
      id: msg.id,
      senderId: msg.sender_id,
      receiverId: msg.receiver_id,
      text: msg.text,
      read: msg.read,
      createdAt: msg.created_at
    };

    return res.status(201).json(convertedMsg);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error sending message' });
  }
});

// Get conversation messages
app.get('/api/messages/conversation', authenticateToken, async (req, res) => {
  try {
    const me = req.donor.id;
    const other = req.query.userId || '';

    if (!other) {
      return res.status(400).json({ message: 'userId query param is required' });
    }

    const { data: items, error } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${me},receiver_id.eq.${other}),and(sender_id.eq.${other},receiver_id.eq.${me})`)
      .order('created_at', { ascending: true })
      .limit(100);

    if (error) {
      console.error('Conversation fetch error:', error);
      return res.status(500).json({ message: 'Server error fetching conversation' });
    }

    // Mark messages as read
    await supabase
      .from('messages')
      .update({ read: true })
      .eq('sender_id', other)
      .eq('receiver_id', me)
      .eq('read', false);

    // Convert to camelCase
    const convertedItems = items.map(item => ({
      _id: item.id,
      id: item.id,
      senderId: item.sender_id,
      receiverId: item.receiver_id,
      text: item.text,
      read: item.read,
      createdAt: item.created_at
    }));

    res.json(convertedItems);
  } catch (error) {
    console.error('Conversation fetch error:', error);
    res.status(500).json({ message: 'Server error fetching conversation' });
  }
});

// List conversations
app.get('/api/messages/conversations', authenticateToken, async (req, res) => {
  try {
    const me = req.donor.id;

    const { data: msgs, error } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${me},receiver_id.eq.${me}`)
      .order('created_at', { ascending: false })
      .limit(500);

    if (error) {
      console.error('Conversations list error:', error);
      return res.status(500).json({ message: 'Server error fetching conversations' });
    }

    const map = new Map();
    for (const m of msgs) {
      const partner = m.sender_id === me ? m.receiver_id : m.sender_id;
      if (!map.has(partner)) map.set(partner, m);
    }

    const list = [];
    for (const [partnerId, lastMsg] of map.entries()) {
      const { data: partner } = await supabase
        .from('donors')
        .select('id, name, blood_group')
        .eq('id', partnerId)
        .single();

      const convertedMsg = {
        _id: lastMsg.id,
        id: lastMsg.id,
        senderId: lastMsg.sender_id,
        receiverId: lastMsg.receiver_id,
        text: lastMsg.text,
        read: lastMsg.read,
        createdAt: lastMsg.created_at
      };

      list.push({ 
        partner: partner ? { 
          _id: partner.id, 
          name: partner.name, 
          bloodGroup: partner.blood_group 
        } : { _id: partnerId }, 
        lastMessage: convertedMsg 
      });
    }

    res.json(list);
  } catch (error) {
    console.error('Conversations list error:', error);
    res.status(500).json({ message: 'Server error fetching conversations' });
  }
});

// Mark message as read
app.patch('/api/messages/:id/read', authenticateToken, async (req, res) => {
  try {
    const me = req.donor.id;

    const { data: msg, error: fetchError } = await supabase
      .from('messages')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (!msg || fetchError) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (msg.receiver_id !== me) {
      return res.status(403).json({ message: 'Not authorized to mark this message' });
    }

    const { data: updated, error } = await supabase
      .from('messages')
      .update({ read: true })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) {
      console.error('Mark read error:', error);
      return res.status(500).json({ message: 'Server error' });
    }

    // Convert to camelCase
    const convertedUpdated = {
      _id: updated.id,
      id: updated.id,
      senderId: updated.sender_id,
      receiverId: updated.receiver_id,
      text: updated.text,
      read: updated.read,
      createdAt: updated.created_at
    };

    res.json(convertedUpdated);
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============================================
// ADMIN ROUTES
// ============================================

// Admin login
app.post('/api/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const { data: admin, error } = await supabase
      .from('admins')
      .select('*')
      .eq('username', username)
      .single();

    if (!admin || error) {
      return res.status(401).json({ message: 'Invalid admin credentials' });
    }

    const isValid = await bcrypt.compare(password, admin.password);
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid admin credentials' });
    }

    return res.json({ message: 'Admin login successful' });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ message: 'Server error during admin login' });
  }
});

// Admin change password
app.post('/api/admin/change-password', async (req, res) => {
  try {
    const { username, currentPassword, newPassword } = req.body;
    
    if (!username || !currentPassword || !newPassword) {
      return res.status(400).json({ message: 'username, currentPassword and newPassword are required' });
    }
    
    if (String(newPassword).length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    const { data: admin, error } = await supabase
      .from('admins')
      .select('*')
      .eq('username', username)
      .single();

    if (!admin || error) {
      return res.status(401).json({ message: 'Invalid admin credentials' });
    }

    const isValid = await bcrypt.compare(currentPassword, admin.password);
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid admin credentials' });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    
    await supabase
      .from('admins')
      .update({ password: hashed })
      .eq('username', username);

    return res.json({ message: 'Admin password changed successfully' });
  } catch (error) {
    console.error('Admin change password error:', error);
    res.status(500).json({ message: 'Server error during admin password change' });
  }
});

// Admin: List donors
app.get('/api/admin/donors', async (req, res) => {
  try {
    const { query, bloodGroup, status, location, page = 1, limit = 20 } = req.query;

    let dbQuery = supabase.from('donors').select('*', { count: 'exact' });

    if (query) {
      dbQuery = dbQuery.or(`name.ilike.%${query}%,email.ilike.%${query}%,phone_number.ilike.%${query}%`);
    }
    if (bloodGroup) {
      dbQuery = dbQuery.eq('blood_group', bloodGroup);
    }
    if (status) {
      dbQuery = dbQuery.eq('status', status);
    }
    if (location) {
      dbQuery = dbQuery.ilike('location', `%${location}%`);
    }

    const offset = (Number(page) - 1) * Number(limit);
    const { data: items, error, count } = await dbQuery
      .order('created_at', { ascending: false })
      .range(offset, offset + Number(limit) - 1);

    if (error) {
      console.error('Admin donors list error:', error);
      return res.status(500).json({ message: 'Server error' });
    }

    // Convert to camelCase and remove password
    const convertedItems = items.map(item => ({
      _id: item.id,
      id: item.id,
      name: item.name,
      email: item.email,
      bloodGroup: item.blood_group,
      location: item.location,
      phoneNumber: item.phone_number,
      status: item.status,
      verified: item.verified,
      verificationNote: item.verification_note,
      lastDonationDate: item.last_donation_date,
      createdAt: item.created_at
    }));

    res.json({ items: convertedItems, total: count, page: Number(page), limit: Number(limit) });
  } catch (error) {
    console.error('Admin donors list error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Get donor by id
app.get('/api/admin/donors/:id', async (req, res) => {
  try {
    const { data: donor, error } = await supabase
      .from('donors')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (!donor || error) {
      return res.status(404).json({ message: 'Donor not found' });
    }

    const eligible = isDonorEligible(donor.last_donation_date);
    const daysUntilEligible = getDaysUntilEligible(donor.last_donation_date);

    const donorWithEligibility = {
      _id: donor.id,
      id: donor.id,
      name: donor.name,
      email: donor.email,
      bloodGroup: donor.blood_group,
      location: donor.location,
      phoneNumber: donor.phone_number,
      status: donor.status,
      verified: donor.verified,
      verificationNote: donor.verification_note,
      lastDonationDate: donor.last_donation_date,
      createdAt: donor.created_at,
      eligible: eligible,
      daysUntilEligible: daysUntilEligible
    };

    res.json(donorWithEligibility);
  } catch (error) {
    console.error('Admin donor get error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Update donor
app.patch('/api/admin/donors/:id', async (req, res) => {
  try {
    const { name, email, bloodGroup, location, phoneNumber } = req.body;
    
    const update = {};
    if (name !== undefined) update.name = name;
    if (email !== undefined) update.email = email;
    if (bloodGroup !== undefined) update.blood_group = bloodGroup;
    if (location !== undefined) update.location = location;
    if (phoneNumber !== undefined) update.phone_number = phoneNumber;

    const { data: donor, error } = await supabase
      .from('donors')
      .update(update)
      .eq('id', req.params.id)
      .select()
      .single();

    if (!donor || error) {
      return res.status(404).json({ message: 'Donor not found' });
    }

    // Convert to camelCase
    const convertedDonor = {
      _id: donor.id,
      id: donor.id,
      name: donor.name,
      email: donor.email,
      bloodGroup: donor.blood_group,
      location: donor.location,
      phoneNumber: donor.phone_number,
      status: donor.status,
      verified: donor.verified,
      verificationNote: donor.verification_note,
      lastDonationDate: donor.last_donation_date,
      createdAt: donor.created_at
    };

    res.json(convertedDonor);
  } catch (error) {
    console.error('Admin donor update error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Update donor status
app.patch('/api/admin/donors/:id/status', async (req, res) => {
  try {
    const { status, reason } = req.body;
    
    if (!['active', 'suspended'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const { data: donor, error } = await supabase
      .from('donors')
      .update({ status, verification_note: reason })
      .eq('id', req.params.id)
      .select()
      .single();

    if (!donor || error) {
      return res.status(404).json({ message: 'Donor not found' });
    }

    // Convert to camelCase
    const convertedDonor = {
      _id: donor.id,
      id: donor.id,
      name: donor.name,
      email: donor.email,
      bloodGroup: donor.blood_group,
      location: donor.location,
      phoneNumber: donor.phone_number,
      status: donor.status,
      verified: donor.verified,
      verificationNote: donor.verification_note,
      lastDonationDate: donor.last_donation_date,
      createdAt: donor.created_at
    };

    res.json(convertedDonor);
  } catch (error) {
    console.error('Admin donor status update error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Verify donor
app.patch('/api/admin/donors/:id/verify', async (req, res) => {
  try {
    const { verified, note } = req.body;

    const { data: donor, error } = await supabase
      .from('donors')
      .update({ verified: Boolean(verified), verification_note: note })
      .eq('id', req.params.id)
      .select()
      .single();

    if (!donor || error) {
      return res.status(404).json({ message: 'Donor not found' });
    }

    // Convert to camelCase
    const convertedDonor = {
      _id: donor.id,
      id: donor.id,
      name: donor.name,
      email: donor.email,
      bloodGroup: donor.blood_group,
      location: donor.location,
      phoneNumber: donor.phone_number,
      status: donor.status,
      verified: donor.verified,
      verificationNote: donor.verification_note,
      lastDonationDate: donor.last_donation_date,
      createdAt: donor.created_at
    };

    res.json(convertedDonor);
  } catch (error) {
    console.error('Admin donor verify error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Delete donor
app.delete('/api/admin/donors/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('donors')
      .delete()
      .eq('id', req.params.id);

    if (error) {
      return res.status(404).json({ message: 'Donor not found' });
    }

    res.json({ message: 'Donor deleted' });
  } catch (error) {
    console.error('Admin donor delete error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Get all blood requests
app.get('/api/admin/requests', async (req, res) => {
  try {
    const { data: requests, error } = await supabase
      .from('blood_requests')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Requests fetch error:', error);
      return res.status(500).json({ message: 'Server error' });
    }

    // Convert to camelCase
    const convertedRequests = requests.map(item => ({
      _id: item.id,
      id: item.id,
      requesterId: item.requester_id,
      donorId: item.donor_id,
      requesterName: item.requester_name,
      donorName: item.donor_name,
      bloodGroup: item.blood_group,
      location: item.location,
      status: item.status,
      note: item.note,
      rating: item.rating,
      createdAt: item.created_at,
      updatedAt: item.updated_at
    }));

    res.json(convertedRequests);
  } catch (error) {
    console.error('Requests fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Get stats
app.get('/api/admin/stats', async (req, res) => {
  try {
    // Get active requests count
    const { count: activeRequests } = await supabase
      .from('blood_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    // Get total donors count
    const { count: totalDonors } = await supabase
      .from('donors')
      .select('*', { count: 'exact', head: true });

    // Get donors by blood group
    const { data: groups } = await supabase
      .from('donors')
      .select('blood_group');

    const donorsByBloodGroup = {};
    if (groups) {
      groups.forEach(g => {
        donorsByBloodGroup[g.blood_group] = (donorsByBloodGroup[g.blood_group] || 0) + 1;
      });
    }

    res.json({ 
      activeRequests: activeRequests || 0, 
      totalDonors: totalDonors || 0, 
      donorsByBloodGroup 
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============================================
// ERROR HANDLING
// ============================================

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Blood Donation API (Supabase) running on http://${HOST}:${PORT}`);
  console.log(`📊 Database: Supabase PostgreSQL`);
  if (!process.env.JWT_SECRET) {
    console.warn('⚠️  Warning: JWT_SECRET is not set. Using an insecure default for development.');
  }
});
