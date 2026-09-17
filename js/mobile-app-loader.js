(function(){
  function load(){
    if(document.getElementById('mobile-app-exact-css'))return;
    var link=document.createElement('link');
    link.id='mobile-app-exact-css';link.rel='stylesheet';link.href='css/mobile-app-exact.css?v=20260917-1';
    document.head.appendChild(link);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',load,{once:true});else load();
})();