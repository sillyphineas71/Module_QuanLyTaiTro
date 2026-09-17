// =============================================================================
// FILE: RepositoryWrapper.cs  (cài đặt cụ thể của IRepositoryWrapper)
// -----------------------------------------------------------------------------
// Hybrid DI + Lazy Loading (`??=`): wrapper do DI tạo (Scoped ở Program.cs), còn các
// Repository bên trong được `new` THỦ CÔNG khi property được gọi lần đầu.
//
// 🔄 Hết rỗng từ P2a (TaiTro) — xem IRepositoryWrapper.cs.
//
// KHUÔN CHO REPOSITORY MỚI (chép nguyên, đổi tên — TaiTro bên dưới làm đúng khuôn này):
//     private IChuongTrinhRepository? _chuongTrinh;
//     public  IChuongTrinhRepository  ChuongTrinh =>
//         _chuongTrinh ??= new ChuongTrinhRepository(
//             _serviceProvider.GetRequiredService<IDbConnectionQuerry>());
//
// ⚠️ BaseRepository nhận `IDbConnectionQuerry`, KHÔNG nhận `IServiceProvider` — comment
//    mẫu ở repo cũ ghi sai chỗ này (cạm bẫy #9 của CLAUDE.md cũ). Lấy IDbConnectionQuerry
//    ra khỏi _serviceProvider như khuôn trên.
// =============================================================================
using ApiQuanLyTaiTro.Repositories.Base;
using ApiQuanLyTaiTro.Repositories.KhaiTaiTro;
using ApiQuanLyTaiTro.Repositories.TaiTro;

namespace ApiQuanLyTaiTro.Repositories
{
    /// <summary>
    /// Concrete implementation của <see cref="IRepositoryWrapper"/>.
    /// </summary>
    public class RepositoryWrapper : IRepositoryWrapper
    {
        private readonly IServiceProvider _serviceProvider;

        private ITaiTroRepository? _taiTro;
        private IKhaiTaiTroRepository? _khaiTaiTro;

        public RepositoryWrapper(IServiceProvider serviceProvider)
        {
            _serviceProvider = serviceProvider;
        }

        public ITaiTroRepository TaiTro =>
            _taiTro ??= new TaiTroRepository(
                _serviceProvider.GetRequiredService<IDbConnectionQuerry>());

        public IKhaiTaiTroRepository KhaiTaiTro =>
            _khaiTaiTro ??= new KhaiTaiTroRepository(
                _serviceProvider.GetRequiredService<IDbConnectionQuerry>());
    }
}
