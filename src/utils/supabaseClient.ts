// src/utils/supabaseClient.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config/config.ts';

const SUPABASE_URL = config.supabaseUrl!;
const SUPABASE_KEY = config.supabaseKey!;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error('SUPABASE_URL and SUPABASE_KEY must be set in .env');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
export type { SupabaseClient };
