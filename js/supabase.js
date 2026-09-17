const SUPABASE_URL = "https://aowdfgemtvkmrvnuuctw.supabase.co";
const SUPABASE_KEY = "sb_publishable_Dn-2lmgn3YfKteVJXDEoSA_dj9GmSVF";
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

(function loadGlobalUI(){
  const version='20260917-1';
  const add=(href,key)=>{if(document.querySelector('link[data-'+key+']'))return;const link=document.createElement('link');link.rel='stylesheet';link.href=href+'?v='+version;link.dataset[key]='1';document.head.appendChild(link)};
  add('css/premium-ui.css','premium-ui');
  add('css/professional-upgrade.css','professional-upgrade');
  const script=document.createElement('script');script.src='js/professional-upgrade.js?v='+version;script.defer=true;document.head.appendChild(script);
})();
