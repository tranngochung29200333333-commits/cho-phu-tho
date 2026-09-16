// Chợ Phú Thọ - nền tảng rao vặt & dịch vụ địa phương

const SERVICE_PLACEHOLDER = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="520" viewBox="0 0 800 520">
<defs><linearGradient id="g" x1="0" x2="1"><stop stop-color="#fff7cf"/><stop offset="1" stop-color="#ffd65a"/></linearGradient></defs>
<rect width="800" height="520" fill="url(#g)"/>
<text x="400" y="235" text-anchor="middle" font-family="Arial" font-size="88">🛠️</text>
<text x="400" y="325" text-anchor="middle" font-family="Arial" font-size="34" font-weight="700" fill="#333">DỊCH VỤ & RAO VẶT</text>
</svg>`)}

const AREA_OPTIONS = ["Việt Trì","Phú Thọ","Lâm Thao","Cẩm Khê","Hạ Hòa","Thanh Sơn","Tân Sơn","Yên Lập","Thanh Ba","Đoan Hùng","Phù Ninh","Thanh Thủy","Tam Nông"];
const CATEGORY_OPTIONS = ["Bất động sản","Xe cộ","Điện tử","Dịch vụ","Việc làm","Đồ gia dụng","Thời trang","Thú cưng","Khác"];

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
    if (!Number.isFinite(number) || number <= 0) return "Thỏa thuận";
    return number.toLocaleString("vi-VN") + " đ";
}

function getQueryId() {
    return new URLSearchParams(window.location.search).get("id");
}

async function getCurrentUserAndProfile() {
    if (typeof supabaseClient === "undefined") return { user: null, profile: null };
    const { data: userData, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !userData.user) return { user: null, profile: null };
    const { data: profile } = await supabaseClient.from("profiles").select("full_name, phone, role").eq("id", userData.user.id).maybeSingle();
    return { user: userData.user, profile: profile || null };
}

async function renderAccountArea() {
    const area = document.getElementById("accountArea");
    if (!area || typeof supabaseClient === "undefined") return;
    const { user, profile } = await getCurrentUserAndProfile();
    if (!user) {
        area.innerHTML = `<a href="dang-nhap.html">Đăng nhập</a><span class="account-separator">|</span><a href="dang-ky.html">Đăng ký</a>`;
        return;
    }
    const name = escapeHtml(profile?.full_name || user.email?.split("@")[0] || "Bạn");
    const role = profile?.role === "admin" ? "Quản trị viên" : profile?.role === "seller" ? "Nhà cung cấp" : "Khách hàng";
    area.innerHTML = `<div class="account-chip"><span>👋 Xin chào, <strong>${name}</strong></span><small>${role}</small><button type="button" onclick="logoutUser()">Đăng xuất</button></div>`;
}

function getSelectedLocation() {
    return localStorage.getItem("choPhuThoLocation") || "";
}

function setSelectedLocation(area) {
    localStorage.setItem("choPhuThoLocation", area);
    const text = document.getElementById("selectedLocation");
    const status = document.getElementById("locationStatus");
    if (text) text.textContent = area || "Chọn khu vực";
    if (status) status.textContent = area ? `Đang ưu tiên tin và dịch vụ tại ${area}.` : "Chưa chọn khu vực. Bật vị trí để xem tin gần bạn.";
    const filter = document.getElementById("locationFilter");
    if (filter && area && [...filter.options].some(option => option.value === area)) filter.value = area;
}

function openLocationModal() {
    const modal = document.getElementById("locationModal");
    if (!modal) return;
    modal.setAttribute("aria-hidden", "false");
    modal.classList.add("open");
}

function closeLocationModal() {
    const modal = document.getElementById("locationModal");
    if (!modal) return;
    modal.setAttribute("aria-hidden", "true");
    modal.classList.remove("open");
}

function detectLocation() {
    if (!navigator.geolocation) {
        alert("Trình duyệt của bạn không hỗ trợ định vị. Bạn có thể chọn khu vực thủ công.");
        document.getElementById("manualLocationBox")?.removeAttribute("hidden");
        return;
    }
    navigator.geolocation.getCurrentPosition(
        position => {
            localStorage.setItem("choPhuThoLat", String(position.coords.latitude));
            localStorage.setItem("choPhuThoLng", String(position.coords.longitude));
            const current = getSelectedLocation();
            if (current) {
                setSelectedLocation(current);
                closeLocationModal();
            } else {
                // Không tự gán huyện từ tọa độ nếu chưa có dịch vụ bản đồ/reverse-geocoding.
                setSelectedLocation("Vị trí hiện tại");
                closeLocationModal();
            }
        },
        error => {
            console.warn("Geolocation error", error);
            alert("Chưa lấy được vị trí. Bạn có thể chọn khu vực thủ công.");
            document.getElementById("manualLocationBox")?.removeAttribute("hidden");
        },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
}

function initLocationExperience() {
    const saved = getSelectedLocation();
    setSelectedLocation(saved);

    document.getElementById("locationButton")?.addEventListener("click", openLocationModal);
    document.getElementById("locationBannerButton")?.addEventListener("click", openLocationModal);
    document.querySelectorAll("[data-close-location]").forEach(el => el.addEventListener("click", closeLocationModal));
    document.getElementById("allowLocation")?.addEventListener("click", detectLocation);
    document.getElementById("manualLocation")?.addEventListener("click", () => document.getElementById("manualLocationBox")?.removeAttribute("hidden"));
    document.getElementById("saveManualLocation")?.addEventListener("click", () => {
        const area = document.getElementById("manualLocationSelect")?.value;
        if (area) {
            setSelectedLocation(area);
            closeLocationModal();
            applyHomeFilters();
        }
    });

    if (!saved && document.getElementById("locationModal")) {
        setTimeout(openLocationModal, 700);
    }
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
        box.innerHTML = `<div class="empty-state">Không thể tải tin đăng. Vui lòng thử lại.</div>`;
        return;
    }
    window.homeListings = data || [];
    renderHomeListings(window.homeListings);
}

function renderHomeListings(list) {
    const box = document.querySelector(".products");
    if (!box) return;
    if (!list.length) {
        box.innerHTML = `<div class="empty-state"><div class="empty-icon">🔎</div><h3>Chưa có tin phù hợp</h3><p>Hãy thử đổi khu vực hoặc từ khóa tìm kiếm.</p></div>`;
        return;
    }

    box.innerHTML = list.map(item => `
        <a href="chi-tiet.html?id=${encodeURIComponent(item.id)}" class="product-link">
            <article class="product">
                <img src="${SERVICE_PLACEHOLDER}" alt="${escapeHtml(item.title)}">
                <div class="product-content">
                    <div class="listing-category">${escapeHtml(item.network || "Khác")}</div>
                    <div class="title">${escapeHtml(item.title)}</div>
                    <div class="price">${formatPrice(item.price)}</div>
                    <div class="location-small">📍 ${escapeHtml(item.location || "Phú Thọ")}</div>
                    <div class="card-description">${escapeHtml(item.description || "Xem chi tiết tin đăng")}</div>
                </div>
            </article>
        </a>
    `).join("");
}

function applyHomeFilters() {
    const keyword = (document.getElementById("searchInput")?.value || "").trim().toLowerCase();
    const category = document.getElementById("categoryFilter")?.value || "";
    const location = document.getElementById("locationFilter")?.value || getSelectedLocation();
    const min = Number(document.getElementById("minPrice")?.value || 0);
    const max = Number(document.getElementById("maxPrice")?.value || 0);

    const result = window.homeListings.filter(item => {
        const text = `${item.title} ${item.network} ${item.location} ${item.description || ""}`.toLowerCase();
        const matchesKeyword = !keyword || text.includes(keyword);
        const matchesCategory = !category || item.network === category;
        const matchesLocation = !location || location === "Vị trí hiện tại" || item.location === location;
        const price = Number(item.price) || 0;
        const matchesMin = !min || price >= min;
        const matchesMax = !max || price <= max;
        return matchesKeyword && matchesCategory && matchesLocation && matchesMin && matchesMax;
    });
    renderHomeListings(result);
}

async function postSim() {
    const serviceNumber = document.getElementById("simNumber")?.value.trim() || "";
    const title = document.getElementById("title")?.value.trim();
    const price = document.getElementById("price")?.value;
    const category = document.getElementById("network")?.value;
    const location = document.getElementById("location")?.value;
    const description = document.getElementById("description")?.value.trim();

    if (!title || !category || !location) {
        alert("Vui lòng nhập đầy đủ thông tin bắt buộc.");
        return;
    }

    const { user, profile } = await getCurrentUserAndProfile();
    if (!user) {
        alert("Bạn cần đăng nhập trước khi đăng tin.");
        window.location.href = "dang-nhap.html";
        return;
    }
    if (!profile || !["seller","admin"].includes(profile.role)) {
        alert("Tài khoản hiện tại chưa được cấp quyền đăng tin.");
        return;
    }

    const button = document.querySelector("[onclick=\"postSim()\"]");
    if (button) button.disabled = true;

    const { error } = await supabaseClient.from("listings").insert({
        seller_id: user.id,
        sim_number: serviceNumber,
        title,
        price: price ? Number(price) : 0,
        network: category,
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
    const { user } = await getCurrentUserAndProfile();
    if (!user) {
        box.innerHTML = `<div class="empty-state"><h3>Bạn chưa đăng nhập</h3><a class="btn-post" href="dang-nhap.html">Đăng nhập</a></div>`;
        return;
    }

    box.innerHTML = `<div class="loading">Đang tải tin của bạn...</div>`;
    const { data, error } = await supabaseClient.from("listings").select("*").eq("seller_id", user.id).order("created_at", { ascending: false });
    if (error) {
        box.innerHTML = `<div class="empty-state">Không tải được tin: ${escapeHtml(error.message)}</div>`;
        return;
    }
    if (!data?.length) {
        box.innerHTML = `<div class="empty-state"><div class="empty-icon">📣</div><h3>Bạn chưa có tin đăng</h3><a class="btn-post" href="dang-tin.html">+ Đăng tin ngay</a></div>`;
        return;
    }

    box.innerHTML = data.map(item => `
        <article class="my-product">
            <div class="listing-status status-${escapeHtml(item.status)}">${item.status === "approved" ? "Đã duyệt" : item.status === "hidden" ? "Đã ẩn" : "Chờ duyệt"}</div>
            <div class="listing-category">${escapeHtml(item.network || "Khác")}</div>
            <h3>${escapeHtml(item.title)}</h3>
            <p class="price">${formatPrice(item.price)}</p>
            <p>📍 ${escapeHtml(item.location)}</p>
            <p class="muted">${escapeHtml(item.description || "Chưa có mô tả")}</p>
            <div class="product-actions">
                <button class="btn-view" onclick="viewProduct('${item.id}')">Xem</button>
                <button class="btn-edit" onclick="editProduct('${item.id}')">Sửa</button>
                <button class="btn-delete" onclick="deleteProduct('${item.id}')">Xóa</button>
            </div>
        </article>`).join("");
}

function viewProduct(id) { window.location.href = `chi-tiet.html?id=${encodeURIComponent(id)}`; }
function editProduct(id) { window.location.href = `sua-tin.html?id=${encodeURIComponent(id)}`; }

async function deleteProduct(id) {
    if (!confirm("Bạn chắc chắn muốn xóa tin này?")) return;
    const { user } = await getCurrentUserAndProfile();
    if (!user) return;
    const { error } = await supabaseClient.from("listings").delete().eq("id", id).eq("seller_id", user.id);
    if (error) { alert("Xóa tin thất bại: " + error.message); return; }
    alert("Đã xóa tin.");
    showMyProducts();
}

async function loadEditListing() {
    const id = getQueryId();
    if (!id || typeof supabaseClient === "undefined") return;
    const { user } = await getCurrentUserAndProfile();
    if (!user) { window.location.href = "dang-nhap.html"; return; }
    const { data, error } = await supabaseClient.from("listings").select("*").eq("id", id).eq("seller_id", user.id).single();
    if (error || !data) { alert("Không tìm thấy tin đăng."); window.location.href = "quan-ly-tin.html"; return; }
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
    if (!id || !user) { window.location.href = "dang-nhap.html"; return; }
    const payload = {
        sim_number: document.getElementById("editSimNumber").value.trim(),
        title: document.getElementById("editTitle").value.trim(),
        price: Number(document.getElementById("editPrice").value || 0),
        network: document.getElementById("editNetwork").value,
        location: document.getElementById("editLocation").value,
        description: document.getElementById("editDescription").value.trim(),
        status: "pending"
    };
    if (!payload.title || !payload.network || !payload.location) { alert("Vui lòng nhập đầy đủ thông tin."); return; }
    const { error } = await supabaseClient.from("listings").update(payload).eq("id", id).eq("seller_id", user.id);
    if (error) { alert("Lưu thay đổi thất bại: " + error.message); return; }
    alert("Đã cập nhật tin. Tin được chuyển về trạng thái chờ Admin duyệt.");
    window.location.href = "quan-ly-tin.html";
}

async function loadListingDetail() {
    const box = document.getElementById("productDetail");
    const id = getQueryId();
    if (!box || !id || typeof supabaseClient === "undefined") return;
    box.innerHTML = `<div class="loading">Đang tải chi tiết...</div>`;
    const { data: item, error } = await supabaseClient.from("listings").select("*").eq("id", id).eq("status", "approved").maybeSingle();
    if (error || !item) { box.innerHTML = `<div class="empty-state"><h3>Không tìm thấy tin đăng</h3><a href="index.html">← Về trang chủ</a></div>`; return; }

    let seller = null;
    if (item.seller_id) {
        const { data } = await supabaseClient.from("profiles").select("full_name, phone").eq("id", item.seller_id).maybeSingle();
        seller = data;
    }
    const phone = seller?.phone || "";
    const tel = phone ? `tel:${phone.replace(/[^0-9+]/g, "")}` : "#";
    box.innerHTML = `
        <div class="detail-box">
            <div class="detail-main">
                <div class="detail-media"><img class="sim-image-large" src="${SERVICE_PLACEHOLDER}" alt="${escapeHtml(item.title)}"></div>
                <div class="detail-info">
                    <div class="listing-badge">${escapeHtml(item.network || "Dịch vụ")}</div>
                    <h1>${escapeHtml(item.title)}</h1>
                    <div class="detail-price">${formatPrice(item.price)}</div>
                    <div class="detail-meta"><div>📍 <strong>Khu vực:</strong> ${escapeHtml(item.location)}</div><div>🕒 <strong>Đăng:</strong> ${new Date(item.created_at).toLocaleString("vi-VN")}</div></div>
                    <hr><h3>Mô tả</h3><div class="description">${escapeHtml(item.description || "Người đăng chưa thêm mô tả.")}</div>
                    <div class="seller-box"><h3>👤 Người cung cấp</h3><p><strong>${escapeHtml(seller?.full_name || "Người đăng tin")}</strong></p>${phone ? `<a class="contact-phone" href="${tel}">☎️ Gọi ngay</a>` : `<p class="muted">Người đăng chưa công khai số điện thoại.</p>`}</div>
                </div>
            </div>
        </div>`;
}

async function logoutUser() {
    if (typeof supabaseClient !== "undefined") await supabaseClient.auth.signOut();
    window.location.href = "index.html";
}

async function initPage() {
    if (typeof supabaseClient === "undefined") return;
    await renderAccountArea();
    initLocationExperience();

    if (document.querySelector(".products")) {
        await loadHomeListings();
        document.getElementById("searchButton")?.addEventListener("click", applyHomeFilters);
        document.getElementById("searchInput")?.addEventListener("keydown", e => { if (e.key === "Enter") applyHomeFilters(); });
        ["categoryFilter","locationFilter","minPrice","maxPrice"].forEach(id => document.getElementById(id)?.addEventListener("change", applyHomeFilters));
    }
    if (document.getElementById("productDetail")) await loadListingDetail();
    if (document.getElementById("myProducts")) await showMyProducts();
    if (document.getElementById("editSimNumber")) await loadEditListing();
}

document.addEventListener("DOMContentLoaded", initPage);
