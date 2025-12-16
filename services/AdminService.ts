import { supabase } from '../config/supabase';
import * as bcrypt from 'bcryptjs';

export class AdminService {
  static async sendRequest(donorUserId: string, payload: {
    desired_donation_date?: Date;
    location?: string;
    hospital?: string;
    message?: string;
  }) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Admin not authenticated');

    const { data, error } = await supabase
      .from('blood_requests')
      .insert({
        donor_id: donorUserId,
        admin_id: user.id,
        desired_donation_date: payload.desired_donation_date?.toISOString() ?? null,
        location: payload.location ?? null,
        hospital: payload.hospital ?? null,
        message: payload.message ?? null,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw new Error('Failed to send request: ' + error.message);
    return data;
  }
  static async login(username: string, password: string) {
    try {
      // Direct table query (RLS must be disabled on admins table)
      const { data: admins, error } = await supabase
        .from('admins')
        .select('id, username, password')
        .eq('username', username)
        .limit(1);

      if (error) {
        throw new Error('Unable to connect to the server. Please try again.');
      }

      if (!admins || admins.length === 0) {
        throw new Error('Invalid username or password. Please check your credentials.');
      }

      const admin = admins[0];
      
      // Compare hashed password using bcrypt
      // Note: This is the slowest operation (100-300ms on mobile)
      // Password hashes should use 8 bcrypt rounds for optimal mobile performance
      const isPasswordValid = await bcrypt.compare(password, admin.password);
      
      if (!isPasswordValid) {
        throw new Error('Invalid username or password. Please check your credentials.');
      }

      return { admin: { id: admin.id, username: admin.username, role: 'admin' } };
    } catch (err: any) {
      throw new Error(err.message || 'An unexpected error occurred during login.');
    }
  }

  static async getStats(): Promise<{ activeRequests: number; totalDonors: number; donorsByBloodGroup: Record<string, number> }> {
    // Get active requests count
    const { count: activeRequests, error: reqError } = await supabase
      .from('blood_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    // Get total donors count
    const { count: totalDonors, error: donorError } = await supabase
      .from('donors')
      .select('*', { count: 'exact', head: true });

    // Get donors by blood group
    const { data: donors, error: groupError } = await supabase
      .from('donors')
      .select('blood_group');

    const donorsByBloodGroup: Record<string, number> = {};
    if (donors) {
      donors.forEach((d: any) => {
        const bg = d.blood_group;
        donorsByBloodGroup[bg] = (donorsByBloodGroup[bg] || 0) + 1;
      });
    }

    return {
      activeRequests: activeRequests || 0,
      totalDonors: totalDonors || 0,
      donorsByBloodGroup,
    };
  }

  static async getBloodRequests() {
    const { data, error } = await supabase
      .from('blood_requests')
      .select(`
        *,
        donor:donors!blood_requests_donor_id_fkey(
          name,
          blood_group,
          location,
          phone_number
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error('Failed to fetch blood requests: ' + error.message);
    }

    // Transform the data to include donor information at the top level
    return (data || []).map((request: any) => ({
      ...request,
      donorName: request.donor?.name || 'Unknown Donor',
      donorPhone: request.donor?.phone_number || '',
      bloodGroup: request.donor?.blood_group || 'N/A',
      blood_group: request.donor?.blood_group || 'N/A',
      location: request.location || request.donor?.location || 'N/A',
      // Keep original donor data for reference
      donorData: request.donor
    }));
  }

  // Donor management
  static async listDonors(params: {
    query?: string;
    bloodGroup?: string;
    status?: 'active' | 'suspended';
    location?: string;
    page?: number;
    limit?: number;
  } = {}) {
    let query = supabase.from('donors').select('*');

    if (params.bloodGroup) {
      query = query.eq('blood_group', params.bloodGroup);
    }
    if (params.status) {
      query = query.eq('status', params.status);
    }
    if (params.location) {
      query = query.ilike('location', `%${params.location}%`);
    }
    if (params.query) {
      query = query.or(`name.ilike.%${params.query}%,email.ilike.%${params.query}%,phone_number.ilike.%${params.query}%`);
    }

    // Order by newest first
    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) throw new Error('Failed to fetch donors: ' + error.message);
    
    // Check which donors have accepted requests
    if (data && data.length > 0) {
      const donorIds = data.map(d => d.id);
      const { data: acceptedRequests } = await supabase
        .from('blood_requests')
        .select('donor_id')
        .in('donor_id', donorIds)
        .eq('status', 'accepted');

      const donorsWithAcceptedRequests = new Set(
        (acceptedRequests || []).map(r => r.donor_id)
      );

      // Add hasAcceptedRequest flag to each donor
      return data.map(donor => ({
        ...donor,
        hasAcceptedRequest: donorsWithAcceptedRequests.has(donor.id)
      }));
    }

    return data ?? [];
  }

  static async getDonor(id: string) {
    const { data, error } = await supabase
      .from('donors')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw new Error('Failed to fetch donor: ' + error.message);
    return data;
  }

  static async updateDonor(
    id: string,
    updateData: Partial<{ name: string; email: string; bloodGroup: string; location: string; phoneNumber: string }>
  ) {
    const { data, error } = await supabase
      .from('donors')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error('Failed to update donor: ' + error.message);
    return data;
  }

  static async updateDonorStatus(id: string, status: 'active' | 'suspended', reason?: string) {
    const { data, error } = await supabase
      .from('donors')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error('Failed to update donor status: ' + error.message);
    return data;
  }

  static async verifyDonor(id: string, verified: boolean, note?: string) {
    const { data, error } = await supabase
      .from('donors')
      .update({ verified })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error('Failed to verify donor: ' + error.message);
    return data;
  }

  static async deleteDonor(id: string) {
    const { error } = await supabase
      .from('donors')
      .delete()
      .eq('id', id);

    if (error) throw new Error('Failed to delete donor: ' + error.message);
    return { success: true };
  }

  static async updateRequestStatus(requestId: string, status: 'pending' | 'completed' | 'rejected' | 'cancelled') {
    // Update request status
    const { data: request, error: updateError } = await supabase
      .from('blood_requests')
      .update({ status, completed_at: status === 'completed' ? new Date().toISOString() : null })
      .eq('id', requestId)
      .select('donor_id')
      .single();

    if (updateError) throw new Error('Failed to update request status: ' + updateError.message);

    // If status is completed, update donor's last_donation_date
    if (status === 'completed' && request?.donor_id) {
      const { error: donorError } = await supabase
        .from('donors')
        .update({ last_donation_date: new Date().toISOString() })
        .eq('id', request.donor_id);

      if (donorError) {
        console.error('Failed to update donor last donation date:', donorError);
      }
    }

    return { success: true };
  }

  static async completeRequest(requestId: string, donorId: string) {
    try {
      // Update request status to completed
      const { error: updateError } = await supabase
        .from('blood_requests')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (updateError) throw new Error('Failed to complete request: ' + updateError.message);

      // Update donor's last_donation_date
      const { error: donorError } = await supabase
        .from('donors')
        .update({ last_donation_date: new Date().toISOString() })
        .eq('id', donorId);

      if (donorError) {
        console.error('Failed to update donor last donation date:', donorError);
        // Don't throw error here, the main update succeeded
      }

      return { success: true };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to complete request');
    }
  }

  static async rejectRequest(requestId: string, rejectionReason: string) {
    try {
      const { error } = await supabase
        .from('blood_requests')
        .update({ 
          status: 'rejected',
          rejection_reason: rejectionReason,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw new Error('Failed to reject request: ' + error.message);

      return { success: true };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to reject request');
    }
  }

  // User Reports Management
  static async getUserReports(status?: string) {
    let query = supabase
      .from('user_reports')
      .select(`
        *,
        reporter:donors!user_reports_reporter_id_fkey(
          name,
          email,
          phone_number
        ),
        reported_user:donors!user_reports_reported_user_id_fkey(
          name,
          email,
          phone_number,
          blood_group,
          location,
          status,
          ban_expiry
        )
      `)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw new Error('Failed to fetch reports: ' + error.message);
    
    return (data || []).map((report: any) => ({
      ...report,
      reporterName: report.reporter?.name || 'Unknown',
      reporterEmail: report.reporter?.email || 'N/A',
      reporterPhone: report.reporter?.phone_number || '',
      reportedUserName: report.reported_user?.name || 'Unknown',
      reportedUserEmail: report.reported_user?.email || 'N/A',
      reportedUserPhone: report.reported_user?.phone_number || '',
      reportedUserBloodGroup: report.reported_user?.blood_group || 'N/A',
      reportedUserLocation: report.reported_user?.location || 'N/A',
      reportedUserStatus: report.reported_user?.status || 'active',
      reportedUserBanExpiry: report.reported_user?.ban_expiry || null
    }));
  }

  static async updateReportStatus(reportId: string, status: 'pending' | 'reviewed' | 'resolved' | 'dismissed', adminNotes?: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Admin not authenticated');

    const { data, error } = await supabase
      .from('user_reports')
      .update({ 
        status,
        admin_notes: adminNotes,
        reviewed_by: user.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', reportId)
      .select()
      .single();

    if (error) throw new Error('Failed to update report status: ' + error.message);
    return data;
  }

  static async banUser(userId: string, days?: number) {
    try {
      let banExpiry = null;
      
      if (days && days > 0) {
        // Temporary ban - calculate expiry date
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + days);
        banExpiry = expiryDate.toISOString();
      }
      
      const { error } = await supabase
        .from('donors')
        .update({ 
          status: 'suspended',
          ban_expiry: banExpiry,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw new Error('Failed to ban user: ' + error.message);

      return { success: true };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to ban user');
    }
  }

  static async unbanUser(userId: string) {
    try {
      const { error } = await supabase
        .from('donors')
        .update({ 
          status: 'active',
          ban_expiry: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw new Error('Failed to unban user: ' + error.message);

      return { success: true };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to unban user');
    }
  }
}