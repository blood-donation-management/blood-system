import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = 'https://wwhfxrgjeparrccoojjb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3aGZ4cmdqZXBhcnJjY29vampiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MzM2NjgsImV4cCI6MjA4MDAwOTY2OH0.GiFbefEehY1lom7uygbRz4k3ZMNhv6ZwTtTVPuafuXY';

export { supabaseUrl, supabaseAnonKey };

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
