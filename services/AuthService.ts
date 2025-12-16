import { setItemAsync, getItemAsync, deleteItemAsync } from 'expo-secure-store';
import { supabase } from '../config/supabase';

export class AuthService {
  // Check if email exists
  static async checkEmail(email: string): Promise<{ exists: boolean }> {
    const { data, error } = await supabase
      .from('donors')
      .select('id')
      .eq('email', email)
      .limit(1);
    
    return { exists: !error && data && data.length > 0 };
  }

  // Check if phone exists
  static async checkPhone(phone: string): Promise<{ exists: boolean }> {
    const { data, error } = await supabase
      .from('donors')
      .select('id')
      .eq('phone_number', phone)
      .limit(1);
    
    return { exists: !error && data && data.length > 0 };
  }

  // Signup using Supabase Auth
  static async signup(userData: {
    name: string;
    email: string;
    password: string;
    bloodGroup: string;
    location: string;
    phoneNumber: string;
  }) {
    try {
      // Sign up with Supabase Auth with email confirmation disabled
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          emailRedirectTo: undefined,
          data: {
            name: userData.name,
          }
        }
      });

      if (authError) {
        // Handle specific error cases
        if (authError.message.includes('already registered')) {
          throw new Error('This email is already registered. Please login instead.');
        }
        if (authError.message.includes('invalid')) {
          throw new Error('Please provide a valid email address.');
        }
        throw new Error(authError.message);
      }

      if (!authData.user) {
        throw new Error('Unable to create account. Please try again.');
      }

      // Insert donor profile
      const { data: donor, error: donorError } = await supabase
        .from('donors')
        .insert({
          id: authData.user.id,
          name: userData.name,
          email: userData.email,
          blood_group: userData.bloodGroup,
          location: userData.location,
          phone_number: userData.phoneNumber,
          status: 'active',
          verified: false,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (donorError) {
        console.error('Donor insert error:', donorError);
        console.error('Error details:', JSON.stringify(donorError, null, 2));
        console.error('User ID:', authData.user.id);
        console.error('Data attempted:', {
          id: authData.user.id,
          name: userData.name,
          email: userData.email,
          blood_group: userData.bloodGroup,
          location: userData.location,
          phone_number: userData.phoneNumber,
        });
        
        // More specific error message
        if (donorError.code === '23505') {
          throw new Error('This email or phone number is already registered. Please use the Profile Recovery screen or try logging in.');
        }
        if (donorError.code === '42501') {
          throw new Error('Database permission error. Please check that RLS is disabled on the donors table.');
        }
        if (donorError.message.includes('violates')) {
          throw new Error(`Database constraint error: ${donorError.message}`);
        }
        
        throw new Error(`Profile creation failed: ${donorError.message || 'Unknown error'}. Your account exists - use Profile Recovery to fix it.`);
      }

      // Store session
      if (authData.session) {
        await setItemAsync('token', authData.session.access_token);
      }

      return { user: authData.user, donor };
    } catch (error: any) {
      throw new Error(error.message || 'An unexpected error occurred during signup.');
    }
  }

  // Login using Supabase Auth
  static async login(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('Invalid email or password. Please try again.');
        }
        if (error.message.includes('Email not confirmed')) {
          throw new Error('Please verify your email address before logging in.');
        }
        throw new Error(error.message);
      }

      if (!data.session) {
        throw new Error('Unable to establish session. Please try again.');
      }

      await setItemAsync('token', data.session.access_token);
      return { token: data.session.access_token, user: data.user };
    } catch (error: any) {
      throw new Error(error.message || 'An unexpected error occurred during login.');
    }
  }

  // Mock logout
  static async logout() {
    await deleteItemAsync('token');
    // Cache clearing moved to DonorService to avoid circular dependency
  }

  // Real get token
  static async getToken() {
    return await getItemAsync('token');
  }

  // Real isAuthenticated
  static async isAuthenticated() {
    const token = await getItemAsync('token');
    return !!token;
  }

  // Mock change password
  static async changePassword(currentPassword: string, newPassword: string) {
    console.log('[Mock AuthService] changePassword', currentPassword, newPassword);
    return { message: 'Password changed' };
  }
}
