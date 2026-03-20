import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL or Anon Key is missing. Please check your environment variables.');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

// Connection test
const testConnection = async () => {
  try {
    const { data, error } = await supabase.from('settings').select('id').limit(1);
    if (error) {
      if (error.message.includes('Failed to fetch')) {
        console.error('Supabase connection failed: The client is offline or the URL is incorrect.');
      } else {
        console.error('Supabase connection error:', error.message);
      }
    } else {
      console.log('Supabase connected successfully.');
    }
  } catch (err) {
    console.error('Supabase connection test failed:', err);
  }
};

testConnection();
