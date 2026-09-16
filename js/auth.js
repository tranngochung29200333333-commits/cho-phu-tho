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
function fileExt(name) { return (String(name || "jpg").split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg"; }
async function registerSeller(event) {
    event.preventDefault();
    const form = event.target;
    const fullName = form.fullName.value.trim(), phone = form.phone.value.trim(), email = form.email.value.trim();
    const password = form.password.value, confirmPassword = form.confirmPassword.value;
    const documentNumber = form.documentNumber.value.trim();
    const front = form.documentFront.files?.[0], back = form.documentBack.files?.[0];
    if (!fullName || !phone || !email || !documentNumber) return setAuthStatus("Vui lòng nhập đầy đủ thông tin.");
    if (!/^\d{9,12}$/.test(documentNumber)) return setAuthStatus("Số giấy tờ không hợp lệ.");
    if (!front || !back) return setAuthStatus("Vui lòng tải đủ 2 mặt giấy tờ.");
    if (![front, back].every(f => f.type.startsWith("image/") && f.size <= 8 * 1024 * 1024)) return setAuthStatus("Mỗi ảnh phải là ảnh và tối đa 8MB.");
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

    // Không tự INSERT profiles ở đây. Supabase đã có trigger on_auth_user_created
    // tạo profile khi tài khoản được tạo. Policy profiles chỉ cho phép user tự tạo
    // profile với role=customer, nên INSERT seller/customer lần nữa sẽ gây lỗi RLS.
    if (!data.session) {
        setBusy(form, false);
        return setAuthStatus("Tài khoản đã tạo. Hãy xác nhận email Gmail trước, sau đó đăng nhập lại để hoàn tất hồ sơ nhà bán hàng.", "success");
    }

    try {
        const stamp = Date.now();
        const frontPath = `${data.user.id}/front-${stamp}.${fileExt(front.name)}`;
        const backPath = `${data.user.id}/back-${stamp}.${fileExt(back.name)}`;
        const a = await supabaseClient.storage.from(VERIFY_BUCKET).upload(frontPath, front, { upsert: false, contentType: front.type });
        if (a.error) throw a.error;
        const b = await supabaseClient.storage.from(VERIFY_BUCKET).upload(backPath, back, { upsert: false, contentType: back.type });
        if (b.error) throw b.error;
        const result = await supabaseClient.from("seller_applications").insert({
            user_id: data.user.id,
            full_name: fullName,
            phone,
            cccd_number: documentNumber,
            cccd_front_path: frontPath,
            cccd_back_path: backPath,
            status: "pending"
        });
        if (result.error) throw result.error;
        await supabaseClient.auth.signOut();
        setBusy(form, false);
        setAuthStatus("Hồ sơ nhà bán hàng đã gửi. Admin sẽ kiểm tra và cấp quyền sau khi duyệt.", "success");
        setTimeout(() => window.location.href = "dang-nhap.html", 1200);
    } catch (e) {
        console.error(e);
        setBusy(form, false);
        setAuthStatus("Tài khoản đã tạo nhưng hồ sơ xác minh chưa hoàn tất. Vui lòng đăng nhập lại sau khi xác nhận email và tiếp tục hồ sơ.");
    }
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
    if (application?.status === "pending") { await supabaseClient.auth.signOut(); setBusy(form, false); return setAuthStatus("Hồ sơ nhà bán hàng đang chờ Admin duyệt. Tài khoản bán hàng chưa được phép đăng nhập."); }
    if (application?.status === "rejected" && profile?.role !== "admin") { await supabaseClient.auth.signOut(); setBusy(form, false); return setAuthStatus("Hồ sơ nhà bán hàng chưa được duyệt. Vui lòng liên hệ Admin."); }
    setBusy(form, false);
    window.location.href = profile?.role === "admin" ? "admin.html" : "index.html";
}
window.logoutUser = async function () { await supabaseClient.auth.signOut(); window.location.href = "index.html"; };
