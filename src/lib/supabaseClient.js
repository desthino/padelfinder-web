import { createClient } from '@supabase/supabase-js';
const SUPABASE_URL = 'https://eoncoqhppukzjjeltxwb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVvbmNvcWhwcHVrempqZWx0eHdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwODcwNzksImV4cCI6MjA5NTY2MzA3OX0.BExwednIyqRPFUwf_LSqEGSt4Qc4WkY8fSgQJEWF5Mg';
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
