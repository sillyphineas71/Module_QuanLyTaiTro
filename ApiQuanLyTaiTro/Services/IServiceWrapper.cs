using ApiQuanLyTaiTro.Services.Email;

namespace ApiQuanLyTaiTro.Services
{
    /// <summary>
    /// Wrapper gom toàn bộ Service NGHIỆP VỤ của cổng Tài trợ.
    /// Controller/Service chỉ inject cái này, không inject từng service lẻ.
    /// </summary>
    /// <remarks>
    /// 🔴 CHỈ CÒN HẠ TẦNG — repo mới dựng khung (P1), chưa có nghiệp vụ nào. Toàn bộ service
    /// của cổng Cựu sinh viên đã được gỡ khi clone; cổng này có nghiệp vụ riêng trên bảng TT_*.
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
    }
}
