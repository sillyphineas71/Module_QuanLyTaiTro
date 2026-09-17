namespace ApiQuanLyTaiTro.Common
{
    /// <summary>
    /// CHUẨN HOÁ URL ẢNH LẤY TỪ HỆ ĐÀO TẠO — MỘT CHỖ DUY NHẤT CHO CẢ HỆ THỐNG.
    ///
    /// 🔴 VÌ SAO Ở TẦNG C# CHỨ KHÔNG PHẢI TRONG SP HAY Ở FE — đọc trước khi "dọn":
    ///   · Trong SP: mỗi màn cần ảnh là một SP khác nhau (CSV_ThongTin_GetMe cho màn Hồ sơ,
    ///     CSV_ThongTin_GetChiTietByIdSv cho màn Quản lý sau này). Đặt REPLACE trong SP nghĩa là
    ///     luật bị CHÉP RA NHIỀU BẢN ngay khi có màn thứ hai, và không bản nào kiểm được.
    ///   · Ở FE: mỗi chỗ render ảnh phải tự nhớ gọi. Quên một chỗ là vỡ âm thầm đúng một chỗ đó.
    ///   · Ở đây: MỘT hàm, mọi endpoint gọi vào. Đổi luật = sửa một chỗ.
    ///
    /// ⛔ TUYỆT ĐỐI KHÔNG ghi ngược giá trị đã chuẩn hoá xuống STU_HoSoSinhVien. Bảng đó thuộc hệ
    /// đào tạo, cổng Cựu SV chỉ có quyền ĐỌC. Chuẩn hoá là việc lúc đọc, không phải lúc ghi.
    /// </summary>
    public static class UrlAnhHelper
    {
        private const string TIEN_TO_HTTP = "http://";
        private const string TIEN_TO_HTTPS = "https://";

        /// <summary>
        /// Nâng http:// thành https:// và trả về null cho giá trị rỗng.
        ///
        /// VÌ SAO PHẢI NÂNG: khi cổng chạy trên HTTPS, trình duyệt CHẶN mọi ảnh http:// vì mixed
        /// content — chặn im lặng, không báo lỗi gì, chỉ thấy ảnh vỡ. Đã kiểm chứng bằng curl là
        /// host ảnh có phục vụ HTTPS với chứng chỉ hợp lệ (ui-no-ky-thuat.md mục A6.5).
        ///
        /// ⚠️ NẾU MÔI TRƯỜNG MỚI KHÔNG PHỤC VỤ HTTPS: hàm này vẫn nâng, và ảnh sẽ hỏng. Đó là chủ
        /// ý — để http:// thì trình duyệt cũng chặn, nên không có lựa chọn nào khác chạy được.
        /// Cách xử lý đúng khi đó là kiểm trước lúc deploy (trien-khai-va-kiem-chung.md, mục
        /// "KIỂM ẢNH THẺ TRƯỚC KHI DEPLOY"), không phải hạ xuống http.
        ///
        /// Giá trị KHÔNG phải http:// (đã là https, hoặc là đường dẫn tương đối) được trả nguyên
        /// vẹn — hàm này chỉ làm đúng một việc, không đoán thêm.
        /// </summary>
        public static string? NangCapHttps(string? url)
        {
            if (string.IsNullOrWhiteSpace(url))
            {
                // Chuỗi rỗng và chuỗi toàn khoảng trắng cùng quy về null: FE chỉ phải kiểm MỘT
                // trạng thái "không có ảnh", thay vì ba trạng thái trông giống nhau.
                return null;
            }

            string sach = url.Trim();

            // StartsWith có so sánh KHÔNG PHÂN BIỆT HOA THƯỜNG: dữ liệu do hệ đào tạo nhập tay
            // qua nhiều năm, "HTTP://" hoàn toàn có thể xuất hiện.
            if (sach.StartsWith(TIEN_TO_HTTP, StringComparison.OrdinalIgnoreCase))
            {
                return string.Concat(TIEN_TO_HTTPS, sach.AsSpan(TIEN_TO_HTTP.Length));
            }

            return sach;
        }
    }
}
