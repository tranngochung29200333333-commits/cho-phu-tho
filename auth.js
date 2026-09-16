// ========================================
// ĐĂNG KÝ TÀI KHOẢN - SUPABASE AUTH
// ========================================

async function registerUser() {

    const fullname = document.getElementById("fullname").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const accountType = document.getElementById("accountType").value;

    // Kiểm tra dữ liệu
    if (!fullname || !phone || !email || !password) {
        alert("Vui lòng nhập đầy đủ thông tin.");
        return;
    }

    if (password.length < 6) {
        alert("Mật khẩu phải có ít nhất 6 ký tự.");
        return;
    }

    try {

        // Đăng ký tài khoản Supabase
        const { data, error } = await supabaseClient.auth.signUp({
            email: email,
            password: password,

            options: {
                data: {
                    full_name: fullname,
                    phone: phone,
                    role: accountType
                }
            }
        });

        if (error) {
            throw error;
        }

        // Supabase đã tạo tài khoản
        if (data.user) {

            // Trường hợp yêu cầu xác nhận email
            if (!data.session) {

                alert(
                    "Đăng ký thành công!\n\n" +
                    "Một email xác nhận đã được gửi tới:\n" +
                    email +
                    "\n\n" +
                    "Hãy mở email và bấm vào liên kết xác nhận."
                );

                window.location.href = "dang-nhap.html";

                return;
            }

            // Trường hợp đăng nhập ngay
            alert("Đăng ký thành công!");

            window.location.href = "index.html";
        }

    } catch (error) {

        console.error("Lỗi đăng ký:", error);

        alert("Đăng ký thất bại: " + error.message);
    }
}
// ========================================
// ĐĂNG NHẬP TÀI KHOẢN - SUPABASE AUTH
// ========================================

async function loginUser() {

    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;

    if (!email || !password) {
        alert("Vui lòng nhập email và mật khẩu.");
        return;
    }

    try {

        const { data, error } =
            await supabaseClient.auth.signInWithPassword({
                email: email,
                password: password
            });

        if (error) {
            throw error;
        }

        if (!data.user) {
            throw new Error("Không tìm thấy tài khoản.");
        }

        alert("Đăng nhập thành công!");

        window.location.href = "index.html";

    } catch (error) {

        console.error("Lỗi đăng nhập:", error);

        alert("Đăng nhập thất bại: " + error.message);
    }
}