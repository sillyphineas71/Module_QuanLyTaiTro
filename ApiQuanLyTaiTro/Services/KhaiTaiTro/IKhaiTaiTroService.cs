using Microsoft.AspNetCore.Http;
using Models;
using Models.Request.TaiTro;

namespace ApiQuanLyTaiTro.Services.KhaiTaiTro
{
    /// <summary>Nhận lời khai tài trợ từ trang CÔNG KHAI (P3a). Không cần đăng nhập.</summary>
    public interface IKhaiTaiTroService
    {
        /// <summary>
        /// Kiểm dữ liệu khai + ảnh, lưu ảnh, ghi lời khai CHỜ DUYỆT.
        /// <para>Mã trả: SUCCESS · INPUTDATA_ERROR (dữ liệu/ảnh sai, câu tiếng Việt) · DATA_NULL (chương trình không
        /// nhận khai — không tồn tại / nháp / đã kết thúc, CÙNG một câu) · SYSTEM_ERROR.</para>
        /// </summary>
        Task<Response> KhaiTaiTro(int idChuongTrinh, KhaiTaiTroRequest request, IReadOnlyList<IFormFile>? anh);
    }
}
