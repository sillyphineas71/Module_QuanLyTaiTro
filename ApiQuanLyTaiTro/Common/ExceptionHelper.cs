using Models;

namespace ApiQuanLyTaiTro.Common
{
    public static class ExceptionHelper
    {
        /// <summary>
        /// Gói lỗi kỹ thuật vào response chuẩn (is_success=false + mã lỗi hệ thống).
        /// Dùng trong catch của service: catch (Exception ex) { ex.ErrorSysResponse(response); }
        /// </summary>
        public static void ErrorSysResponse<T>(this Exception ex, ResponseBase<T> response)
        {
            response.is_success = false;
            response.code = ResponseCode.SYSTEM_ERROR;
            response.message = ResponseDetail.SYSTEM_ERRORDETAIL + ": " + ex.Message;
        }
    }
}