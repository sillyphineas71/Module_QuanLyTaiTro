using ApiQuanLyTaiTro.Filters;
using ApiQuanLyTaiTro.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace ApiQuanLyTaiTro.Filters
{
    /// <summary>
    /// Filter "cổng gác" xác thực: chặn request nếu KHÔNG có API Key hợp lệ HOẶC JWT hợp lệ.
    /// - Bỏ qua nếu Action có [AllowAnonymous], [AllowApiKeyOrJwt] hoặc [ApiKeyAuthentication].
    /// - Bật toàn cục bằng cách mở dòng options.Filters.Add&lt;MustLogged&gt;() trong Program.cs.
    /// LƯU Ý: khi có exception nội bộ, filter cho request đi tiếp (fail-open) — vì vậy phải
    /// đảm bảo IJwtTokenService đã được đăng ký DI (đã làm ở Program.cs).
    /// </summary>
    public class MustLogged : ActionFilterAttribute
    {
        private const string ApiKeyHeaderName = "X-Api-Key";
        private IJwtTokenService _jwtTokenService;
        private IConfiguration _configuration;

        public MustLogged()
        {
        }

        public override void OnActionExecuting(ActionExecutingContext context)
        {
            try
            {
                // Bỏ qua nếu có [AllowAnonymous]
                var hasAllowAnonymous = context.ActionDescriptor.EndpointMetadata
                    .Any(em => em is AllowAnonymousAttribute);
                if (hasAllowAnonymous)
                {
                    base.OnActionExecuting(context);
                    return;
                }




                // Bỏ qua nếu có [AllowApiKeyOrJwt] - sẽ được xử lý bởi attribute đó
                var hasAllowApiKeyOrJwt = context.ActionDescriptor.EndpointMetadata
                    .Any(em => em is AllowApiKeyOrJwtAttribute);
                if (hasAllowApiKeyOrJwt)
                {
                    base.OnActionExecuting(context);
                    return;
                }

                //// Bỏ qua nếu có [ApiKeyAuthentication] - sẽ được xử lý bởi attribute đó
                var hasApiKeyAuth = context.ActionDescriptor.EndpointMetadata
                    .Any(em => em is ApiKeyAuthenticationAttribute);
                if (hasApiKeyAuth)
                {
                    base.OnActionExecuting(context);
                    return;
                }
//
                //Kiểm tra API Key trước(để hỗ trợ các API không có attribute)
                _configuration = context.HttpContext.RequestServices.GetRequiredService<IConfiguration>();
                if (context.HttpContext.Request.Headers.TryGetValue(ApiKeyHeaderName, out var extractedApiKey))
                {
                    var apiKey = _configuration["ApiSettings:ApiKey"];
                    if (!string.IsNullOrEmpty(apiKey) && apiKey.Equals(extractedApiKey))
                    {
                        return;
                    }
                }
                
                // Kiểm tra JWT Token
                _jwtTokenService = (IJwtTokenService)context.HttpContext.RequestServices.GetService(typeof(IJwtTokenService));
                var userId = _jwtTokenService.GetUserID(context.HttpContext);
                if (userId.ToString() != "")
                {
                    return;
                }

                context.Result = new UnauthorizedResult();
            }
            catch (Exception)
            {
                base.OnActionExecuting(context);
            }
        }
    }
}

