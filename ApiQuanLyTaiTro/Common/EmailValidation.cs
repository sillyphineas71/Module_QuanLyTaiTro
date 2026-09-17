namespace ApiQuanLyTaiTro.Common
{
    /// <summary>
    /// Kiểm định dạng email dùng chung cho các luồng ghi email đăng nhập.
    ///
    /// B4a: TÁCH NGUYÊN VĂN từ <c>ExcelService.IsValidEmailFormat</c> (trước là private) để màn Cấp
    /// tài khoản lớp trưởng dùng CÙNG luật với import Excel. Chỉ di chuyển - không đổi một dòng logic.
    /// ⚠️ Sửa luật ở đây là đổi hành vi của CẢ HAI luồng (import Excel + cấp lớp trưởng).
    /// </summary>
    public static class EmailValidation
    {
        /// <summary>
        /// Kiểm định dạng email bằng System.Net.Mail.MailAddress trong try/catch.
        /// CỐ Ý KHÔNG dùng regex: mọi regex email đều sai ở đâu đó (đây là cái bẫy kinh điển),
        /// còn MailAddress là bộ phân tích theo chuẩn có sẵn trong .NET.
        /// Thêm kiểm dấu chấm trong phần domain vì MailAddress chấp nhận "a@b" (hợp lệ về mặt
        /// chuẩn nhưng không gửi được tới hộp thư thật).
        /// </summary>
        public static bool IsValidEmailFormat(string email)
        {
            try
            {
                var addr = new System.Net.Mail.MailAddress(email.Trim());
                if (!string.Equals(addr.Address, email.Trim(), StringComparison.Ordinal)) return false;
                int at = email.LastIndexOf('@');
                if (at < 0) return false;
                string domain = email.Substring(at + 1);
                return domain.Contains('.') && !domain.StartsWith('.') && !domain.EndsWith('.');
            }
            catch
            {
                return false;
            }
        }
    }
}
