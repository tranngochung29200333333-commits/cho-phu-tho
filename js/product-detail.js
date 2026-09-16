(function () {
  const esc = (v) => String(v ?? '').replace(/[&<>'"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#039;', '"':'&quot;' }[c]));
  const formatPrice = (v) => { const n = Number(v); return Number.isFinite(n) && n > 0 ? n.toLocaleString('vi-VN') + ' đ' : 'Thỏa thuận'; };

  async function getUser() {
    const { data } = await supabaseClient.auth.getUser();
    return data?.user || null;
  }

  async function load() {
    const box = document.getElementById('productDetail');
    const id = new URLSearchParams(location.search).get('id');
    if (!box) return;
    if (!id) {
      box.innerHTML = '<div class="empty-state"><h3>Không tìm thấy tin</h3><a href="index.html">← Về trang chủ</a></div>';
      return;
    }

    box.innerHTML = '<div class="loading">Đang tải thông tin sản phẩm...</div>';

    const [{ data: item, error: itemError }, { data: viewer }] = await Promise.all([
      supabaseClient.from('listings').select('*').eq('id', id).eq('status', 'approved').maybeSingle(),
      supabaseClient.auth.getUser()
    ]);

    if (itemError || !item) {
      box.innerHTML = '<div class="empty-state"><div class="empty-icon">🔎</div><h3>Tin đăng không tồn tại hoặc đã được ẩn</h3><p>Tin chỉ hiển thị công khai sau khi được Admin duyệt.</p><a class="btn-post" href="index.html">← Về trang chủ</a></div>';
      return;
    }

    const [{ data: images }, { data: seller }] = await Promise.all([
      supabaseClient.from('listing_images').select('image_url,sort_order').eq('listing_id', id).order('sort_order', { ascending: true }),
      supabaseClient.from('profiles').select('id,full_name,phone,shop_name,shop_description,avatar_url,verified_at').eq('id', item.seller_id).maybeSingle()
    ]);

    const gallery = images || [];
    const hero = gallery[0]?.image_url || '';
    const phone = item.contact_phone || seller?.phone || '';
    const zalo = item.contact_zalo || '';
    const loggedIn = !!viewer?.user;
    const safePhone = phone.replace(/[^0-9+]/g, '');

    box.innerHTML = `
      <div class="product-detail-shell">
        <div class="detail-breadcrumb"><a href="index.html">Trang chủ</a><span>›</span><span>${esc(item.category || item.network || 'Khác')}</span><span>›</span><strong>${esc(item.title || 'Chi tiết tin')}</strong></div>
        <div class="detail-layout">
          <section class="detail-card detail-gallery-card">
            <div class="detail-hero-wrap">
              ${hero ? `<img id="detailHero" class="detail-hero-image" src="${esc(hero)}" alt="${esc(item.title)}">` : '<div class="detail-image-empty">📷<span>Người bán chưa tải ảnh</span></div>'}
            </div>
            ${gallery.length > 1 ? `<div class="detail-thumbs">${gallery.map((img,i)=>`<button class="detail-thumb ${i===0?'active':''}" type="button" data-img="${esc(img.image_url)}"><img src="${esc(img.image_url)}" alt="Ảnh ${i+1}"></button>`).join('')}</div>` : ''}
          </section>

          <section class="detail-card detail-main-card">
            <div class="detail-category">${esc(item.category || item.network || 'Khác')}${item.subcategory ? ` · ${esc(item.subcategory)}` : ''}</div>
            <h1>${esc(item.title || 'Không có tiêu đề')}</h1>
            <div class="detail-price-large">${formatPrice(item.price)}</div>
            <div class="detail-location-line">📍 ${esc(item.location || 'Phú Thọ')}</div>
            <div class="detail-time-line">🕒 ${item.created_at ? new Date(item.created_at).toLocaleString('vi-VN') : '—'}</div>
            <div class="detail-actions-grid">
              ${loggedIn && phone ? `<a class="detail-action primary" href="tel:${safePhone}">☎ Gọi điện</a>` : '<a class="detail-action primary" href="dang-nhap.html">🔒 Đăng nhập để xem số điện thoại</a>'}
              ${zalo ? `<a class="detail-action zalo" href="https://chat.zalo.me/${encodeURIComponent(zalo.replace(/\s/g,''))}" target="_blank" rel="noopener">💬 Zalo</a>` : '<span class="detail-action disabled">💬 Zalo</span>'}
              <button class="detail-action" id="favoriteDetail" type="button">♡ Lưu tin</button>
              <button class="detail-action" id="reportDetail" type="button">⚑ Báo tin</button>
            </div>
            <div class="detail-section"><h2>Mô tả chi tiết</h2><div class="detail-description">${esc(item.description || 'Người bán chưa thêm mô tả.')}</div></div>
            <div class="detail-section"><h2>Thông tin người bán</h2><div class="seller-detail-box">
              <div class="seller-avatar">${seller?.avatar_url ? `<img src="${esc(seller.avatar_url)}" alt="">` : '👤'}</div>
              <div class="seller-detail-copy"><strong>${esc(seller?.full_name || 'Người bán')}</strong>${seller?.verified_at ? '<span class="seller-verified">✓ Đã xác minh</span>' : ''}${seller?.shop_name ? `<p>🏪 ${esc(seller.shop_name)}</p>` : ''}${seller?.shop_description ? `<p class="muted">${esc(seller.shop_description)}</p>` : ''}</div>
            </div></div>
          </section>
        </div>
      </div>`;

    document.querySelectorAll('.detail-thumb').forEach(btn => btn.addEventListener('click', () => {
      const heroEl = document.getElementById('detailHero');
      if (heroEl) heroEl.src = btn.dataset.img;
      document.querySelectorAll('.detail-thumb').forEach(x => x.classList.remove('active'));
      btn.classList.add('active');
    }));

    const favBtn = document.getElementById('favoriteDetail');
    const reportBtn = document.getElementById('reportDetail');

    if (favBtn) favBtn.addEventListener('click', async () => {
      const user = await getUser();
      if (!user) return (location.href = 'dang-nhap.html');
      const { data: existing } = await supabaseClient.from('favorites').select('id').eq('listing_id', item.id).eq('user_id', user.id).maybeSingle();
      if (existing) {
        await supabaseClient.from('favorites').delete().eq('id', existing.id);
        favBtn.textContent = '♡ Lưu tin';
      } else {
        const { error } = await supabaseClient.from('favorites').insert({ listing_id: item.id, user_id: user.id });
        if (error) return alert('Không thể lưu tin: ' + error.message);
        favBtn.textContent = '♥ Đã lưu';
      }
    });

    if (reportBtn) reportBtn.addEventListener('click', async () => {
      const user = await getUser();
      if (!user) return (location.href = 'dang-nhap.html');
      const reason = prompt('Lý do báo tin?');
      if (!reason) return;
      const { error } = await supabaseClient.from('listing_reports').insert({ listing_id: item.id, reporter_id: user.id, reason, details: '' });
      if (error) return alert('Không thể gửi báo tin: ' + error.message);
      alert('Đã gửi báo tin. Cảm ơn bạn.');
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (typeof supabaseClient !== 'undefined') load();
  });
})();
