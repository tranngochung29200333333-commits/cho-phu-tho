(function(){
  const esc=v=>typeof escapeHtml==='function'?escapeHtml(v):String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[c]));
  document.addEventListener('DOMContentLoaded',async()=>{
    if(typeof supabaseClient==='undefined')return;
    const box=document.getElementById('accountCenter'); if(!box)return;
    const {data,error}=await supabaseClient.auth.getUser();
    if(error||!data?.user){
      box.innerHTML='<div class="seller-profile-head"><div class="seller-avatar">👤</div><div><span class="eyebrow">TÀI KHOẢN</span><h2>Đăng nhập hoặc đăng ký</h2><p class="muted">Quản lý tin đăng, tin yêu thích, tin nhắn và tài khoản nhà bán hàng.</p><div style="margin-top:12px"><a class="detail-action primary" href="dang-nhap.html?next=tai-khoan.html">🔐 Đăng nhập</a><a class="detail-action" href="dang-ky.html">📝 Đăng ký</a><a class="detail-action" href="dang-ky-nha-ban-hang.html">🏪 Đăng ký nhà bán hàng</a></div></div></div>';
      return;
    }
    const u=data.user;
    const {data:p}=await supabaseClient.from('profiles').select('full_name,phone,role,shop_name,shop_description,verified_at,created_at').eq('id',u.id).maybeSingle();
    const name=p?.shop_name||p?.full_name||u.user_metadata?.full_name||u.email?.split('@')[0]||'Bạn';
    const role=p?.role==='admin'?'QUẢN TRỊ VIÊN':p?.role==='seller'?'NHÀ BÁN HÀNG':'KHÁCH HÀNG';
    box.innerHTML=`<div class="seller-profile-head"><div class="seller-avatar">👤</div><div><span class="eyebrow">${role}</span><h2>${esc(name)}</h2><p>${esc(u.email||'')}</p><p>☎ ${esc(p?.phone||'Chưa cập nhật')}</p>${p?.verified_at?'<div class="seller-trust">✅ Đã xác minh nhà bán hàng</div>':''}<button id="logoutAccount" class="outline-button detail-action" type="button">Đăng xuất</button></div></div>`;
    document.getElementById('logoutAccount').onclick=async()=>{await supabaseClient.auth.signOut();location.href='index.html'};
    const nbox=document.getElementById('notifications');
    if(!nbox)return;
    const r=await supabaseClient.from('notifications').select('id,title,body,url,read_at,created_at').eq('user_id',u.id).order('created_at',{ascending:false}).limit(30);
    if(r.error||!r.data?.length){nbox.innerHTML='<p class="muted">Chưa có thông báo.</p>';return}
    nbox.innerHTML=r.data.map(n=>`<a class="notification-item" href="${esc(n.url||'#')}" data-id="${esc(n.id)}"><strong>${esc(n.title||'Thông báo')}</strong><p>${esc(n.body||'')}</p><small>${new Date(n.created_at).toLocaleString('vi-VN')}</small>${!n.read_at?'<b>• Mới</b>':''}</a>`).join('');
    nbox.querySelectorAll('.notification-item').forEach(a=>a.onclick=()=>supabaseClient.from('notifications').update({read_at:new Date().toISOString()}).eq('id',a.dataset.id));
  });
})();