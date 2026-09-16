window.postSim = async function () {
    const title = document.getElementById("title")?.value.trim();
    const priceValue = document.getElementById("price")?.value;
    const category = document.getElementById("category")?.value || "Khác";
    const subcategory = document.getElementById("subcategory")?.value || "";
    const area = document.getElementById("location")?.value || "";
    const description = document.getElementById("description")?.value.trim() || "";
    const phone = document.getElementById("contactPhone")?.value.trim() || "";
    const zalo = document.getElementById("contactZalo")?.value.trim() || "";
    const lat = localStorage.getItem("choPhuThoLat") ? Number(localStorage.getItem("choPhuThoLat")) : null;
    const lng = localStorage.getItem("choPhuThoLng") ? Number(localStorage.getItem("choPhuThoLng")) : null;
    const files = document.getElementById("listingImages")?.files;
    if (!title || !category || !area) return alert("Vui lòng nhập đầy đủ thông tin bắt buộc.");
    const { user, profile } = await getCurrentUserAndProfile();
    if (!user) { alert("Bạn cần đăng nhập trước khi đăng tin."); window.location.href = "dang-nhap.html"; return; }
    if (!profile || !["seller", "admin"].includes(profile.role)) { alert("Tài khoản chưa được Admin cấp quyền nhà bán hàng."); return; }
    if (files?.length > 8) return alert("Bạn chỉ có thể đăng tối đa 8 ảnh.");
    const button = document.querySelector("[onclick=\"postSim()\"]"); if (button) button.disabled = true;
    const { data: listing, error } = await supabaseClient.from("listings").insert({ seller_id:user.id, sim_number:"", title, price:priceValue?Number(priceValue):0, network:category, category, subcategory, location:area, contact_phone:phone, contact_zalo:zalo, latitude:lat, longitude:lng, description, status:"pending" }).select().single();
    if (error) { if(button)button.disabled=false; alert("Đăng tin thất bại: "+error.message); return; }
    try {
        if (files?.length && typeof window.loadImages === "function") {
            for (let i=0;i<Math.min(files.length,8);i++) {
                const file=files[i]; if(!file.type.startsWith("image/")) continue; if(file.size>8*1024*1024) throw new Error("Mỗi ảnh tối đa 8MB.");
                const safe=file.name.replace(/[^a-zA-Z0-9._-]/g,"-"); const path=`${user.id}/${listing.id}/${Date.now()}-${i}-${safe}`;
                const up=await supabaseClient.storage.from("listing-images").upload(path,file,{upsert:false,contentType:file.type}); if(up.error) throw up.error;
                const pub=supabaseClient.storage.from("listing-images").getPublicUrl(path); const ins=await supabaseClient.from("listing_images").insert({listing_id:listing.id,image_url:pub.data.publicUrl,sort_order:i}); if(ins.error) throw ins.error;
            }
        }
    } catch(e){ console.error(e); if(button)button.disabled=false; alert("Tin đã tạo nhưng có ảnh chưa tải lên được: "+e.message); window.location.href="quan-ly-tin.html"; return; }
    if(button)button.disabled=false; alert("Đăng tin thành công! Tin đang chờ Admin duyệt."); window.location.href="quan-ly-tin.html";
};
