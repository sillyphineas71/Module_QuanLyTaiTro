using ApiQuanLyTaiTro.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Models;

namespace ApiQuanLyTaiTro.Controllers
{
    /// <summary>
    /// Chương trình tài trợ — ĐỌC CÔNG KHAI, không cần đăng nhập (P2a).
    /// <para>
    /// 🔴 <c>[AllowAnonymous]</c> Ở CẤP CLASS LÀ BẮT BUỘC, không phải trang trí. <c>BaseController</c> mang
    /// <c>[Authorize]</c>; controller con KẾ THỪA nó. "Không bọc [Authorize]" mà không có dòng này thì cả
    /// bốn endpoint trả 401 cho khách. Đừng gỡ nó khi thêm endpoint ghi vào đây — đặt endpoint cần đăng
    /// nhập ở CONTROLLER KHÁC, để không ai phải nhớ gắn <c>[Authorize]</c> ngược lại từng action.
    /// </para>
    /// <para>⚠️ Controller KHÔNG chứa logic: ghép SP, kiểm tồn tại đều ở <c>TaiTroService</c>.</para>
    /// </summary>
    [Route("api/tai-tro")]
    [ApiController]
    [AllowAnonymous]
    public class TaiTroController : BaseController
    {
        public TaiTroController(IServiceWrapper serviceWrapper) : base(serviceWrapper)
        { }

        /// <summary>Danh sách chương trình công khai, kèm tổng dự kiến chi / tổng đã quyên / số lượt tài trợ.</summary>
        [HttpGet("chuong-trinh")]
        public async Task<IActionResult> GetDanhSachChuongTrinh()
        {
            var response = await _serviceWrapper.TaiTro.GetDanhSachChuongTrinh();
            return KetQua(response);
        }

        /// <summary>
        /// Chi tiết một chương trình: thông tin + dự kiến chi + nhà tài trợ + khoản chi (một lượt gọi).
        /// <para>⚠️ Không tồn tại · đã xoá · còn nháp ⇒ 404, GIỐNG HỆT NHAU.</para>
        /// </summary>
        [HttpGet("chuong-trinh/{id:int}")]
        public async Task<IActionResult> GetChiTietChuongTrinh(int id)
        {
            var response = await _serviceWrapper.TaiTro.GetChiTietChuongTrinh(id);
            return KetQua(response);
        }

        /// <summary>Nhà tài trợ đã duyệt. Chương trình không tồn tại / nháp ⇒ 404; công khai mà chưa ai tài trợ ⇒ 200 [].</summary>
        [HttpGet("chuong-trinh/{id:int}/nha-tai-tro")]
        public async Task<IActionResult> GetNhaTaiTroTheoChuongTrinh(int id)
        {
            var response = await _serviceWrapper.TaiTro.GetNhaTaiTroTheoChuongTrinh(id);
            return KetQua(response);
        }

        /// <summary>Khoản đã chi + minh chứng. Chương trình không tồn tại / nháp ⇒ 404; chưa chi khoản nào ⇒ 200 [].</summary>
        [HttpGet("chuong-trinh/{id:int}/khoan-chi")]
        public async Task<IActionResult> GetKhoanChiTheoChuongTrinh(int id)
        {
            var response = await _serviceWrapper.TaiTro.GetKhoanChiTheoChuongTrinh(id);
            return KetQua(response);
        }

        /// <summary>
        /// <c>DATA_NULL</c> ⇒ HTTP 404; còn lại giữ nguyên <c>ToActionResult()</c> (SUCCESS ⇒ 200, lỗi khác ⇒ 400).
        /// <para>
        /// ⚠️ Không sửa <c>ResponseBase.ToActionResult()</c>: đổi ở đó là đổi mã HTTP của MỌI endpoint sau này
        ///    trả DATA_NULL — quyết định hợp đồng API chung, không thuộc lô này. Body 404 vẫn là response chuẩn
        ///    <c>{ is_success, code, message, data }</c>.
        /// </para>
        /// </summary>
        private static IActionResult KetQua(Response response)
            => response.code == ResponseCode.DATA_NULL
                ? new NotFoundObjectResult(response)
                : response.ToActionResult();
    }
}
