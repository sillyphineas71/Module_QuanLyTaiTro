using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.Mvc;

namespace ApiQuanLyTaiTro.Filters
{
    /// <summary>
    /// Filter tự động gắn các HTTP security header vào response (X-Content-Type-Options,
    /// X-Frame-Options, Content-Security-Policy, Referrer-Policy...) để chống một số
    /// tấn công cơ bản (sniffing, clickjacking, XSS). Đã gắn sẵn ở BaseController
    /// nên mọi API kế thừa đều có. LƯU Ý: X-Frame-Options đang để "ALLOWALL" (cho nhúng
    /// iframe) — cân nhắc lại khi làm tính năng widget nhúng.
    /// </summary>
    public class SecurityHeadersAttribute: ActionFilterAttribute
    {
            // public override void OnActionExecuting(ActionExecutingContext context)
            // {
            //     var path = context.HttpContext.Request.Path;
            //     LogWriter.LogWrite(path);
            // }
            public override void OnResultExecuting(ResultExecutingContext context)
            {
                var result = context.Result;
                if (result is ViewResult || true)
                {
                    // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Content-Type-Options
                    if (!context.HttpContext.Response.Headers.ContainsKey("X-Content-Type-Options"))
                    {
                        context.HttpContext.Response.Headers.Add("X-Content-Type-Options", "nosniff");
                    }

                    // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Frame-Options
                    if (!context.HttpContext.Response.Headers.ContainsKey("X-Frame-Options"))
                    {
                        context.HttpContext.Response.Headers.Add("X-Frame-Options", "ALLOWALL");
                    }

                    // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy
                    var csp = "default-src 'self'; object-src 'none'; frame-ancestors 'none'; sandbox allow-forms allow-same-origin allow-scripts; base-uri 'self';";
                    // also consider adding upgrade-insecure-requests once you have HTTPS in place for production
                    //csp += "upgrade-insecure-requests;";
                    // also an example if you need client images to be displayed from twitter
                    // csp += "img-src 'self' https://pbs.twimg.com;";

                    // once for standards compliant browsers
                    if (!context.HttpContext.Response.Headers.ContainsKey("Content-Security-Policy"))
                    {
                        context.HttpContext.Response.Headers.Add("Content-Security-Policy", csp);
                    }
                    // and once again for IE
                    if (!context.HttpContext.Response.Headers.ContainsKey("X-Content-Security-Policy"))
                    {
                        context.HttpContext.Response.Headers.Add("X-Content-Security-Policy", csp);
                    }

                    // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Referrer-Policy
                    var referrer_policy = "no-referrer";
                    if (!context.HttpContext.Response.Headers.ContainsKey("Referrer-Policy"))
                    {
                        context.HttpContext.Response.Headers.Add("Referrer-Policy", referrer_policy);
                    }
                }
            }
        }
    }