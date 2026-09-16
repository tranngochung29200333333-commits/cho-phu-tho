const SUPABASE_URL = "https://aowdfgemtvkmrvnuuctw.supabase.co";
const SUPABASE_KEY = "sb_publishable_Dn-2lmgn3YfKteVJXDEoSA_dj9GmSVF";
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Global visual layer: keep every page on the same polished UI system.
(function loadPremiumUI(){
  if(document.querySelector('link[data-premium-ui]')) return;
  const link=document.createElement('link');
  link.rel='stylesheet';
  link.href='css/premium-ui.css?v=20260916-2';
  link.dataset.premiumUi='1';
  document.head.appendChild(link);
})();
