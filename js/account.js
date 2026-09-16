(function(){
  const esc=v=>typeof escapeHtml==='function'?escapeHtml(v):String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[c]));
  const fmt=v=>v?new Date(v).toLocaleString('vi-VN'):'';
  document.addEventListener('DOMContentLoaded',async()=>{
    if(typeof supabaseClient==='undefined')return;
    const box=document.getElementById('accountCenter');if(!box)return;
    const {data,error}=await supabaseClient.auth.getUser();
    if(error||!data?.user){
      box.innerHTML='<div class="seller-profile-head"><div class="seller-avatar">👤</div><div><span class="eyebrow">TÀI KHOẢN</span><h2>Đăng nhập hoặc đăng ký</h2><p class="muted">Quản lý tin đăng, tin yêu thích, tin nhắn và tài khoản nhà bán hàng.</p><div style="margin-top:12px"><a class="detail-action primary" href="dang-nhap.html?next=tai-khoan.html">🔐 Đăng nhập</a><a class="detail-action" href="dang-ky.html">📝 Đăng ký</a><a class="detail-action" href="dang-ky-nha-ban-hang.html">🏪 Đăng ký nhà bán hàng</a></div></div></div>';return;
    }
    const u=data.user;const {data:p,error:pErr}=await supabaseClient.from('profiles').select('full_name,phone,role,shop_name,shop_description,verified_at,created_at,avatar_url').eq('id',u.id).maybeSingle();
    const name=p?.shop_name||p?.full_name||u.user_metadata?.full_name||u.email?.split('@')[0]||'Bạn';
    const role=p?.role==='admin'?'QUẢN TRỊ VIÊN':p?.role==='seller'?'NHÀ BÁN HÀNG':'KHÁCH HÀNG';
    const avatar=p?.avatar_url?`<img src="${esc(p.avatar_url)}" alt="Ảnh đại diện">`:'👤';
    box.innerHTML=`<div class="seller-profile-head"><div class="seller-avatar">${avatar}</div><div><span class="eyebrow">${role}</span><h2>${esc(name)}</h2><p>${esc(u.email||'')}</p><p>☎ ${esc(p?.phone||'Chưa cập nhật')}</p>${p?.verified_at?'<div class="seller-trust">✅ Đã xác minh nhà bán hàng</div>':''}<div style="display:flex;gap:6px;flex-wrap:wrap"><button id="editProfile" class="outline-button detail-action" type="button">✏️ Hồ sơ cửa hàng</button><button id="logoutAccount" class="outline-button detail-action" type="button">Đăng xuất</button></div></div></div>`;
    document.getElementById('logoutAccount').onclick=async()=>{await supabaseClient.auth.signOut();location.href='index.html'};
    document.getElementById('editProfile').onclick=()=>openEditor(u,p);
    if(p?.role==='seller')addSellerEditorHint(p);
    const nbox=document.getElementById('notifications');if(!nbox)return;
    await renderNotifications(u.id,nbox);
    const channel=supabaseClient.channel('account-notifications-'+u.id).on('postgres_changes',{event:'INSERT',schema:'public',table:'notifications',filter:'user_id=eq.'+u.id},payload=>{renderNotifications(u.id,nbox);});channel.subscribe();
    window.addEventListener('beforeunload',()=>supabaseClient.removeChannel(channel));
  });
  async function renderNotifications(uid,nbox){
    const r=await supabaseClient.from('notifications').select('id,title,body,url,read_at,created_at').eq('user_id',uid).order('created_at',{ascending:false}).limit(30);
    if(r.error||!r.data?.length){nbox.innerHTML='<p class="muted">Chưa có thông báo.</p>';return;}
    nbox.innerHTML=r.data.map(n=>`<a class="notification-item" href="${esc(n.url||'#')}" data-id="${esc(n.id)}"><strong>${esc(n.title||'Thông báo')}</strong><p>${esc(n.body||'')}</p><small>${fmt(n.created_at)}</small>${!n.read_at?'<b>• Mới</b>':''}</a>`).join('');
    nbox.querySelectorAll('.notification-item').forEach(a=>a.onclick=()=>supabaseClient.from('notifications').update({read_at:new Date().toISOString()}).eq('id',a.dataset.id));
  }
  function addSellerEditorHint(p){
    const box=document.getElementById('accountCenter');if(!box||document.getElementById('sellerEditorHint'))return;
    const hint=document.createElement('div');hint.id='sellerEditorHint';hint.className='auth-quick-card';hint.style.marginTop='14px';hint.innerHTML=`<strong>🏪 Hồ sơ nhà bán hàng</strong><p class="muted" style="margin:6px 0 0">${p.shop_name?'Hồ sơ cửa hàng đã có tên. Bạn có thể cập nhật tên, mô tả và ảnh đại diện.':'Bạn chưa đặt tên cửa hàng. Hãy hoàn thiện hồ sơ để khách hàng dễ nhận diện.'}</p>`;box.appendChild(hint);
  }
  function openEditor(uid,p){
    if(p?.role!=='seller'&&p?.role!=='admin'){alert('Chức năng hồ sơ cửa hàng dành cho nhà bán hàng.');return;}
    const old=document.getElementById('profileEditor');if(old){old.remove();return;}
    const wrap=document.createElement('div');wrap.id='profileEditor';wrap.className='auth-quick-card';wrap.style.marginTop='14px';wrap.innerHTML=`<h3 style="margin:0 0 12px">✏️ Hoàn thiện hồ sơ cửa hàng</h3><label style="display:block;margin:9px 0;font-weight:700">Tên cửa hàng<input id="shopNameEdit" maxlength="100" value="${esc(p.shop_name||p.full_name||'')}" style="width:100%;box-sizing:border-box;margin-top:5px;padding:11px;border:1px solid #ddd;border-radius:10px"></label><label style="display:block;margin:9px 0;font-weight:700">Mô tả cửa hàng<textarea id="shopDescEdit" maxlength="1000" rows="4" style="width:100%;box-sizing:border-box;margin-top:5px;padding:11px;border:1px solid #ddd;border-radius:10px;resize:vertical">${esc(p.shop_description||'')}</textarea></label><label style="display:block;margin:9px 0;font-weight:700">Ảnh đại diện (URL)<input id="avatarEdit" maxlength="500" value="${esc(p.avatar_url||'')}" placeholder="https://..." style="width:100%;box-sizing:border-box;margin-top:5px;padding:11px;border:1px solid #ddd;border-radius:10px"></label><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px"><button id="saveProfile" class="detail-action primary" type="button">Lưu hồ sơ</button><button id="cancelProfile" class="detail-action" type="button">Hủy</button></div>`;
    document.getElementById('accountCenter').appendChild(wrap);
    document.getElementById('cancelProfile').onclick=()=>wrap.remove();
    document.getElementById('saveProfile').onclick=async()=>{const btn=document.getElementById('saveProfile');btn.disabled=true;const shop_name=document.getElementById('shopNameEdit').value.trim();const shop_description=document.getElementById('shopDescEdit').value.trim();const avatar_url=document.getElementById('avatarEdit').value.trim()||null;if(!shop_name){alert('Vui lòng nhập tên cửa hàng.');btn.disabled=false;return;}const r=await supabaseClient.from('profiles').update({shop_name,shop_description,avatar_url}).eq('id',uid);if(r.error){alert('Không thể lưu hồ sơ: '+r.error.message);btn.disabled=false;return;}location.reload();};
  }
})();