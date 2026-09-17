using ApiQuanLyTaiTro.Middleware;
using Models;
using System.Runtime.CompilerServices;

namespace ApiQuanLyTaiTro.Common
{
    /// <summary>
    /// 🔴 CỬA DUY NHẤT biến một <see cref="Exception"/> thành response gửi client.
    /// </summary>
    /// <remarks>
    /// <para>
    /// LUẬT (P2a, 2026-09-17): <b>chữ của một Exception KHÔNG BAO GIỜ rời máy chủ.</b> Client chỉ nhận
    /// <see cref="THONG_BAO_LOI_CHUNG"/>; chi tiết thật (message, stack, nơi xảy ra) vào LOG.
    /// </para>
    /// <para>
    /// 🔄 Trước đây (chép từ repo cũ): <c>message = "Lỗi hệ thống: " + ex.Message</c> và KHÔNG ghi log. Hai hệ
    /// quả: (1) endpoint CÔNG KHAI trả nguyên văn "Login failed for user 'TT_APP_USER'" — tên tài khoản SQL,
    /// tên bảng, cấu trúc câu lệnh cho người không đăng nhập; (2) lỗi đã bị <c>catch</c> ở service thì không
    /// tới middleware, nên không nơi nào ghi lại nó. Ở repo cũ mọi endpoint nằm sau <c>[Authorize]</c> nên (1)
    /// ít nguy; ở đây thì không.
    /// </para>
    /// <para>
    /// PHÂN BIỆT LỖI HỆ THỐNG VỚI LỖI NGHIỆP VỤ — THEO ĐƯỜNG ĐI, KHÔNG THEO NỘI DUNG:
    /// · Lỗi NGHIỆP VỤ = service TỰ dựng response với mã cụ thể (<c>DATA_NULL</c>, <c>INPUTDATA_ERROR</c>…) và câu
    ///   viết sẵn trong code. Không đi qua Exception nào ⇒ không đi qua file này ⇒ không bị che.
    /// · Lỗi HỆ THỐNG = mọi thứ tới được <c>catch</c> ⇒ luôn <c>SYSTEM_ERROR</c> + câu chung.
    /// ⚠️ Hệ quả cho người viết code sau: ĐỪNG <c>throw new Exception("Ảnh vượt quá 2 MB")</c> để báo lỗi cho
    ///    người dùng — câu đó sẽ bị che thành câu chung. Báo lỗi nghiệp vụ bằng cách dựng response. Che nhầm
    ///    một câu nghiệp vụ là hỏng về phía AN TOÀN; lộ nhầm một câu hệ thống thì không.
    /// </para>
    /// </remarks>
    public static class ExceptionHelper
    {
        /// <summary>Câu DUY NHẤT client thấy khi có lỗi hệ thống. Đừng ghép thêm gì từ Exception vào đây.</summary>
        public const string THONG_BAO_LOI_CHUNG = "Có lỗi xảy ra, vui lòng thử lại.";

        /// <summary>
        /// Ghi log lỗi hệ thống + gói response chuẩn (<c>SYSTEM_ERROR</c> + <see cref="THONG_BAO_LOI_CHUNG"/>).
        /// Dùng trong catch của service: <c>catch (Exception ex) { ex.ErrorSysResponse(response); }</c>
        /// </summary>
        /// <param name="noiGoi">Trình biên dịch tự điền tên hàm gọi — KHÔNG truyền tay.</param>
        /// <param name="tepGoi">Trình biên dịch tự điền đường dẫn file gọi — KHÔNG truyền tay.</param>
        public static void ErrorSysResponse<T>(this Exception ex, ResponseBase<T> response,
            [CallerMemberName] string noiGoi = "", [CallerFilePath] string tepGoi = "")
        {
            GhiLogLoiHeThong(ex, $"{Path.GetFileNameWithoutExtension(tepGoi)}.{noiGoi}");

            response.is_success = false;
            response.code = ResponseCode.SYSTEM_ERROR;
            response.message = THONG_BAO_LOI_CHUNG;
            // Xoá data: service có thể đã gán một phần trước khi nổ — không trả nửa kết quả kèm câu "có lỗi".
            response.data = default;
        }

        /// <summary>
        /// Ghi chi tiết lỗi hệ thống phía máy chủ. Không bao giờ ném — ghi log hỏng không được làm hỏng response.
        /// </summary>
        /// <remarks>
        /// ⚠️ Serilog chỉ được cấu hình khi <c>EnableRequestLog = true</c> (<see cref="SerilogConfig"/>); tắt cờ đó
        ///    thì <c>Log.Logger</c> là logger CÂM và lỗi biến mất không dấu vết. Nên khi cờ tắt thì ghi ra
        ///    stderr — thấy được trong cửa sổ <c>dotnet run</c> và log dịch vụ.
        /// </remarks>
        public static void GhiLogLoiHeThong(Exception ex, string noiXayRa)
        {
            try
            {
                if (SerilogConfig.IsEnabled)
                    Serilog.Log.Error(ex, "Lỗi hệ thống tại {NoiXayRa}", noiXayRa);
                else
                    // Chữ KHÔNG DẤU có chủ đích: console Windows không ở UTF-8 in "Lỗi hệ thống" thành "L?i h? th?ng"
                    // (đo thật P2a) — và `grep` tìm tiền tố này cũng trượt.
                    Console.Error.WriteLine($"[LOI HE THONG] {DateTime.Now:yyyy-MM-dd HH:mm:ss} tai {noiXayRa}: {ex}");
            }
            catch { /* ghi log hỏng thì bỏ qua */ }
        }
    }
}
