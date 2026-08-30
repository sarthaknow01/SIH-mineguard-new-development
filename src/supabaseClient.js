import { createClient } from '@supabase/supabase-js'

export const SUPABASE_URL = 'https://ylnttsxhxzqurkbpxswe.supabase.co';
export const SUPABASE_KEY = 'sb_publishable_FJBmuqcCsXKRy6pJeJrXTg_5HCzqKPW';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);