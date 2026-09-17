using ApiQuanLyTaiTro.Common;
using ApiQuanLyTaiTro.Services;
using Microsoft.AspNetCore.Diagnostics;
using Models;
using System.Net;
using System.Text.Json;

namespace ApiQuanLyTaiTro.Middleware
{
    /// <summary>
    /// Bộ bắt lỗi toàn cục. Cung cấp extension app.ConfigureExceptionHandler(...) — mọi
    /// exception chưa được bắt trong controller/service sẽ rơi về đây, được ghi log
    /// (Serilog) và trả về JSON lỗi thống nhất (code SYSTEM_ERROR) thay vì trang lỗi HTML.
    /// Được gọi ở Program.cs, đặt NGOÀI CÙNG pipeline để bao trọn các middleware sau.
    /// </summary>
    public static class ExceptionMiddlewareExtensions
    {
        /// <summary>
        /// Global exception handler — bắt tất cả exception chưa được xử lý,
        /// log lại và trả về JSON response thống nhất.
        /// </summary>
        public static void ConfigureExceptionHandler(
            this IApplicationBuilder app,
            IJwtTokenService jwtTokenService)
        {
            app.UseExceptionHandler(appError =>
            {
                appError.Run(async context =>
                {
                    string userName = "";
                    try { userName = jwtTokenService.GetUserName(context); } catch { }

                    context.Response.StatusCode  = (int)HttpStatusCode.InternalServerError;
                    context.Response.ContentType = "application/json";

                    var contextFeature = context.Features.Get<IExceptionHandlerPathFeature>();
                    if (contextFeature != null)
                    {
                        try
                        {
                            Serilog.Log.Error(
                                contextFeature.Error,
                                "Lỗi hệ thống tại endpoint {Path}. User: {User}",
                                contextFeature.Path.ToString(),
                                userName);
                        }
                        catch { /* Silently ignore logging errors */ }

                        var errorResponse = new Response
                        {
                            is_success = false,
                            code       = ResponseCode.SYSTEM_ERROR,
                            message    = "Có lỗi: " + contextFeature.Error.Message
                        };

                        await context.Response.WriteAsync(
                            JsonSerializer.Serialize(errorResponse,
                                new JsonSerializerOptions { PropertyNamingPolicy = null }));
                    }
                });
            });
        }
    }
}
