// Di-generate otomatis saat deploy Vercel dari env vars
// Untuk local dev: isi manual sementara, jangan di-commit
const SUPABASE_URL = '';
const SUPABASE_ANON_KEY = '';
supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
