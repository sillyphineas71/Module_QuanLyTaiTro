using System.Text;

namespace ApiQuanLyTaiTro.Common
{
    /// <summary>
    /// Chuyển nội dung mail từ VĂN BẢN THUẦN sang HTML tối thiểu.
    ///
    /// <para>🔴 GỬI THẬT VÀ GỬI THỬ PHẢI ĐI QUA ĐÚNG HÀM NÀY. Nếu hai đường dựng nội dung khác
    /// nhau thì bản gửi thử không chứng minh được gì về bản gửi thật — mà gửi thử tồn tại chính
    /// là để chứng minh điều đó trước khi bấm một nút không thu hồi được.</para>
    ///
    /// <para>Vì sao không dùng trình soạn thảo WYSIWYG: nó là dependency mới, mà repo vừa gỡ 23
    /// gói ở lô D4. Cùng lối đã chốt cho <c>CSV_TinTuc.noi_dung</c> — người soạn gõ văn bản
    /// thuần, hệ thống lo phần trình bày.</para>
    ///
    /// <para>⚠️ DB lưu bản VĂN BẢN THUẦN, không lưu chuỗi HTML hàm này sinh ra. Màn lịch sử đọc
    /// lại phải ra chữ đọc được, không phải một mớ thẻ.</para>
    /// </summary>
    public static class MailNoiDung
    {
        /// <summary>
        /// Escape rồi xuống dòng. Chỉ làm đúng hai việc đó — cố ý không hỗ trợ in đậm/liên kết.
        ///
        /// <para>Escape <c>&amp; &lt; &gt;</c> KHÔNG phải vì XSS (trình đọc mail không chạy
        /// script) mà vì HIỂN THỊ ĐÚNG: Quản lý gõ "lương &lt; 10 triệu" thì phần sau dấu
        /// <c>&lt;</c> sẽ bị nuốt mất nếu không escape. <c>&amp;</c> phải escape TRƯỚC, nếu
        /// không chính các chuỗi <c>&amp;lt;</c> vừa sinh ra lại bị escape lần nữa.</para>
        ///
        /// <para>Xử lý cả <c>\r\n</c> và <c>\n</c>: người soạn dán từ Word/Notepad trên Windows
        /// sẽ ra <c>\r\n</c>, bỏ sót thì mỗi dòng thừa một ký tự lạ.</para>
        /// </summary>
        public static string SangHtml(string? vanBanThuan)
        {
            var noiDung = vanBanThuan ?? string.Empty;

            var sb = new StringBuilder(noiDung.Length + 64);
            foreach (var c in noiDung)
            {
                switch (c)
                {
                    case '&': sb.Append("&amp;"); break;
                    case '<': sb.Append("&lt;"); break;
                    case '>': sb.Append("&gt;"); break;
                    case '\r': break;                       // bỏ, để \n phía sau lo việc xuống dòng
                    case '\n': sb.Append("<br/>"); break;
                    default: sb.Append(c); break;
                }
            }

            // Bọc một lớp div đặt font: nhiều trình đọc mail mặc định dùng font serif cỡ nhỏ.
            // KHÔNG dùng <style> hay class - phần lớn trình đọc mail gỡ bỏ chúng; chỉ style nội
            // tuyến mới sống sót.
            return "<div style=\"font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.5;color:#1F2328\">"
                 + sb.ToString()
                 + "</div>";
        }
    }
}
