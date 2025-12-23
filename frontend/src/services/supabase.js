import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

console.log('[ENV] VITE_SUPABASE_URL =', SUPABASE_URL)
console.log('[ENV] VITE_SUPABASE_ANON_KEY exists =', !!SUPABASE_ANON_KEY)

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY')
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

export async function checkConnection() {
  try {
    const { error } = await supabase.from('settings').select('key').limit(1)
    return !error
  } catch {
    return false
  }
}
