import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

/**
 * Admin client with service role key - ONLY use on server side
 * Never expose this client to the browser
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Missing Supabase URL or Service Role Key')
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }) as any
}
