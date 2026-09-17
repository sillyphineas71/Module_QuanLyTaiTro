using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace ApiQuanLyTaiTro.Filters
{
    /// <summary>
    /// Attribute xác thực API Key cho các lời gọi service-to-service
    /// (ví dụ: module điểm gọi sang để bắn thông báo học vụ cho sinh viên).
    /// Đặt trên Controller hoặc Action cần yêu cầu API Key.
    /// </summary>
    [AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
    public class ApiKeyAuthenticationAttribute : Attribute, IAsyncActionFilter
    {
        private const string ApiKeyHeaderName = "X-Api-Key";

        public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
        {
            // Kiểm tra request có chứa API Key trong header không
            if (!context.HttpContext.Request.Headers.TryGetValue(ApiKeyHeaderName, out var extractedApiKey))
            {
                context.Result = new UnauthorizedObjectResult(new
                {
                    message = "API Key không được cung cấp trong header",
                    code = "API_KEY_MISSING"
                });
                return;
            }

            // Lấy API Key từ configuration
            var configuration = context.HttpContext.RequestServices.GetRequiredService<IConfiguration>();
            var apiKey = configuration["ApiSettings:ApiKey"];

            // Validate API Key
            if (string.IsNullOrEmpty(apiKey) || !apiKey.Equals(extractedApiKey))
            {
                context.Result = new UnauthorizedObjectResult(new
                {
                    message = "API Key không hợp lệ",
                    code = "API_KEY_INVALID"
                });
                return;
            }

            // API Key hợp lệ, tiếp tục xử lý request
            await next();
        }
    }
}
