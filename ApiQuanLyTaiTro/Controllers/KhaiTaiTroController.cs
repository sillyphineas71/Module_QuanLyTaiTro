using ApiQuanLyTaiTro.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Models;
using Models.Request.TaiTro;

namespace ApiQuanLyTaiTro.Controllers
{
    /// <summary>
    /// Nhận lời khai tài trợ từ trang CÔNG KHAI (P3a) — không cần đăng nhập.
    /// <para>
    /// 🔴 <c>[AllowAnonymous]</c> Ở CẤP CLASS LÀ BẮT BUỘC: <c>BaseController</c> mang <c>[Authorize]</c> và controller con
    /// kế thừa nó. Tách khỏi <c>TaiTroController</c> (chỉ đọc) để đường GHI công khai có trần kích thước riêng và dễ
    /// thấy khi rà soát bề mặt tấn công.
    /// </para>
    /// <para>⚠️ Controller KHÔNG chứa logic — kiểm dữ liệu, ảnh, thứ tự ghi đều ở <c>KhaiTaiTroService</c>.</para>
    /// <para>
    /// 🔴 CHƯA CÓ CHỐNG LẠM DỤNG (không rate limit) — docs/03 N25. Mỗi lượt tạo một dòng chờ duyệt + tối đa 5 file.
    /// </para>
    /// </summary>
    [Route("api/tai-tro")]
    [ApiController]
    [AllowAnonymous]
    public class KhaiTaiTroController : BaseController
    {
        /// <summary>
        /// Trần TẦNG VẬN CHUYỂN cho endpoint này: 8 MB — bằng trần toàn cục ở Program.cs, khai TƯỜNG MINH để ai nới
        /// trần toàn cục (vd. cho import Excel) không vô tình nới luôn endpoint công khai này.
        /// Service tự chặn tổng ảnh ở 7,5 MB để lượt vượt nhận câu tiếng Việt thay vì 413 trống trơn.
        /// </summary>
        private const int TRAN_THAN_REQUEST = 8 * 1024 * 1024;

        public KhaiTaiTroController(IServiceWrapper serviceWrapper) : base(serviceWrapper)
        { }

        /// <summary>
        /// Khai tài trợ cho một chương trình: dữ liệu định danh + ảnh chuyển khoản (field <c>anh</c>, 1–5 ảnh JPG/PNG/WEBP).
        /// <para>Lưu CHỜ DUYỆT, không số tiền. Chương trình không tồn tại / nháp / đã kết thúc ⇒ 404, cùng một câu.</para>
        /// </summary>
        [HttpPost("chuong-trinh/{id:int}/tai-tro")]
        [Consumes("multipart/form-data")]
        [RequestSizeLimit(TRAN_THAN_REQUEST)]
        [RequestFormLimits(
            MultipartBodyLengthLimit = TRAN_THAN_REQUEST,   // mặc định ASP.NET Core 128 MB
            ValueLengthLimit = 4 * 1024,                    // một trường chữ ≤ 4 KB (dài nhất: tên 300 ký tự ≈ 1,2 KB UTF-8); mặc định 4 MB
            ValueCountLimit = 64)]                          // ~12 trường + 5 file; mặc định 1024
        public async Task<IActionResult> KhaiTaiTro(int id, [FromForm] KhaiTaiTroRequest request, [FromForm(Name = "anh")] List<IFormFile>? anh)
        {
            var response = await _serviceWrapper.KhaiTaiTro.KhaiTaiTro(id, request, anh);
            return KetQua(response);
        }

        /// <summary>DATA_NULL ⇒ 404; còn lại theo <c>ToActionResult()</c> — chép từ TaiTroController (docs/03 N19 điểm 3).</summary>
        private static IActionResult KetQua(Response response)
            => response.code == ResponseCode.DATA_NULL
                ? new NotFoundObjectResult(response)
                : response.ToActionResult();
    }
}
