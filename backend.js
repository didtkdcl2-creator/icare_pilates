import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();
let client = null;
if (url && key?.startsWith('sb_publishable_')) {
  try {
    const endpoint = new URL(url);
    const localEndpoint = import.meta.env.DEV && ['localhost', '127.0.0.1', '[::1]'].includes(endpoint.hostname);
    if (endpoint.protocol === 'https:' || (localEndpoint && endpoint.protocol === 'http:')) {
      client = createClient(endpoint.origin, key, { auth: { persistSession: false, detectSessionInUrl: false } });
    }
  } catch { /* An invalid deployment setting leaves the public site available. */ }
}
export const backend = client;
export const demo = !backend && import.meta.env.DEV && ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);

export function checked({ data, error }) {
  if (error) throw error;
  return data;
}
