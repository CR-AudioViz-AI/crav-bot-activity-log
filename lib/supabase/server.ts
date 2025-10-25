import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import type { Database } from './types';

export const createClient = () => {
  const cookieStore = cookies();
  
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        storage: {
          getItem: (key: string) => {
            return cookieStore.get(key)?.value ?? null;
          },
          setItem: (key: string, value: string) => {
            try {
              cookieStore.set(key, value);
            } catch {}
          },
          removeItem: (key: string) => {
            try {
              cookieStore.delete(key);
            } catch {}
          },
        },
      },
    }
  );
};
