import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

if (!process.env.SUPABASE_SERVICE_ROLE) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE environment variable');
}

export const createServiceClient = () =>
  createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
