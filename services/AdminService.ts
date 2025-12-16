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
      
      // Compare hashed password using bcrypt (optimized - removed test hash)
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
}