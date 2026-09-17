// Chợ Phú Thọ - lớp hoàn thiện marketplace
(function(){
  const esc=v=>typeof escapeHtml==='function'?escapeHtml(v):String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[c]));
  const params=new URLSearchParams(location.search);
  function formatPrice(v){const n=Number(v);return n>0?n.toLocaleString('vi-VN')+' đ':'Thỏa thuận';}
  window.refreshFavoriteButtons=async function(){if(typeof supabaseClient==='undefined')return;const u=(await supabaseClient.auth.getUser()).data?.user;if(!u)return;const r=await supabaseClient.from('favorites').select('listing_id').eq('user_id',u.id);const ids=new Set((r.data||[]).map(x=>String(x.listing_id)));document.querySelectorAll('[data-favorite]').forEach(b=>b.textContent=ids.has(String(b.dataset.favorite))?'♥':'♡');};
  window.toggleFavorite=async function(id,button){if(typeof supabaseClient==='undefined')return;const u=(await supabaseClient.auth.getUser()).data?.user;if(!u){location.href='dang-nhap.html?next='+encodeURIComponent(location.pathname+location.search);return;}const q=await supabaseClient.from('favorites').select('id').eq('listing_id',id).eq('user_id',u.id).maybeSingle();if(q.error){alert('Không kiểm tra được tin yêu thích.');return;}if(q.data){const {error}=await supabaseClient.from('favorites').delete().eq('id',q.data.id);if(error){alert('Không thể bỏ lưu tin.');return;}button.textContent='♡';}else{const {error}=await supabaseClient.from('favorites').insert({listing_id:id,user_id:u.id});if(error){alert('Không thể lưu tin: '+error.message);return;}button.textContent='♥';}};
  function initUrlFilters(){const cat=params.get('category'),q=params.get('q')||params.get('search'),loc=params.get('location');if(cat&&document.getElementById('categoryFilter'))document.getElementById('categoryFilter').value=cat;if(q&&document.getElementById('searchInput'))document.getElementById('searchInput').value=q;if(loc&&document.getElementById('locationFilter'))document.getElementById('locationFilter').value=loc;if(cat||q||loc)window.setTimeout(()=>window.applyHomeFilters?.(),150);}
  function installDesktopMessageLink(){const topbar=document.querySelector('.topbar');const account=document.getElementById('accountArea');if(!topbar||!account||document.getElementById('desktopMessageLink'))return;const link=document.createElement('a');link.id='desktopMessageLink';link.className='desktop-message-link';link.href='chat.html';link.innerHTML='💬 <span>Tin nhắn</span>';link.title='Mở tin nhắn';topbar.insertBefore(link,account);if(!document.getElementById('desktop-message-link-style')){const s=document.createElement('style');s.id='desktop-message-link-style';s.textContent='.desktop-message-link{display:inline-flex;align-items:center;gap:6px;height:40px;padding:0 14px;border:1px solid #e5e5e5;border-radius:12px;background:#fff;color:#222;text-decoration:none;font-weight:800;white-space:nowrap;transition:.18s ease}.desktop-message-link:hover{border-color:#ffbf00;background:#fff9df;transform:translateY(-1px)}@media(max-width:760px){.desktop-message-link{display:none}}';document.head.appendChild(s);}}
  function installMobileNav(){if(document.getElementById('mobileBottomNav'))return;const nav=document.createElement('nav');nav.id='mobileBottomNav';nav.className='mobile-bottom-nav';nav.setAttribute('aria-label','Điều hướng');nav.innerHTML='<a href="index.html" class="mobile-nav-item">⌂<span>Trang chủ</span></a><a href="quan-ly-tin.html" class="mobile-nav-item">▤<span>Quản lý tin</span></a><a href="dang-tin.html" class="mobile-nav-post">＋<span>Đăng tin</span></a><a href="chat.html" class="mobile-nav-item">◌<span>Tin nhắn</span></a><a href="tai-khoan.html" class="mobile-nav-item">◉<span>Tài khoản</span></a>';document.body.appendChild(nav);document.body.classList.add('has-mobile-bottom-nav');}
  function installMobileMenu(){const button=document.querySelector('.mobile-menu-button');if(!button||button.dataset.bound==='1')return;button.dataset.bound='1';if(!document.getElementById('mobile-menu-style')){const s=document.createElement('style');s.id='mobile-menu-style';s.textContent='#mobileMenuDrawer{position:fixed;inset:0;z-index:1000;pointer-events:none}#mobileMenuDrawer.open{pointer-events:auto}.mobile-menu-backdrop{position:absolute;inset:0;background:rgba(0,0,0,.38);opacity:0;transition:opacity .2s}.mobile-menu-panel{position:absolute;left:0;top:0;bottom:0;width:min(82vw,340px);background:#fff;padding:calc(14px + env(safe-area-inset-top)) 0 24px;box-shadow:8px 0 25px rgba(0,0,0,.16);transform:translateX(-105%);transition:transform .22s;overflow:auto}.mobile-menu-panel a{display:block;padding:15px 22px;border-bottom:1px solid #eee;color:#222;text-decoration:none;font-weight:700}.mobile-menu-head{display:flex;align-items:center;justify-content:space-between;padding:0 18px 16px;font-size:18px}.mobile-menu-head button{border:0;background:#f3f3f3;border-radius:50%;width:34px;height:34px;font-size:23px}.open .mobile-menu-backdrop{opacity:1}.open .mobile-menu-panel{transform:translateX(0)}';document.head.appendChild(s);}button.addEventListener('click',()=>{let drawer=document.getElementById('mobileMenuDrawer');if(drawer){drawer.classList.toggle('open');return;}drawer=document.createElement('aside');drawer.id='mobileMenuDrawer';drawer.innerHTML='<div class="mobile-menu-backdrop"></div><div class="mobile-menu-panel"><div class="mobile-menu-head"><strong>🛒 Chợ Phú Thọ</strong><button type="button" aria-label="Đóng">×</button></div><a href="index.html">🏠 Trang chủ</a><a href="danh-muc.html">📂 Tất cả danh mục</a><a href="yeu-thich.html">♡ Tin yêu thích</a><a href="chat.html">💬 Trao đổi online</a><a href="thong-bao.html">🔔 Thông báo</a><a href="quan-ly-tin.html">▤ Quản lý tin</a><a href="goi-dich-vu.html">⭐ Gói dịch vụ</a><a href="tai-khoan.html">👤 Tài khoản</a><a href="lien-he.html">☎ Liên hệ hỗ trợ</a></div>';document.body.appendChild(drawer);const close=()=>drawer.classList.remove('open');drawer.querySelector('.mobile-menu-backdrop').onclick=close;drawer.querySelector('button').onclick=close;drawer.querySelectorAll('a').forEach(a=>a.onclick=close);requestAnimationFrame(()=>drawer.classList.add('open'));});}
  function installMobileHomePolish(){
    if(!document.body.classList.contains('home-body'))return;
    const headerIcons=document.querySelectorAll('.mobile-app-header .mobile-header-icon');
    if(headerIcons[1]&&!document.getElementById('mobileNotificationButton')){
      const bell=headerIcons[1];bell.id='mobileNotificationButton';bell.href='#';bell.setAttribute('aria-label','Thông báo');bell.textContent='🔔';
      bell.addEventListener('click',e=>{e.preventDefault();let panel=document.getElementById('mobileNotificationPanel');if(!panel){panel=document.createElement('div');panel.id='mobileNotificationPanel';panel.className='mobile-notification-panel';panel.hidden=true;panel.innerHTML='<h3>🔔 Thông báo</h3><p>Bạn chưa có thông báo mới. Khi có tin nhắn, tin yêu thích hoặc cập nhật tài khoản, thông báo sẽ hiển thị tại đây.</p><a href="tai-khoan.html">Mở tài khoản</a>';document.body.appendChild(panel);}panel.hidden=!panel.hidden;});
      document.addEventListener('click',e=>{const p=document.getElementById('mobileNotificationPanel');if(p&&!p.hidden&&!p.contains(e.target)&&e.target!==bell)p.hidden=true;});
    }
    document.querySelectorAll('.home-body .category-grid .category-card').forEach(card=>{if(card.querySelector('.category-icon'))return;const strong=card.querySelector('strong');if(!strong)return;const text=[...card.childNodes].find(n=>n.nodeType===3&&n.textContent.trim());if(text){const icon=document.createElement('span');icon.className='category-icon';icon.textContent=text.textContent.trim();text.remove();card.insertBefore(icon,strong);}});
    const heading=document.querySelector('#listings .section-heading h2');if(heading&&window.matchMedia('(max-width:760px)').matches)heading.textContent='Tin nổi bật';
    const sort=document.getElementById('sortFilter');if(sort&&window.matchMedia('(max-width:760px)').matches)sort.setAttribute('aria-label','Sắp xếp tin nổi bật');
    if(!document.getElementById('mobile-category-compact-style')){const s=document.createElement('style');s.id='mobile-category-compact-style';s.textContent='@media(max-width:760px){.home-body .section-block:has(.category-grid){margin-top:22px!important}.home-body .category-grid{display:flex!important;flex-direction:row!important;flex-wrap:nowrap!important;overflow-x:auto!important;overflow-y:hidden!important;gap:8px!important;width:100%!important;padding:2px 2px 7px!important;scroll-snap-type:x proximity!important;-webkit-overflow-scrolling:touch!important}.home-body .category-grid::-webkit-scrollbar{display:none!important}.home-body .category-grid .category-card{box-sizing:border-box!important;flex:0 0 82px!important;width:82px!important;min-width:82px!important;height:84px!important;min-height:84px!important;padding:7px 4px!important;border-radius:12px!important;gap:3px!important;scroll-snap-align:start!important;box-shadow:0 2px 7px rgba(71,50,22,.06)!important}.home-body .category-grid .category-icon{width:42px!important;height:42px!important;display:flex!important;align-items:center!important;justify-content:center!important;border-radius:12px!important;font-size:27px!important;line-height:1!important}.home-body .category-grid .category-card strong{font-size:10px!important;line-height:1.15!important;max-width:78px!important;display:block!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}.home-body .category-grid .category-card small{display:none!important}}@media(max-width:390px){.home-body .category-grid{gap:7px!important}.home-body .category-grid .category-card{flex-basis:78px!important;width:78px!important;min-width:78px!important;height:80px!important;min-height:80px!important}.home-body .category-grid .category-icon{width:40px!important;height:40px!important;font-size:25px!important}.home-body .category-grid .category-card strong{font-size:9.5px!important}}';document.head.appendChild(s);}
  }
  function loadHomepageRedesign(){if(!document.body.classList.contains('home-body')||document.getElementById('home-redesign-css'))return;const link=document.createElement('link');link.id='home-redesign-css';link.rel='stylesheet';link.href='css/home-redesign.css?v=20260917-1';document.head.appendChild(link);const mobile=document.createElement('link');mobile.id='mobile-home-fix-css';mobile.rel='stylesheet';mobile.href='css/mobile-home-fix.css?v=20260917-5';document.head.appendChild(mobile);const polish=document.createElement('link');polish.id='mobile-home-polish-css';polish.rel='stylesheet';polish.href='css/mobile-home-polish.css?v=20260917-1';document.head.appendChild(polish);}
  document.addEventListener('DOMContentLoaded',()=>{initUrlFilters();const sort=document.getElementById('sortFilter');if(sort)sort.addEventListener('change',()=>{const list=[...(window.homeListings||[])];const mode=sort.value;if(mode==='price_asc')list.sort((a,b)=>Number(a.price||0)-Number(b.price||0));else if(mode==='price_desc')list.sort((a,b)=>Number(b.price||0)-Number(a.price||0));else if(mode==='views')list.sort((a,b)=>Number(b.view_count||0)-Number(a.view_count||0));else list.sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));window.renderMarketplaceListings?.(list);});refreshFavoriteButtons();installDesktopMessageLink();installMobileNav();installMobileMenu();loadHomepageRedesign();setTimeout(installMobileHomePolish,120);});
  window.marketplaceFormatPrice=formatPrice;
})();

// Đồng bộ danh mục đầy đủ để mọi thẻ danh mục trên trang Danh mục lọc đúng trên trang chủ.
(function(){
  const TAXONOMY=[
    'Bất động sản','Xe cộ','Điện tử','Việc làm','Thú cưng','Điện lạnh','Đồ gia dụng','Mẹ và bé','Thời trang','Giải trí','Văn phòng','Đồ chuyên dụng','Dịch vụ','Khác'
  ];
  function sync(){
    const select=document.getElementById('categoryFilter');
    if(!select)return;
    const existing=new Set([...select.options].map(o=>o.value||o.textContent));
    TAXONOMY.forEach(name=>{if(!existing.has(name)){const o=document.createElement('option');o.value=name;o.textContent=name;select.appendChild(o);}});
    const cat=new URLSearchParams(location.search).get('category');
    if(cat&&TAXONOMY.includes(cat))select.value=cat;
  }
  document.addEventListener('DOMContentLoaded',()=>{
    sync();
    const cat=new URLSearchParams(location.search).get('category');
    if(cat){setTimeout(()=>{sync();const select=document.getElementById('categoryFilter');if(select&&TAXONOMY.includes(cat)){select.value=cat;window.applyHomeFilters?.();}},450);}
  });
})();

// MOBILE SECTION CARDS — keep headings, category grid and featured listings inside clean bordered surfaces.
(function(){
  function apply(){
    if(!document.body.classList.contains('home-body') || !window.matchMedia('(max-width:760px)').matches) return;
    if(document.getElementById('mobile-section-card-style')) return;
    const s=document.createElement('style');
    s.id='mobile-section-card-style';
    s.textContent=`
      @media(max-width:760px){
        .home-body .home-page > .section-block:has(.category-grid),
        .home-body .home-page > #listings{
          width:100%!important;
          box-sizing:border-box!important;
          margin-left:0!important;
          margin-right:0!important;
          padding:15px 14px 14px!important;
          background:rgba(255,253,248,.96)!important;
          border:1px solid #e3d8c8!important;
          border-radius:18px!important;
          box-shadow:0 3px 12px rgba(66,50,29,.07)!important;
          overflow:hidden!important;
        }
        .home-body .home-page > .section-block:has(.category-grid) .section-heading,
        .home-body .home-page > #listings .section-heading{
          margin:0 0 12px!important;
          padding:0!important;
        }
        .home-body .home-page > .section-block:has(.category-grid) .category-grid{
          padding:2px 1px 4px!important;
        }
        .home-body .home-page > #listings .filter-panel{
          margin-bottom:10px!important;
        }
        .home-body .home-page > #listings .products{
          padding-bottom:3px!important;
        }
      }
      @media(max-width:390px){
        .home-body .home-page > .section-block:has(.category-grid),
        .home-body .home-page > #listings{padding-left:12px!important;padding-right:12px!important;border-radius:16px!important}
      }
    `;
    document.head.appendChild(s);
  }
  document.addEventListener('DOMContentLoaded',()=>setTimeout(apply,180));
})();