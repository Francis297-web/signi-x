// js/supabase.js - 2.50.0 UMD compliant
const SUPABASE_URL = "https://ocfdsuthkdtcpjliuesz.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_LWDSOTkh_Nvjtk3SeN7r2A_244qkVLP";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Expose globally for signix.bot.js
window.supabaseClient = supabaseClient;
window.SUPABASE_URL = SUPABASE_URL;
window.SUPABASE_ANON_KEY = SUPABASE_ANON_KEY;

console.log("Supabase ready:", SUPABASE_URL);
