using ApiQuanLyTaiTro.Repositories.Base;

namespace ApiQuanLyTaiTro.Repositories.KhaiTaiTro
{
    /// <summary>
    /// Lời khai ĐÃ QUA KIỂM ở service — chuỗi đã trim, rỗng thành null, SĐT đã chuẩn hoá, độ dài đã khớp cột.
    /// Repository không kiểm lại gì: nó chỉ chuyển giá trị xuống SP.
    /// </summary>
    public class LoiKhaiDaKiem
    {
        public int IdChuongTrinh { get; init; }
        public byte Loai { get; init; }
        public string HoTenDonVi { get; init; } = string.Empty;
        public DateTime? NgaySinh { get; init; }
        public string? TenHe { get; init; }
        public string? TenKhoa { get; init; }
        public string? NienKhoa { get; init; }
        public string? TenLop { get; init; }
        public string? EmailLienHe { get; init; }
        public string? SdtLienHe { get; init; }
        public byte MucAnDanh { get; init; }
        /// <summary>Từ CLAIM JWT (service), không bao giờ từ request. NULL = khách.</summary>
        public int? IdTaiKhoanCsv { get; init; }
    }

    /// <summary>Ghi lời khai tài trợ (P3a) — đường GHI đầu tiên của cổng.</summary>
    public interface IKhaiTaiTroRepository : IBaseRepository
    {
        /// <summary>
        /// Tạo lời khai + gắn các ảnh chuyển khoản, TẤT CẢ trong MỘT transaction.
        /// </summary>
        /// <param name="tenFileAnh">Tên file do server sinh, theo thứ tự hiển thị. File PHẢI đã nằm trên đĩa.</param>
        /// <returns>id lời khai (&gt; 0); 0 = chương trình không nhận khai (không tồn tại / nháp / đã kết thúc) — không ghi gì.</returns>
        Task<int> TaoLoiKhai(LoiKhaiDaKiem loiKhai, IReadOnlyList<string> tenFileAnh);
    }
}
