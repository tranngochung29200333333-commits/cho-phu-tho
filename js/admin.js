let currentAdmin = null;
async function requireAdmin() {
    const { data } = await supabaseClient.auth.getUser();
    if (!data.user) { location.href = "dang-nhap.html"; return null; }
    const { data: profile } = await supabaseClient.from("profiles").select("id,full_name,phone,role").eq("id", data.user.id).maybeSingle();
    if (profile?.role !== "admin") { alert("Bạn không có quyền quản trị."); location.href = "index.html"; return null; }
    currentAdmin = profile;
    document.getElementById("adminName")?.replaceChildren(document.createTextNode(profile.full_name || "Admin"));
    return profile;
}
function adminPrice(v){ const n=Number(v); return n>0?n.toLocaleString("vi-VN")+" đ":"Thỏa thuận"; }
function adminHtml(v){ return String(v??"").replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#039;","\"":"&quot;"}[c])); }
async function loadStats(){
 const [{count:users},{count:listings},{count:pending},{count:reports}]=await Promise.all([
  supabaseClient.from("profiles").select("id",{count:"exact",head:true}),
  supabaseClient.from("listings").select("id",{count:"exact",head:true}),
  supabaseClient.from("listings").select("id",{count:"exact",head:true}).eq("status","pending"),
  supabaseClient.from("listing_reports").select("id",{count:"exact",head:true}).eq("status","new")
 ]);
 ["statUsers","statListings","statPending","statReports"].forEach((id,i)=>document.getElementById(id).textContent=[users,listings,pending,reports][i]??0);
}
async function loadApplications(){
 const box=document.getElementById("sellerApplications");
 const {data,error}=await supabaseClient.from("seller_applications").select("*").order("created_at",{ascending:false});
 if(error){box.innerHTML=`<div class="empty-state">${adminHtml(error.message)}</div>`;return;}
 if(!data?.length){box.innerHTML='<div class="empty-state">Chưa có hồ sơ nhà bán hàng.</div>';return;}
 box.innerHTML=data.map(a=>`<article class="admin-listing"><div class="admin-row"><div><span class="listing-status status-${adminHtml(a.status)}">${a.status==='approved'?'Đã duyệt':a.status==='rejected'?'Từ chối':'Chờ duyệt'}</span><h3>${adminHtml(a.full_name)}</h3><p>☎ ${adminHtml(a.phone)} · Số giấy tờ: ${adminHtml(a.cccd_number||'—')}</p><p class="muted">${new Date(a.created_at).toLocaleString('vi-VN')}</p></div><div class="admin-actions"><button onclick="viewKyc('${a.id}')">👁 Xem hồ sơ</button>${a.status==='pending'?`<button onclick="approveSeller('${a.id}','${a.user_id}')">✅ Duyệt bán hàng</button><button onclick="rejectSeller('${a.id}')">✕ Từ chối</button>`:''}</div></div><div id="kyc-${a.id}" class="kyc-preview" hidden></div></article>`).join('');
}
async function viewKyc(applicationId){
 const {data:a,error}=await supabaseClient.from("seller_applications").select("cccd_front_path,cccd_back_path").eq("id",applicationId).single();
 if(error)return alert(error.message);
 const front=await supabaseClient.storage.from("seller-kyc").createSignedUrl(a.cccd_front_path,900);
 const back=await supabaseClient.storage.from("seller-kyc").createSignedUrl(a.cccd_back_path,900);
 if(front.error||back.error)return alert("Không tạo được liên kết xem hồ sơ.");
 const box=document.getElementById(`kyc-${applicationId}`); box.hidden=false; box.innerHTML=`<p class="muted">Liên kết xem hồ sơ có hiệu lực 15 phút.</p><div class="kyc-grid"><img src="${adminHtml(front.data.signedUrl)}" alt="Hồ sơ mặt trước"><img src="${adminHtml(back.data.signedUrl)}" alt="Hồ sơ mặt sau"></div>`;
}
async function approveSeller(applicationId,userId){
 if(!confirm("Duyệt tài khoản này thành nhà bán hàng?"))return;
 const a=await supabaseClient.from("seller_applications").update({status:"approved",reviewed_by:currentAdmin.id,reviewed_at:new Date().toISOString()}).eq("id",applicationId);
 if(a.error)return alert(a.error.message);
 const p=await supabaseClient.from("profiles").update({role:"seller"}).eq("id",userId);
 if(p.error)return alert(p.error.message);
 alert("Đã cấp quyền nhà bán hàng."); await loadApplications(); await loadStats();
}
async function rejectSeller(applicationId){
 const note=prompt("Ghi chú lý do từ chối (không bắt buộc):","");
 const {error}=await supabaseClient.from("seller_applications").update({status:"rejected",note:note||"",reviewed_by:currentAdmin.id,reviewed_at:new Date().toISOString()}).eq("id",applicationId);
 if(error)return alert(error.message); alert("Đã từ chối hồ sơ."); loadApplications();
}
async function loadListings(){
 const box=document.getElementById("adminListings"); const status=document.getElementById("listingStatus").value;
 let q=supabaseClient.from("listings").select("id,title,price,category,subcategory,location,description,status,created_at,seller_id").order("created_at",{ascending:false}).limit(100);
 if(status)q=q.eq("status",status);
 const {data,error}=await q;
 if(error){box.innerHTML=`<div class="empty-state">${adminHtml(error.message)}</div>`;return;}
 box.innerHTML=(data||[]).map(x=>`<article class="admin-listing"><span class="listing-status status-${adminHtml(x.status)}">${adminHtml(x.status)}</span><h3>${adminHtml(x.title)}</h3><p><b>${adminPrice(x.price)}</b> · ${adminHtml(x.category||"Khác")}${x.subcategory?` · ${adminHtml(x.subcategory)}`:""}</p><p>📍 ${adminHtml(x.location||"")}</p><p class="muted">${adminHtml(x.description||"")}</p><div class="admin-actions"><a class="outline-button" href="chi-tiet.html?id=${encodeURIComponent(x.id)}" target="_blank">Xem</a>${x.status!=='approved'?`<button onclick="setListingStatus('${x.id}','approved')">✅ Duyệt</button>`:''}${x.status!=='hidden'?`<button onclick="setListingStatus('${x.id}','hidden')">🙈 Ẩn</button>`:''}<button onclick="deleteAdminListing('${x.id}')">🗑 Xóa</button></div></article>`).join("")||'<div class="empty-state">Không có tin.</div>';
}
async function setListingStatus(id,status){const {error}=await supabaseClient.from("listings").update({status}).eq("id",id);if(error)return alert(error.message);loadListings();loadStats();}
async function deleteAdminListing(id){if(!confirm("Xóa vĩnh viễn tin này?"))return;const {error}=await supabaseClient.from("listings").delete().eq("id",id);if(error)return alert(error.message);loadListings();loadStats();}
async function loadUsers(){const box=document.getElementById("adminUsers");const {data,error}=await supabaseClient.from("profiles").select("id,full_name,phone,role,created_at").order("created_at",{ascending:false}).limit(200);if(error){box.innerHTML=adminHtml(error.message);return;}box.innerHTML=(data||[]).map(u=>`<div class="user-row"><div><b>${adminHtml(u.full_name||"Chưa đặt tên")}</b><span>${adminHtml(u.phone||"—")}</span></div><div><span class="listing-status">${adminHtml(u.role)}</span><small>${new Date(u.created_at).toLocaleDateString('vi-VN')}</small></div></div>`).join("")||'<div class="empty-state">Chưa có người dùng.</div>';}
async function loadReports(){const box=document.getElementById("adminReports");const {data,error}=await supabaseClient.from("listing_reports").select("id,listing_id,reason,details,status,created_at").order("created_at",{ascending:false}).limit(100);if(error){box.innerHTML=adminHtml(error.message);return;}box.innerHTML=(data||[]).map(r=>`<article class="admin-listing"><span class="listing-status">${adminHtml(r.status)}</span><p><b>Tin #${r.listing_id}</b> · ${adminHtml(r.reason)}</p><p class="muted">${adminHtml(r.details||"")} · ${new Date(r.created_at).toLocaleString('vi-VN')}</p>${r.status==='new'?`<button onclick="resolveReport('${r.id}','reviewed')">Đánh dấu đã xem</button><button onclick="resolveReport('${r.id}','resolved')">Đã xử lý</button>`:''}</article>`).join("")||'<div class="empty-state">Chưa có báo cáo.</div>';}
async function resolveReport(id,status){const {error}=await supabaseClient.from("listing_reports").update({status}).eq("id",id);if(error)return alert(error.message);loadReports();loadStats();}
async function bootAdmin(){if(!(await requireAdmin()))return;await Promise.all([loadStats(),loadApplications(),loadListings(),loadUsers(),loadReports()]);}
window.viewKyc=viewKyc;window.approveSeller=approveSeller;window.rejectSeller=rejectSeller;window.setListingStatus=setListingStatus;window.deleteAdminListing=deleteAdminListing;window.resolveReport=resolveReport;window.loadListings=loadListings;window.logoutUser=async()=>{await supabaseClient.auth.signOut();location.href='index.html';};
document.addEventListener('DOMContentLoaded',bootAdmin);
