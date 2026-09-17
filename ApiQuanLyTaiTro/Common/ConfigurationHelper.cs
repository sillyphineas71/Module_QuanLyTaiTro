using ApiQuanLyTaiTro.Repositories;
using ApiQuanLyTaiTro.Repositories.Base;
using ApiQuanLyTaiTro.Services;
using ApiQuanLyTaiTro.Services.Password;

namespace ApiQuanLyTaiTro.Common
{
    public static class ConfigurationHelper
    {
        /// <summary>Đăng ký tầng Repository + connection.</summary>
        public static void RepositorysConfig(IServiceCollection services)
        {
            services.AddScoped<IRepositoryWrapper, RepositoryWrapper>();
            services.AddSingleton<IDbConnectionQuerry, DbConnectionQuerry>();
        }

        /// <summary>Đăng ký tầng Service.</summary>
        public static void ServicesConfig(IServiceCollection services)
        {
            services.AddScoped<IServiceWrapper, ServiceWrapper>();
            services.AddScoped<ICoreServiceWrapper, CoreServiceWrapper>();
            services.AddSingleton<IJwtTokenService, JwtTokenService>();
            // Không giữ trạng thái theo request -> Singleton, giống IJwtTokenService.
            services.AddSingleton<IPasswordService, PasswordService>();
        }
    }
}