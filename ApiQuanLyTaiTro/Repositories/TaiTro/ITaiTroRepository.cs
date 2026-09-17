using ApiQuanLyTaiTro.Repositories.Base;
using Models.Responses.TaiTro;

namespace ApiQuanLyTaiTro.Repositories.TaiTro
{
    /// <summary>
    /// Đọc dữ liệu CÔNG KHAI của cổng Tài trợ — chỉ gọi SP <c>TT_CongKhai_*</c>.
    /// </summary>
    /// <remarks>
    /// 🔴 Bốn SP này CHỈ ĐỌC VIEW <c>TT_v_*CongKhai</c>. Luật "đã duyệt / che ẩn danh / chặn nháp" nằm
    /// hết trong view — repository và service KHÔNG lọc thêm gì, để luật đó chỉ có MỘT bản.
    /// </remarks>
    public interface ITaiTroRepository : IBaseRepository
    {
        /// <summary>SP 01 — mọi chương trình công khai, kèm ba con số đã cộng sẵn.</summary>
        Task<IEnumerable<ChuongTrinhTomTatResponse>> GetDanhSachChuongTrinh();

        /// <summary>
        /// SP 02 — phần vô hướng + <c>du_kien_chi</c>.
        /// <para>
        /// 🔴 <c>null</c> cho CẢ BA ca: id không tồn tại · đã xoá mềm · còn nháp. SP không phân biệt,
        /// repository cũng không — xem <c>TaiTroService.GetChiTietChuongTrinh</c>.
        /// </para>
        /// <para>⚠️ <c>nha_tai_tro</c> / <c>khoan_chi</c> để rỗng — service gán từ SP 03 / SP 04.</para>
        /// </summary>
        Task<ChuongTrinhChiTietResponse?> GetChiTietChuongTrinh(int id);

        /// <summary>SP 03 — nhà tài trợ đã duyệt. Chương trình nháp / không tồn tại ra rỗng.</summary>
        Task<IEnumerable<NhaTaiTroCongKhaiResponse>> GetNhaTaiTroTheoChuongTrinh(int idChuongTrinh);

        /// <summary>SP 04 — khoản đã chi, mỗi khoản kèm <c>minh_chung</c>. Chương trình nháp / không tồn tại ra rỗng.</summary>
        Task<IEnumerable<KhoanChiResponse>> GetKhoanChiTheoChuongTrinh(int idChuongTrinh);
    }
}
