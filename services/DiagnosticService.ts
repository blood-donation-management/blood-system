import { supabase } from '../config/supabase';

/**
 * Diagnostic utility to check Supabase connection and data integrity
 * Run this from any screen to debug issues
 */

export class DiagnosticService {
  /**
   * Run all diagnostic checks
   */
  static async runFullDiagnostic() {
    console.log('🔍 Starting Full Diagnostic...\n');
    
    const results = {
      connection: await this.checkConnection(),
      auth: await this.checkAuth(),
      profile: await this.checkProfile(),
      tables: await this.checkTables(),
    };

    console.log('\n📊 Diagnostic Results:');
    console.log(JSON.stringify(results, null, 2));
    
    return results;
  }

  /**
   * Check Supabase connection
   */
  static async checkConnection(): Promise<{ status: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('donors')
        .select('count')
        .limit(1);

      if (error) {
        return { status: 'FAILED', error: error.message };
      }

      return { status: 'SUCCESS' };
    } catch (err: any) {
      return { status: 'FAILED', error: err.message };
    }
  }

  /**
   * Check authentication status
   */
  static async checkAuth(): Promise<{ 
    status: string; 
    userId?: string; 
    email?: string; 
    error?: string 
  }> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error) {
        return { status: 'NOT_AUTHENTICATED', error: error.message };
      }

      if (!user) {
        return { status: 'NO_USER' };
      }

      return {
        status: 'AUTHENTICATED',
        userId: user.id,
        email: user.email,
      };
    } catch (err: any) {
      return { status: 'ERROR', error: err.message };
    }
  }

  /**
   * Check donor profile
   */
  static async checkProfile(): Promise<{
    status: string;
    profile?: any;
    error?: string;
  }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return { status: 'NO_AUTH_USER' };
      }

      const { data, error } = await supabase
        .from('donors')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        return { status: 'QUERY_ERROR', error: error.message };
      }

      if (!data) {
        return { 
          status: 'PROFILE_NOT_FOUND',
          error: `No donor profile found for user ID: ${user.id}`
        };
      }

      return {
        status: 'PROFILE_EXISTS',
        profile: data,
      };
    } catch (err: any) {
      return { status: 'ERROR', error: err.message };
    }
  }

  /**
   * Check if required tables exist
   */
  static async checkTables(): Promise<{
    donors: boolean;
    admins: boolean;
    blood_requests: boolean;
  }> {
    const tables = {
      donors: false,
      admins: false,
      blood_requests: false,
    };

    try {
      // Check donors table
      const { error: donorsError } = await supabase
        .from('donors')
        .select('id')
        .limit(1);
      tables.donors = !donorsError;

      // Check admins table
      const { error: adminsError } = await supabase
        .from('admins')
        .select('id')
        .limit(1);
      tables.admins = !adminsError;

      // Check blood_requests table
      const { error: requestsError } = await supabase
        .from('blood_requests')
        .select('id')
        .limit(1);
      tables.blood_requests = !requestsError;

    } catch (err) {
      console.error('Table check error:', err);
    }

    return tables;
  }

  /**
   * Fix missing donor profile for authenticated user
   */
  static async createMissingProfile(data: {
    name: string;
    bloodGroup: string;
    location: string;
    phoneNumber: string;
  }): Promise<{ status: string; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return { status: 'NOT_AUTHENTICATED' };
      }

      // Check if profile already exists
      const { data: existing } = await supabase
        .from('donors')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      if (existing) {
        return { status: 'PROFILE_ALREADY_EXISTS' };
      }

      // Create profile
      const { error } = await supabase
        .from('donors')
        .insert({
          id: user.id,
          name: data.name,
          email: user.email!,
          blood_group: data.bloodGroup,
          location: data.location,
          phone_number: data.phoneNumber,
          status: 'active',
          verified: false,
          created_at: new Date().toISOString(),
        });

      if (error) {
        return { status: 'FAILED', error: error.message };
      }

      return { status: 'SUCCESS' };
    } catch (err: any) {
      return { status: 'ERROR', error: err.message };
    }
  }

  /**
   * Quick health check - returns true if everything is OK
   */
  static async healthCheck(): Promise<boolean> {
    const connection = await this.checkConnection();
    const auth = await this.checkAuth();
    const profile = await this.checkProfile();

    return (
      connection.status === 'SUCCESS' &&
      auth.status === 'AUTHENTICATED' &&
      profile.status === 'PROFILE_EXISTS'
    );
  }

  /**
   * Get human-readable status message
   */
  static async getStatusMessage(): Promise<string> {
    const results = await this.runFullDiagnostic();

    if (results.connection.status !== 'SUCCESS') {
      return `❌ Cannot connect to Supabase: ${results.connection.error}`;
    }

    if (results.auth.status !== 'AUTHENTICATED') {
      return '❌ Not logged in. Please login first.';
    }

    if (results.profile.status !== 'PROFILE_EXISTS') {
      return `❌ Profile not found: ${results.profile.error}\n\nPlease logout and signup again.`;
    }

    return '✅ Everything looks good!';
  }
}
