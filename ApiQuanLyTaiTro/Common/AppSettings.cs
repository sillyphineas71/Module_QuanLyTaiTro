namespace ApiQuanLyTaiTro.Common
{
    /// <summary>
    /// Static holder cho các giá trị cấu hình đọc từ appsettings.json.
    /// Gọi AppSettings.Initialize(configuration) trong Program.cs trước app.Build().
    /// </summary>
    public static class AppSettings
    {
        public static string ConnectionString { get; private set; } = string.Empty;
        public static string JwtSecret { get; private set; } = string.Empty;
        public static string JwtIssuer { get; private set; } = string.Empty;
        public static string JwtAudience { get; private set; } = string.Empty;
        public static int JwtExpiryMinutes { get; private set; } = 60;
        public static string[] CorsOrigins { get; private set; } = ["http://localhost:3000"];

        public static IConfiguration? Configuration { get; private set; }

        public static void Initialize(IConfiguration configuration)
        {
            Configuration = configuration;
            ConnectionString = configuration.GetConnectionString("DefaultConnection") ?? string.Empty;
            JwtSecret        = configuration["Jwt:Secret"] ?? string.Empty;
            JwtIssuer        = configuration["Jwt:Issuer"] ?? "QuanLyTaiTroApi";
            JwtAudience      = configuration["Jwt:Audience"] ?? "QuanLyTaiTroClient";
            JwtExpiryMinutes = int.TryParse(configuration["Jwt:ExpiryMinutes"], out var m) ? m : 60;
            CorsOrigins      = configuration["CorsWithOrigins"]
                               ?.Split(',', StringSplitOptions.RemoveEmptyEntries)
                               ?? ["http://localhost:3000"];
        }
    }
}
