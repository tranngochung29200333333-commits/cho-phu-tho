// ================================
// DỮ LIỆU SẢN PHẨM
// ================================

const products = [
    {
        name: "iPhone 15 Pro 256GB",
        price: "18.500.000 đ",
        location: "Việt Trì, Phú Thọ",
        category: "Điện thoại",
        image: "https://picsum.photos/400/300?1"
    },

    {
        name: "Samsung Galaxy S24",
        price: "16.000.000 đ",
        location: "Lâm Thao, Phú Thọ",
        category: "Điện thoại",
        image: "https://picsum.photos/400/300?2"
    },

    {
        name: "Honda SH 2023",
        price: "65.000.000 đ",
        location: "Lâm Thao, Phú Thọ",
        category: "Xe máy",
        image: "https://picsum.photos/400/300?3"
    },

    {
        name: "Toyota Vios 2021",
        price: "420.000.000 đ",
        location: "Việt Trì, Phú Thọ",
        category: "Ô tô",
        image: "https://picsum.photos/400/300?4"
    },

    {
        name: "Laptop Dell",
        price: "12.000.000 đ",
        location: "Thanh Sơn, Phú Thọ",
        category: "Máy tính",
        image: "https://picsum.photos/400/300?5"
    },

    {
        name: "Nhà đất cần bán",
        price: "1.850.000.000 đ",
        location: "Phù Ninh, Phú Thọ",
        category: "Bất động sản",
        image: "https://picsum.photos/400/300?6"
    },

    {
        name: "Bộ bàn ghế phòng khách",
        price: "8.000.000 đ",
        location: "Việt Trì, Phú Thọ",
        category: "Đồ gia dụng",
        image: "https://picsum.photos/400/300?7"
    },

    {
        name: "Chó Poodle",
        price: "5.000.000 đ",
        location: "Thanh Thủy, Phú Thọ",
        category: "Thú cưng",
        image: "https://picsum.photos/400/300?8"
    }
];
// Lấy các tin do người dùng đăng
const postedProducts =
    JSON.parse(
        localStorage.getItem("choPhuThoProducts")
    ) || [];


// Chỉ hiển thị tin đã được Admin duyệt
const approvedProducts =
    postedProducts.filter(
        product =>
            product.status === "approved"
    );


// Đưa tin đã duyệt lên đầu
products.unshift(...approvedProducts);


// ================================
// HIỂN THỊ SẢN PHẨM
// ================================

function showProducts(list) {

    const productBox = document.querySelector(".products");

    if (!productBox) {
        return;
    }

    productBox.innerHTML = "";

    if (list.length === 0) {

        productBox.innerHTML = `
            <p>
                Không tìm thấy tin đăng phù hợp.
            </p>
        `;

        return;
    }


    list.forEach((product, index) => {

        productBox.innerHTML += `

            <a
                href="chi-tiet.html"
                class="product-link"
            >

                <div class="product">

                    <img
                        src="${product.image}"
                        alt="${product.name}"
                    >

                    <div class="product-content">

                        <div class="title">
                            ${product.name}
                        </div>

                        <div class="price">
                            ${product.price}
                        </div>

                        <div class="location-small">
                            📍 ${product.location}
                        </div>

                        <div class="category-small">
                            ${product.category}
                        </div>

                    </div>

                </div>

            </a>
        `;

    });

}


// ================================
// TÌM KIẾM
// ================================

function searchProducts() {

    const searchInput =
        document.querySelector(".search input");

    if (!searchInput) {
        return;
    }

    const keyword =
        searchInput.value
        .toLowerCase()
        .trim();


    const result = products.filter(product => {

        return (
            product.name.toLowerCase().includes(keyword) ||
            product.category.toLowerCase().includes(keyword) ||
            product.location.toLowerCase().includes(keyword)
        );

    });


    showProducts(result);
}


// ================================
// NÚT TÌM KIẾM
// ================================

const searchButton =
    document.querySelector(".search button");

if (searchButton) {

    searchButton.addEventListener(
        "click",
        searchProducts
    );

}


// ================================
// NHẤN ENTER ĐỂ TÌM
// ================================

const searchInput =
    document.querySelector(".search input");

if (searchInput) {

    searchInput.addEventListener(
        "keydown",
        function(event) {

            if (event.key === "Enter") {

                searchProducts();

            }

        }
    );

}


// ================================
// HIỂN THỊ SẢN PHẨM BAN ĐẦU
// ================================

showProducts(products);
// ================================
// ĐĂNG KÝ TÀI KHOẢN
// ================================

function registerUser() {

    const fullname =
        document.getElementById("fullname").value.trim();

    const phone =
        document.getElementById("phone").value.trim();

    const password =
        document.getElementById("password").value.trim();

    const accountType =
        document.getElementById("accountType").value;


    if (!fullname || !phone || !password) {

        alert("Vui lòng nhập đầy đủ thông tin.");

        return;
    }


    const user = {

        fullname: fullname,

        phone: phone,

        password: password,

        accountType: accountType

    };


    localStorage.setItem(
        "choPhuThoUser",
        JSON.stringify(user)
    );


    alert("Đăng ký thành công!");

    window.location.href = "dang-nhap.html";

}


// ================================
// ĐĂNG NHẬP
// ================================

function loginUser() {

    const phone =
        document.getElementById("loginPhone").value.trim();

    const password =
        document.getElementById("loginPassword").value.trim();


    const savedUser =
        localStorage.getItem("choPhuThoUser");


    if (!savedUser) {

        alert("Bạn chưa có tài khoản.");

        return;
    }


    const user =
        JSON.parse(savedUser);


    if (
        phone === user.phone &&
        password === user.password
    ) {

        localStorage.setItem(
            "choPhuThoLoggedIn",
            "true"
        );


        alert("Đăng nhập thành công!");

        window.location.href = "index.html";

    } else {

        alert(
            "Số điện thoại hoặc mật khẩu không đúng."
        );

    }

}
// ================================
// HIỂN THỊ TÀI KHOẢN
// ================================

function showUserInfo() {

    const userArea = document.getElementById("userArea");

    if (!userArea) {
        return;
    }

    const loggedIn =
        localStorage.getItem("choPhuThoLoggedIn");

    const savedUser =
        localStorage.getItem("choPhuThoUser");

    if (loggedIn === "true" && savedUser) {

        const user = JSON.parse(savedUser);

        let roleText = "Khách hàng";

        if (user.accountType === "seller") {
            roleText = "Nhà bán hàng";
        }

        userArea.innerHTML = `
            <div class="user-box">
                👋 Xin chào <strong>${user.fullname}</strong>
                <span>(${roleText})</span>

                <button onclick="logoutUser()">
                    Đăng xuất
                </button>
            </div>
        `;

    } else {

        userArea.innerHTML = `
            <a href="dang-nhap.html">Đăng nhập</a>
            |
            <a href="dang-ky.html">Đăng ký</a>
        `;
    }
}


// ================================
// ĐĂNG XUẤT
// ================================

function logoutUser() {

    localStorage.removeItem("choPhuThoLoggedIn");

    alert("Đã đăng xuất!");

    window.location.href = "index.html";
}


// Chạy khi mở trang
showUserInfo();

// ========================================
// ĐĂNG TIN SIM - SUPABASE
// ========================================

async function postSim() {

    const simNumber = document.getElementById("simNumber").value.trim();
    const title = document.getElementById("title").value.trim();
    const price = document.getElementById("price").value;
    const network = document.getElementById("network").value;
    const location = document.getElementById("location").value;
    const description = document.getElementById("description").value.trim();

    // Kiểm tra đăng nhập
    const { data: userData, error: userError } =
        await supabaseClient.auth.getUser();

    if (userError || !userData.user) {
        alert("Bạn cần đăng nhập trước khi đăng tin.");
        window.location.href = "dang-nhap.html";
        return;
    }

    const user = userData.user;

    // Kiểm tra tài khoản có phải nhà bán hàng không
    const { data: profile, error: profileError } =
        await supabaseClient
            .from("profiles")
            .select("full_name, phone, role")
            .eq("id", user.id)
            .single();

    if (profileError || !profile) {
        alert("Không tìm thấy thông tin tài khoản.");
        return;
    }

    if (profile.role !== "seller") {
        alert("Chỉ tài khoản Nhà bán hàng mới được đăng tin.");
        return;
    }

    // Kiểm tra dữ liệu
    if (!simNumber || !title || !price || !network || !location) {
        alert("Vui lòng nhập đầy đủ thông tin bắt buộc.");
        return;
    }

    try {

        // Lưu tin vào Supabase
        const { data, error } =
            await supabaseClient
                .from("listings")
                .insert({
                    seller_id: user.id,
                    sim_number: simNumber,
                    title: title,
                    price: Number(price),
                    network: network,
                    location: location,
                    description: description,
                    status: "pending"
                })
                .select()
                .single();

        if (error) {
            throw error;
        }

        console.log("Tin đã tạo:", data);

        alert(
            "Đăng tin thành công!\n\n" +
            "Tin của bạn đang chờ Admin duyệt."
        );

        // Chuyển sang quản lý tin
        window.location.href = "quan-ly-tin.html";

    } catch (error) {

        console.error("Lỗi đăng tin:", error);

        alert("Đăng tin thất bại: " + error.message);
    }
}




// ================================
// QUẢN LÝ TIN ĐĂNG
// ================================

function showMyProducts() {

    const box =
        document.getElementById("myProducts");

    if (!box) {
        return;
    }


    const savedUser =
        localStorage.getItem("choPhuThoUser");


    const loggedIn =
        localStorage.getItem("choPhuThoLoggedIn");


    if (loggedIn !== "true" || !savedUser) {

        box.innerHTML = `
            <p>
                Bạn cần đăng nhập để xem tin.
            </p>

            <a href="dang-nhap.html">
                Đăng nhập
            </a>
        `;

        return;
    }


    const user =
        JSON.parse(savedUser);


    const products =
        JSON.parse(
            localStorage.getItem("choPhuThoProducts")
        ) || [];


    const myProducts =
        products.filter(
            product =>
                product.phone === user.phone
        );


    if (myProducts.length === 0) {

        box.innerHTML = `
            <p>
                Bạn chưa có tin đăng nào.
            </p>

            <a href="dang-tin.html"
               class="btn-post">

                + Đăng tin

            </a>
        `;

        return;
    }


    box.innerHTML = "";


    myProducts.forEach(product => {

        const item =
            document.createElement("div");


        item.className =
            "my-product";


item.innerHTML = `

    <h3>
        ${product.name}
    </h3>

    <p>
        📱 ${product.simNumber}
    </p>

    <p>
        💰
        ${Number(product.price).toLocaleString("vi-VN")}
        đ
    </p>

    <p>
        📡 ${product.network}
    </p>

    <p>
        📍 ${product.location}
    </p>

    <div class="product-actions">

        <button
            class="btn-view"
            onclick="viewProduct(${product.id})">

            Xem tin

        </button>


        <button
            class="btn-edit"
            onclick="editProduct(${product.id})">

            Sửa tin

        </button>


        <button
            class="btn-delete"
            onclick="deleteProduct(${product.id})">

            Xóa tin

        </button>

    </div>

`;


        box.appendChild(item);

    });

}


// ================================
// XÓA TIN
// ================================

function deleteProduct(id) {

    const confirmDelete =
        confirm(
            "Bạn có chắc muốn xóa tin này?"
        );


    if (!confirmDelete) {
        return;
    }


    let products =
        JSON.parse(
            localStorage.getItem("choPhuThoProducts")
        ) || [];


    products =
        products.filter(
            product =>
                product.id !== id
        );


    localStorage.setItem(
        "choPhuThoProducts",
        JSON.stringify(products)
    );


    alert("Đã xóa tin!");


    showMyProducts();

}
// ================================
// XEM CHI TIẾT TIN
// ================================

function viewProduct(id) {

    window.location.href =
        "chi-tiet.html?id=" + id;

}
// ================================
// SỬA TIN
// ================================

function editProduct(id) {

    window.location.href =
        "sua-tin.html?id=" + id;

}


// Chạy trang quản lý
showMyProducts();
// ================================
// LOAD TIN ĐỂ SỬA
// ================================

function loadEditProduct() {

    const editSim =
        document.getElementById("editSimNumber");

    if (!editSim) {
        return;
    }


    const params =
        new URLSearchParams(
            window.location.search
        );


    const id =
        Number(params.get("id"));


    const products =
        JSON.parse(
            localStorage.getItem("choPhuThoProducts")
        ) || [];


    const product =
        products.find(
            item => item.id === id
        );


    if (!product) {

        alert("Không tìm thấy tin.");

        window.location.href =
            "quan-ly-tin.html";

        return;
    }


    document.getElementById("editSimNumber").value =
        product.simNumber;

    document.getElementById("editTitle").value =
        product.name;

    document.getElementById("editPrice").value =
        product.price;

    document.getElementById("editNetwork").value =
        product.network;

    document.getElementById("editLocation").value =
        product.location;

    document.getElementById("editDescription").value =
        product.description;

}


// ================================
// LƯU TIN ĐÃ SỬA
// ================================

function saveEditedProduct() {

    const params =
        new URLSearchParams(
            window.location.search
        );


    const id =
        Number(params.get("id"));


    let products =
        JSON.parse(
            localStorage.getItem("choPhuThoProducts")
        ) || [];


    const index =
        products.findIndex(
            item => item.id === id
        );


    if (index === -1) {

        alert("Không tìm thấy tin.");

        return;
    }


    products[index].simNumber =
        document
            .getElementById("editSimNumber")
            .value
            .trim();


    products[index].name =
        document
            .getElementById("editTitle")
            .value
            .trim();


    products[index].price =
        Number(
            document
                .getElementById("editPrice")
                .value
        );


    products[index].network =
        document
            .getElementById("editNetwork")
            .value;


    products[index].location =
        document
            .getElementById("editLocation")
            .value;


    products[index].description =
        document
            .getElementById("editDescription")
            .value
            .trim();


    localStorage.setItem(
        "choPhuThoProducts",
        JSON.stringify(products)
    );


    alert("Đã cập nhật tin!");


    window.location.href =
        "quan-ly-tin.html";

}


// Chạy trang sửa tin
loadEditProduct();
// ================================
// CHI TIẾT TIN SIM
// ================================

function showProductDetail() {

    const box =
        document.getElementById("productDetail");

    if (!box) {
        return;
    }


    const params =
        new URLSearchParams(
            window.location.search
        );


    const id =
        Number(params.get("id"));


    const products =
        JSON.parse(
            localStorage.getItem("choPhuThoProducts")
        ) || [];


    const product =
        products.find(
            item => item.id === id
        );


    // Nếu không tìm thấy tin
    if (!product) {

        box.innerHTML = `
            <div class="detail-box">

                <h2>Không tìm thấy tin</h2>

                <p>
                    Tin đăng này không tồn tại
                    hoặc đã bị xóa.
                </p>

                <a href="index.html">
                    ← Quay lại trang chủ
                </a>

            </div>
        `;

        return;
    }


    box.innerHTML = `

        <div class="detail-box">

            <div class="detail-main">

                <div>

                    <div class="sim-image">
                        📱
                    </div>

                </div>


                <div class="detail-info">

                    <h1>
                        ${product.name}
                    </h1>


                    <div class="detail-price">

                        ${Number(product.price)
                            .toLocaleString("vi-VN")} đ

                    </div>


                    <p>
                        📱
                        <strong>Số SIM:</strong>
                        ${product.simNumber}
                    </p>


                    <p>
                        📡
                        <strong>Nhà mạng:</strong>
                        ${product.network}
                    </p>


                    <p>
                        📍
                        <strong>Khu vực:</strong>
                        ${product.location}
                    </p>


                    <hr>


                    <h3>
                        Mô tả
                    </h3>


                    <p class="description">

                        ${product.description}

                    </p>

                </div>

            </div>


            <div class="seller-box">

                <h2>
                    👤 Người bán
                </h2>


                <p>
                    <strong>
                        ${product.seller}
                    </strong>
                </p>


                <p>
                    📍 ${product.location}
                </p>


                <a
                    class="contact-phone"
                    href="tel:${product.phone}">

                    ☎️ Gọi ${product.phone}

                </a>


                <a
                    class="contact-zalo"
                    href="https://zalo.me/${product.phone}"
                    target="_blank">

                    💬 Nhắn Zalo

                </a>

            </div>


            <br>


            <a href="index.html">

                ← Quay lại danh sách SIM

            </a>

        </div>

    `;
}


// Chạy trang chi tiết
showProductDetail();
// ================================
// ĐĂNG NHẬP ADMIN DEMO
// ================================

function adminLogin() {

    const username =
        document.getElementById("adminUsername").value.trim();

    const password =
        document.getElementById("adminPassword").value.trim();


    if (
        username === "admin" &&
        password === "123456"
    ) {

        localStorage.setItem(
            "choPhuThoAdmin",
            "true"
        );

        alert("Đăng nhập Admin thành công!");

        window.location.href =
            "admin.html";

    } else {

        alert(
            "Tên đăng nhập hoặc mật khẩu không đúng."
        );

    }
}


// ================================
// ĐĂNG XUẤT ADMIN
// ================================

function adminLogout() {

    localStorage.removeItem(
        "choPhuThoAdmin"
    );

    window.location.href =
        "admin-login.html";
}
// ================================
// KIỂM TRA ADMIN
// ================================

function checkAdmin() {

    const admin =
        localStorage.getItem("choPhuThoAdmin");

    const box =
        document.getElementById("adminProducts");


    if (!box) {
        return;
    }


    if (admin !== "true") {

        alert(
            "Bạn không có quyền truy cập Admin."
        );

        window.location.href =
            "admin-login.html";

        return;
    }


    showAdminProducts();
}


// ================================
// HIỂN THỊ TẤT CẢ TIN
// ================================

function showAdminProducts() {

    const box =
        document.getElementById("adminProducts");

    if (!box) {
        return;
    }


    const products =
        JSON.parse(
            localStorage.getItem("choPhuThoProducts")
        ) || [];


    const total =
        products.length;


    const pending =
        products.filter(
            product =>
                product.status !== "approved"
        ).length;


    const approved =
        products.filter(
            product =>
                product.status === "approved"
        ).length;


    document.getElementById(
        "totalProducts"
    ).textContent = total;


    document.getElementById(
        "pendingProducts"
    ).textContent = pending;


    document.getElementById(
        "approvedProducts"
    ).textContent = approved;


    if (products.length === 0) {

        box.innerHTML = `
            <p>
                Chưa có tin đăng nào.
            </p>
        `;

        return;
    }


    box.innerHTML = "";


    products.forEach(product => {

        const item =
            document.createElement("div");


        item.className =
            "admin-product";


        const status =
            product.status || "pending";


        let statusText =
            "⏳ Chờ duyệt";


        if (status === "approved") {

            statusText =
                "✅ Đã duyệt";

        }


        if (status === "hidden") {

            statusText =
                "🚫 Đã ẩn";

        }


        item.innerHTML = `

            <h3>
                ${product.name}
            </h3>

            <p>
                📱 ${product.simNumber}
            </p>

            <p>
                💰
                ${Number(product.price)
                    .toLocaleString("vi-VN")} đ
            </p>

            <p>
                📡 ${product.network}
            </p>

            <p>
                👤 Người bán:
                ${product.seller}
            </p>

            <p>
                ${statusText}
            </p>


            <div class="admin-actions">

                <button
                    onclick="approveProduct(${product.id})">

                    ✅ Duyệt

                </button>


                <button
                    onclick="hideProduct(${product.id})">

                    🚫 Ẩn

                </button>


                <button
                    onclick="adminDeleteProduct(${product.id})">

                    🗑️ Xóa

                </button>

            </div>

        `;


        box.appendChild(item);

    });

}


// ================================
// DUYỆT TIN
// ================================

function approveProduct(id) {

    updateProductStatus(
        id,
        "approved"
    );

}


// ================================
// ẨN TIN
// ================================

function hideProduct(id) {

    updateProductStatus(
        id,
        "hidden"
    );

}


// ================================
// CẬP NHẬT TRẠNG THÁI
// ================================

function updateProductStatus(
    id,
    status
) {

    let products =
        JSON.parse(
            localStorage.getItem("choPhuThoProducts")
        ) || [];


    const product =
        products.find(
            item => item.id === id
        );


    if (!product) {
        return;
    }


    product.status =
        status;


    localStorage.setItem(
        "choPhuThoProducts",
        JSON.stringify(products)
    );


    showAdminProducts();

}


// ================================
// ADMIN XÓA TIN
// ================================

function adminDeleteProduct(id) {

    if (
        !confirm(
            "Admin có chắc muốn xóa tin này?"
        )
    ) {

        return;
    }


    let products =
        JSON.parse(
            localStorage.getItem("choPhuThoProducts")
        ) || [];


    products =
        products.filter(
            product =>
                product.id !== id
        );


    localStorage.setItem(
        "choPhuThoProducts",
        JSON.stringify(products)
    );


    showAdminProducts();

}


// Chạy trang Admin
checkAdmin();
// ========================================
// KIỂM TRA TÀI KHOẢN SUPABASE
// ========================================

async function checkSupabaseUser() {

    try {

        const { data, error } =
            await supabaseClient.auth.getUser();

        if (error) {
            console.log("Chưa đăng nhập.");
            return;
        }

        const user = data.user;

        if (!user) {
            return;
        }

        // Lấy thông tin profile
        const { data: profile, error: profileError } =
            await supabaseClient
                .from("profiles")
                .select("full_name, phone, role")
                .eq("id", user.id)
                .single();

        if (profileError) {
            console.error("Không lấy được profile:", profileError);
            return;
        }

        console.log("Người dùng hiện tại:", profile);

        // Tìm khu vực tài khoản trên header
        const accountArea =
            document.getElementById("accountArea");

        if (!accountArea) {
            return;
        }

        let roleText = "👤 Khách hàng";

        if (profile.role === "seller") {
            roleText = "🏪 Nhà bán hàng";
        }

        if (profile.role === "admin") {
            roleText = "🛡️ Quản trị viên";
        }

        accountArea.innerHTML = `
            <div class="user-info">
                <span>
                    Xin chào, <strong>${profile.full_name}</strong>
                </span>

                <small>
                    ${roleText}
                </small>

                <button onclick="logoutUser()" class="btn-logout">
                    Đăng xuất
                </button>
            </div>
        `;

    } catch (error) {

        console.error("Lỗi kiểm tra tài khoản:", error);

    }
}


// ========================================
// ĐĂNG XUẤT
// ========================================

async function logoutUser() {

    const { error } =
        await supabaseClient.auth.signOut();

    if (error) {

        alert("Đăng xuất thất bại: " + error.message);
        return;
    }

    alert("Đã đăng xuất.");

    window.location.href = "index.html";
}


// Kiểm tra tài khoản khi trang tải
document.addEventListener("DOMContentLoaded", function () {

    if (typeof supabaseClient !== "undefined") {
        checkSupabaseUser();
    }

});
async function loadSupabaseListings() {

    const box = document.getElementById("productList");

    if (!box) return;

    const { data, error } = await supabaseClient
        .from("listings")
        .select("*")
        .eq("status", "approved")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Lỗi tải tin:", error);
        return;
    }

    if (!data || data.length === 0) {
        box.innerHTML = "<p>Chưa có SIM nào được duyệt.</p>";
        return;
    }

    box.innerHTML = data.map(item => `
        <div class="product-card">

            <div class="product-info">

                <h3>${item.title}</h3>

                <p class="sim-number">
                    📱 ${item.sim_number}
                </p>

                <p class="price">
                    ${Number(item.price).toLocaleString("vi-VN")} đ
                </p>

                <p>
                    📡 ${item.network}
                </p>

                <p>
                    📍 ${item.location}
                </p>

                <a href="chi-tiet.html?id=${item.id}"
                   class="btn-detail">
                    Xem chi tiết
                </a>

            </div>

        </div>
    `).join("");
}

document.addEventListener("DOMContentLoaded", function () {
    if (typeof supabaseClient !== "undefined") {
        loadSupabaseListings();
    }
});