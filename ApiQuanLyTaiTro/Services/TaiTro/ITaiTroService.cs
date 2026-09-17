using Models;

namespace ApiQuanLyTaiTro.Services.TaiTro
{
    /// <summary>
    /// Nghiệp vụ ĐỌC CÔNG KHAI của cổng Tài trợ — không cần đăng nhập.
    /// </summary>
    /// <remarks>
    /// 🔴 Chương trình KHÔNG TỒN TẠI · ĐÃ XOÁ MỀM · CÒN NHÁP ⇒ cả ba trả <c>DATA_NULL</c> với CÙNG một câu
    /// thông báo (controller đổi thành HTTP 404). Không nhánh nào được khác nhau — xem
    /// <c>TaiTroService.KhongTimThay</c>.
    /// ⚠️ CHƯA CÓ CACHE (lô P2a). SP 01 ghi "lớp chống lạm dụng là cache ở tầng service" — việc của lô sau.
    /// </remarks>
    public interface ITaiTroService
    {
        /// <summary>Danh sách chương trình công khai (SP 01).</summary>
        Task<Response> GetDanhSachChuongTrinh();

        /// <summary>Chi tiết một chương trình — GHÉP SP 02 + SP 03 + SP 04 thành một response.</summary>
        Task<Response> GetChiTietChuongTrinh(int id);

        /// <summary>Nhà tài trợ đã duyệt của một chương trình (SP 03). Không tồn tại / nháp ⇒ DATA_NULL.</summary>
        Task<Response> GetNhaTaiTroTheoChuongTrinh(int id);

        /// <summary>Khoản đã chi + minh chứng của một chương trình (SP 04). Không tồn tại / nháp ⇒ DATA_NULL.</summary>
        Task<Response> GetKhoanChiTheoChuongTrinh(int id);
    }
}
