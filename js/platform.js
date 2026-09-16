// Chợ Phú Thọ - lớp nền tảng dùng chung
(function () {
  const SETTINGS_KEYS = ['site_name','site_tagline','support_phone','support_email','support_zalo','support_address','facebook_url','youtube_url','linkedin_url','analytics_id','currency','listing_default_days'];
  const escapeValue = (v) => typeof escapeHtml === 'function' ? escapeHtml(v) : String(v ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[c]));

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
    script.id = 'gtag-script';
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
    document.head.appendChild(script);
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function(){window.dataLayer.push(arguments);};
    window.gtag('js', new Date());
    window.gtag('config', id);
  }

  function sessionKey() {
    let key = localStorage.getItem('choPhuThoViewSession');
    if (!key) {
      key = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem('choPhuThoViewSession', key);
    }
    return key;
  }

  async function trackListingView() {
    const id = new URLSearchParams(location.search).get('id');
    if (!id || typeof supabaseClient === 'undefined') return;
    const key = sessionKey();
    await supabaseClient.from('listing_views').insert({
      listing_id: Number(id),
      viewer_id: (await supabaseClient.auth.getUser()).data?.user?.id || null,
      session_key: key
    }).then(() => {});
  }

  function hideExpiredListings(list) {
    const now = Date.now();
    return (list || []).filter(item => !item.expires_at || new Date(item.expires_at).getTime() > now);
  }

  async function applySeoForPage(settings) {
    const path = location.pathname;
    const siteName = settings.site_name || 'Chợ Phú Thọ';
    const canonical = document.querySelector('link[rel="canonical"]') || document.createElement('link');
    canonical.rel = 'canonical';
    canonical.href = location.href.split('#')[0];
    if (!canonical.parentNode) document.head.appendChild(canonical);

    const detailId = new URLSearchParams(location.search).get('id');
    if (path.endsWith('/chi-tiet.html') && detailId && typeof supabaseClient !== 'undefined') {
      const { data: item } = await supabaseClient.from('listings').select('title,description,category,location,price').eq('id', Number(detailId)).maybeSingle();
      if (item?.title) {
        document.title = `${item.title} | ${siteName}`;
        const meta = document.querySelector('meta[name="description"]') || document.head.appendChild(Object.assign(document.createElement('meta'), {name:'description'}));
        meta.content = `${item.title} - ${item.category || 'Rao vặt'} tại ${item.location || 'Phú Thọ'}. ${String(item.description || '').slice(0,150)}`;
      }
    }
  }

  window.platformHideExpiredListings = hideExpiredListings;
  window.platformLoadSettings = loadSiteSettings;
  window.platformTrackView = trackListingView;

  document.addEventListener('DOMContentLoaded', async () => {
    if (typeof supabaseClient !== 'undefined') {
      const settings = await loadSiteSettings();
      await applySeoForPage(settings);
      if (location.pathname.endsWith('/chi-tiet.html')) trackListingView();
    }
  });
})();
