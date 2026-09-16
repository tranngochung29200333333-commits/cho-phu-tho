(function(){
  async function start(){
    if(typeof supabaseClient==='undefined')return;
    const id=new URLSearchParams(location.search).get('id');
    if(!id)return;
    const key='viewed_listing_'+id;
    if(sessionStorage.getItem(key))return;
    sessionStorage.setItem(key,'1');
    const {data}=await supabaseClient.from('listings').select('view_count').eq('id',id).maybeSingle();
    if(data){ await supabaseClient.from('listings').update({view_count:(Number(data.view_count)||0)+1}).eq('id',id); }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
