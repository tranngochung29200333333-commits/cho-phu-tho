// Chợ Phú Thọ - lớp tính năng marketplace nâng cao
(function () {
    const AREAS = ["Việt Trì","Phú Thọ","Lâm Thao","Cẩm Khê","Hạ Hòa","Thanh Sơn","Tân Sơn","Yên Lập","Thanh Ba","Đoan Hùng","Phù Ninh","Thanh Thủy","Tam Nông"];
    const CATEGORIES = [
        { name: "Bất động sản", subs: ["Nhà bán", "Đất bán", "Phòng trọ", "Cho thuê"] },
        { name: "Xe cộ", subs: ["Ô tô", "Xe máy", "Xe tải", "Vận chuyển"] },
        { name: "Điện tử", subs: ["Điện thoại", "Laptop", "Máy tính", "Điện máy"] },
        { name: "Dịch vụ", subs: ["Sửa chữa", "Vận chuyển", "Vệ sinh", "Xây dựng", "Gia sư", "Chăm sóc cây"] },
        { name: "Việc làm", subs: ["Tuyển dụng", "Tìm việc", "Làm thêm"] },
        { name: "Đồ gia dụng", subs: ["Nội thất", "Đồ dùng", "Thiết bị"] },
        { name: "Thời trang", subs: ["Quần áo", "Giày dép", "Phụ kiện"] },
        { name: "Thú cưng", subs: ["Chó", "Mèo", "Phụ kiện"] },
        { name: "Khác", subs: ["Khác"] }
    ];

    function html(v) {
        if (typeof escapeHtml === "function") return escapeHtml(v);
        return String(v ?? "").replace(/[&<>'"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#039;","\"":"&quot;"}[c]));
    }

    function price(v) {
        const n = Number(v);
        return n > 0 ? n.toLocaleString("vi-VN") + " đ" : "Thỏa thuận";
    }

    function coords() {
        const lat = Number(localStorage.getItem("choPhuThoLat"));
        const lng = Number(localStorage.getItem("choPhuThoLng"));
        return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
    }

    function distanceKm(a, b) {
        if (!a || !b) return null;
        const R = 6371;
        const dLat = (b.lat - a.lat) * Math.PI / 180;
        const dLng = (b.lng - a.lng) * Math.PI / 180;
        const x = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
        return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
    }

    function categoryName(item) {
        return item.category || item.network || "Khác";
    }

    async function loadImages(listingId) {
        const { data } = await supabaseClient.from("listing_images").select("image_url, sort_order").eq("listing_id", listingId).order("sort_order", { ascending: true });
        return data || [];
    }

    async function uploadImages(files, listingId, userId) {
        if (!files?.length || !supabaseClient) return [];
        const result = [];
        for (let i = 0; i < Math.min(files.length, 8); i++) {
            const file = files[i];
            if (!file.type.startsWith("image/")) continue;
            if (file.size > 8 * 1024 * 1024) throw new Error("Mỗi ảnh tối đa 8MB.");
            const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
            const path = `${userId}/${listingId}/${Date.now()}-${i}-${safeName}`;
            const { error: uploadError } = await supabaseClient.storage.from("listing-images").upload(path, file, { upsert: false, contentType: file.type });
            if (uploadError) throw uploadError;
            const { data: publicData } = supabaseClient.storage.from("listing-images").getPublicUrl(path);
            result.push({ image_url: publicData.publicUrl, sort_order: i });
        }
        if (result.length) {
            const { error } = await supabaseClient.from("listing_images").insert(result.map(x => ({ ...x, listing_id: listingId })));
            if (error) throw error;
        }
        return result;
    }

    async function loadHomeMarketplace() {
        const box = document.querySelector(".products");
        if (!box || typeof supabaseClient === "undefined") return;
        box.innerHTML = `<div class="loading">Đang tải tin đăng...</div>`;

        const { data, error } = await supabaseClient.from("listings").select("*").eq("status", "approved").order("created_at", { ascending: false });
        if (error) {
            console.error(error);
            box.innerHTML = `<div class="empty-state"><h3>Chưa tải được dữ liệu</h3><p>Vui lòng tải lại trang.</p></div>`;
            return;
        }

        const listings = data || [];
        window.homeListings = listings;
        const cards = await Promise.all(listings.map(async item => ({ item, images: await loadImages(item.id) })));
        window.homeListingImages = Object.fromEntries(cards.map(x => [x.item.id, x.images]));
        window.renderMarketplaceListings(listings);
    }

    window.renderMarketplaceListings = async function (list) {
        const box = document.querySelector(".products");
        if (!box) return;
        if (!list?.length) {
            box.innerHTML = `<div class="empty-state"><div class="empty-icon">🔎</div><h3>Chưa có tin phù hợp</h3><p>Thử đổi từ khóa hoặc khu vực.</p></div>`;
            return;
        }
        const user = coords();
        box.innerHTML = list.map(item => {
            const imgs = window.homeListingImages?.[item.id] || [];
            const first = imgs[0]?.image_url || "";
            const d = (item.latitude && item.longitude && user) ? distanceKm(user, { lat: Number(item.latitude), lng: Number(item.longitude) }) : null;
            const fallback = (typeof SERVICE_PLACEHOLDER !== "undefined") ? SERVICE_PLACEHOLDER : "";
            return `<article class="product marketplace-card" data-id="${html(item.id)}">
                <a href="chi-tiet.html?id=${encodeURIComponent(item.id)}" class="product-link">
                    <div class="image-wrap"><img src="${first || fallback}" alt="${html(item.title)}" loading="lazy">${imgs.length ? `<span class="photo-count">📷 ${imgs.length}</span>` : ""}</div>
                    <div class="product-content"><div class="listing-category">${html(categoryName(item))}${item.subcategory ? ` · ${html(item.subcategory)}` : ""}</div><div class="title">${html(item.title)}</div><div class="price">${price(item.price)}</div><div class="location-small">📍 ${html(item.location || "Phú Thọ")}${d != null ? ` · ${d.toFixed(1)} km` : ""}</div><div class="card-description">${html(item.description || "Xem chi tiết tin đăng")}</div></div>
                </a>
                <button class="favorite-button" type="button" data-favorite="${html(item.id)}" aria-label="Yêu thích">♡</button>
            </article>`;
        }).join("");
        box.querySelectorAll("[data-favorite]").forEach(b => b.addEventListener("click", e => { e.preventDefault(); e.stopPropagation(); toggleFavorite(b.dataset.favorite, b); }));
        await refreshFavoriteButtons();
    };

    window.applyHomeFilters = function () {
        const keyword = (document.getElementById("searchInput")?.value || "").trim().toLowerCase();
        const category = document.getElementById("categoryFilter")?.value || "";
        const location = document.getElementById("locationFilter")?.value || "";
        const min = Number(document.getElementById("minPrice")?.value || 0);
        const max = Number(document.getElementById("maxPrice")?.value || 0);
        const nearOnly = document.getElementById("nearbyOnly")?.checked;
        const user = coords();

        const list = (window.homeListings || []).filter(item => {
            const text = `${item.title} ${categoryName(item)} ${item.subcategory || ""} ${item.location || ""} ${item.description || ""}`.toLowerCase();
            const km = (item.latitude && item.longitude && user) ? distanceKm(user, { lat: Number(item.latitude), lng: Number(item.longitude) }) : null;
            return (!keyword || text.includes(keyword)) && (!category || categoryName(item) === category) && (!location || item.location === location) && (!min || Number(item.price) >= min) && (!max || Number(item.price) <= max) && (!nearOnly || (km != null && km <= 25));
        });
        window.renderMarketplaceListings(list);
    };

    window.postSim = async function () {
        const title = document.getElementById("title")?.value.trim();
        const priceValue = document.getElementById("price")?.value;
        const category = document.getElementById("category")?.value || document.getElementById("network")?.value || "Khác";
        const subcategory = document.getElementById("subcategory")?.value || "";
        const location = document.getElementById("location")?.value;
        const description = document.getElementById("description")?.value.trim() || "";
        const phone = document.getElementById("contactPhone")?.value.trim() || "";
        const zalo = document.getElementById("contactZalo")?.value.trim() || "";
        const lat = localStorage.getItem("choPhuThoLat") ? Number(localStorage.getItem("choPhuThoLat")) : null;
        const lng = localStorage.getItem("choPhuThoLng") ? Number(localStorage.getItem("choPhuThoLng")) : null;
        const files = document.getElementById("listingImages")?.files;

        if (!title || !category || !location) {
            alert("Vui lòng nhập đầy đủ thông tin bắt buộc.");
            return;
        }
        const { user, profile } = await getCurrentUserAndProfile();
        if (!user) { alert("Bạn cần đăng nhập trước khi đăng tin."); window.location.href = "dang-nhap.html"; return; }
        if (!profile || !["seller", "admin"].includes(profile.role)) { alert("Tài khoản hiện tại chưa được cấp quyền đăng tin."); return; }

        const payload = {
            seller_id: user.id,
            sim_number: "",
            title,
            price: priceValue ? Number(priceValue) : 0,
            network: category,
            location,
            description,
            status: "pending"
        };

        // Dùng cột mới khi migration đã chạy; nếu chưa, tự rơi về schema cũ để không làm website hỏng.
        let listing = null;
        let error = null;
        const modern = { ...payload, category, subcategory, contact_phone: phone, contact_zalo: zalo, latitude: lat, longitude: lng };
        ({ data: listing, error } = await supabaseClient.from("listings").insert(modern).select().single());
        if (error) ({ data: listing, error } = await supabaseClient.from("listings").insert(payload).select().single());
        if (error) { alert("Đăng tin thất bại: " + error.message); return; }

        try {
            if (files?.length) await uploadImages(files, listing.id, user.id);
        } catch (imageError) {
            console.warn(imageError);
            alert("Tin đã được tạo nhưng ảnh chưa tải lên được. Bạn có thể bổ sung ảnh sau khi Admin bật kho ảnh.");
        }

        alert("Đăng tin thành công! Tin đang chờ Admin duyệt.");
        window.location.href = "quan-ly-tin.html";
    };

    async function currentUser() {
        const { data } = await supabaseClient.auth.getUser();
        return data?.user || null;
    }

    async function toggleFavorite(id, button) {
        const user = await currentUser();
        if (!user) { alert("Đăng nhập để lưu tin yêu thích."); return; }
        const { data: existing } = await supabaseClient.from("favorites").select("id").eq("listing_id", id).eq("user_id", user.id).maybeSingle();
        if (existing) {
            await supabaseClient.from("favorites").delete().eq("id", existing.id);
            button.textContent = "♡";
        } else {
            const { error } = await supabaseClient.from("favorites").insert({ listing_id: id, user_id: user.id });
            if (error) { alert("Chưa bật được tính năng yêu thích. Hãy chạy file migration trong thư mục supabase/migrations."); return; }
            button.textContent = "♥";
        }
    }

    async function refreshFavoriteButtons() {
        const user = await currentUser();
        if (!user) return;
        const { data } = await supabaseClient.from("favorites").select("listing_id").eq("user_id", user.id);
        const set = new Set((data || []).map(x => x.listing_id));
        document.querySelectorAll("[data-favorite]").forEach(b => { b.textContent = set.has(b.dataset.favorite) ? "♥" : "♡"; });
    }

    window.toggleFavorite = toggleFavorite;

    window.loadListingDetail = async function () {
        const box = document.getElementById("productDetail");
        const id = getQueryId();
        if (!box || !id) return;
        box.innerHTML = `<div class="loading">Đang tải tin...</div>`;
        const { data: item, error } = await supabaseClient.from("listings").select("*").eq("id", id).eq("status", "approved").maybeSingle();
        if (error || !item) { box.innerHTML = `<div class="empty-state"><h3>Không tìm thấy tin</h3><a href="index.html">← Về trang chủ</a></div>`; return; }
        const imgs = await loadImages(id);
        let seller = null;
        if (item.seller_id) seller = (await supabaseClient.from("profiles").select("full_name, phone").eq("id", item.seller_id).maybeSingle()).data;
        const gallery = imgs.length ? imgs.map((x, i) => `<img class="gallery-thumb ${i === 0 ? "active" : ""}" src="${html(x.image_url)}" alt="Ảnh ${i + 1}" onclick="document.getElementById('detailHero').src='${html(x.image_url)}'">`).join("") : "";
        const hero = imgs[0]?.image_url || ((typeof SERVICE_PLACEHOLDER !== "undefined") ? SERVICE_PLACEHOLDER : "");
        const phone = item.contact_phone || seller?.phone || "";
        const phoneLink = phone ? `tel:${phone.replace(/[^0-9+]/g, "")}` : "#";
        box.innerHTML = `<div class="detail-box"><div class="detail-main"><div class="detail-media"><img id="detailHero" class="sim-image-large" src="${html(hero)}" alt="${html(item.title)}">${gallery ? `<div class="gallery-row">${gallery}</div>` : ""}</div><div class="detail-info"><div class="listing-badge">${html(categoryName(item))}${item.subcategory ? ` · ${html(item.subcategory)}` : ""}</div><h1>${html(item.title)}</h1><div class="detail-price">${price(item.price)}</div><div class="detail-meta"><div>📍 <strong>Khu vực:</strong> ${html(item.location || "Phú Thọ")}</div><div>🕒 <strong>Đăng:</strong> ${new Date(item.created_at).toLocaleString("vi-VN")}</div></div><hr><h3>Mô tả</h3><div class="description">${html(item.description || "Người đăng chưa thêm mô tả.")}</div><div class="seller-box"><h3>👤 Người đăng</h3><p><strong>${html(seller?.full_name || "Người cung cấp")}</strong></p>${phone ? `<a class="contact-phone" href="${phoneLink}">☎️ Gọi</a>` : ""}<button class="outline-button detail-action" onclick="toggleFavorite('${html(item.id)}', this)">♡ Lưu tin</button><button class="outline-button detail-action" onclick="reportListing('${html(item.id)}')">⚑ Báo tin</button><a class="outline-button detail-action" href="nguoi-ban.html?id=${encodeURIComponent(item.seller_id || "")}">Trang người đăng</a></div></div></div></div>`;
        refreshFavoriteButtons();
    };

    window.reportListing = async function (listingId) {
        const user = await currentUser();
        if (!user) { alert("Đăng nhập để báo tin."); return; }
        const reason = prompt("Lý do báo tin?\n1. Tin giả\n2. Lừa đảo\n3. Nội dung không phù hợp\n4. Trùng tin\n5. Khác", "");
        if (!reason) return;
        const { error } = await supabaseClient.from("listing_reports").insert({ listing_id: listingId, reporter_id: user.id, reason, details: "" });
        if (error) { alert("Chưa bật được báo tin. Hãy chạy file migration trong thư mục supabase/migrations."); return; }
        alert("Đã gửi báo tin. Cảm ơn bạn.");
    };

    window.initMarketplaceLocation = function () {
        if (typeof initLocationExperience === "function") initLocationExperience();
    };

    document.addEventListener("DOMContentLoaded", () => {
        const run = () => {
            if (document.querySelector(".products")) {
                loadHomeMarketplace();
                document.getElementById("searchButton")?.addEventListener("click", window.applyHomeFilters);
                document.getElementById("searchInput")?.addEventListener("keydown", e => e.key === "Enter" && window.applyHomeFilters());
                ["categoryFilter", "locationFilter", "minPrice", "maxPrice", "nearbyOnly"].forEach(id => document.getElementById(id)?.addEventListener("change", window.applyHomeFilters));
            }
            window.initMarketplaceLocation();
        };
        if (typeof supabaseClient !== "undefined") run();
    });
})();
