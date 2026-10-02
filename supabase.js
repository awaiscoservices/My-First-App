import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// createBrowserClient stores the session in cookies (not localStorage),
// so middleware.js can see that the user is logged in.
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)
