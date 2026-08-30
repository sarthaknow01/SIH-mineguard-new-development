import { createClient } from '@supabase/supabase-js'

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://pojjhykcgoyjdqhvjsst.supabase.co';
export const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_AJolqYX51PRdvqmkgaywew_d14CtFzl';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);