// =============================================================================
// FILE: IRepositoryWrapper.cs  (tầng Repository — cửa vào duy nhất cho data access)
// -----------------------------------------------------------------------------
// Cửa vào DUY NHẤT của tầng truy cập dữ liệu. Service gọi
// `_repository.TenNghiepVu.LayTheoId(...)` chứ không tự viết SQL rải rác.
//
// 🔄 Trước P2a: RỖNG CÓ CHỦ ĐÍCH (repo mới dựng khung, chưa có nghiệp vụ). Danh sách repository
//    của cổng Cựu sinh viên ĐÃ ĐƯỢC GỠ khi clone: cổng Tài trợ có nghiệp vụ riêng (bảng TT_*),
//    không kế thừa nghiệp vụ nào của cổng kia. Từ P2a có repository đầu tiên: TaiTro (đọc công khai).
//
// THÊM MỘT REPOSITORY MỚI = ĐÚNG HAI CHỖ:
//   1. khai property ở ĐÂY
//   2. cài đặt lazy `??=` bên RepositoryWrapper.cs
// =============================================================================
using ApiQuanLyTaiTro.Repositories.KhaiTaiTro;
using ApiQuanLyTaiTro.Repositories.TaiTro;

namespace ApiQuanLyTaiTro.Repositories
{
    /// <summary>
    /// Wrapper gom toàn bộ Repository của cổng Tài trợ (tầng truy cập dữ liệu).
    /// </summary>
    public interface IRepositoryWrapper
    {
        /// <summary>Đọc dữ liệu CÔNG KHAI — chỉ SP <c>TT_CongKhai_*</c> (P2a).</summary>
        ITaiTroRepository TaiTro { get; }

        /// <summary>GHI lời khai tài trợ + ảnh chuyển khoản (P3a).</summary>
        IKhaiTaiTroRepository KhaiTaiTro { get; }
    }
}
