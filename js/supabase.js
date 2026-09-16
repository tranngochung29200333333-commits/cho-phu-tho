const SUPABASE_URL = "https://aowdfgemtvkmrvnuuctw.supabase.co";
const SUPABASE_KEY = "sb_publishable_Dn-2lmgn3YfKteVJXDEoSA_dj9GmSVF";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Load common community features on every page without requiring every HTML page to repeat the script tag.
(function loadCommunityFeatures(){
    if(document.querySelector('script[data-community-loader]')) return;
    const s=document.createElement('script');
    s.src='js/community.js';
    s.dataset.communityLoader='1';
    document.head.appendChild(s);
})();
