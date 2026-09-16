// Chợ Phú Thọ - phiên bản vận hành với Supabase

const SIM_PLACEHOLDER = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500">
<defs><linearGradient id="g" x1="0" x2="1"><stop stop-color="#fff3c4"/><stop offset="1" stop-color="#ffe082"/></linearGradient></defs>
<rect width="800" height="500" fill="url(#g)"/>
<text x="400" y="235" text-anchor="middle" font-family="Arial" font-size="72">📱</text>
<text x="400" y="320" text-anchor="middle" font-family="Arial" font-size="34" font-weight="700" fill="#333">SIM SỐ ĐẸP</text>
</svg>`)}

window.homeListings = [];

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function formatPrice(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return "Thỏa thuận";
    return number.toLocaleString("vi-VN") + " đ";
}

function getQueryId() {
    return new URLSearchParams(window.location.search).get("id");
}

async function getCurrentUserAndProfile() {
    if (typeof supabaseClient === "undefined") return { user: null, profile: null };

    const { data: userData, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !userData.user) return { user: null, profile: null };

    const { data: profile } = await supabaseClient
        .from("profiles")
        .select("full_name, phone, role")
        .eq("id", userData.user.id)
        .maybeSingle();

    return { user: userData.user, profile: profile || null };
}

async function renderAccountArea() {
    const area = document.getElementById("accountArea");
    if (!area || typeof supabaseClient === "undefined") return;

    const { user, profile } = await getCurrentUserAndProfile();

    if (!user) {
        area.innerHTML = `
            <a href="dang-nhap.html">Đăng nhập</a>
            <span class="account-separator">|</span>
            <a href="dang-ky.html">Đăng ký</a>
        `;
        return;
    }

    const name = escapeHtml(profile?.full_name || user.email?.split("@")[0] || "Bạn");
    const role = profile?.role === "admin" ? "Quản trị viên" :
        profile?.role === "seller" ? "Nhà bán hàng" : "Khách hàng";

    area.innerHTML = `
        <div class="account-chip">
            <span>👋 Xin chào, <strong>${name}</strong></span>
            <small>${role}</small>
            <button type="button" onclick="logoutUser()">Đăng xuất</button>
        </div>
    `;
}

async function loadHomeListings() {
    const box = document.querySelector(".products");
    if (!box || typeof supabaseClient === "undefined") return;

    box.innerHTML = `<div class="loading">Đang tải tin đăng...</div>`;

    const { data, error } = await supabaseClient
        .from("listings")
        .select("id, sim_number, title, price, network, location, description, created_at")
        .eq("status", "approved")
        .order("created_at", { ascending: false });

    if (error) {
        console.error(error);
        box.innerHTML = `<div class="empty-state">Không thể tải tin đăng. Vui lòng tải lại trang.</div>`;
        return;
    }

    window.homeListings = data || [];
    renderHomeListings(window.homeListings);
}

function renderHomeListings(list) {
    const box = document.querySelector(".products");
    if (!box) return;

    if (!list.length) {
        box.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📱</div>
                <h3>Chưa có tin SIM được duyệt</h3>
                <p>Hãy quay lại sau hoặc đăng tin đầu tiên của bạn.</p>
            </div>
        `;
        return;
    }

    box.innerHTML = list.map(item => `
        <a href="chi-tiet.html?id=${encodeURIComponent(item.id)}" class="product-link">
            <article class="product">
                <img src="${SIM_PLACEHOLDER}" alt="${escapeHtml(item.title)}">
                <div class="product-content">
                    <div class="title">${escapeHtml(item.title)}</div>
                    <div class="sim-number">📱 ${escapeHtml(item.sim_number)}</div>
                    <div class="price">${formatPrice(item.price)}</div>
                    <div class="location-small">📍 ${escapeHtml(item.location)} · ${escapeHtml(item.network)}</div>
                </div>
            </article>
        </a>
    `).join("");
}

function applyHomeFilters() {
    const keyword = (document.getElementById("searchInput")?.value || "").trim().toLowerCase();
    const network = document.getElementById("networkFilter")?.value || "";
    const location = document.getElementById("locationFilter")?.value || "";
    const min = Number(document.getElementById("minPrice")?.value || 0);
    const max = Number(document.getElementById("maxPrice")?.value || 0);

    const result = window.homeListings.filter(item => {
        const text = `${item.title} ${item.sim_number} ${item.network} ${item.location} ${item.description || ""}`.toLowerCase();
        const matchesKeyword = !keyword || text.includes(keyword);
        const matchesNetwork = !network || item.network === network;
        const matchesLocation = !location || item.location === location;
        const price = Number(item.price) || 0;
        const matchesMin = !min || price >= min;
        const matchesMax = !max || price <= max;
        return matchesKeyword && matchesNetwork && matchesLocation && matchesMin && matchesMax;
    });

    renderHomeListings(result);
}

async function postSim() {
    const simNumber = document.getElementById("simNumber")?.value.trim();
    const title = document.getElementById("title")?.value.trim();
    const price = document.getElementById("price")?.value;
    const network = document.getElementById("network")?.value;
    const location = document.getElementById("location")?.value;
    const description = document.getElementById("description")?.value.trim();

    if (!simNumber || !title || !price || !network || !location) {
        alert("Vui lòng nhập đầy đủ thông tin bắt buộc.");
        return;
    }

    const { user, profile } = await getCurrentUserAndProfile();

    if (!user) {
        alert("Bạn cần đăng nhập trước khi đăng tin.");
        window.location.href = "dang-nhap.html";
        return;
    }

    if (!profile || profile.role !== "seller") {
        alert("Chỉ tài khoản Nhà bán hàng mới được đăng tin.");
        return;
    }

    const button = document.querySelector("[onclick=\"postSim()\"]");
    if (button) button.disabled = true;

    const { error } = await supabaseClient.from("listings").insert({
        seller_id: user.id,
        sim_number: simNumber,
        title,
        price: Number(price),
        network,
        location,
        description: description || "",
        status: "pending"
    });

    if (button) button.disabled = false;

    if (error) {
        console.error(error);
        alert("Đăng tin thất bại: " + error.message);
        return;
    }

    alert("Đăng tin thành công! Tin đang chờ Admin duyệt.");
    window.location.href = "quan-ly-tin.html";
}

async function showMyProducts() {
    const box = document.getElementById("myProducts");
    if (!box || typeof supabaseClient === "undefined") return;

    box.innerHTML = `<div class="loading">Đang tải tin của bạn...</div>`;

    const { user, profile } = await getCurrentUserAndProfile();
    if (!user) {
        box.innerHTML = `
            <div class="empty-state">
                <h3>Bạn chưa đăng nhập</h3>
                <a class="btn-post" href="dang-nhap.html">Đăng nhập</a>
            </div>`;
        return;
    }

    const { data, error } = await supabaseClient
        .from("listings")
        .select("*")
        .eq("seller_id", user.id)
        .order("created_at", { ascending: false });

    if (error) {
        box.innerHTML = `<div class="empty-state">Không tải được tin: ${escapeHtml(error.message)}</div>`;
        return;
    }

    if (!data?.length) {
        box.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📱</div>
                <h3>Bạn chưa có tin đăng</h3>
                <a class="btn-post" href="dang-tin.html">+ Đăng tin ngay</a>
            </div>`;
        return;
    }

    box.innerHTML = data.map(item => `
        <article class="my-product">
            <div class="listing-status status-${escapeHtml(item.status)}">${
                item.status === "approved" ? "Đã duyệt" : item.status === "hidden" ? "Đã ẩn" : "Chờ duyệt"
            }</div>
            <h3>${escapeHtml(item.title)}</h3>
            <p class="sim-number">📱 ${escapeHtml(item.sim_number)}</p>
            <p class="price">${formatPrice(item.price)}</p>
            <p>📡 ${escapeHtml(item.network)} · 📍 ${escapeHtml(item.location)}</p>
            <p class="muted">${escapeHtml(item.description || "Chưa có mô tả")}</p>
            <div class="product-actions">
                <button class="btn-view" onclick="viewProduct('${item.id}')">Xem tin</button>
                <button class="btn-edit" onclick="editProduct('${item.id}')">Sửa tin</button>
                <button class="btn-delete" onclick="deleteProduct('${item.id}')">Xóa tin</button>
            </div>
        </article>
    `).join("");
}

function viewProduct(id) {
    window.location.href = `chi-tiet.html?id=${encodeURIComponent(id)}`;
}

function editProduct(id) {
    window.location.href = `sua-tin.html?id=${encodeURIComponent(id)}`;
}

async function deleteProduct(id) {
    if (!confirm("Bạn chắc chắn muốn xóa tin này?")) return;

    const { user } = await getCurrentUserAndProfile();
    if (!user) {
        alert("Phiên đăng nhập đã hết. Vui lòng đăng nhập lại.");
        return;
    }

    const { error } = await supabaseClient
        .from("listings")
        .delete()
        .eq("id", id)
        .eq("seller_id", user.id);

    if (error) {
        alert("Xóa tin thất bại: " + error.message);
        return;
    }

    alert("Đã xóa tin.");
    showMyProducts();
}

async function loadEditListing() {
    const id = getQueryId();
    if (!id || typeof supabaseClient === "undefined") return;

    const { user } = await getCurrentUserAndProfile();
    if (!user) {
        window.location.href = "dang-nhap.html";
        return;
    }

    const { data, error } = await supabaseClient
        .from("listings")
        .select("*")
        .eq("id", id)
        .eq("seller_id", user.id)
        .single();

    if (error || !data) {
        alert("Không tìm thấy tin đăng.");
        window.location.href = "quan-ly-tin.html";
        return;
    }

    document.getElementById("editSimNumber").value = data.sim_number || "";
    document.getElementById("editTitle").value = data.title || "";
    document.getElementById("editPrice").value = data.price || "";
    document.getElementById("editNetwork").value = data.network || "";
    document.getElementById("editLocation").value = data.location || "";
    document.getElementById("editDescription").value = data.description || "";
}

async function saveEditedProduct() {
    const id = getQueryId();
    const { user } = await getCurrentUserAndProfile();
    if (!id || !user) {
        window.location.href = "dang-nhap.html";
        return;
    }

    const payload = {
        sim_number: document.getElementById("editSimNumber").value.trim(),
        title: document.getElementById("editTitle").value.trim(),
        price: Number(document.getElementById("editPrice").value),
        network: document.getElementById("editNetwork").value,
        location: document.getElementById("editLocation").value,
        description: document.getElementById("editDescription").value.trim(),
        status: "pending"
    };

    if (!payload.sim_number || !payload.title || !payload.price || !payload.network || !payload.location) {
        alert("Vui lòng nhập đầy đủ thông tin.");
        return;
    }

    const { error } = await supabaseClient
        .from("listings")
        .update(payload)
        .eq("id", id)
        .eq("seller_id", user.id);

    if (error) {
        alert("Lưu thay đổi thất bại: " + error.message);
        return;
    }

    alert("Đã cập nhật tin. Tin được chuyển về trạng thái chờ Admin duyệt.");
    window.location.href = "quan-ly-tin.html";
}

async function loadListingDetail() {
    const box = document.getElementById("productDetail");
    const id = getQueryId();
    if (!box || !id || typeof supabaseClient === "undefined") return;

    box.innerHTML = `<div class="loading">Đang tải thông tin tin đăng...</div>`;

    const { data: item, error } = await supabaseClient
        .from("listings")
        .select("*")
        .eq("id", id)
        .eq("status", "approved")
        .maybeSingle();

    if (error || !item) {
        box.innerHTML = `<div class="empty-state"><h3>Không tìm thấy tin đăng</h3><a href="index.html">← Về trang chủ</a></div>`;
        return;
    }

    let seller = null;
    if (item.seller_id) {
        const { data } = await supabaseClient
            .from("profiles")
            .select("full_name, phone")
            .eq("id", item.seller_id)
            .maybeSingle();
        seller = data;
    }

    const phone = seller?.phone || "";
    const tel = phone ? `tel:${phone.replace(/[^0-9+]/g, "")}` : "#";

    box.innerHTML = `
        <div class="detail-box">
            <div class="detail-main">
                <div class="detail-media">
                    <img class="sim-image-large" src="${SIM_PLACEHOLDER}" alt="${escapeHtml(item.title)}">
                </div>
                <div class="detail-info">
                    <div class="listing-badge">${escapeHtml(item.network)}</div>
                    <h1>${escapeHtml(item.title)}</h1>
                    <div class="detail-price">${formatPrice(item.price)}</div>
                    <div class="detail-meta">
                        <div>📱 <strong>Số SIM:</strong> ${escapeHtml(item.sim_number)}</div>
                        <div>📍 <strong>Khu vực:</strong> ${escapeHtml(item.location)}</div>
                        <div>🕒 <strong>Đăng:</strong> ${new Date(item.created_at).toLocaleString("vi-VN")}</div>
                    </div>
                    <hr>
                    <h3>Mô tả</h3>
                    <div class="description">${escapeHtml(item.description || "Người bán chưa thêm mô tả.")}</div>
                    <div class="seller-box">
                        <h3>👤 Người bán</h3>
                        <p><strong>${escapeHtml(seller?.full_name || "Người bán")}</strong></p>
                        ${phone ? `<a class="contact-phone" href="${tel}">☎️ Gọi người bán</a>` : `<p class="muted">Người bán chưa công khai số điện thoại.</p>`}
                    </div>
                </div>
            </div>
        </div>
    `;
}

async function logoutUser() {
    if (typeof supabaseClient !== "undefined") {
        await supabaseClient.auth.signOut();
    }
    window.location.href = "index.html";
}

async function initPage() {
    if (typeof supabaseClient === "undefined") return;

    await renderAccountArea();

    if (document.querySelector(".products")) {
        await loadHomeListings();
        document.getElementById("searchButton")?.addEventListener("click", applyHomeFilters);
        document.getElementById("searchInput")?.addEventListener("keydown", event => {
            if (event.key === "Enter") applyHomeFilters();
        });
        ["networkFilter", "locationFilter", "minPrice", "maxPrice"].forEach(id => {
            document.getElementById(id)?.addEventListener("change", applyHomeFilters);
        });
    }

    if (document.getElementById("productDetail")) await loadListingDetail();
    if (document.getElementById("myProducts")) await showMyProducts();
    if (document.getElementById("editSimNumber")) await loadEditListing();
}

document.addEventListener("DOMContentLoaded", initPage);
