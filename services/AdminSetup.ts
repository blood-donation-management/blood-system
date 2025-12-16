import * as bcrypt from 'bcryptjs';
import { supabase } from '../config/supabase';

// Set random fallback for React Native environment
bcrypt.setRandomFallback((len: number) => {
  const buf = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    buf[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(buf);
});

/**
 * ONE-TIME UTILITY: Generate and store admin password hash
 * Run this once to set up the admin account with correct hash
 */
export class AdminSetup {
  /**
   * Generate hash and create admin account
   */
  static async createAdmin(username: string, password: string) {
    try {
      console.log('[AdminSetup] Generating hash for password:', password);
      
      // Generate salt with 8 rounds (optimized for React Native performance)
      // Note: 10 rounds is standard for servers, but 8 rounds is acceptable for mobile
      // and significantly faster (reduces login time by ~50%)
      const salt = await bcrypt.genSalt(8);
      console.log('[AdminSetup] Generated salt:', salt);
      
      // Generate hash using the SAME bcryptjs library we use for comparison
      const hash = await bcrypt.hash(password, salt);
      console.log('[AdminSetup] Generated hash:', hash);
      console.log('[AdminSetup] Hash length:', hash.length);
      
      // Test the hash immediately
      const testCompare = await bcrypt.compare(password, hash);
      console.log('[AdminSetup] Self-test (should be true):', testCompare);
      
      if (!testCompare) {
        throw new Error('Hash generation failed self-test!');
      }
      
      // Delete existing admin
      const { error: deleteError } = await supabase
        .from('admins')
        .delete()
        .eq('username', username);
      
      if (deleteError) {
        console.warn('[AdminSetup] Delete error (might not exist):', deleteError);
      }
      
      // Insert new admin with generated hash
      const { data, error } = await supabase
        .from('admins')
        .insert({
          username: username,
          password: hash,
        })
        .select();
      
      if (error) {
        console.error('[AdminSetup] Insert error:', error);
        throw new Error('Failed to create admin: ' + error.message);
      }
      
      console.log('[AdminSetup] Admin created successfully:', data);
      return {
        success: true,
        username: username,
        hash: hash,
        message: `Admin created! Login with username: ${username}, password: ${password}`
      };
      
    } catch (error: any) {
      console.error('[AdminSetup] Setup failed:', error);
      throw error;
    }
  }
  
  /**
   * Quick setup for default admin account
   */
  static async setupDefaultAdmin() {
    return await this.createAdmin('admin', 'admin123');
  }
}
