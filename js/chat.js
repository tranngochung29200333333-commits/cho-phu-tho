// Chợ Phú Thọ - trao đổi online realtime giữa người mua và người bán
(function(){
  const esc=v=>typeof escapeHtml==='function'?escapeHtml(v):String(v??'').replace(/[&<>'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','\"':'&quot;'}[c]));
  const qs=new URLSearchParams(location.search);
  const targetId=qs.get('seller')||qs.get('user');
  const listingId=qs.get('listing');
  let me=null,activeUser=targetId,activeListing=listingId,pollTimer=null,realtimeChannel=null,loadingThread=false;
  const profileCache=new Map(),listingCache=new Map();
  async function getProfile(id){if(!id)return null;if(profileCache.has(id))return profileCache.get(id);const r=await supabaseClient.from('profiles').select('id,full_name,phone,shop_name,shop_description,avatar_url,verified_at,created_at').eq('id',id).maybeSingle();const p=r.data||null;if(p)profileCache.set(id,p);return p;}
  async function getListing(id){if(!id||!/^\d+$/.test(String(id)))return null;const key=String(id);if(listingCache.has(key))return listingCache.get(key);const r=await supabaseClient.from('listings').select('id,title,price,location,status').eq('id',Number(id)).maybeSingle();const x=r.data||null;if(x)listingCache.set(key,x);return x;}
  function personName(p){return p?.shop_name||p?.full_name||'Người dùng';}
  function time(v){return new Date(v).toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'});}
  function price(v){const n=Number(v);return Number.isFinite(n)&&n>0?n.toLocaleString('vi-VN')+' đ':'Thỏa thuận';}
  function setStatus(text){const el=document.querySelector('.chat-online-status');if(el)el.textContent=text;}
  async function init(){
    if(typeof supabaseClient==='undefined')return;
    me=(await supabaseClient.auth.getUser()).data?.user||null;
    const shell=document.getElementById('chatShell');if(!shell)return;
    if(!me){shell.innerHTML='<div class="empty-state"><h3>Đăng nhập để trao đổi online</h3><p>Nhắn tin trực tiếp với người mua hoặc nhà bán hàng.</p><a class="primary-button" href="dang-nhap.html?next='+encodeURIComponent(location.href)+'">Đăng nhập</a></div>';return;}
    renderShell();await loadConversations();
    if(activeUser){await loadThread(activeUser,activeListing);const p=await getProfile(activeUser);if(p)document.title='Trao đổi với '+personName(p)+' - Chợ Phú Thọ';}
    subscribeRealtime();
    pollTimer=setInterval(()=>{loadConversations();if(activeUser&&!loadingThread)loadThread(activeUser,activeListing);},15000);
  }
  function renderShell(){
    document.getElementById('chatShell').innerHTML='<aside class="chat-list"><div class="chat-list-head"><div><strong>💬 Cuộc trò chuyện</strong><small class="chat-online-status">● Đang kết nối...</small></div><button id="chatRefresh" type="button" title="Làm mới danh sách">↻</button></div><div id="conversationList"><div class="loading">Đang tải cuộc trò chuyện...</div></div></aside><section class="chat-main"><div id="chatHeader" class="chat-header"><div><strong>🤝 Kết nối &amp; trao đổi</strong><small>Chọn một cuộc trò chuyện để tiếp tục nhắn tin với người mua hoặc nhà bán hàng.</small></div></div><div id="messageList" class="message-list"><div class="empty-state"><div class="empty-icon">💬</div><h3>Kết nối với người mua &amp; nhà bán hàng</h3><p>Lịch sử trò chuyện của bạn sẽ luôn hiển thị ở danh sách bên trên.</p></div></div><div class="chat-quick-replies" id="chatQuickReplies"><button type="button" data-text="Xin chào, mình quan tâm sản phẩm này ạ.">Xin chào 👋</button><button type="button" data-text="Sản phẩm còn không ạ?">Còn hàng không?</button><button type="button" data-text="Mình muốn xem sản phẩm. Bạn tư vấn giúp mình nhé.">Tư vấn sản phẩm</button></div><form id="messageForm" class="message-form"><input id="messageInput" maxlength="1000" placeholder="Nhập tin nhắn..." autocomplete="off"><button type="submit">Gửi</button></form></section>';
    document.getElementById('chatRefresh').onclick=loadConversations;document.getElementById('messageForm').onsubmit=sendMessage;
    document.querySelectorAll('#chatQuickReplies button').forEach(btn=>btn.onclick=()=>{const input=document.getElementById('messageInput');if(input){input.value=btn.dataset.text;input.focus();}});
  }
  async function loadConversations(){
    const box=document.getElementById('conversationList');if(!box||!me)return;
    const {data,error}=await supabaseClient.rpc('get_my_conversations');
    if(error){console.error('get_my_conversations',error);box.innerHTML='<div class="empty-state"><p>Không tải được hội thoại.</p><small>'+esc(error.message||'Vui lòng thử lại.')+'</small></div>';return;}
    const map=new Map();
    for(const m of data||[]){const other=m.sender_id===me.id?m.receiver_id:m.sender_id;if(!other||other===me.id)continue;const key=String(other);if(!map.has(key))map.set(key,m);}
    const ids=[...map.keys()];await Promise.all(ids.map(id=>getProfile(id)));
    if(!map.size){box.innerHTML='<div class="empty-state"><div class="empty-icon">💬</div><p>Chưa có cuộc trò chuyện.</p><small>Mở một tin đăng và chọn “Trao đổi online” để bắt đầu.</small></div>';return;}
    box.innerHTML=[...map.entries()].map(([key,m])=>{const other=m.sender_id===me.id?m.receiver_id:m.sender_id,p=profileCache.get(other),unread=m.receiver_id===me.id&&!m.read_at;return `<button class="conversation-item ${other===activeUser?'active':''}" data-user="${esc(other)}" data-listing="${esc(m.listing_id||'')}"><div class="conversation-avatar">${p?.avatar_url?`<img src="${esc(p.avatar_url)}" alt="">`:'👤'}</div><strong>${esc(personName(p))}</strong>${unread?'<b class="chat-unread">Mới</b>':''}<span>${esc(m.body||'')}</span><small>${time(m.created_at)}</small></button>`;}).join('');
    box.querySelectorAll('.conversation-item').forEach(b=>b.onclick=async()=>{activeUser=b.dataset.user;activeListing=b.dataset.listing||null;await loadConversations();await loadThread(activeUser,activeListing);const p=await getProfile(activeUser);if(p)document.title='Trao đổi với '+personName(p)+' - Chợ Phú Thọ';});
  }
  async function loadThread(userId,lid){
    if(!userId||!me||loadingThread)return;loadingThread=true;
    try{
      const numericListing=lid&&/^\d+$/.test(String(lid))?Number(lid):null;
      const {data,error}=await supabaseClient.rpc('get_chat_messages',{p_user_id:userId,p_listing_id:numericListing});
      if(error){console.error('get_chat_messages',error);return;}
      const rows=data||[],prof=await getProfile(userId),listing=await getListing(lid),box=document.getElementById('messageList'),header=document.getElementById('chatHeader');if(!box||!header)return;
      const avatar=prof?.avatar_url?`<img src="${esc(prof.avatar_url)}" alt="">`:'👤';
      const product=listing?`<a class="chat-product-context" href="chi-tiet.html?id=${encodeURIComponent(listing.id)}"><span class="chat-product-icon">📦</span><span><b>${esc(listing.title||'Tin đăng')}</b><small>${price(listing.price)} · ${esc(listing.location||'Phú Thọ')}</small></span><strong>›</strong></a>`:'';
      header.innerHTML=`<div class="chat-person"><div class="conversation-avatar large">${avatar}</div><div><strong>${esc(personName(prof))}</strong><small>${prof?.verified_at?'✓ Nhà bán hàng đã xác minh':'Người dùng Chợ Phú Thọ'}${lid?' · Đang trao đổi về sản phẩm':''}</small></div></div><div class="chat-header-actions">${lid?`<a class="chat-view-product" href="chi-tiet.html?id=${encodeURIComponent(lid)}">Xem sản phẩm</a>`:''}<a href="nguoi-ban.html?id=${encodeURIComponent(userId)}">Xem profile</a></div>${product}`;
      box.innerHTML=rows.length?rows.map(m=>`<div class="message-row ${m.sender_id===me.id?'mine':''}" data-message-id="${esc(m.id)}"><div class="message-bubble">${esc(m.body).replace(/\n/g,'<br>')}<small>${time(m.created_at)}</small></div></div>`).join(''):'<div class="empty-state"><p>Hãy gửi lời chào đầu tiên 👋</p></div>';
      box.scrollTop=box.scrollHeight;
      await supabaseClient.from('messages').update({read_at:new Date().toISOString()}).eq('receiver_id',me.id).eq('sender_id',userId).is('read_at',null);
    }finally{loadingThread=false;}
  }
  function subscribeRealtime(){
    if(realtimeChannel)supabaseClient.removeChannel(realtimeChannel);
    realtimeChannel=supabaseClient.channel('messages-realtime-'+me.id).on('postgres_changes',{event:'INSERT',schema:'public',table:'messages'},payload=>{const m=payload.new;if(!m||(m.sender_id!==me.id&&m.receiver_id!==me.id))return;if(m.sender_id===activeUser||m.receiver_id===activeUser){const sameListing=String(m.listing_id||'')===String(activeListing||'');if(sameListing||!activeListing)loadThread(activeUser,m.listing_id||null);}loadConversations();if(m.receiver_id===me.id&&m.sender_id!==activeUser){getProfile(m.sender_id).then(p=>{if(document.hidden&&'Notification'in window&&Notification.permission==='granted')new Notification('Tin nhắn mới',{body:personName(p)+': '+String(m.body||'').slice(0,100)});});}}).subscribe(status=>{setStatus(status==='SUBSCRIBED'?'● Đang kết nối trực tiếp':'○ Đang kết nối lại...');});
    if('Notification'in window&&Notification.permission==='default')Notification.requestPermission().catch(()=>{});
  }
  async function sendMessage(e){e.preventDefault();if(!activeUser){alert('Hãy chọn nhà bán hàng hoặc cuộc trò chuyện.');return;}const input=document.getElementById('messageInput'),body=input.value.trim();if(!body)return;const button=e.submitter||document.querySelector('#messageForm button');if(button)button.disabled=true;const numericListing=activeListing&&/^\d+$/.test(String(activeListing))?Number(activeListing):null;const {error}=await supabaseClient.from('messages').insert({sender_id:me.id,receiver_id:activeUser,listing_id:numericListing,body});if(button)button.disabled=false;if(error){alert('Không thể gửi tin nhắn: '+error.message);return;}input.value='';await loadThread(activeUser,activeListing);await loadConversations();}
  window.addEventListener('beforeunload',()=>{if(pollTimer)clearInterval(pollTimer);if(realtimeChannel)supabaseClient.removeChannel(realtimeChannel);});
  document.addEventListener('DOMContentLoaded',init);
})();
