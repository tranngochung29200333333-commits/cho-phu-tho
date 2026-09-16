const VERIFY_BUCKET = "seller-kyc";

function setAuthStatus(message, type = "error") {
    const box = document.getElementById("authStatus");
    if (box) { box.className = `auth-status ${type}`; box.textContent = message; }
    else alert(message);
}
function setBusy(form, busy) {
    const button = form?.querySelector("button[type=submit]");
    if (!button) return;
    if (!button.dataset.defaultText) button.dataset.defaultText = button.textContent;
    button.disabled = busy;
    button.textContent = busy ? "Đang xử lý..." : button.dataset.defaultText;
}
function fileExt(name) { return (String(name || "jpg").split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg"; }

async function registerCustomer(event) {
    event.preventDefault();
    const form = event.target;
    const fullName = form.fullName.value.trim(), phone = form.phone.value.trim(), email = form.email.value.trim();
    const password = form.password.value, confirmPassword = form.confirmPassword.value;
    if (!fullName || !phone || !email) return setAuthStatus("Vui lòng nhập đầy đủ thông tin.");
    if (password.length < 6) return setAuthStatus("Mật khẩu cần ít nhất 6 ký tự.");
    if (password !== confirmPassword) return setAuthStatus("Mật khẩu nhập lại không khớp.");
    setBusy(form, true);

    const { data: fnData, error: fnError } = await supabaseClient.functions.invoke("demo-customer-signup", {
        body: { email, password, fullName, phone }
    });
    if (fnError || !fnData?.ok) {
        setBusy(form, false);
        return setAuthStatus(fnData?.error || fnError?.message || "Không tạo được tài khoản.");
    }

    const { data: loginData, error: loginError } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (loginError || !loginData.user) {
        setBusy(form, false);
        return setAuthStatus(loginError?.message || "Tài khoản đã tạo nhưng chưa đăng nhập được.");
    }

    setBusy(form, false);
    setAuthStatus("Đăng ký thành công. Đang chuyển trang...", "success");
    setTimeout(() => window.location.href = "index.html", 700);
}

async function completeSellerApplication(event) {
    event.preventDefault();
    const form = event.target;
    const documentNumber = form.documentNumber.value.trim();
    const front = form.documentFront.files?.[0], back = form.documentBack.files?.[0];
    if (!/^\d{9,12}$/.test(documentNumber)) return setAuthStatus("Số giấy tờ không hợp lệ.");
    if (!front || !back) return setAuthStatus("Vui lòng tải đủ 2 mặt giấy tờ.");
    if (![front, back].every(f => f.type.startsWith("image/") && f.size <= 8 * 1024 * 1024)) return setAuthStatus("Mỗi ảnh phải là ảnh và tối đa 8MB.");

    const { data: authData, error: authError } = await supabaseClient.auth.getUser();
    const user = authData?.user;
    if (authError || !user) {
        return setAuthStatus("Phiên đăng nhập đã hết. Vui lòng đăng nhập lại sau khi xác nhận email.");
    }

    const { data: profile } = await supabaseClient.from("profiles").select("full_name, phone, role").eq("id", user.id).maybeSingle();
    if (!profile) return setAuthStatus("Không tìm thấy hồ sơ tài khoản. Vui lòng đăng nhập lại.");

    const existing = await supabaseClient.from("seller_applications").select("status").eq("user_id", user.id).maybeSingle();
    if (existing.data?.status === "pending") {
        return setAuthStatus("Hồ sơ nhà bán hàng của bạn đã được gửi và đang chờ Admin duyệt.", "success");
    }
    if (existing.data?.status === "approved") {
        return setAuthStatus("Tài khoản đã được Admin duyệt nhà bán hàng.", "success");
    }

    setBusy(form, true);
    try {
        const stamp = Date.now();
        const frontPath = `${user.id}/front-${stamp}.${fileExt(front.name)}`;
        const backPath = `${user.id}/back-${stamp}.${fileExt(back.name)}`;

        const a = await supabaseClient.storage.from(VERIFY_BUCKET).upload(frontPath, front, { upsert: false, contentType: front.type });
        if (a.error) throw a.error;
        const b = await supabaseClient.storage.from(VERIFY_BUCKET).upload(backPath, back, { upsert: false, contentType: back.type });
        if (b.error) throw b.error;

        const result = await supabaseClient.from("seller_applications").insert({
            user_id: user.id,
            full_name: profile.full_name || user.user_metadata?.full_name || "",
            phone: profile.phone || user.user_metadata?.phone || "",
            cccd_number: documentNumber,
            cccd_front_path: frontPath,
            cccd_back_path: backPath,
            status: "pending"
        });
        if (result.error) throw result.error;

        await supabaseClient.auth.signOut();
        setBusy(form, false);
        setAuthStatus("Hồ sơ nhà bán hàng đã gửi thành công. Admin sẽ kiểm tra và duyệt hồ sơ.", "success");
        setTimeout(() => window.location.href = "dang-nhap.html", 1400);
    } catch (e) {
        console.error(e);
        setBusy(form, false);
        return setAuthStatus("Không thể gửi hồ sơ xác minh: " + (e?.message || "Lỗi không xác định."));
    }
}

async function registerSeller(event) {
    event.preventDefault();
    const form = event.target;
    const fullName = form.fullName.value.trim(), phone = form.phone.value.trim(), email = form.email.value.trim();
    const password = form.password.value, confirmPassword = form.confirmPassword.value;
    if (!fullName || !phone || !email) return setAuthStatus("Vui lòng nhập đầy đủ thông tin.");
    if (password.length < 6) return setAuthStatus("Mật khẩu cần ít nhất 6 ký tự.");
    if (password !== confirmPassword) return setAuthStatus("Mật khẩu nhập lại không khớp.");
    setBusy(form, true);

    const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName, phone, account_type: "seller" } }
    });
    if (error || !data.user) {
        setBusy(form, false);
        return setAuthStatus(error?.message || "Không tạo được tài khoản.");
    }

    setBusy(form, false);
    if (!data.session) {
        setAuthStatus("Tài khoản nhà bán hàng đã được tạo. Hãy mở Gmail và xác nhận email, sau đó đăng nhập để hoàn tất hồ sơ CCCD.", "success");
        setTimeout(() => window.location.href = "dang-nhap.html", 1800);
        return;
    }

    window.location.href = "dang-ky-nha-ban-hang.html?complete=1";
}

async function prepareSellerCompletionPage() {
    const params = new URLSearchParams(window.location.search);
    if (params.get("complete") !== "1") return;

    const form = document.querySelector("form");
    if (!form) return;
    const { data } = await supabaseClient.auth.getUser();
    const user = data?.user;
    if (!user) return;

    const accountType = user.user_metadata?.account_type;
    if (accountType !== "seller") return;

    const { data: profile } = await supabaseClient.from("profiles").select("full_name, phone").eq("id", user.id).maybeSingle();
    if (form.fullName) {
        form.fullName.value = profile?.full_name || user.user_metadata?.full_name || "";
        form.fullName.readOnly = true;
    }
    if (form.phone) {
        form.phone.value = profile?.phone || user.user_metadata?.phone || "";
        form.phone.readOnly = true;
    }
    if (form.email) {
        form.email.value = user.email || "";
        form.email.readOnly = true;
    }
    form.password?.closest(".form-grid-2")?.setAttribute("hidden", "hidden");
    form.email?.closest("label")?.setAttribute("hidden", "hidden");

    document.querySelector(".auth-box h1")?.replaceChildren(document.createTextNode("Hoàn tất hồ sơ nhà bán hàng"));
    const intro = document.querySelector(".auth-box > p");
    if (intro) intro.textContent = "Email đã được xác nhận. Bây giờ hãy tải CCCD để gửi hồ sơ cho Admin kiểm tra.";
    const kicker = document.querySelector(".auth-kicker");
    if (kicker) kicker.textContent = "BƯỚC 2 · XÁC MINH NHÀ BÁN HÀNG";
    const submit = form.querySelector("button[type=submit]");
    if (submit) submit.textContent = "Gửi hồ sơ xác minh cho Admin";
    form.onsubmit = completeSellerApplication;
    form.documentNumber?.setAttribute("required", "required");
    form.documentFront?.setAttribute("required", "required");
    form.documentBack?.setAttribute("required", "required");
}

async function loginUser(event) {
    event.preventDefault();
    const form = event.target;
    const email = form.email.value.trim(), password = form.password.value;
    setBusy(form, true);
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error || !data.user) { setBusy(form, false); return setAuthStatus(error?.message || "Đăng nhập thất bại."); }
    const { data: profile } = await supabaseClient.from("profiles").select("full_name, phone, role").eq("id", data.user.id).maybeSingle();
    const { data: application } = await supabaseClient.from("seller_applications").select("status").eq("user_id", data.user.id).maybeSingle();

    if (application?.status === "pending") {
        await supabaseClient.auth.signOut();
        setBusy(form, false);
        return setAuthStatus("Hồ sơ nhà bán hàng đang chờ Admin duyệt. Bạn chưa được phép đăng bán.");
    }
    if (application?.status === "rejected" && profile?.role !== "admin") {
        await supabaseClient.auth.signOut();
        setBusy(form, false);
        return setAuthStatus("Hồ sơ nhà bán hàng chưa được duyệt. Vui lòng liên hệ Admin.");
    }

    const isSellerAccount = data.user.user_metadata?.account_type === "seller";
    setBusy(form, false);

    if (isSellerAccount && !application?.status) {
        window.location.href = "dang-ky-nha-ban-hang.html?complete=1";
        return;
    }
    window.location.href = profile?.role === "admin" ? "admin.html" : "index.html";
}

window.logoutUser = async function () {
    try { await supabaseClient.auth.signOut(); }
    finally { window.location.href = "index.html"; }
};

document.addEventListener("DOMContentLoaded", () => {
    if (typeof supabaseClient !== "undefined") prepareSellerCompletionPage();
});
