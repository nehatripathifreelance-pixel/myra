import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Provide a fallback URL to prevent createClient from throwing if URL is empty
const validUrl = supabaseUrl || 'https://placeholder-project.supabase.co';
const validKey = supabaseAnonKey || 'placeholder-key';

export const supabase = createClient(validUrl, validKey);

// Connection test
const testConnection = async () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase URL or Anon Key is missing. App might not function correctly.');
    return;
  }
  try {
    const { error } = await supabase.from('settings').select('id').limit(1);
    if (error) {
      console.error('Supabase connection error:', error.message);
    } else {
      console.log('Supabase connected successfully.');
    }
  } catch (err) {
    console.error('Supabase connection test failed:', err);
  }
};

testConnection().catch(console.error);
