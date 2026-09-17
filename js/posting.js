// Chợ Phú Thọ - luồng đăng tin nhà bán hàng
(function () {
    function getNumber(value) { const n=Number(value); return value!==null && value!=='' && Number.isFinite(n) ? n : null; }
    async function getPostingUser(){if(typeof supabaseClient==="undefined")throw new Error("Hệ thống kết nối Supabase chưa sẵn sàng.");const {data,error}=await supabaseClient.auth.getUser();if(error)throw error;if(!data?.user)return{user:null,profile:null};const {data:profile,error:profileError}=await supabaseClient.from("profiles").select("full_name,phone,role").eq("id",data.user.id).maybeSingle();if(profileError)throw profileError;return{user:data.user,profile:profile||null};}
    async function uploadListingImages(files,listingId,userId){if(!files?.length)return;const count=Math.min(files.length,8);for(let i=0;i<count;i+=1){const file=files[i];if(!file.type.startsWith("image/"))throw new Error(`Ảnh thứ ${i+1} không đúng định dạng.`);if(file.size>8*1024*1024)throw new Error(`Ảnh thứ ${i+1} vượt quá 8MB.`);const safeName=file.name.replace(/[^a-zA-Z0-9._-]/g,"-");const path=`${userId}/${listingId}/${Date.now()}-${i}-${safeName}`;const upload=await supabaseClient.storage.from("listing-images").upload(path,file,{upsert:false,contentType:file.type});if(upload.error)throw upload.error;const publicUrl=supabaseClient.storage.from("listing-images").getPublicUrl(path).data.publicUrl;const imageInsert=await supabaseClient.from("listing_images").insert({listing_id:listingId,image_url:publicUrl,sort_order:i});if(imageInsert.error)throw imageInsert.error;}}
    async function submitListing(){const button=document.getElementById("submitListingButton");if(button?.disabled)return;let listingId=null;try{const title=document.getElementById("title")?.value.trim()||"",category=document.getElementById("category")?.value||"",subcategory=document.getElementById("subcategory")?.value||"",priceValue=document.getElementById("price")?.value||"",area=document.getElementById("location")?.value||"",phone=document.getElementById("contactPhone")?.value.trim()||"",zalo=document.getElementById("contactZalo")?.value.trim()||"",description=document.getElementById("description")?.value.trim()||"",files=document.getElementById("listingImages")?.files||[];if(!title)throw new Error("Vui lòng nhập tiêu đề tin.");if(!category)throw new Error("Vui lòng chọn danh mục.");if(!area)throw new Error("Vui lòng chọn khu vực.");if(files.length>8)throw new Error("Bạn chỉ có thể đăng tối đa 8 ảnh.");const {user,profile}=await getPostingUser();if(!user){alert("Bạn cần đăng nhập trước khi đăng tin.");window.location.href="dang-nhap.html?next=dang-tin.html";return;}if(!profile||!["seller","admin"].includes(profile.role)){alert("Tài khoản chưa được cấp quyền nhà bán hàng.");return;}if(button){button.disabled=true;button.textContent="Đang đăng...";}const lat=getNumber(localStorage.getItem("choPhuThoLat")),lng=getNumber(localStorage.getItem("choPhuThoLng"));const payload={seller_id:user.id,sim_number:"",title,price:priceValue?Number(priceValue):0,network:category,category,subcategory,location:area,contact_phone:phone||profile.phone||"",contact_zalo:zalo,latitude:lat,longitude:lng,description,status:"pending"};const result=await supabaseClient.from("listings").insert(payload).select("id").single();if(result.error)throw result.error;listingId=result.data.id;try{await uploadListingImages(files,listingId,user.id);}catch(imageError){console.error("Listing image upload error",imageError);alert("Tin đã được tạo nhưng có ảnh chưa tải lên được: "+imageError.message);}alert("Đăng tin thành công! Tin đang chờ Admin duyệt.");window.location.href="quan-ly-tin.html";}catch(error){console.error("Posting error",error);alert("Không thể đăng tin: "+(error?.message||"Lỗi không xác định."));}finally{if(button){button.disabled=false;button.textContent="Đăng tin";}}}
    window.postSim=submitListing;
    document.addEventListener("DOMContentLoaded",()=>{const button=document.getElementById("submitListingButton");if(button)button.addEventListener("click",submitListing);const files=document.getElementById("listingImages"),preview=document.getElementById("imagePreview");files?.addEventListener("change",()=>{if(!preview)return;preview.innerHTML="";[...files.files].slice(0,8).forEach(file=>{const url=URL.createObjectURL(file),image=document.createElement("img");image.src=url;image.alt=file.name;image.onload=()=>URL.revokeObjectURL(url);preview.appendChild(image);});});});
})();

// Danh mục đầy đủ theo cấu trúc Chợ Phú Thọ.
(function(){
  const TAXONOMY={
    'Bất động sản':['Căn hộ/Chung cư','Nhà ở','Đất','Văn phòng, Mặt bằng kinh doanh','Phòng trọ'],
    'Xe cộ':['Ô tô','Xe máy','Xe tải, Xe ben','Xe đạp','Phương tiện khác','Phụ tùng xe'],
    'Điện tử':['Điện thoại','Máy tính bảng','Laptop','Máy tính để bàn','Máy ảnh, Máy quay','Tivi, Âm thanh','Phụ kiện','Linh kiện','Thiết bị đeo thông minh'],
    'Việc làm':['Tuyển dụng'],
    'Thú cưng':['Gà','Chó','Chim','Mèo','Thú cưng khác','Phụ kiện, Thức ăn, Dịch vụ'],
    'Điện lạnh':['Tủ lạnh','Máy lạnh, điều hoà','Máy giặt'],
    'Đồ gia dụng':['Bếp, lò, đồ điện nhà bếp','Dụng cụ nhà bếp','Giường, chăn ga gối nệm','Thiết bị vệ sinh, nhà tắm','Quạt','Đèn','Bàn ghế','Tủ, kệ gia đình','Cây cảnh, đồ trang trí','Nội thất, đồ gia dụng khác'],
    'Mẹ và bé':['Mẹ và bé'],
    'Thời trang':['Quần áo','Đồng hồ','Giày dép','Túi xách','Nước hoa','Phụ kiện thời trang khác'],
    'Giải trí':['Nhạc cụ','Sách','Đồ thể thao, Dã ngoại','Đồ sưu tầm, đồ cổ','Thiết bị chơi game','Sở thích khác'],
    'Văn phòng':['Đồ dùng văn phòng'],
    'Đồ chuyên dụng':['Đồ chuyên dụng, Giống nuôi trồng'],
    'Dịch vụ':['Dịch vụ','Du lịch','Dịch vụ dọn dẹp nhà','Dịch vụ chuyển nhà','Dịch vụ sửa chữa & bảo dưỡng điện máy','Dịch vụ nhà cửa khác'],
    'Khác':['Các loại khác']
  };
  function sync(){
    const cat=document.getElementById('category'),sub=document.getElementById('subcategory');
    if(!cat||!sub)return;
    const current=cat.value;
    cat.innerHTML='<option value="">-- Chọn danh mục --</option>'+Object.keys(TAXONOMY).map(x=>`<option value="${x}">${x}</option>`).join('');
    if(current&&TAXONOMY[current])cat.value=current;
    const selected=cat.value, old=sub.value;
    sub.innerHTML='<option value="">-- Chọn danh mục con --</option>'+(TAXONOMY[selected]||[]).map(x=>`<option value="${x}">${x}</option>`).join('');
    if(old&&(TAXONOMY[selected]||[]).includes(old))sub.value=old;
    cat.onchange=()=>{const values=TAXONOMY[cat.value]||[];sub.innerHTML='<option value="">-- Chọn danh mục con --</option>'+values.map(x=>`<option value="${x}">${x}</option>`).join('');};
  }
  document.addEventListener('DOMContentLoaded',sync);
})();