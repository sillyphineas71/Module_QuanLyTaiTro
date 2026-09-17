using ApiQuanLyTaiTro.Services.Email;
using ApiQuanLyTaiTro.Services.KhaiTaiTro;
using ApiQuanLyTaiTro.Services.TaiTro;

namespace ApiQuanLyTaiTro.Services
{
    /// <summary>
    /// Concrete implementation của <see cref="IServiceWrapper"/> — Hybrid DI + Lazy Loading.
    /// </summary>
    /// <remarks>
    /// KHUÔN CHO SERVICE MỚI (chép nguyên, đổi tên — TaiTro bên dưới làm đúng khuôn này):
    ///     private IChuongTrinhService? _chuongTrinhService;
    ///     public  IChuongTrinhService  ChuongTrinh =>
    ///         _chuongTrinhService ??= new ChuongTrinhService(_serviceProvider);
    ///
    /// Service nghiệp vụ nhận `IServiceProvider` (kế thừa BaseService rồi tự resolve
    /// IServiceWrapper / IRepositoryWrapper / IJwtTokenService khi cần).
    /// ⚠️ EmailService là NGOẠI LỆ: nó nhận thẳng IConfiguration vì chỉ đọc cấu hình SMTP.
    /// </remarks>
    public class ServiceWrapper : IServiceWrapper
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly IHttpContextAccessor _httpContextAccessor;

        private IEmailService? _emailService;
        private ITaiTroService? _taiTroService;
        private IKhaiTaiTroService? _khaiTaiTroService;

        public ServiceWrapper(
            IServiceProvider serviceProvider,
            IHttpContextAccessor httpContextAccessor)
        {
            _serviceProvider = serviceProvider;
            _httpContextAccessor = httpContextAccessor;
        }

        public IHttpContextAccessor HttpContextAccessor => _httpContextAccessor;

        public IEmailService Email =>
            _emailService ??= new EmailService(_serviceProvider.GetRequiredService<IConfiguration>());

        public ITaiTroService TaiTro =>
            _taiTroService ??= new TaiTroService(_serviceProvider);

        public IKhaiTaiTroService KhaiTaiTro =>
            _khaiTaiTroService ??= new KhaiTaiTroService(_serviceProvider);
    }
}
