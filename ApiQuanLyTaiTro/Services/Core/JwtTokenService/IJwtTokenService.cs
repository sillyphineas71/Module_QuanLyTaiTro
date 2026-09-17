using Models.Base;

namespace ApiQuanLyTaiTro.Services
{
    /// <summary>
    /// Interface xác thực, sinh và đọc thông tin người dùng từ JWT token.
    /// </summary>
    public interface IJwtTokenService
    {
        /// <summary>Lấy UserName từ JWT trong HttpContext.</summary>
        string GetUserName(HttpContext httpContext);

        /// <summary>Lấy UserID từ JWT trong HttpContext.</summary>
        string GetUserID(HttpContext httpContext);

        /// <summary>Lấy địa chỉ IP của client.</summary>
        string GetIP(HttpContext httpContext);

        /// <summary>Lấy raw Bearer token từ Authorization header.</summary>
        string GetUserToken(HttpContext httpContext);

        /// <summary>
        /// Set thông tin người tạo/sửa vào ModifyInfo từ JWT claims.
        /// </summary>
        void SetModifyInfo(HttpContext httpContext, ModifyInfo info);

        // 🔴 ĐÃ GỠ overload `GenerateToken(CSV_TaiKhoan)` khi clone sang cổng Tài trợ: nó nhận
        //    đúng bảng tài khoản của cổng Cựu sinh viên. Cổng này có bảng TT_TaiKhoan riêng và
        //    luồng đăng nhập là P4 — khi làm P4 thì thêm overload `GenerateToken(TT_TaiKhoan)`
        //    ở đây, ĐỪNG kéo CSV_TaiKhoan sang (hai luồng tài khoản KHÔNG giao nhau, xem docs).

        /// <summary>
        /// Sinh JWT Token tổng quát.
        /// </summary>
        string GenerateToken(string userId, string userName, string role, IDictionary<string, string>? extraClaims = null);
    }
}
