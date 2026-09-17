namespace ApiQuanLyTaiTro.Services.Password
{
    /// <summary>
    /// Kết quả kiểm mật khẩu. Phải phân biệt BA trạng thái, không phải hai:
    /// biết "đúng nhưng còn hash cũ" mới nâng cấp ngầm sang BCrypt được.
    /// </summary>
    public enum PasswordVerifyResult
    {
        /// <summary>Sai mật khẩu, HOẶC hash lưu trong DB là null/rỗng/không nhận dạng được.</summary>
        Failed = 0,

        /// <summary>Đúng mật khẩu, hash đã là BCrypt - không cần làm gì thêm.</summary>
        Succeeded = 1,

        /// <summary>
        /// Đúng mật khẩu, nhưng khớp qua ĐƯỜNG CŨ (SHA256 không salt).
        /// Nơi gọi NÊN băm lại bằng BCrypt và ghi đè vào DB (nâng cấp ngầm).
        /// </summary>
        SucceededNeedsUpgrade = 2,
    }

    /// <summary>
    /// Nơi DUY NHẤT của toàn hệ thống băm/kiểm mật khẩu và sinh mật khẩu tạm.
    /// Trước đây hàm băm bị chép trùng ở AuthService và TaiKhoanService - sửa một chỗ quên
    /// chỗ kia là đăng nhập và đổi mật khẩu lệch nhau ngay.
    /// </summary>
    public interface IPasswordService
    {
        /// <summary>Băm mật khẩu mới. LUÔN dùng BCrypt - không bao giờ sinh hash SHA256 nữa.</summary>
        string Hash(string plain);

        /// <summary>
        /// Kiểm mật khẩu nhập vào với hash đang lưu. Tự nhận dạng định dạng hash nên chạy
        /// được với cả tài khoản chưa nâng cấp (SHA256) lẫn đã nâng cấp (BCrypt).
        /// </summary>
        /// <param name="idTaiKhoan">Chỉ dùng để GHI LOG khi dữ liệu bất thường. Không ghi
        /// mật khẩu, hash hay email vào log.</param>
        PasswordVerifyResult Verify(string plain, string? stored, int idTaiKhoan = 0);

        /// <summary>
        /// Sinh mật khẩu tạm cho tài khoản mới được duyệt/cấp. Dùng nguồn ngẫu nhiên MẬT MÃ
        /// và bộ ký tự đã loại ký tự dễ đọc nhầm (người dùng gõ tay lại từ email).
        /// </summary>
        string GenerateTemporaryPassword();
    }
}
