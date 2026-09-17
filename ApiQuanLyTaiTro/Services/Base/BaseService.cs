using ApiQuanLyTaiTro.Repositories;   // IRepositoryWrapper
using ApiQuanLyTaiTro.Services;        // IServiceWrapper, IJwtTokenService
using ApiQuanLyTaiTro.Services.Password;
using Models.Base;                    // ModifyInfo

namespace ApiQuanLyTaiTro.Services.Base
{
    public class BaseService : IBaseService
    {
        protected IServiceProvider _serviceProvider;
        protected IServiceWrapper _serviceWrapper;
        protected IRepositoryWrapper _repositoryWrapper;
        protected IJwtTokenService _jwtTokenService;
        protected IPasswordService _passwordService;

        public BaseService(IServiceProvider serviceProvider)
        {
            // KHÁC ApiMarkMan: KHÔNG dùng serviceProvider.CreateScope().
            // Bản gốc tạo scope mới không bao giờ dispose → hỏng lifetime scoped + rò rỉ.
            // Dùng thẳng serviceProvider được inject.
            this._serviceProvider = serviceProvider;
            this._serviceWrapper = _serviceProvider.GetRequiredService<IServiceWrapper>();
            this._repositoryWrapper = _serviceProvider.GetRequiredService<IRepositoryWrapper>();
            this._jwtTokenService = _serviceProvider.GetRequiredService<IJwtTokenService>();
            this._passwordService = _serviceProvider.GetRequiredService<IPasswordService>();
        }

        public void SetModifyUser(ModifyInfo info)
        {
            try
            {
                var context = _serviceWrapper.HttpContextAccessor?.HttpContext;
                if (context == null) return;
                _jwtTokenService.SetModifyInfo(context, info);
            }
            catch { }
        }

        public string GetUserName()
        {
            try
            {
                var context = _serviceWrapper.HttpContextAccessor?.HttpContext;
                if (context == null) return "";
                return _jwtTokenService.GetUserName(context);
            }
            catch { }
            return "";
        }

        public string GetUserID()
        {
            try
            {
                var context = _serviceWrapper.HttpContextAccessor?.HttpContext;
                if (context == null) return "";
                return _jwtTokenService.GetUserID(context);
            }
            catch { }
            return "";
        }

        public string GetIP()
        {
            try
            {
                var context = _serviceWrapper.HttpContextAccessor?.HttpContext;
                if (context == null) return "";
                return _jwtTokenService.GetIP(context);
            }
            catch { }
            return "";
        }
    }
}