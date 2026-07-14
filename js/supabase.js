// Supabase Configuration

const SUPABASE_URL = "https://ocfdsuthkdtcpjliuesz.supabase.co";

const SUPABASE_ANON_KEY = "sb_publishable_LWDSOTkh_Nvjtk3SeN7r2A_244qkVLP";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);

console.log(" Supabase connected successfully!");
