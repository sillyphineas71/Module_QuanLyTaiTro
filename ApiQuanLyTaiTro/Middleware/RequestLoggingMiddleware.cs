using ApiQuanLyTaiTro.Filters;
using ApiQuanLyTaiTro.Services;
using Microsoft.AspNetCore.Mvc.Controllers;
using Serilog;
using System.Collections.Concurrent;
using System.ComponentModel;
using System.Diagnostics;
using System.Reflection;
using System.Text;
using ApiQuanLyTaiTro.Filters;

namespace ApiQuanLyTaiTro.Middleware
{
    /// <summary>
    /// Middleware ghi log mọi request vào /api/* (method, đường dẫn, thời gian chạy,
    /// status, user, IP, payload...) bằng Serilog. Có tối ưu: bỏ qua các Action Select
    /// nhanh & thành công (trừ khi gắn [ForceLogging]); che payload nhạy cảm nếu gắn
    /// [SensitivePayload]; bỏ qua nếu gắn [IgnoreLogging]. Bật/tắt qua "EnableRequestLog".
    /// Được cắm vào pipeline ở Program.cs bằng app.UseMiddleware&lt;RequestLoggingMiddleware&gt;().
    /// </summary>
    public class RequestLoggingMiddleware
    {
        private readonly RequestDelegate _next;
        private const int SLOW_QUERY_THRESHOLD_MS = 5000;
        private const int MAX_PAYLOAD_LENGTH = 4000;

        /// <summary>
        /// Key de controller set userId thu cong vao HttpContext.Items.
        /// Dung khi JWT chua co (login) hoac da bi xoa (logout).
        /// Cach dung trong Controller: HttpContext.Items[RequestLoggingMiddleware.LOG_USER_ID_KEY] = userId;
        /// </summary>
        public const string LOG_USER_ID_KEY = "log_user_id";

        // Cache metadata cua tung Action de tranh reflection moi request
        // Dung MethodInfo lam key — dam bao duy nhat ke ca khi overload Action cung ten
        private static readonly ConcurrentDictionary<MethodInfo, ActionLogMetadata> _metadataCache = new();

        public RequestLoggingMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            if (!SerilogConfig.IsEnabled)
            {
                await _next(context);
                return;
            }

            var path = context.Request.Path.Value ?? "";
            if (!path.StartsWith("/api/", StringComparison.OrdinalIgnoreCase))
            {
                await _next(context);
                return;
            }

            // Enable buffering TRUOC khi pipeline doc body, de co the doc lai sau
            context.Request.EnableBuffering();

            var stopwatch = Stopwatch.StartNew();
            Exception caughtException = null;

            try
            {
                await _next(context);
            }
            catch (Exception ex)
            {
                caughtException = ex;
                context.Response.StatusCode = 500;
                throw;
            }
            finally
            {
                stopwatch.Stop();

                try
                {
                    await ProcessLoggingAsync(context, stopwatch.ElapsedMilliseconds, caughtException);
                }
                catch
                {
                }
            }
        }

        private async Task ProcessLoggingAsync(HttpContext context, long executionTimeMs, Exception exception)
        {
            var endpoint = context.GetEndpoint();
            var actionDescriptor = endpoint?.Metadata.GetMetadata<ControllerActionDescriptor>();

            if (actionDescriptor == null)
                return;

            var metadata = GetOrCreateMetadata(actionDescriptor);

            if (metadata.IsIgnored)
                return;

            bool isSuccess = context.Response.StatusCode >= 200 && context.Response.StatusCode < 300;
            bool isFast = executionTimeMs < SLOW_QUERY_THRESHOLD_MS;

            if (metadata.IsSelectAction && isSuccess && isFast && !metadata.IsForceLogged && exception == null)
                return;

            // === Chi doc Request Body khi thuc su can ghi log ===
            string payload = metadata.IsSensitivePayload
                ? "[sensitive – hidden]"
                : await ReadRequestBodyAsync(context.Request);

            // === THONG TIN REQUEST ===
            string method = context.Request.Method;
            string endpointPath = context.Request.Path.Value;
            string query = context.Request.QueryString.HasValue ? context.Request.QueryString.Value : null;

            // === TRACING & USER ===
            string traceId = context.TraceIdentifier;
            string ipAddress = GetClientIpAddress(context);
            string userAgent = context.Request.Headers["User-Agent"].FirstOrDefault();
            if (userAgent != null && userAgent.Length > 500)
                userAgent = userAgent.Substring(0, 500);

            string serverName = Environment.MachineName;
            string clientId = context.Request.Headers["X-Client-Id"].FirstOrDefault() ?? "Unknown";

            string userId = null;
            try
            {
                var jwtTokenService = context.RequestServices.GetService(typeof(IJwtTokenService)) as IJwtTokenService;
                if (jwtTokenService != null)
                    userId = jwtTokenService.GetUserID(context)?.ToString();
            }
            catch { }

            // Fallback: controller co the set userId thu cong qua HttpContext.Items
            // Dung cho login (token chua co) hoac logout (token bi xoa)
            if (string.IsNullOrEmpty(userId) && context.Items.TryGetValue(LOG_USER_ID_KEY, out var manualUserId))
                userId = manualUserId?.ToString();

            // === EXCEPTION ===
            string message = exception?.Message;
            string stackTrace = exception?.StackTrace;
            if (message != null && message.Length > 1000)
                message = message.Substring(0, 1000);

            int statusCode = context.Response.StatusCode;

            // === GHI LOG BANG SERILOG ===
            Log.ForContext("trace_id", traceId)
               .ForContext("controller", metadata.ControllerName)
               .ForContext("action", metadata.ActionName)
               .ForContext("method", method)
               .ForContext("endpoint", endpointPath)
               .ForContext("content", metadata.Description)
               .ForContext("query", query)
               .ForContext("payload", payload)
               .ForContext("execution_time_ms", (int)executionTimeMs)
               .ForContext("status_code", statusCode)
               .ForContext("message", message)
               .ForContext("stack_trace", stackTrace)
               .ForContext("permission_code", metadata.PermissionCode)
               .ForContext("user_id", userId)
               .ForContext("ip_address", ipAddress)
               //.ForContext("user_agent", userAgent)
               .ForContext("server_name", serverName)
               .ForContext("client_id", clientId)
               .Write(exception != null ? Serilog.Events.LogEventLevel.Error : Serilog.Events.LogEventLevel.Information,
                      "RequestLog");
        }

        private static ActionLogMetadata GetOrCreateMetadata(ControllerActionDescriptor descriptor)
        {
            return _metadataCache.GetOrAdd(descriptor.MethodInfo, _ =>
            {
                var methodInfo = descriptor.MethodInfo;
                var controllerType = descriptor.ControllerTypeInfo;
                var actionName = descriptor.ActionName;
                // [HasPermission] — lay machucnang qua reflection 1 lan duy nhat
                string permissionCode = null;
                // var permissionAttr = methodInfo.GetCustomAttribute<HasPermission>();
                // if (permissionAttr != null)
                // {
                //     var field = typeof(HasPermission).GetField("_machucnangs", BindingFlags.NonPublic | BindingFlags.Instance);
                //     var machucnangs = field?.GetValue(permissionAttr) as string[];
                //     permissionCode = machucnangs != null ? string.Join(",", machucnangs) : null;
                // }

                return new ActionLogMetadata
                {
                    ControllerName = descriptor.ControllerName,
                    ActionName = actionName,
                    IsIgnored = controllerType.GetCustomAttribute<IgnoreLogging>() != null
                                || methodInfo.GetCustomAttribute<IgnoreLogging>() != null,
                    IsForceLogged = controllerType.GetCustomAttribute<ForceLogging>() != null
                                    || methodInfo.GetCustomAttribute<ForceLogging>() != null,
                    IsSelectAction = actionName.StartsWith("Select", StringComparison.OrdinalIgnoreCase) || actionName.StartsWith("Print_", StringComparison.OrdinalIgnoreCase),
                    Description = methodInfo.GetCustomAttribute<DescriptionAttribute>()?.Description,
                    PermissionCode = permissionCode,
                    IsSensitivePayload = controllerType.GetCustomAttribute<SensitivePayload>() != null
                                        || methodInfo.GetCustomAttribute<SensitivePayload>() != null,
                };
            });
        }

        private static async Task<string> ReadRequestBodyAsync(HttpRequest request)
        {
            try
            {
                if (request.Body == null || !request.Body.CanSeek)
                    return null;

                request.Body.Position = 0;
                using var reader = new StreamReader(request.Body, Encoding.UTF8, detectEncodingFromByteOrderMarks: false, leaveOpen: true);
                var body = await reader.ReadToEndAsync();
                request.Body.Position = 0;

                if (string.IsNullOrWhiteSpace(body))
                    return null;

                if (body.Length > MAX_PAYLOAD_LENGTH)
                    body = body.Substring(0, MAX_PAYLOAD_LENGTH) + "...[truncated]";

                return body;
            }
            catch
            {
                return null;
            }
        }

        private static string GetClientIpAddress(HttpContext context)
        {
            // 1. Uu tien X-Forwarded-For (reverse proxy: IIS/Nginx)
            var forwardedFor = context.Request.Headers["X-Forwarded-For"].FirstOrDefault();
            if (!string.IsNullOrEmpty(forwardedFor))
                return forwardedFor.Split(',')[0].Trim();

            // 2. Lay IP tu connection
            var ip = context.Connection.RemoteIpAddress;
            if (ip == null)
                return "Unknown";

            // 3. Neu la IPv6-mapped IPv4 (::ffff:192.168.1.5) → chuyen ve IPv4
            if (ip.IsIPv4MappedToIPv6)
                ip = ip.MapToIPv4();

            return ip.ToString();
        }

        /// <summary>
        /// Cache ket qua reflection cua tung Action — chi chay 1 lan duy nhat cho moi endpoint
        /// </summary>
        private class ActionLogMetadata
        {
            public string ControllerName { get; set; }
            public string ActionName { get; set; }
            public bool IsIgnored { get; set; }
            public bool IsForceLogged { get; set; }
            public bool IsSelectAction { get; set; }
            public string Description { get; set; }
            public string PermissionCode { get; set; }
            public bool IsSensitivePayload { get; set; }
        }
    }
}
