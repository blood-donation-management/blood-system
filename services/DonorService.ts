import { supabase, supabaseAnonKey } from '../config/supabase';
import { Linking } from 'react-native';

export interface BloodRequest {
  id: string;
  admin_id: string;
  donor_id: string;
  admin_name?: string;
  donor_name?: string;
  blood_group: string;
  location: string;
  status: string;
  note?: string;
  created_at: string;
  updated_at?: string;
}

export class DonorService {
  // WhatsApp contact helper: opens WhatsApp chat with a donor
  static async openWhatsApp(phoneNumber: string, message?: string) {
    try {
      const formattedPhone = phoneNumber.replace(/\D/g, '');
      const whatsappMessage = message || 'Hello! I would like to connect with you regarding blood donation.';
      const encodedMessage = encodeURIComponent(whatsappMessage);
      const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
      
      await Linking.openURL(whatsappUrl);
    } catch (error) {
      console.error('[DonorService] Failed to open WhatsApp:', error);
      throw new Error('Could not open WhatsApp. Make sure it is installed on your device.');
    }
  }

  // Direct call helper: initiates a phone call
  static async initiateCall(phoneNumber: string) {
    try {
      const callUrl = `tel:${phoneNumber}`;
      await Linking.openURL(callUrl);
    } catch (error) {
      console.error('[DonorService] Failed to initiate call:', error);
      throw new Error('Could not initiate call. Make sure your device supports calling.');
    }
  }

  static async getProfile() {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('Please log in to view your profile.');
      }

      const { data, error } = await supabase
        .from('donors')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.error('[DonorService] Profile fetch error:', error);
        throw new Error('Unable to load your profile. Please try logging in again.');
      }

      if (!data) {
        throw new Error('Profile not found. Please complete your registration.');
      }

      return data;
    } catch (error: any) {
      console.error('[DonorService] getProfile error:', error);
      throw new Error(error.message || 'Unable to fetch your profile. Please try again.');
    }
  }

  static async updateProfile(profileData: { name?: string; location?: string; phone_number?: string; profile_picture_url?: string }) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('donors')
        .update(profileData)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw new Error('Failed to update profile: ' + error.message);
      return data;
    } catch (error: any) {
      throw new Error(error.message || 'Unable to update your profile. Please try again.');
    }
  }

  static async uploadProfilePicture(uri: string): Promise<string> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      console.log('[Upload] Starting upload for:', uri);

      // Normalize extension and mime
      const guessExt = () => {
        const match = uri.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
        return (match && match[1]) ? match[1].toLowerCase() : 'jpg';
      };
      const ext = guessExt();
      const contentType = ext === 'png' ? 'image/png' : ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/jpeg';
      const filePath = `profile-pictures/${user.id}-${Date.now()}.${ext}`;

      console.log('[Upload] File path:', filePath, 'Content-Type:', contentType);

      // Use FormData for React Native compatibility
      const formData = new FormData();
      formData.append('file', {
        uri: uri,
        type: contentType,
        name: filePath.split('/').pop() || 'profile.jpg',
      } as any);

      console.log('[Upload] Uploading to Supabase Storage...');

      // Direct upload using fetch to storage API
      const uploadUrl = `${supabase.storage.url}/object/avatars/${filePath}`;
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('No valid session');
      }

      const uploadResponse = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': supabaseAnonKey,
        },
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('[Upload] Upload failed:', uploadResponse.status, errorText);
        throw new Error(`Upload failed: ${uploadResponse.status}`);
      }

      console.log('[Upload] Upload successful');

      // Get public URL
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      if (!data?.publicUrl) {
        throw new Error('Failed to get image URL');
      }

      console.log('[Upload] Public URL:', data.publicUrl);

      // Update profile with new picture URL
      await this.updateProfile({ profile_picture_url: data.publicUrl });

      return data.publicUrl;
    } catch (error: any) {
      console.error('[DonorService] Upload profile picture error:', error);
      throw new Error(error.message || 'Unable to upload profile picture');
    }
  }

  static async searchDonors(location?: string, bloodGroup?: string) {
    try {
      let query = supabase
        .from('donors')
        .select('*')
        .eq('status', 'active');

      if (location) {
        query = query.ilike('location', `%${location}%`);
      }
      if (bloodGroup) {
        query = query.eq('blood_group', bloodGroup);
      }

      const { data, error } = await query;
      if (error) throw new Error('Failed to search donors: ' + error.message);
      
      // Map database fields to camelCase for frontend
      return (data || []).map((donor: any) => ({
        ...donor,
        lastDonationDate: donor.last_donation_date,
      }));
    } catch (error: any) {
      throw new Error(error.message || 'Unable to search donors. Please try again.');
    }
  }

  static async sendBloodRequest(donorId: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      if (donorId === user.id) {
        throw new Error('You cannot send a request to yourself.');
      }

      const displayName = (user.user_metadata && (user.user_metadata.full_name || user.user_metadata.name)) || user.email || 'Unknown';

      // Lookup donor name for legacy NOT NULL columns
      const { data: donorRow, error: donorErr } = await supabase
        .from('donors')
        .select('name,email,blood_group,location,phone_number')
        .eq('id', donorId)
        .maybeSingle();
      if (donorErr) throw new Error('Failed to fetch donor: ' + donorErr.message);
      const donorName = (donorRow && donorRow.name) || (donorRow && donorRow.email) || 'Unknown Donor';
      const donorBloodGroup = donorRow?.blood_group || 'Unknown';
      const donorLocation = donorRow?.location || null;
      const donorPhone = donorRow?.phone_number || null;

      const { data, error } = await supabase
        .from('blood_requests')
        .insert({
          donor_id: donorId,
          admin_id: user.id,
          requester_id: user.id, // Backward compatibility
          requester_name: displayName,
          donor_name: donorName,
          blood_group: donorBloodGroup,
          location: donorLocation || '',
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw new Error('Failed to send request: ' + error.message);
      return data;
    } catch (error: any) {
      throw new Error(error.message || 'Unable to send blood request. Please try again.');
    }
  }

  static async getMyRequests(type?: 'sent' | 'received') {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      let query = supabase
        .from('blood_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (type === 'sent') {
        query = query.eq('admin_id', user.id).neq('donor_id', user.id);
      } else if (type === 'received') {
        query = query.eq('donor_id', user.id).neq('admin_id', user.id);
      } else {
        query = query.or(`admin_id.eq.${user.id},donor_id.eq.${user.id}`);
      }

      const { data, error } = await query;
      if (error) throw new Error('Failed to fetch requests: ' + error.message);
      
      // Enrich with user names and details
      const enriched = await Promise.all((data || []).map(async (req) => {
        const [adminData, donorData] = await Promise.all([
          supabase.from('admins').select('name,email').eq('id', req.admin_id).maybeSingle(),
          supabase.from('donors').select('name,email,blood_group,phone_number').eq('id', req.donor_id).maybeSingle()
        ]);
        
        return {
          ...req,
          admin_name: adminData.data?.name || adminData.data?.email,
          donor_name: donorData.data?.name || donorData.data?.email,
          blood_group: donorData.data?.blood_group,
          phone_number: donorData.data?.phone_number,
        };
      }));
      
      return enriched;
    } catch (error: any) {
      throw new Error(error.message || 'Unable to fetch requests. Please try again.');
    }
  }

  static async rejectRequest(requestId: string, note?: string) {
    try {
      if (!requestId || requestId === 'undefined') {
        throw new Error('Invalid request ID');
      }

      const { data, error } = await supabase
        .from('blood_requests')
        .update({ 
          status: 'rejected',
          note: note,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId)
        .select()
        .single();

      if (error) throw new Error('Failed to reject request: ' + error.message);
      return data;
    } catch (error: any) {
      throw new Error(error.message || 'Unable to reject request. Please try again.');
    }
  }

  static async acceptRequest(requestId: string) {
    try {
      if (!requestId || requestId === 'undefined') {
        throw new Error('Invalid request ID');
      }

      const { data, error } = await supabase
        .from('blood_requests')
        .update({ 
          status: 'accepted',
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId)
        .select()
        .single();

      if (error) throw new Error('Failed to accept request: ' + error.message);
      return data;
    } catch (error: any) {
      throw new Error(error.message || 'Unable to accept request. Please try again.');
    }
  }

  static async cancelRequest(requestId: string, note?: string) {
    try {
      if (!requestId || requestId === 'undefined') {
        throw new Error('Invalid request ID');
      }

      const { data, error } = await supabase
        .from('blood_requests')
        .update({ 
          status: 'cancelled',
          note: note,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId)
        .select()
        .single();

      if (error) throw new Error('Failed to cancel request: ' + error.message);
      return data;
    } catch (error: any) {
      throw new Error(error.message || 'Unable to cancel request. Please try again.');
    }
  }

  static async completeRequest(requestId: string, rating?: number) {
    try {
      if (!requestId || requestId === 'undefined') {
        throw new Error('Invalid request ID');
      }

      const updateData: any = { 
        status: 'completed',
        updated_at: new Date().toISOString()
      };
      
      if (rating !== undefined) {
        updateData.rating = rating;
      }

      // First, get the request to find the donor_id
      const { data: request, error: fetchError } = await supabase
        .from('blood_requests')
        .select('donor_id')
        .eq('id', requestId)
        .single();

      if (fetchError) throw new Error('Failed to fetch request: ' + fetchError.message);

      // Update the request status
      const { data, error } = await supabase
        .from('blood_requests')
        .update(updateData)
        .eq('id', requestId)
        .select()
        .single();

      if (error) throw new Error('Failed to complete request: ' + error.message);

      // If rating is provided, update donor's rating statistics
      if (rating !== undefined && request.donor_id) {
        await this.updateDonorRating(request.donor_id, rating);
      }

      return data;
    } catch (error: any) {
      throw new Error(error.message || 'Unable to complete request. Please try again.');
    }
  }

  /**
   * Update donor's average rating and rating count
   */
  private static async updateDonorRating(donorId: string, newRating: number) {
    try {
      // Get current donor stats
      const { data: donor, error: donorError } = await supabase
        .from('donors')
        .select('avg_rating, rating_count')
        .eq('id', donorId)
        .single();

      if (donorError) throw donorError;

      const currentAvg = donor.avg_rating || 0;
      const currentCount = donor.rating_count || 0;

      // Calculate new average
      const totalRating = (currentAvg * currentCount) + newRating;
      const newCount = currentCount + 1;
      const newAvg = totalRating / newCount;

      // Update donor profile
      const { error: updateError } = await supabase
        .from('donors')
        .update({
          avg_rating: newAvg,
          rating_count: newCount,
          updated_at: new Date().toISOString()
        })
        .eq('id', donorId);

      if (updateError) throw updateError;
    } catch (error: any) {
      console.error('Failed to update donor rating:', error);
      // Don't throw error here to avoid blocking the completion
    }
  }

  static async getDonationHistory() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('blood_requests')
        .select('*')
        .eq('status', 'completed')
        .or(`admin_id.eq.${user.id},donor_id.eq.${user.id}`)
        .order('updated_at', { ascending: false });

      if (error) throw new Error('Failed to fetch donation history: ' + error.message);
      return data || [];
    } catch (error: any) {
      throw new Error(error.message || 'Unable to fetch donation history. Please try again.');
    }
  }
}
