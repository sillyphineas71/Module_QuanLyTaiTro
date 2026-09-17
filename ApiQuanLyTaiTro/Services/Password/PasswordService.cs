using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;

namespace ApiQuanLyTaiTro.Services.Password
{
    /// <summary>
    /// Băm/kiểm mật khẩu bằng BCrypt, kèm đường lùi đọc được hash SHA256 cũ.
    ///
    /// VÌ SAO CẦN ĐƯỜNG LÙI: DB đang có sẵn mật khẩu băm bằng SHA256 trần (không salt).
    /// Không thể băm lại hàng loạt vì hash một chiều - không ai biết mật khẩu gốc. Nên phải
    /// nhận dạng ĐỊNH DẠNG hash lưu trong DB rồi chọn cách kiểm tương ứng, và nâng cấp dần
    /// từng tài khoản mỗi lần họ đăng nhập / đổi mật khẩu thành công.
    ///
    /// HAI ĐƯỜNG chuyển đổi (bỏ sót đường thứ hai là KHOÁ NGƯỜI DÙNG VĨNH VIỄN):
    ///   1. Login          - đăng nhập đúng bằng hash cũ -> băm lại ngay (nâng cấp ngầm).
    ///   2. ForceChangePassword - tài khoản còn cờ phai_doi_mat_khau=1 KHÔNG đăng nhập được
    ///      (Login chặn ở bước kiểm cờ), nên nó chỉ đi qua đường này. Nếu ở đây không kiểm
    ///      được hash SHA256 cũ thì họ không đổi được mật khẩu -> mất tài khoản.
    /// </summary>
    public class PasswordService : IPasswordService
    {
        /// <summary>
        /// Work factor 11: ~100-130ms mỗi lần băm trên máy chủ thường. Cân giữa chống dò
        /// offline và thời gian phản hồi API. Tăng lên 12 là gấp đôi thời gian.
        /// LƯU Ý: luồng duyệt hàng loạt băm nhiều lần trong một request - xem cách xử lý
        /// song song ở TaiKhoanService.DuyetBatch, KHÔNG hạ số này để chạy cho nhanh.
        /// </summary>
        private const int WorkFactor = 11;

        /// <summary>Hash BCrypt: "$2a$"/"$2b$"/"$2y$" + tổng đúng 60 ký tự.</summary>
        private static readonly Regex BCryptPattern = new(@"^\$2[aby]\$", RegexOptions.Compiled);

        /// <summary>Hash SHA256 cũ: đúng 64 ký tự hex thường.</summary>
        private static readonly Regex Sha256HexPattern = new("^[0-9a-f]{64}$", RegexOptions.Compiled);

        public string Hash(string plain)
        {
            if (string.IsNullOrEmpty(plain)) return string.Empty;
            return BCrypt.Net.BCrypt.HashPassword(plain, WorkFactor);
        }

        public PasswordVerifyResult Verify(string plain, string? stored, int idTaiKhoan = 0)
        {
            // Mật khẩu nhập rỗng, hoặc tài khoản CHƯA có mật khẩu (dòng vừa import,
            // mat_khau = NULL) -> từ chối ngay, không so gì cả.
            if (string.IsNullOrEmpty(plain) || string.IsNullOrWhiteSpace(stored))
            {
                return PasswordVerifyResult.Failed;
            }

            // --- Đường MỚI: BCrypt ---
            if (stored.Length == 60 && BCryptPattern.IsMatch(stored))
            {
                try
                {
                    return BCrypt.Net.BCrypt.Verify(plain, stored)
                        ? PasswordVerifyResult.Succeeded
                        : PasswordVerifyResult.Failed;
                }
                catch (Exception ex)
                {
                    // BCrypt.Verify NÉM exception khi chuỗi salt hỏng (SaltParseException).
                    // Không bọc thì một dòng dữ liệu hỏng biến thành lỗi 500 thay vì
                    // "sai mật khẩu". Ghi id tài khoản, TUYỆT ĐỐI không ghi mật khẩu/hash.
                    Console.WriteLine($"[Lỗi Mật khẩu] Hash BCrypt hỏng ở tài khoản id={idTaiKhoan}: {ex.GetType().Name}");
                    return PasswordVerifyResult.Failed;
                }
            }

            // --- Đường CŨ: SHA256 trần, không salt ---
            if (Sha256HexPattern.IsMatch(stored))
            {
                // So bằng FixedTimeEquals thay vì "!=" để không rò rỉ thông tin qua thời gian
                // so sánh. Với SHA256 không salt đây là mối lo nhỏ, nhưng đã viết lại thì làm đúng.
                var storedBytes = Encoding.ASCII.GetBytes(stored);
                var inputBytes = Encoding.ASCII.GetBytes(HashSha256Legacy(plain));
                bool ok = CryptographicOperations.FixedTimeEquals(storedBytes, inputBytes);

                return ok ? PasswordVerifyResult.SucceededNeedsUpgrade : PasswordVerifyResult.Failed;
            }

            // --- Không nhận dạng được ---
            // KHÔNG âm thầm rơi về so SHA256: dữ liệu bất thường phải lộ ra, không phải bị che.
            Console.WriteLine($"[Lỗi Mật khẩu] Hash trong DB không đúng định dạng nào ở tài khoản id={idTaiKhoan} (độ dài={stored.Length})");
            return PasswordVerifyResult.Failed;
        }

        /// <summary>
        /// Bộ ký tự đã BỎ các ký tự dễ đọc nhầm khi gõ lại từ email:
        /// 0/O/o, 1/l/I. Còn 55 ký tự.
        /// </summary>
        private const string TempPasswordAlphabet =
            "ABCDEFGHJKLMNPQRSTUVWXYZ" +   // bỏ I, O
            "abcdefghijkmnpqrstuvwxyz" +   // bỏ l, o
            "23456789";                    // bỏ 0, 1

        private const int TempPasswordLength = 12;

        public string GenerateTemporaryPassword()
        {
            // RandomNumberGenerator = nguồn ngẫu nhiên MẬT MÃ. Bản cũ dùng
            // Guid.NewGuid().ToString("N").Substring(0,8): Guid v4 KHÔNG phải RNG mật mã theo
            // hợp đồng, và cắt 8 ký tự hex chỉ còn 32 bit -> đoán được. Vá hash mà để nguyên
            // chỗ này là vá nửa vời: kẻ tấn công không cần phá hash, chỉ cần đoán mật khẩu tạm.
            var chars = new char[TempPasswordLength];
            for (int i = 0; i < TempPasswordLength; i++)
            {
                chars[i] = TempPasswordAlphabet[RandomNumberGenerator.GetInt32(TempPasswordAlphabet.Length)];
            }
            return new string(chars);
        }

        /// <summary>
        /// Băm SHA256 y hệt bản cũ - GIỮ LẠI CHỈ ĐỂ ĐỌC hash đã có trong DB.
        /// TUYỆT ĐỐI không dùng để tạo mật khẩu mới.
        /// </summary>
        private static string HashSha256Legacy(string password)
        {
            if (string.IsNullOrEmpty(password)) return string.Empty;
            using var sha256 = SHA256.Create();
            var bytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
            return Convert.ToHexString(bytes).ToLowerInvariant();
        }
    }
}
