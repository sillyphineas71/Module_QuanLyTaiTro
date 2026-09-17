// =============================================================================
// FILE: IRepositoryWrapper.cs  (tầng Repository — cửa vào duy nhất cho data access)
// -----------------------------------------------------------------------------
// Cửa vào DUY NHẤT của tầng truy cập dữ liệu. Service gọi
// `_repository.TenNghiepVu.LayTheoId(...)` chứ không tự viết SQL rải rác.
//
// 🔴 ĐANG RỖNG CÓ CHỦ ĐÍCH — repo này mới dựng khung (P1), chưa có nghiệp vụ nào.
//    Danh sách repository của cổng Cựu sinh viên ĐÃ ĐƯỢC GỠ khi clone: cổng Tài trợ
//    có nghiệp vụ riêng (bảng TT_*), không kế thừa nghiệp vụ nào của cổng kia.
//
// THÊM MỘT REPOSITORY MỚI = ĐÚNG HAI CHỖ:
//   1. khai property ở ĐÂY
//   2. cài đặt lazy `??=` bên RepositoryWrapper.cs
// =============================================================================
namespace ApiQuanLyTaiTro.Repositories
{
    /// <summary>
    /// Wrapper gom toàn bộ Repository của cổng Tài trợ (tầng truy cập dữ liệu).
    /// </summary>
    public interface IRepositoryWrapper
    {
    }
}
