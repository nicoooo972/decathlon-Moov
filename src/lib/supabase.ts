import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || 'https://vzxnfzbgyuoohbocullm.supabase.co'
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6eG5memJneXVvb2hib2N1bGxtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE3MDMxOTgsImV4cCI6MjA1NzI3OTE5OH0.GQZ79my6H6H8fy670ZCAUn0m014ek_E3CJRiMuMkMTg'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: 'decathlon-urban-trek-auth',
    storage: {
      getItem: (key) => {
        if (typeof window !== 'undefined') {
          return localStorage.getItem(key);
        }
        return null;
      },
      setItem: (key, value) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem(key, value);
        }
      },
      removeItem: (key) => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem(key);
        }
      }
    }
  }
}) 