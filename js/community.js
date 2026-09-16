// Chợ Phú Thọ - tính năng cộng đồng bổ sung
(function () {
    const $ = (s, root = document) => root.querySelector(s);
    const esc = v => typeof escapeHtml === 'function' ? escapeHtml(v) : String(v ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[c]));
    async function user() { const { data } = await supabaseClient.auth.getUser(); return data?.user || null; }
    function money(v){ const n=Number(v); return n>0?n.toLocaleString('vi-VN')+' đ':'Thỏa thuận'; }
    function stars(n){ return '★'.repeat(Number(n)||0)+'☆'.repeat(5-(Number(n)||0)); }

    async function loadFavoritesPage(){
        const box = $('#favoritesList'); if(!box) return;
        const me = await user(); if(!me){ box.innerHTML='<div class="empty-state"><h3>Đăng nhập để xem tin yêu thích</h3><a class="btn-post" href="dang-nhap.html">Đăng nhập</a></div>'; return; }
        const { data: favs, error } = await supabaseClient.from('favorites').select('listing_id').eq('user_id',me.id).order('created_at',{ascending:false});
        if(error){ box.innerHTML='<div class="empty-state">Không tải được tin yêu thích.</div>'; return; }
        const ids=(favs||[]).map(x=>x.listing_id); if(!ids.length){box.innerHTML='<div class="empty-state"><div class="empty-icon">♡</div><h3>Bạn chưa lưu tin nào</h3><p>Nhấn ♡ trên tin đăng để lưu lại.</p></div>';return;}
        const { data:listings }=await supabaseClient.from('listings').select('*').in('id',ids).eq('status','approved');
        box.innerHTML=(listings||[]).map(item=>`<a class="product-link" href="chi-tiet.html?id=${encodeURIComponent(item.id)}"><article class="product"><img src="${esc(window.homeListingImages?.[item.id]?.[0]?.image_url||'') }" alt="${esc(item.title)}"><div class="product-content"><div class="listing-category">${esc(item.category||item.network||'Khác')}</div><div class="title">${esc(item.title)}</div><div class="price">${money(item.price)}</div><div class="location-small">📍 ${esc(item.location||'Phú Thọ')}</div></div></article></a>`).join('');
    }

    async function addCommentsAndReviews(){
        const root=$('#productDetail'); if(!root) return;
        const wait=()=>{ if(!$('.detail-box',root)){setTimeout(wait,300);return;} if($('#communityPanel',root))return; buildCommunity(root); };
        wait();
    }

    async function buildCommunity(root){
        const id=new URLSearchParams(location.search).get('id'); if(!id)return;
        const {data:item}=await supabaseClient.from('listings').select('id,seller_id').eq('id',id).maybeSingle(); if(!item)return;
        const panel=document.createElement('section'); panel.id='communityPanel'; panel.className='community-panel';
        panel.innerHTML=`<div class="community-grid"><div class="community-card"><h3>💬 Bình luận</h3><div id="commentsList" class="comments-list"><div class="muted">Đang tải...</div></div><form id="commentForm" class="community-form"><textarea id="commentBody" rows="3" maxlength="800" placeholder="Đặt câu hỏi hoặc trao đổi về tin này..."></textarea><button class="btn-post">Gửi bình luận</button></form></div><div class="community-card"><h3>⭐ Đánh giá người bán</h3><div id="reviewSummary" class="review-summary">Đang tải...</div><div id="reviewList" class="review-list"></div><form id="reviewForm" class="community-form"><select id="reviewRating"><option value="5">★★★★★ 5 sao</option><option value="4">★★★★☆ 4 sao</option><option value="3">★★★☆☆ 3 sao</option><option value="2">★★☆☆☆ 2 sao</option><option value="1">★☆☆☆☆ 1 sao</option></select><textarea id="reviewBody" rows="3" maxlength="800" placeholder="Chia sẻ trải nghiệm của bạn..."></textarea><button class="btn-post">Gửi đánh giá</button></form></div></div>`;
        root.appendChild(panel);
        await loadComments(id); await loadReviews(item.seller_id);
        $('#commentForm',panel).addEventListener('submit',submitComment); $('#reviewForm',panel).addEventListener('submit',e=>submitReview(e,item.seller_id,id));
    }

    async function loadComments(id){ const box=$('#commentsList'); const {data,error}=await supabaseClient.from('listing_comments').select('id,body,created_at,user_id').eq('listing_id',id).order('created_at',{ascending:true}); if(error){box.innerHTML='<div class="muted">Không tải được bình luận.</div>';return;} if(!data?.length){box.innerHTML='<div class="muted">Chưa có bình luận.</div>';return;} box.innerHTML=data.map(c=>`<div class="comment-item"><strong>${esc(c.user_id?.slice(0,8)||'Người dùng')}</strong><small>${new Date(c.created_at).toLocaleString('vi-VN')}</small><p>${esc(c.body)}</p></div>`).join(''); }
    async function submitComment(e){e.preventDefault();const me=await user();if(!me){location.href='dang-nhap.html';return;}const id=new URLSearchParams(location.search).get('id');const body=$('#commentBody').value.trim();if(!body)return;const {error}=await supabaseClient.from('listing_comments').insert({listing_id:id,user_id:me.id,body});if(error){alert('Không thể gửi bình luận: '+error.message);return;}$('#commentBody').value='';loadComments(id);}
    async function loadReviews(sellerId){
        const summary=$('#reviewSummary'),list=$('#reviewList'); if(!sellerId){summary.textContent='Chưa có người bán.';return;}
        const {data}=await supabaseClient.from('reviews').select('rating,body,created_at,reviewer_id').eq('seller_id',sellerId).eq('status','approved').order('created_at',{ascending:false});
        const rows=data||[]; const avg=rows.length?rows.reduce((s,x)=>s+Number(x.rating),0)/rows.length:0; summary.innerHTML=`<div class="review-score"><b>${avg?avg.toFixed(1):'—'}</b><span>${avg?stars(Math.round(avg)):'☆☆☆☆☆'}</span><small>${rows.length} đánh giá</small></div>`;
        list.innerHTML=rows.slice(0,8).map(r=>`<div class="review-item"><div><span class="stars">${stars(r.rating)}</span><small>${new Date(r.created_at).toLocaleDateString('vi-VN')}</small></div><p>${esc(r.body||'Không có nhận xét.')}</p></div>`).join('')||'<div class="muted">Chưa có đánh giá.</div>';
    }
    async function submitReview(e,sellerId,listingId){e.preventDefault();const me=await user();if(!me){location.href='dang-nhap.html';return;}if(me.id===sellerId){alert('Bạn không thể tự đánh giá chính mình.');return;}const rating=Number($('#reviewRating').value),body=$('#reviewBody').value.trim();const {error}=await supabaseClient.from('reviews').insert({reviewer_id:me.id,seller_id:sellerId,listing_id:listingId,rating,body,status:'pending'});if(error){alert(error.code==='23505'?'Bạn đã đánh giá tin này rồi.':'Không thể gửi đánh giá: '+error.message);return;}$('#reviewBody').value='';alert('Đã gửi đánh giá, chờ Admin kiểm duyệt.');}

    async function loadNotifications(){ const box=$('#notificationsList');if(!box)return;const me=await user();if(!me){box.innerHTML='<div class="empty-state"><h3>Đăng nhập để xem thông báo</h3></div>';return;}const {data,error}=await supabaseClient.from('notifications').select('*').eq('user_id',me.id).order('created_at',{ascending:false}).limit(100);if(error){box.innerHTML='<div class="empty-state">Không tải được thông báo.</div>';return;}box.innerHTML=(data||[]).map(n=>`<a class="notification-item ${n.read_at?'':'unread'}" href="${esc(n.url||'#')}" data-notification="${esc(n.id)}"><strong>${esc(n.title)}</strong><span>${esc(n.body||'')}</span><small>${new Date(n.created_at).toLocaleString('vi-VN')}</small></a>`).join('')||'<div class="empty-state">Chưa có thông báo.</div>';box.querySelectorAll('[data-notification]').forEach(a=>a.addEventListener('click',()=>supabaseClient.from('notifications').update({read_at:new Date().toISOString()}).eq('id',a.dataset.notification).eq('user_id',me.id))); }

    async function loadChat(){
        const box=$('#chatShell');if(!box)return;const me=await user();if(!me){box.innerHTML='<div class="empty-state"><h3>Đăng nhập để nhắn tin</h3><a class="btn-post" href="dang-nhap.html">Đăng nhập</a></div>';return;}
        const qs=new URLSearchParams(location.search), other=qs.get('user'), listing=qs.get('listing');
        const {data:msgs}=await supabaseClient.from('messages').select('*').or(`sender_id.eq.${me.id},receiver_id.eq.${me.id}`).order('created_at',{ascending:true}).limit(300);
        const all=msgs||[];let otherId=other;
        if(!otherId&&listing){const m=all.find(x=>String(x.listing_id)===String(listing));otherId=m?(m.sender_id===me.id?m.receiver_id:m.sender_id):null;}
        const people=[...new Set(all.map(m=>m.sender_id===me.id?m.receiver_id:m.sender_id))];
        const listBox=document.createElement('div');listBox.className='chat-sidebar';listBox.innerHTML=`<h3>Tin nhắn</h3>`+(people.map(p=>`<a href="chat.html?user=${encodeURIComponent(p)}${listing?'&listing='+encodeURIComponent(listing):''}" class="chat-person ${p===otherId?'active':''}">👤 ${esc(p.slice(0,8))}</a>`).join('')||'<p class="muted">Chưa có cuộc trò chuyện.</p>');
        const content=document.createElement('div');content.className='chat-content';
        if(otherId){const rows=all.filter(m=>m.sender_id===otherId||m.receiver_id===otherId);content.innerHTML=`<div class="chat-messages">${rows.map(m=>`<div class="chat-bubble ${m.sender_id===me.id?'mine':''}">${esc(m.body)}<small>${new Date(m.created_at).toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'})}</small></div>`).join('')}</div><form id="chatForm" class="chat-compose"><input id="chatBody" maxlength="1000" placeholder="Nhập tin nhắn..."><button class="btn-post">Gửi</button></form>`;
            content.querySelector('#chatForm').addEventListener('submit',async e=>{e.preventDefault();const body=$('#chatBody',content).value.trim();if(!body)return;const {error}=await supabaseClient.from('messages').insert({sender_id:me.id,receiver_id:otherId,listing_id:listing?Number(listing):null,body});if(error){alert('Không thể gửi tin nhắn: '+error.message);return;}location.reload();});
        }else content.innerHTML='<div class="chat-empty">Chọn một cuộc trò chuyện để bắt đầu.</div>';
        box.innerHTML='';box.appendChild(listBox);box.appendChild(content);
    }

    async function decorateAccount(){const a=$('#accountArea');if(!a)return;const me=await user();if(!me)return;const links=document.createElement('div');links.className='account-shortcuts';links.innerHTML='<a href="yeu-thich.html">♡ Yêu thích</a><a href="chat.html">💬 Tin nhắn</a><a href="thong-bao.html">🔔 Thông báo</a>';a.appendChild(links);}
    document.addEventListener('DOMContentLoaded',()=>{ if(typeof supabaseClient==='undefined')return; decorateAccount();loadFavoritesPage();loadNotifications();loadChat();if($('#productDetail')) addCommentsAndReviews(); });
})();
