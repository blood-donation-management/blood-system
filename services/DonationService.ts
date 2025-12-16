import { supabase } from '../config/supabase';

export interface BloodDonation {
  id: string;
  donor_id: string;
  donation_date: string;
  location?: string;
  hospital?: string;
  blood_group: string;
  quantity_ml: number;
  notes?: string;
  verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateDonationInput {
  donation_date: Date;
  location?: string;
  hospital?: string;
  blood_group: string;
  quantity_ml?: number;
  notes?: string;
}

export class DonationService {
  /**
   * Minimum days required between blood donations
   */
  static readonly MIN_DONATION_INTERVAL_DAYS = 90;

  /**
   * Record a new blood donation
   * This will automatically update the donor's last_donation_date via database trigger
   */
  static async recordDonation(donationData: CreateDonationInput): Promise<BloodDonation> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Check if user has donated recently
      const lastDonation = await this.getLastDonation();
      if (lastDonation) {
        const lastDonationDate = new Date(lastDonation.donation_date);
        const newDonationDate = new Date(donationData.donation_date);
        const daysSinceLastDonation = Math.floor(
          (newDonationDate.getTime() - lastDonationDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysSinceLastDonation < this.MIN_DONATION_INTERVAL_DAYS) {
          const daysRemaining = this.MIN_DONATION_INTERVAL_DAYS - daysSinceLastDonation;
          throw new Error(
            `You must wait at least ${this.MIN_DONATION_INTERVAL_DAYS} days between donations. ` +
            `You can donate again in ${daysRemaining} days (after ${new Date(
              lastDonationDate.getTime() + this.MIN_DONATION_INTERVAL_DAYS * 24 * 60 * 60 * 1000
            ).toLocaleDateString()}).`
          );
        }
      }

      // Insert the donation record
      const { data, error } = await supabase
        .from('blood_donations')
        .insert({
          donor_id: user.id,
          donation_date: donationData.donation_date.toISOString(),
          location: donationData.location,
          hospital: donationData.hospital,
          blood_group: donationData.blood_group,
          quantity_ml: donationData.quantity_ml || 450,
          notes: donationData.notes,
          verified: false,
        })
        .select()
        .single();

      if (error) {
        console.error('Error recording donation:', error);
        throw new Error(error.message || 'Failed to record donation');
      }

      console.log('Donation recorded successfully:', data);
      
      // The database trigger will automatically update last_donation_date in donors table
      return data;
    } catch (error: any) {
      console.error('Error in recordDonation:', error);
      throw error;
    }
  }

  /**
   * Get all donations for the current user
   */
  static async getMyDonations(): Promise<BloodDonation[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('blood_donations')
        .select('*')
        .eq('donor_id', user.id)
        .order('donation_date', { ascending: false });

      if (error) {
        console.error('Error fetching donations:', error);
        throw new Error(error.message || 'Failed to fetch donations');
      }

      return data || [];
    } catch (error: any) {
      console.error('Error in getMyDonations:', error);
      throw error;
    }
  }

  /**
   * Get total donation count for current user
   */
  static async getMyDonationCount(): Promise<number> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return 0;
      }

      const { count, error } = await supabase
        .from('blood_donations')
        .select('*', { count: 'exact', head: true })
        .eq('donor_id', user.id);

      if (error) {
        console.error('Error counting donations:', error);
        return 0;
      }

      return count || 0;
    } catch (error: any) {
      console.error('Error in getMyDonationCount:', error);
      return 0;
    }
  }

  /**
   * Get the most recent donation for current user
   */
  static async getLastDonation(): Promise<BloodDonation | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return null;
      }

      const { data, error } = await supabase
        .from('blood_donations')
        .select('*')
        .eq('donor_id', user.id)
        .order('donation_date', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No donations found
          return null;
        }
        console.error('Error fetching last donation:', error);
        throw new Error(error.message || 'Failed to fetch last donation');
      }

      return data;
    } catch (error: any) {
      console.error('Error in getLastDonation:', error);
      return null;
    }
  }

  /**
   * Update a donation record
   */
  static async updateDonation(
    donationId: string,
    updates: Partial<CreateDonationInput>
  ): Promise<BloodDonation> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (updates.donation_date) {
        updateData.donation_date = updates.donation_date.toISOString();
      }
      if (updates.location !== undefined) {
        updateData.location = updates.location;
      }
      if (updates.hospital !== undefined) {
        updateData.hospital = updates.hospital;
      }
      if (updates.blood_group) {
        updateData.blood_group = updates.blood_group;
      }
      if (updates.quantity_ml !== undefined) {
        updateData.quantity_ml = updates.quantity_ml;
      }
      if (updates.notes !== undefined) {
        updateData.notes = updates.notes;
      }

      const { data, error } = await supabase
        .from('blood_donations')
        .update(updateData)
        .eq('id', donationId)
        .eq('donor_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating donation:', error);
        throw new Error(error.message || 'Failed to update donation');
      }

      return data;
    } catch (error: any) {
      console.error('Error in updateDonation:', error);
      throw error;
    }
  }

  /**
   * Delete a donation record
   */
  static async deleteDonation(donationId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('blood_donations')
        .delete()
        .eq('id', donationId)
        .eq('donor_id', user.id);

      if (error) {
        console.error('Error deleting donation:', error);
        throw new Error(error.message || 'Failed to delete donation');
      }

      console.log('Donation deleted successfully');
    } catch (error: any) {
      console.error('Error in deleteDonation:', error);
      throw error;
    }
  }

  /**
   * Calculate days since last donation
   */
  static getDaysSinceLastDonation(lastDonationDate: string | null): number | null {
    if (!lastDonationDate) {
      return null;
    }

    const lastDonation = new Date(lastDonationDate);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - lastDonation.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  }

  /**
   * Calculate days until eligible to donate again
   */
  static getDaysUntilEligible(lastDonationDate: string | null): number {
    if (!lastDonationDate) {
      return 0; // Eligible now
    }

    const daysSince = this.getDaysSinceLastDonation(lastDonationDate);
    if (daysSince === null) {
      return 0;
    }

    const daysUntilEligible = 90 - daysSince;
    return daysUntilEligible > 0 ? daysUntilEligible : 0;
  }

  /**
   * Check if donor is eligible to donate
   */
  static isEligible(lastDonationDate: string | null): boolean {
    return this.getDaysUntilEligible(lastDonationDate) === 0;
  }
}
