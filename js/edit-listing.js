(function(){
  const qs=new URLSearchParams(window.location.search),id=qs.get('id');
  async function getUser(){const r=await supabaseClient.auth.getUser();return r.data?.user||null;}
  async function load(){
    const form=document.getElementById('editListingForm'),status=document.getElementById('editStatus');
    if(!form)return;
    if(!id){status.textContent='Không tìm thấy mã tin.';return;}
    const user=await getUser();
    if(!user){window.location.href='dang-nhap.html?next='+encodeURIComponent(window.location.href);return;}
    const {data:item,error}=await supabaseClient.from('listings').select('id,seller_id,sim_number,title,price,category,subcategory,network,location,description,contact_phone,contact_zalo,status').eq('id',id).maybeSingle();
    if(error||!item||item.seller_id!==user.id){status.textContent='Bạn không có quyền sửa tin này.';return;}
    document.getElementById('editSimNumber').value=item.sim_number||'';
    document.getElementById('editTitle').value=item.title||'';
    document.getElementById('editPrice').value=Number(item.price||0)||'';
    document.getElementById('editNetwork').value=item.category||item.network||'Khác';
    document.getElementById('editSubcategory').value=item.subcategory||'';
    document.getElementById('editLocation').value=item.location||'Phú Thọ';
    document.getElementById('editContactPhone').value=item.contact_phone||'';
    document.getElementById('editContactZalo').value=item.contact_zalo||'';
    document.getElementById('editDescription').value=item.description||'';
    status.textContent='Trạng thái hiện tại: '+(item.status==='approved'?'Đã duyệt':item.status==='hidden'?'Đã ẩn':'Chờ duyệt');
    form.hidden=false;
  }
  async function save(){
    const user=await getUser();if(!user)return;
    const button=document.getElementById('saveEditButton');
    try{
      const title=document.getElementById('editTitle').value.trim(),category=document.getElementById('editNetwork').value,subcategory=document.getElementById('editSubcategory').value,area=document.getElementById('editLocation').value,description=document.getElementById('editDescription').value.trim(),price=Number(document.getElementById('editPrice').value||0),phone=document.getElementById('editContactPhone').value.trim(),zalo=document.getElementById('editContactZalo').value.trim(),sim=document.getElementById('editSimNumber').value.trim();
      if(!title){alert('Vui lòng nhập tiêu đề tin.');return;}
      if(!category){alert('Vui lòng chọn danh mục.');return;}
      if(!area){alert('Vui lòng chọn khu vực.');return;}
      button.disabled=true;button.textContent='Đang lưu...';
      const {error}=await supabaseClient.from('listings').update({sim_number:sim,title,price,network:category,category,subcategory,location:area,description,contact_phone:phone,contact_zalo:zalo,status:'pending'}).eq('id',id).eq('seller_id',user.id);
      if(error)throw error;
      alert('Đã lưu thay đổi. Tin được chuyển về chờ Admin duyệt lại.');
      window.location.href='quan-ly-tin.html';
    }catch(e){alert('Không thể lưu thay đổi: '+(e?.message||'Lỗi không xác định.'));button.disabled=false;button.textContent='Lưu thay đổi';}
  }
  window.saveEditedProduct=save;
  document.addEventListener('DOMContentLoaded',load);
})();