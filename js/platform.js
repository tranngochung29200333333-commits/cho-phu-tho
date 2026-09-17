// Chợ Phú Thọ - unified mobile app stylesheet loader
(function(){
  if(!document.getElementById('mobile-app-exact-css')){
    const link=document.createElement('link');
    link.id='mobile-app-exact-css';link.rel='stylesheet';link.href='css/mobile-app-exact.css?v=20260917-1';
    document.head.appendChild(link);
  }
})();

// Chợ Phú Thọ - lớp nền tảng dùng chung
(function () {
  const SETTINGS_KEYS = ['site_name','site_tagline','support_phone','support_email','support_zalo','support_address','facebook_url','youtube_url','linkedin_url','analytics_id','currency','listing_default_days'];
  const escapeValue = (v) => typeof escapeHtml === 'function' ? escapeHtml(v) : String(v ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[c]));
  let messageChannel = null;

  async function loadSiteSettings() {
    if (typeof supabaseClient === 'undefined') return {};
    const { data, error } = await supabaseClient.from('site_settings').select('key,value').in('key', SETTINGS_KEYS);
    if (error) return {};
    const settings = Object.fromEntries((data || []).map(row => [row.key, row.value]));
    window.siteSettings = settings;
    applyAnalytics(settings.analytics_id);
    return settings;
  }

  function applyAnalytics(id) {
    if (!id || !/^G-[A-Z0-9_-]+$/i.test(id) || document.getElementById('gtag-script')) return;
    const script = document.createElement('script');
    script.id = 'gtag-script'; script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
    document.head.appendChild(script);
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function(){window.dataLayer.push(arguments);};
    window.gtag('js', new Date()); window.gtag('config', id);
  }

  function sessionKey() {
    let key = localStorage.getItem('choPhuThoViewSession');
    if (!key) { key = `${Date.now()}-${Math.random().toString(36).slice(2)}`; localStorage.setItem('choPhuThoViewSession', key); }
    return key;
  }

  async function trackListingView() {
    const id = new URLSearchParams(location.search).get('id');
    if (!id || typeof supabaseClient === 'undefined') return;
    const key = sessionKey();
    const viewer = (await supabaseClient.auth.getUser()).data?.user;
    await supabaseClient.from('listing_views').insert({ listing_id: id, viewer_id: viewer?.id || null, session_key: key }).then(() => {});
  }

  function hideExpiredListings(list) {
    const now = Date.now();
    return (list || []).filter(item => !item.expires_at || new Date(item.expires_at).getTime() > now);
  }

  async function applySeoForPage(settings) {
    const path = location.pathname;
    const siteName = settings.site_name || 'Chợ Phú Thọ';
    const canonical = document.querySelector('link[rel="canonical"]') || document.createElement('link');
    canonical.rel = 'canonical'; canonical.href = location.href.split('#')[0];
    if (!canonical.parentNode) document.head.appendChild(canonical);

    const detailId = new URLSearchParams(location.search).get('id');
    if (path.endsWith('/chi-tiet.html') && detailId && typeof supabaseClient !== 'undefined') {
      const { data: item } = await supabaseClient.from('listings').select('title,description,category,location,price').eq('id', detailId).maybeSingle();
      if (item?.title) {
        document.title = `${item.title} | ${siteName}`;
        const meta = document.querySelector('meta[name="description"]') || document.head.appendChild(Object.assign(document.createElement('meta'), {name:'description'}));
        meta.content = `${item.title} - ${item.category || 'Rao vặt'} tại ${item.location || 'Phú Thọ'}. ${String(item.description || '').slice(0,150)}`;
      }
    }
  }

  async function performLogout() {
    try { await supabaseClient.auth.signOut(); } catch (error) { console.warn('Logout error', error); }
    window.location.replace('index.html');
  }

  function bindLogoutButton() {
    const button = document.getElementById('logoutButton');
    if (!button || button.dataset.bound === '1') return;
    button.dataset.bound = '1'; button.addEventListener('click', performLogout);
  }

  function showMessageToast(senderName, body, url) {
    let toast = document.getElementById('messageToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'messageToast';
      toast.innerHTML = '<div class="message-toast-icon">💬</div><div class="message-toast-copy"><strong>Tin nhắn mới</strong><span></span></div><a class="message-toast-link" href="#">Xem</a><button type="button" class="message-toast-close" aria-label="Đóng">×</button>';
      document.body.appendChild(toast);
      const close = toast.querySelector('.message-toast-close');
      close.onclick = () => toast.classList.remove('show');
    }
    toast.querySelector('.message-toast-copy span').textContent = `${senderName || 'Người dùng'}: ${String(body || '').slice(0, 90)}`;
    toast.querySelector('.message-toast-link').href = url || 'chat.html';
    toast.classList.add('show');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove('show'), 7000);
  }

  function ensureMessageToastStyles() {
    if (document.getElementById('message-toast-styles')) return;
    const style = document.createElement('style');
    style.id = 'message-toast-styles';
    style.textContent = `
      #messageToast{position:fixed;right:20px;bottom:20px;z-index:99999;width:min(390px,calc(100vw - 28px));display:flex;align-items:center;gap:12px;padding:14px 15px;background:#fff;border:1px solid #e7e7e7;border-radius:16px;box-shadow:0 16px 45px rgba(0,0,0,.16);transform:translateY(20px);opacity:0;pointer-events:none;transition:.22s ease}
      #messageToast.show{transform:translateY(0);opacity:1;pointer-events:auto}
      .message-toast-icon{width:42px;height:42px;display:grid;place-items:center;background:#fff4c8;border-radius:12px;font-size:20px;flex:0 0 42px}
      .message-toast-copy{min-width:0;display:flex;flex-direction:column;gap:3px;flex:1}.message-toast-copy strong{font-size:14px}.message-toast-copy span{font-size:13px;color:#666;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.message-toast-link{font-weight:800;color:#171717;text-decoration:none;background:#ffbf00;padding:9px 12px;border-radius:10px;white-space:nowrap}.message-toast-close{border:0;background:transparent;font-size:22px;color:#888;cursor:pointer;padding:2px}
      @media(max-width:600px){#messageToast{right:12px;bottom:76px}.message-toast-link{padding:8px 10px}}
    `;
    document.head.appendChild(style);
  }

  async function watchIncomingMessages(user) {
    if (!user || typeof supabaseClient === 'undefined') return;
    if (messageChannel) { try { await supabaseClient.removeChannel(messageChannel); } catch (_) {} }
    ensureMessageToastStyles();
    messageChannel = supabaseClient.channel(`platform-messages-${user.id}`)
      .on('postgres_changes', {event:'INSERT', schema:'public', table:'messages', filter:`receiver_id=eq.${user.id}`}, async payload => {
        const m = payload.new;
        if (!m || m.sender_id === user.id) return;
        let senderName = 'Người dùng';
        try {
          const {data:p} = await supabaseClient.from('profiles').select('full_name,shop_name').eq('id',m.sender_id).maybeSingle();
          senderName = p?.shop_name || p?.full_name || senderName;
        } catch (_) {}
        const url = `chat.html?user=${encodeURIComponent(m.sender_id)}${m.listing_id ? `&listing=${encodeURIComponent(m.listing_id)}` : ''}`;
        showMessageToast(senderName, m.body, url);
        if ('Notification' in window && document.hidden && Notification.permission === 'granted') {
          try { new Notification('Tin nhắn mới - Chợ Phú Thọ', {body:`${senderName}: ${String(m.body || '').slice(0,100)}`}); } catch (_) {}
        }
        window.dispatchEvent(new CustomEvent('choPhuTho:new-message', {detail:m}));
      })
      .subscribe();
  }

  async function refreshAccountAndLocation() {
    try {
      if (typeof supabaseClient === 'undefined') return;
      const area = document.getElementById('accountArea');
      const { data: authData } = await supabaseClient.auth.getUser();
      const user = authData?.user || null;
      if (area) {
        if (!user) {
          area.innerHTML = '<a href="dang-nhap.html">Đăng nhập</a><span class="account-separator">|</span><a href="dang-ky.html">Đăng ký</a>';
        } else {
          const result = await supabaseClient.from('profiles').select('full_name, phone, role').eq('id', user.id).maybeSingle();
          const profile = result.error ? null : result.data;
          const metadataName = user.user_metadata?.full_name || user.user_metadata?.name || '';
          const name = escapeValue(profile?.full_name || metadataName || user.email?.split('@')[0] || 'Bạn');
          const role = profile?.role === 'admin' ? 'Quản trị viên' : profile?.role === 'seller' ? 'Nhà bán hàng' : 'Khách hàng';
          area.innerHTML = `<div class="account-chip"><span>👋 Xin chào, <strong>${name}</strong></span><small>${role}</small><button id="logoutButton" class="account-logout" type="button">Đăng xuất</button></div>`;
          bindLogoutButton();
        }
      }
      await watchIncomingMessages(user);
      if (typeof window.setSelectedLocation === 'function') window.setSelectedLocation(localStorage.getItem('choPhuThoLocation') || '');
    } catch (error) { console.warn('Account/location refresh error', error); }
  }

  function watchAuthAndLocation() {
    if (typeof supabaseClient === 'undefined') return;
    try { supabaseClient.auth.onAuthStateChange(() => window.setTimeout(refreshAccountAndLocation, 100)); } catch (error) { console.warn('Auth listener error', error); }
    window.addEventListener('storage', event => { if (event.key === 'choPhuThoLocation') refreshAccountAndLocation(); });
  }

  window.platformHideExpiredListings = hideExpiredListings;
  window.platformLoadSettings = loadSiteSettings;
  window.platformTrackView = trackListingView;
  window.platformRefreshAccountAndLocation = refreshAccountAndLocation;
  window.platformLogout = performLogout;

  document.addEventListener('DOMContentLoaded', async () => {
    if (typeof supabaseClient !== 'undefined') {
      const settings = await loadSiteSettings();
      await applySeoForPage(settings);
      watchAuthAndLocation();
      await refreshAccountAndLocation();
      if (location.pathname.endsWith('/chi-tiet.html')) trackListingView();
    }
  });
})();