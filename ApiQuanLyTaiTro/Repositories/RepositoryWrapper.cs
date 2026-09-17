// =============================================================================
// FILE: RepositoryWrapper.cs  (cài đặt cụ thể của IRepositoryWrapper)
// -----------------------------------------------------------------------------
// Hybrid DI + Lazy Loading (`??=`): wrapper do DI tạo (Scoped ở Program.cs), còn các
// Repository bên trong được `new` THỦ CÔNG khi property được gọi lần đầu.
//
// 🔴 ĐANG RỖNG CÓ CHỦ ĐÍCH — xem IRepositoryWrapper.cs.
//
// KHUÔN CHO REPOSITORY ĐẦU TIÊN (chép nguyên, đổi tên):
//     private IChuongTrinhRepository? _chuongTrinh;
//     public  IChuongTrinhRepository  ChuongTrinh =>
//         _chuongTrinh ??= new ChuongTrinhRepository(
//             _serviceProvider.GetRequiredService<IDbConnectionQuerry>());
//
// ⚠️ BaseRepository nhận `IDbConnectionQuerry`, KHÔNG nhận `IServiceProvider` — comment
//    mẫu ở repo cũ ghi sai chỗ này (cạm bẫy #9 của CLAUDE.md cũ). Lấy IDbConnectionQuerry
//    ra khỏi _serviceProvider như khuôn trên.
// =============================================================================
namespace ApiQuanLyTaiTro.Repositories
{
    /// <summary>
    /// Concrete implementation của <see cref="IRepositoryWrapper"/>.
    /// </summary>
    public class RepositoryWrapper : IRepositoryWrapper
    {
        private readonly IServiceProvider _serviceProvider;

        public RepositoryWrapper(IServiceProvider serviceProvider)
        {
            _serviceProvider = serviceProvider;
        }
    }
}
