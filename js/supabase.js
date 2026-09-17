const SUPABASE_URL = "https://aowdfgemtvkmrvnuuctw.supabase.co";
const SUPABASE_KEY = "sb_publishable_Dn-2lmgn3YfKteVJXDEoSA_dj9GmSVF";
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

(function loadGlobalUI(){
  const version='20260917-4';
  const add=(href,key)=>{if(document.querySelector('link[data-'+key+']'))return;const link=document.createElement('link');link.rel='stylesheet';link.href=href+'?v='+version;link.dataset[key]='1';document.head.appendChild(link)};
  add('css/premium-ui.css','premium-ui');
  add('css/professional-upgrade.css','professional-upgrade');
  const addScript=(src,key)=>{if(document.querySelector('script[data-'+key+']'))return;const s=document.createElement('script');s.src=src+'?v='+version;s.defer=true;s.dataset[key]='1';document.head.appendChild(s)};
  addScript('js/professional-upgrade.js','professional-upgrade-script');
  addScript('js/detail-engagement.js','detail-engagement-script');
  addScript('js/account-enhancement.js','account-enhancement-script');
  if('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(()=>{});
})();
