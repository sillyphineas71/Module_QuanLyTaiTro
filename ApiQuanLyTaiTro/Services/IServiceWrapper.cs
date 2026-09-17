using ApiQuanLyTaiTro.Services.Email;
using ApiQuanLyTaiTro.Services.KhaiTaiTro;
using ApiQuanLyTaiTro.Services.TaiTro;

namespace ApiQuanLyTaiTro.Services
{
    /// <summary>
    /// Wrapper gom toàn bộ Service NGHIỆP VỤ của cổng Tài trợ.
    /// Controller/Service chỉ inject cái này, không inject từng service lẻ.
    /// </summary>
    /// <remarks>
    /// 🔄 Trước P2a: CHỈ CÒN HẠ TẦNG (repo mới dựng khung). Toàn bộ service của cổng Cựu sinh viên đã
    /// được gỡ khi clone; cổng này có nghiệp vụ riêng trên bảng TT_*. Từ P2a có service nghiệp vụ đầu
    /// tiên: <c>TaiTro</c> (đọc công khai).
    ///
    /// `Email` được GIỮ LẠI vì nó là hạ tầng (SMTP), không phải nghiệp vụ — cổng nào cũng cần gửi
    /// mail, và nó không đụng bảng nào.
    ///
    /// THÊM MỘT SERVICE MỚI = ĐÚNG HAI CHỖ: khai property ở đây + lazy `??=` bên ServiceWrapper.cs.
    /// </remarks>
    public interface IServiceWrapper
    {
        IHttpContextAccessor HttpContextAccessor { get; }

        IEmailService Email { get; }

        /// <summary>Đọc công khai: danh sách + chi tiết chương trình (P2a).</summary>
        ITaiTroService TaiTro { get; }

        /// <summary>Nhận lời khai tài trợ công khai (P3a).</summary>
        IKhaiTaiTroService KhaiTaiTro { get; }
    }
}
