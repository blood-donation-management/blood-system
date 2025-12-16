const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const dotenv = require('dotenv');
// Load backend/.env first (if present)
dotenv.config({ path: path.resolve(__dirname, '.env') });
// Force-load root .env to override any defaults or missing vars
dotenv.config({ path: path.resolve(__dirname, '../.env'), override: true });

const app = express();
const PORT = process.env.PORT || 5002;
const HOST = process.env.HOST || 'localhost';
const JWT_SECRET = process.env.JWT_SECRET || 'change_me_dev_only';

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/blood_donation';
// Log which DB target we're attempting (without leaking credentials)
try {
  const redacted = MONGODB_URI.replace(/\/\/[\w%+-]+:[^@]+@/i, '//<redacted>@');
  console.log('[Backend] Mongo target:', redacted.startsWith('mongodb+srv') ? 'Atlas SRV' : redacted);
} catch {}

mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB Atlas');
    await ensureDefaultAdmin();
  })
  .catch(err => console.error('MongoDB connection error:', err));

// Middleware
app.use(cors());
app.use(express.json());

// Donor Schema
const donorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  bloodGroup: { type: String, required: true },
  location: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  status: { type: String, enum: ['active', 'suspended'], default: 'active' },
  verified: { type: Boolean, default: false },
  verificationNote: { type: String },
  lastDonationDate: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

// (moved) cancel/complete routes are defined after authenticateToken

const Donor = mongoose.model('Donor', donorSchema);

// Admin Schema
const adminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const Admin = mongoose.model('Admin', adminSchema);

// Seed default admin from env if missing
async function ensureDefaultAdmin() {
  try {
    const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

    const existing = await Admin.findOne({ username: ADMIN_USERNAME });
    if (!existing) {
      const hashed = await bcrypt.hash(ADMIN_PASSWORD, 10);
      await Admin.create({ username: ADMIN_USERNAME, password: hashed });
      console.log('Default admin user created');
    }
  } catch (err) {
    console.error('Failed to ensure default admin:', err);
  }
}

// Blood Request Schema
const requestSchema = new mongoose.Schema({
  requesterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Donor', required: true },
  donorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Donor', required: true },
  requesterName: { type: String, required: true },
  donorName: { type: String, required: true },
  bloodGroup: { type: String, required: true },
  location: { type: String, required: true },
  status: { type: String, enum: ['pending', 'rejected', 'completed', 'cancelled'], default: 'pending' },
  note: { type: String },
  // Rating provided by requester for donor upon completion (1-5)
  rating: { type: Number, min: 1, max: 5 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
requestSchema.pre('save', function(next) { this.updatedAt = new Date(); next(); });
requestSchema.pre('findOneAndUpdate', function(next) { this.set({ updatedAt: new Date() }); next(); });

const BloodRequest = mongoose.model('BloodRequest', requestSchema);

// Message Schema (for in-app communication between users)
const messageSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Donor', required: true },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'Donor', required: true },
  text: { type: String, required: true },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

const Message = mongoose.model('Message', messageSchema);

// Helper function to check if donor is eligible (90 days since last donation)
const isDonorEligible = (lastDonationDate) => {
  if (!lastDonationDate) return true; // Never donated before
  const daysSinceLastDonation = (new Date() - new Date(lastDonationDate)) / (1000 * 60 * 60 * 24);
  return daysSinceLastDonation >= 90;
};

// Helper function to get days until eligible
const getDaysUntilEligible = (lastDonationDate) => {
  if (!lastDonationDate) return 0;
  const daysSinceLastDonation = (new Date() - new Date(lastDonationDate)) / (1000 * 60 * 60 * 24);
  return Math.max(0, Math.ceil(90 - daysSinceLastDonation));
};

// Authentication middleware
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const donor = await Donor.findById(decoded.donorId);
    if (!donor) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    req.donor = donor;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid token' });
  }
};

// Routes

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'Blood Donation Management System API' });
});

// Check if email is already registered
app.get('/api/auth/check-email', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ message: 'Email is required' });
    }
    const lookup = String(email).trim();
    const existing = await Donor.findOne({ email: lookup }).lean();
    return res.json({ exists: !!existing });
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
    const existing = await Donor.findOne({ phoneNumber: lookup }).lean();
    return res.json({ exists: !!existing });
  } catch (error) {
    console.error('Check phone error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Donor: Donation history (completed requests where user participated)
app.get('/api/donor/history', authenticateToken, async (req, res) => {
  try {
    const me = req.donor._id;
    const items = await BloodRequest.find({
        // Include accepted and completed requests in history so accepted donations appear
        status: { $in: ['completed', 'accepted'] },
        $or: [
          { requesterId: me },
          { donorId: me },
        ],
      })
      .sort({ updatedAt: -1 })
      .limit(100);
    res.json(items);
  } catch (error) {
    console.error('Donation history fetch error:', error);
    res.status(500).json({ message: 'Server error fetching donation history' });
  }
});

// Debug: list recent requests or fetch one by id (authenticated)
app.get('/api/debug/requests', authenticateToken, async (req, res) => {
  try {
    const { id } = req.query;
    if (id) {
      console.log('[Debug] Fetch request by id', id);
      const item = await BloodRequest.findById(id);
      if (!item) return res.status(404).json({ message: 'Request not found' });
      return res.json(item);
    }
    console.log('[Debug] Fetch recent requests');
    const items = await BloodRequest.find().sort({ createdAt: -1 }).limit(50);
    return res.json(items);
  } catch (error) {
    console.error('Debug requests error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Messaging endpoints
// Send a message from authenticated user to another donor
app.post('/api/messages', authenticateToken, async (req, res) => {
  try {
    const senderId = req.donor._id;
    const { receiverId, text } = req.body;
    if (!receiverId || !text) return res.status(400).json({ message: 'receiverId and text are required' });
    const receiver = await Donor.findById(receiverId);
    if (!receiver) return res.status(404).json({ message: 'Receiver not found' });

    const msg = new Message({ senderId, receiverId, text });
    await msg.save();
    return res.status(201).json(msg);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error sending message' });
  }
});

// Get conversation messages between authenticated user and another user
app.get('/api/messages/conversation', authenticateToken, async (req, res) => {
  try {
    const me = String(req.donor._id);
    const other = String(req.query.userId || '');
    if (!other) return res.status(400).json({ message: 'userId query param is required' });

    const items = await Message.find({
      $or: [
        { senderId: me, receiverId: other },
        { senderId: other, receiverId: me }
      ]
    }).sort({ createdAt: 1 }).limit(100);

    // Mark messages received by me from other as read
    await Message.updateMany({ senderId: other, receiverId: me, read: false }, { read: true });

    res.json(items);
  } catch (error) {
    console.error('Conversation fetch error:', error);
    res.status(500).json({ message: 'Server error fetching conversation' });
  }
});

// List recent conversations (last message per partner) for authenticated user
app.get('/api/messages/conversations', authenticateToken, async (req, res) => {
  try {
    const me = String(req.donor._id);
    const msgs = await Message.find({ $or: [{ senderId: me }, { receiverId: me }] }).sort({ createdAt: -1 }).limit(500).lean();

    const map = new Map();
    for (const m of msgs) {
      const partner = String(m.senderId) === me ? String(m.receiverId) : String(m.senderId);
      if (!map.has(partner)) map.set(partner, m); // first encountered is most recent due to sort desc
    }

    // Build list with partner id and last message
    const list = [];
    for (const [partnerId, lastMsg] of map.entries()) {
      // attempt to get partner info
      const partner = await Donor.findById(partnerId).select('name email bloodGroup location');
      list.push({ partner: partner ? { _id: partner._id, name: partner.name, bloodGroup: partner.bloodGroup } : { _id: partnerId }, lastMessage: lastMsg });
    }

    res.json(list);
  } catch (error) {
    console.error('Conversations list error:', error);
    res.status(500).json({ message: 'Server error fetching conversations' });
  }
});

// Optional: mark a message as read (single)
app.patch('/api/messages/:id/read', authenticateToken, async (req, res) => {
  try {
    const me = String(req.donor._id);
    const msg = await Message.findById(req.params.id);
    if (!msg) return res.status(404).json({ message: 'Message not found' });
    if (String(msg.receiverId) !== me) return res.status(403).json({ message: 'Not authorized to mark this message' });
    msg.read = true;
    await msg.save();
    res.json(msg);
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Donor: Change password (requires current password)
app.post('/api/auth/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'currentPassword and newPassword are required' });
    }
    if (String(newPassword).length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    const donor = await Donor.findById(req.donor._id);
    if (!donor) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, donor.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    donor.password = hashed;
    await donor.save();

    return res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error during password change' });
  }
});

// Donor Signup
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password, bloodGroup, location, phoneNumber } = req.body;

    // Check if donor already exists
    const existingDonor = await Donor.findOne({ email });
    if (existingDonor) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    // Check if phone number already exists
    const existingPhone = await Donor.findOne({ phoneNumber: phoneNumber });
    if (existingPhone) {
      return res.status(400).json({ message: 'Phone number already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new donor
    const donor = new Donor({
      name,
      email,
      password: hashedPassword,
      bloodGroup,
      location,
      phoneNumber
    });

    await donor.save();

    res.status(201).json({ 
      message: 'Donor registered successfully',
      donorId: donor._id 
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Reject a blood request (recipient only) with note
app.patch('/api/donor/requests/:id/reject', authenticateToken, async (req, res) => {
  try {
    const me = req.donor._id;
    const { note } = req.body;
    const request = await BloodRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    // Only the recipient (donorId) can reject
    if (String(request.donorId) !== String(me)) {
      return res.status(403).json({ message: 'Not authorized to reject this request' });
    }
    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending requests can be rejected' });
    }
    const updated = await BloodRequest.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected', note: note ?? '' },
      { new: true }
    );
    return res.json(updated);
  } catch (error) {
    console.error('Reject request error:', error);
    res.status(500).json({ message: 'Server error during request rejection' });
  }
});

// Accept a blood request (recipient only) - new endpoint
app.patch('/api/donor/requests/:id/accept', authenticateToken, async (req, res) => {
  try {
    const me = req.donor._id;
    const request = await BloodRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    // Only the recipient (donorId) can accept
    if (String(request.donorId) !== String(me)) {
      return res.status(403).json({ message: 'Not authorized to accept this request' });
    }
    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending requests can be accepted' });
    }
    const updated = await BloodRequest.findByIdAndUpdate(
      req.params.id,
      { status: 'accepted' },
      { new: true }
    );
    return res.json(updated);
  } catch (error) {
    console.error('Accept request error:', error);
    res.status(500).json({ message: 'Server error during request acceptance' });
  }
});

// Cancel a blood request (requester only) with optional note
app.patch('/api/donor/requests/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const me = req.donor._id;
    const { note } = req.body;
    const request = await BloodRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (String(request.requesterId) !== String(me)) {
      return res.status(403).json({ message: 'Not authorized to cancel this request' });
    }
    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending requests can be cancelled' });
    }
    const updated = await BloodRequest.findByIdAndUpdate(
      req.params.id,
      { status: 'cancelled', note: note ?? request.note },
      { new: true }
    );
    return res.json(updated);
  } catch (error) {
    console.error('Cancel request error:', error);
    res.status(500).json({ message: 'Server error during request cancellation' });
  }
});

// Complete a blood request (either party) when fulfilled
app.patch('/api/donor/requests/:id/complete', authenticateToken, async (req, res) => {
  try {
    const me = req.donor._id;
    const request = await BloodRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (String(request.requesterId) !== String(me) && String(request.donorId) !== String(me)) {
      return res.status(403).json({ message: 'Not authorized to complete this request' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending requests can be completed' });
    }

    // Only the requester can mark as completed
    if (String(request.donorId) === String(me)) {
      return res.status(403).json({ message: 'Only the requester can mark this request as completed' });
    }

    // The requester is completing; require a rating (1-5)
    let update = { status: 'completed' };
    const { rating } = req.body || {};
    const r = Number(rating);
    if (!r || r < 1 || r > 5) {
      return res.status(400).json({ message: 'Rating (1-5) is required when requester completes' });
    }
    update.rating = r;

    const updated = await BloodRequest.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true }
    );

    // Update donor's last donation date
    await Donor.findByIdAndUpdate(
      request.donorId,
      { lastDonationDate: new Date() }
    );

    return res.json(updated);
  } catch (error) {
    console.error('Complete request error:', error);
    res.status(500).json({ message: 'Server error during request completion' });
  }
});

// Get donor's own blood requests (sent/received)
app.get('/api/donor/requests', authenticateToken, async (req, res) => {
  try {
    const { type } = req.query; // 'sent' | 'received' | undefined
    const me = req.donor._id;

    let query = {};
    if (type === 'sent') {
      query = { requesterId: me };
    } else if (type === 'received') {
      query = { donorId: me };
    } else {
      query = { $or: [{ requesterId: me }, { donorId: me }] };
    }

    const items = await BloodRequest.find(query).sort({ createdAt: -1 }).limit(100);
    res.json(items);
  } catch (error) {
    console.error('My requests fetch error:', error);
    res.status(500).json({ message: 'Server error fetching requests' });
  }
});

// Admin: List donors with filters
app.get('/api/admin/donors', async (req, res) => {
  try {
    const { query, bloodGroup, status, location, page = 1, limit = 20 } = req.query;
    const q = {};
    if (query) {
      q.$or = [
        { name: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
        { phoneNumber: { $regex: query, $options: 'i' } }
      ];
    }
    if (bloodGroup) q.bloodGroup = bloodGroup;
    if (status) q.status = status;
    if (location) q.location = { $regex: location, $options: 'i' };

    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      Donor.find(q).select('-password').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Donor.countDocuments(q)
    ]);

    res.json({ items, total, page: Number(page), limit: Number(limit) });
  } catch (error) {
    console.error('Admin donors list error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Get donor by id
app.get('/api/admin/donors/:id', async (req, res) => {
  try {
    const donor = await Donor.findById(req.params.id).select('-password');
    if (!donor) return res.status(404).json({ message: 'Donor not found' });
    
    const eligible = isDonorEligible(donor.lastDonationDate);
    const daysUntilEligible = getDaysUntilEligible(donor.lastDonationDate);
    
    const donorWithEligibility = {
      ...donor.toObject(),
      eligible: eligible,
      daysUntilEligible: daysUntilEligible
    };
    
    res.json(donorWithEligibility);
  } catch (error) {
    console.error('Admin donor get error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Update donor editable fields
app.patch('/api/admin/donors/:id', async (req, res) => {
  try {
    const { name, email, bloodGroup, location, phoneNumber } = req.body;
    const update = { name, email, bloodGroup, location, phoneNumber };
    Object.keys(update).forEach((k) => update[k] === undefined && delete update[k]);
    const donor = await Donor.findByIdAndUpdate(req.params.id, update, { new: true }).select('-password');
    if (!donor) return res.status(404).json({ message: 'Donor not found' });
    res.json(donor);
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
    const donor = await Donor.findByIdAndUpdate(
      req.params.id,
      { status, verificationNote: reason },
      { new: true }
    ).select('-password');
    if (!donor) return res.status(404).json({ message: 'Donor not found' });
    res.json(donor);
  } catch (error) {
    console.error('Admin donor status update error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Verify donor
app.patch('/api/admin/donors/:id/verify', async (req, res) => {
  try {
    const { verified, note } = req.body;
    const donor = await Donor.findByIdAndUpdate(
      req.params.id,
      { verified: Boolean(verified), verificationNote: note },
      { new: true }
    ).select('-password');
    if (!donor) return res.status(404).json({ message: 'Donor not found' });
    res.json(donor);
  } catch (error) {
    console.error('Admin donor verify error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Delete donor
app.delete('/api/admin/donors/:id', async (req, res) => {
  try {
    const donor = await Donor.findByIdAndDelete(req.params.id);
    if (!donor) return res.status(404).json({ message: 'Donor not found' });
    res.json({ message: 'Donor deleted' });
  } catch (error) {
    console.error('Admin donor delete error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Donor Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find donor by email
    const donor = await Donor.findOne({ email });
    if (!donor) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, donor.password);
    if (!isValidPassword) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign({ donorId: donor._id }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      message: 'Login successful',
      token,
      donor: {
        id: donor._id,
        name: donor.name,
        email: donor.email,
        bloodGroup: donor.bloodGroup,
        location: donor.location,
        phoneNumber: donor.phoneNumber
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Get donor profile
app.get('/api/donor/profile', authenticateToken, async (req, res) => {
  try {
    const donor = req.donor;
    const eligible = isDonorEligible(donor.lastDonationDate);
    const daysUntilEligible = getDaysUntilEligible(donor.lastDonationDate);
    
    res.json({
      _id: donor._id,
      name: donor.name,
      email: donor.email,
      bloodGroup: donor.bloodGroup,
      location: donor.location,
      phoneNumber: donor.phoneNumber,
      lastDonationDate: donor.lastDonationDate,
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
    const donorId = req.donor._id;

    const updatedDonor = await Donor.findByIdAndUpdate(
      donorId,
      { name, location, phoneNumber },
      { new: true }
    );

    const eligible = isDonorEligible(updatedDonor.lastDonationDate);
    const daysUntilEligible = getDaysUntilEligible(updatedDonor.lastDonationDate);
    
    res.json({
      _id: updatedDonor._id,
      name: updatedDonor.name,
      email: updatedDonor.email,
      bloodGroup: updatedDonor.bloodGroup,
      location: updatedDonor.location,
      phoneNumber: updatedDonor.phoneNumber,
      lastDonationDate: updatedDonor.lastDonationDate,
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
    const donor = await Donor.findById(req.params.donorId);
    if (!donor) {
      return res.status(404).json({ message: 'Donor not found' });
    }

    const eligible = isDonorEligible(donor.lastDonationDate);
    const daysUntilEligible = getDaysUntilEligible(donor.lastDonationDate);

    res.json({
      donorId: donor._id,
      eligible: eligible,
      daysUntilEligible: daysUntilEligible,
      lastDonationDate: donor.lastDonationDate
    });
  } catch (error) {
    console.error('Eligibility check error:', error);
    res.status(500).json({ message: 'Server error during eligibility check' });
  }
});

// Search donors
app.get('/api/donor/search', authenticateToken, async (req, res) => {
  try {
    const { location, bloodGroup } = req.query;

    const query = {
      location: { $regex: location, $options: 'i' },
      _id: { $ne: req.donor._id } // Exclude current user
    };

    if (bloodGroup) {
      query.bloodGroup = bloodGroup;
    }

    // Base donors
    const donors = await Donor.find(query).select('-password');

    if (!donors.length) {
      return res.json([]);
    }

    // Aggregate average ratings for these donors from completed requests
    const donorIds = donors.map(d => d._id);
    const ratingAgg = await BloodRequest.aggregate([
      { $match: { donorId: { $in: donorIds }, status: 'completed', rating: { $gte: 1 } } },
      { $group: { _id: '$donorId', avgRating: { $avg: '$rating' }, ratingCount: { $sum: 1 } } }
    ]);
    const ratingMap = new Map(ratingAgg.map(r => [String(r._id), { avgRating: r.avgRating, ratingCount: r.ratingCount }]));

    // Filter and map donors, only including eligible ones
    const result = donors
      .map(d => {
        const r = ratingMap.get(String(d._id));
        const eligible = isDonorEligible(d.lastDonationDate);
        const daysUntilEligible = getDaysUntilEligible(d.lastDonationDate);
        return {
          _id: d._id,
          name: d.name,
          email: d.email,
          bloodGroup: d.bloodGroup,
          location: d.location,
          phoneNumber: d.phoneNumber,
          // average rating to one decimal, and count
          avgRating: r ? Math.round(r.avgRating * 10) / 10 : null,
          ratingCount: r ? r.ratingCount : 0,
          // eligibility status
          eligible: eligible,
          daysUntilEligible: daysUntilEligible,
          lastDonationDate: d.lastDonationDate
        };
      })
      .filter(donor => donor.eligible === true); // Only return eligible donors

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
    const donor = await Donor.findById(donorId);
    if (!donor) {
      return res.status(404).json({ message: 'Donor not found' });
    }

    // Check if donor is eligible (90-day waiting period)
    if (!isDonorEligible(donor.lastDonationDate)) {
      const daysUntilEligible = getDaysUntilEligible(donor.lastDonationDate);
      return res.status(400).json({ 
        message: `Donor is not eligible to donate yet. Please wait ${daysUntilEligible} more days.`,
        daysUntilEligible: daysUntilEligible
      });
    }

    // Prevent duplicate pending requests between same requester and donor
    const existing = await BloodRequest.findOne({ requesterId: requester._id, donorId, status: 'pending' });
    if (existing) {
      return res.status(400).json({ message: 'A pending request to this user already exists' });
    }

    // Create blood request
    const bloodRequest = new BloodRequest({
      requesterId: requester._id,
      donorId: donorId,
      requesterName: requester.name,
      donorName: donor.name,
      bloodGroup: donor.bloodGroup,
      location: donor.location
    });

    await bloodRequest.save();

    res.status(201).json({ 
      message: 'Blood request sent successfully',
      requestId: bloodRequest._id 
    });
  } catch (error) {
    console.error('Blood request error:', error);
    res.status(500).json({ message: 'Server error during blood request' });
  }
});

// Admin login
app.post('/api/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const admin = await Admin.findOne({ username });
    if (!admin) {
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

// Admin: Change password (with current password)
app.post('/api/admin/change-password', async (req, res) => {
  try {
    const { username, currentPassword, newPassword } = req.body;
    if (!username || !currentPassword || !newPassword) {
      return res.status(400).json({ message: 'username, currentPassword and newPassword are required' });
    }
    if (String(newPassword).length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    const admin = await Admin.findOne({ username });
    if (!admin) {
      return res.status(401).json({ message: 'Invalid admin credentials' });
    }

    const isValid = await bcrypt.compare(currentPassword, admin.password);
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid admin credentials' });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    admin.password = hashed;
    await admin.save();

    return res.json({ message: 'Admin password changed successfully' });
  } catch (error) {
    console.error('Admin change password error:', error);
    res.status(500).json({ message: 'Server error during admin password change' });
  }
});

// Get all blood requests (admin only)
app.get('/api/admin/requests', async (req, res) => {
  try {
    const requests = await BloodRequest.find()
      .sort({ createdAt: -1 })
      .limit(50);
    
    res.json(requests);
  } catch (error) {
    console.error('Requests fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Stats - active requests, total donors, donors by blood group
app.get('/api/admin/stats', async (req, res) => {
  try {
    const [activeRequests, totalDonors, groups] = await Promise.all([
      BloodRequest.countDocuments({ status: 'pending' }),
      Donor.countDocuments({}),
      Donor.aggregate([
        { $group: { _id: '$bloodGroup', count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ])
    ]);

    const donorsByBloodGroup = groups.reduce((acc, g) => {
      acc[g._id] = g.count;
      return acc;
    }, {});

    res.json({ activeRequests, totalDonors, donorsByBloodGroup });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Start server (bind to all interfaces for LAN access)
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Blood Donation API server running on http://${HOST}:${PORT}`);
  if (!process.env.JWT_SECRET) {
    console.warn('Warning: JWT_SECRET is not set. Using an insecure default for development.');
  }
});