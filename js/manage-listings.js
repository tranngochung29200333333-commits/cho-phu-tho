const STATUS_LABELS = {
  pending: "Chờ Admin duyệt",
  approved: "Đã duyệt",
  hidden: "Đã ẩn"
};

function mlEscape(value) {
  return String(value ?? "").replace(/[&<>\"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#039;"
  }[c]));
}
function mlPrice(value) { const n=Number(value); return Number.isFinite(n)&&n>0?`${n.toLocaleString("vi-VN")} đ`:"Thỏa thuận"; }
function mlDate(value) { if(!value)return ""; const d=new Date(value); return Number.isNaN(d.getTime())?"":d.toLocaleString("vi-VN"); }
function mlStatus(status) { return STATUS_LABELS[status] || "Chờ duyệt"; }
async function getManageUser(){const {data,error}=await supabaseClient.auth.getUser();if(error||!data?.user)return null;return data.user;}
async function deleteOwnListing(id){if(!confirm("Bạn chắc chắn muốn xóa tin này?"))return;const user=await getManageUser();if(!user)return;const {error}=await supabaseClient.from("listings").delete().eq("id",id).eq("seller_id",user.id);if(error){alert("Xóa tin thất bại: "+error.message);return;}await loadMyListings();}
function renderMyListings(list){
  const box=document.getElementById("myProducts");if(!box)return;
  if(!list.length){box.innerHTML='<div class="empty-state"><div class="empty-icon">📣</div><h3>Bạn chưa có tin đăng</h3><p>Tin sau khi đăng sẽ xuất hiện tại đây với trạng thái chờ duyệt.</p><a class="btn-post" href="dang-tin.html">+ Đăng tin ngay</a></div>';return;}
  box.innerHTML=list.map(item=>{const status=mlEscape(item.status||"pending"),approved=item.status==="approved";return `<article class="my-product"><div class="listing-status status-${status}">${mlStatus(item.status)}</div><div class="listing-category">${mlEscape(item.category||item.network||"Khác")}${item.subcategory?` · ${mlEscape(item.subcategory)}`:""}</div><h3>${mlEscape(item.title||"Tin chưa có tiêu đề")}</h3><p class="price">${mlPrice(item.price)}</p><p>📍 ${mlEscape(item.location||"Phú Thọ")}</p><p class="muted">Đăng lúc: ${mlDate(item.created_at)}</p><p class="muted">${mlEscape(item.description||"Chưa có mô tả")}</p>${item.status==="pending"?'<p class="muted"><strong>⏳ Tin đang chờ Admin kiểm tra.</strong></p>':""}${item.status==="hidden"?'<p class="muted"><strong>🙈 Tin đang bị ẩn.</strong></p>':""}<div class="product-actions">${approved?`<a class="btn-view" href="chi-tiet.html?id=${encodeURIComponent(item.id)}">Xem</a>`:""}<a class="btn-edit" href="sua-tin-moi.html?id=${encodeURIComponent(item.id)}">Sửa</a><button class="btn-delete" type="button" data-delete-id="${mlEscape(item.id)}">Xóa</button></div></article>`;}).join("");
  box.querySelectorAll("[data-delete-id]").forEach(button=>button.addEventListener("click",()=>deleteOwnListing(button.dataset.deleteId)));
}
async function loadMyListings(){
  const box=document.getElementById("myProducts");if(!box)return;box.innerHTML='<div class="loading">Đang tải tin của bạn...</div>';
  const user=await getManageUser();if(!user){box.innerHTML='<div class="empty-state"><h3>Bạn chưa đăng nhập</h3><a class="btn-post" href="dang-nhap.html">Đăng nhập</a></div>';return;}
  const {data,error}=await supabaseClient.from("listings").select("id,title,price,category,subcategory,network,location,description,status,created_at,seller_id").eq("seller_id",user.id).order("created_at",{ascending:false});
  if(error){console.error(error);box.innerHTML=`<div class="empty-state"><h3>Không tải được danh sách tin</h3><p>${mlEscape(error.message)}</p><button class="btn-post" type="button" id="retryListings">Thử lại</button></div>`;document.getElementById("retryListings")?.addEventListener("click",loadMyListings);return;}
  renderMyListings(data||[]);
}
document.addEventListener("DOMContentLoaded",async()=>{if(typeof supabaseClient==="undefined")return;await loadMyListings();});
window.loadMyListings=loadMyListings;