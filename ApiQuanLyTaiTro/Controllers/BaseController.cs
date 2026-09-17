using ApiQuanLyTaiTro.Filters;
using ApiQuanLyTaiTro.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Data;
using System.Security.Claims;

namespace ApiQuanLyTaiTro.Controllers
{
    /// <summary>
    /// BaseController cho toàn bộ API.
    /// 
    /// Đặc điểm quan trọng:
    /// - Constructor luôn TRỐNG (không nhận tham số DI).
    /// - ServiceWrapper được lấy qua Service Locator từ HttpContext.RequestServices
    ///   thay vì constructor injection, để giữ cho Controller con không phụ thuộc
    ///   vào thứ tự khai báo parameter.
    /// </summary>
    [ApiController]
    [SecurityHeaders]
    [Authorize]
    public abstract class BaseController : ControllerBase
    {
        /// <summary>
        /// Truy cập Service Wrapper thông qua Service Locator.
        /// Mọi Controller con gọi nghiệp vụ qua đây: ServiceWrapper.TenNghiepVu...
        /// </summary>
        protected readonly IServiceWrapper _serviceWrapper;

        public BaseController(IServiceWrapper serviceWrapper)
        {
            this._serviceWrapper = serviceWrapper;
        }

        // ====================================================================
        // Response Helpers – chuẩn hoá format trả về
        // ====================================================================

        /// <summary>Trả về success=true, không có data.</summary>
        protected IActionResult OK()
            => Ok(new { success = true });

        /// <summary>Trả về success=true kèm data object.</summary>
        protected IActionResult OK(object? data)
            => Ok(new { success = true, data });

        /// <summary>Trả về success=true kèm DataTable (dữ liệu từ SP).</summary>
        protected IActionResult OK(DataTable data)
            => Ok(new { success = true, data });

        /// <summary>Trả về success=true kèm message thông báo.</summary>
        protected IActionResult OKMessage(string message)
            => Ok(new { success = true, message });

        /// <summary>Trả về success=false kèm thông báo lỗi.</summary>
        protected IActionResult BadRequest(string message = "")
            => base.BadRequest(new { success = false, message });

        // ====================================================================
        // Auth Helpers
        // ====================================================================

        /// <summary>
        /// Lấy UserID từ JWT Claims (đã được AddJwtBearer verify).
        /// Claim name khớp với lúc JwtTokenService.GenerateToken() sinh ra: ClaimTypes.NameIdentifier.
        /// </summary>
        protected string GetUserId()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier);
            return claim?.Value ?? string.Empty;
        }

        /// <summary>
        /// Lấy raw Bearer token từ Authorization header.
        /// </summary>
        protected string GetAccessToken()
        {
            var auth = HttpContext.Request.Headers["Authorization"].ToString();
            return auth.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase)
                ? auth["Bearer ".Length..]
                : auth;
        }
    }
}
