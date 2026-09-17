namespace ApiQuanLyTaiTro.Services
{
    /// <summary>
    /// Wrapper cho các service cốt lõi (JWT, Exception, v.v.).
    /// Sử dụng Lazy Loading (??=) — khởi tạo service khi được truy cập lần đầu.
    /// </summary>
    public class CoreServiceWrapper : ICoreServiceWrapper
    {
        protected readonly IServiceProvider _serviceProvider;
        private IJwtTokenService? _jwtTokenService;

        public CoreServiceWrapper(IServiceProvider serviceProvider)
        {
            _serviceProvider = serviceProvider;
        }

        public IJwtTokenService JwtToken =>
            _jwtTokenService ??= new JwtTokenService(_serviceProvider);
    }
}
