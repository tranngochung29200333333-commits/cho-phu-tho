const SUPABASE_URL = "https://aowdfgemtvkmrvnuuctw.supabase.co";
const SUPABASE_KEY = "sb_publishable_Dn-2lmgn3YfKteVJXDEoSA_dj9GmSVF";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

(function loadSharedScripts(){
    const scripts = [
        ['js/community.js','community-loader'],
        ['js/view-counter.js','view-counter-loader']
    ];
    for (const [src, key] of scripts) {
        if (document.querySelector(`script[data-loader="${key}"]`)) continue;
        const s=document.createElement('script');
        s.src=src;
        s.dataset.loader=key;
        document.head.appendChild(s);
    }
})();
