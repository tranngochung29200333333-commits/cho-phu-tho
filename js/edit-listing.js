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
    const cat=document.getElementById('editNetwork'),sub=document.getElementById('editSubcategory');
    if(!cat||!sub)return;
    const current=cat.value,oldSub=sub.value;
    cat.innerHTML=Object.keys(TAXONOMY).map(x=>`<option value="${x}">${x}</option>`).join('');
    if(current&&TAXONOMY[current])cat.value=current;
    const fill=()=>{const values=TAXONOMY[cat.value]||[];sub.innerHTML='<option value="">-- Không chọn --</option>'+values.map(x=>`<option value="${x}">${x}</option>`).join('');if(oldSub&&values.includes(oldSub))sub.value=oldSub;};
    fill();cat.onchange=fill;
  }
  document.addEventListener('DOMContentLoaded',sync);
})();