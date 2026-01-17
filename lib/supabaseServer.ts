import { createClient } from '@supabase/supabase-js';

/**
 * Creates a Supabase client with service role key for server-side use only.
 * Never expose this client or its key to the browser.
 */
export function getSupabaseServerClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Extracts and validates the user from the Authorization header.
 * Returns user id if valid, null otherwise.
 */
export async function getUserFromAuth(authHeader: string | null): Promise<string | null> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  const supabase = getSupabaseServerClient();

  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) {
      return null;
    }
    return data.user.id;
  } catch (error) {
    console.error('Error verifying auth token:', error);
    return null;
  }
}
