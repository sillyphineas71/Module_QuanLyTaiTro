using ApiQuanLyTaiTro.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc.Filters;

namespace ApiQuanLyTaiTro.Filters
{
    /// <summary>
    /// Attribute cho phép truy cập nếu có API Key HỢP LỆ (header X-Api-Key) HOẶC JWT hợp lệ.
    /// Đặt trên Action/Controller mà cả người dùng (JWT) lẫn service khác (API Key) đều gọi được.
    /// [AllowAnonymous] sẽ bỏ qua kiểm tra.
    /// </summary>
    [AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
    public class AllowApiKeyOrJwtAttribute : Attribute, IAsyncActionFilter
    {
        private const string ApiKeyHeaderName = "X-Api-Key";

        public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
        {
            var hasAllowAnonymous = context.ActionDescriptor.EndpointMetadata
                .Any(em => em is AllowAnonymousAttribute);
            if (hasAllowAnonymous) { await next(); return; }

            var configuration   = context.HttpContext.RequestServices.GetRequiredService<IConfiguration>();
            var jwtTokenService = context.HttpContext.RequestServices.GetService<IJwtTokenService>();

            if (context.HttpContext.Request.Headers.TryGetValue(ApiKeyHeaderName, out var extractedApiKey))
            {
                var apiKey = configuration["ApiSettings:ApiKey"];
                if (!string.IsNullOrEmpty(apiKey) && apiKey.Equals(extractedApiKey))
                { await next(); return; }
            }

            if (jwtTokenService != null)
            {
                try
                {
                    var userId = jwtTokenService.GetUserID(context.HttpContext);
                    if (!string.IsNullOrEmpty(userId)) { await next(); return; }
                }
                catch { }
            }

            context.Result = new Microsoft.AspNetCore.Mvc.UnauthorizedObjectResult(new
            {
                message = "Yeu cau xac thuc: Vui long cung cap JWT Token hoac API Key",
                code = "UNAUTHORIZED"
            });
        }
    }
}
