import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Using provided credentials
const supabaseUrl = 'https://muaguhqqgityyduhkwgq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11YWd1aHFxZ2l0eXlkdWhrd2dxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyOTQ4MzIsImV4cCI6MjA3ODg3MDgzMn0.562zibXgOHGzqOKxpeDsUGNYb7JLD60A1dzcHKJFtB4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false, // Critical for mobile
    },
});