(function(){
  function init(){
    const actions=document.querySelector('.detail-actions-grid');
    if(!actions||document.querySelector('.pt-share-row'))return;
    const row=document.createElement('div');row.className='pt-share-row';
    row.innerHTML='<button class="pt-share-btn" type="button" data-share>↗ Chia sẻ tin</button><button class="pt-share-btn" type="button" data-copy>🔗 Sao chép link</button>';
    actions.parentNode.insertBefore(row,actions.nextSibling);
    row.querySelector('[data-share]').onclick=async()=>{try{if(navigator.share)await navigator.share({title:document.title,text:'Xem tin trên Chợ Phú Thọ',url:location.href});else{await navigator.clipboard.writeText(location.href);ptToast('Đã sao chép liên kết')}}catch(e){}};
    row.querySelector('[data-copy]').onclick=async()=>{try{await navigator.clipboard.writeText(location.href);ptToast('Đã sao chép link tin đăng')}catch(e){ptToast('Không thể sao chép link')}};
  }
  const timer=setInterval(()=>{init();if(document.querySelector('.detail-actions-grid'))clearInterval(timer)},300);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
