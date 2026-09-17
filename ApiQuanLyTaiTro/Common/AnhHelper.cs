namespace ApiQuanLyTaiTro.Common
{
    /// <summary>Kết quả nhận dạng một tệp ảnh.</summary>
    public class KetQuaDocAnh
    {
        /// <summary>Phần mở rộng THẬT, suy từ magic-byte: "jpg" · "png" · "webp". Rỗng = không nhận ra.</summary>
        public string DuoiThat { get; set; } = "";
        public int Rong { get; set; }
        public int Cao { get; set; }
        public bool HopLe => DuoiThat.Length > 0 && Rong > 0 && Cao > 0;
    }

    /// <summary>
    /// Nhận dạng ảnh bằng MAGIC-BYTE và đọc kích thước từ phần đầu tệp — KHÔNG dùng thư viện ảnh.
    ///
    /// <para>
    /// 🔴 VÌ SAO TỰ ĐỌC HEADER THAY VÌ THÊM MỘT GÓI (ImageSharp/SkiaSharp):
    /// ta chỉ cần đúng HAI dữ kiện — định dạng thật và kích thước — và cả hai nằm trong vài chục
    /// byte đầu tệp. Thêm một thư viện xử lý ảnh là thêm một bề mặt giải mã ảnh do người dùng tải
    /// lên (chính là loại thư viện hay có CVE), ngay sau lô gỡ 23 gói ở D4.
    /// <c>System.Drawing</c> thì không dùng được: nó chỉ chạy trên Windows và đã bị đánh dấu lỗi
    /// thời trên .NET 8.
    /// </para>
    ///
    /// <para>
    /// ⚠️ Ở đây KHÔNG giải mã điểm ảnh, nên nó KHÔNG chứng minh tệp là ảnh hợp lệ hoàn toàn —
    /// chỉ chứng minh phần đầu tệp đúng khuôn một trong ba định dạng cho phép. Đó là mức bảo vệ
    /// cần thiết cho bài toán này: chặn tệp giả đuôi (đổi .exe thành .jpg) và chặn SVG.
    /// </para>
    /// </summary>
    public static class AnhHelper
    {
        /// <summary>
        /// Số byte đầu tệp cần đọc. 64 KB đủ cho mọi header: PNG cần 24 byte; WebP cần ~30;
        /// JPEG thì đoạn SOF có thể nằm sau vài đoạn EXIF/ICC lớn nên cần nhiều hơn hẳn.
        /// </summary>
        public const int SO_BYTE_DOC_HEADER = 64 * 1024;

        public static KetQuaDocAnh Doc(byte[] dau)
        {
            var kq = new KetQuaDocAnh();
            if (dau == null || dau.Length < 16) return kq;

            if (LaPng(dau)) { kq.DuoiThat = "png"; DocKichThuocPng(dau, kq); return kq; }
            if (LaJpeg(dau)) { kq.DuoiThat = "jpg"; DocKichThuocJpeg(dau, kq); return kq; }
            if (LaWebp(dau)) { kq.DuoiThat = "webp"; DocKichThuocWebp(dau, kq); return kq; }

            // KHÔNG có nhánh SVG. SVG là XML, có thể chứa <script> và phục vụ từ cùng origin thì
            // script đó chạy trong ngữ cảnh của cổng. Không nhận, không cần nhận.
            return kq;
        }

        // ── Nhận dạng ────────────────────────────────────────────────────────────────────────

        private static bool LaPng(byte[] b) =>
            b.Length >= 8 &&
            b[0] == 0x89 && b[1] == 0x50 && b[2] == 0x4E && b[3] == 0x47 &&
            b[4] == 0x0D && b[5] == 0x0A && b[6] == 0x1A && b[7] == 0x0A;

        private static bool LaJpeg(byte[] b) =>
            b.Length >= 3 && b[0] == 0xFF && b[1] == 0xD8 && b[2] == 0xFF;

        private static bool LaWebp(byte[] b) =>
            b.Length >= 12 &&
            b[0] == 'R' && b[1] == 'I' && b[2] == 'F' && b[3] == 'F' &&
            b[8] == 'W' && b[9] == 'E' && b[10] == 'B' && b[11] == 'P';

        // ── Kích thước ───────────────────────────────────────────────────────────────────────

        /// <summary>PNG: IHDR luôn là chunk ĐẦU TIÊN, width/height là 2 số 4 byte big-endian.</summary>
        private static void DocKichThuocPng(byte[] b, KetQuaDocAnh kq)
        {
            if (b.Length < 24) return;
            kq.Rong = DocBe32(b, 16);
            kq.Cao = DocBe32(b, 20);
        }

        /// <summary>
        /// JPEG: duyệt từng đoạn (segment) tới khi gặp SOF — đoạn khai kích thước thật.
        /// <para>
        /// ⚠️ KHÔNG lấy kích thước từ EXIF: EXIF là siêu dữ liệu do máy ảnh/phần mềm ghi và có thể
        /// SAI hoặc bị sửa. SOF là thứ bộ giải mã thực sự dùng.
        /// </para>
        /// </summary>
        private static void DocKichThuocJpeg(byte[] b, KetQuaDocAnh kq)
        {
            int i = 2;
            while (i + 9 < b.Length)
            {
                if (b[i] != 0xFF) { i++; continue; }   // đồng bộ lại nếu lệch
                byte marker = b[i + 1];

                // Đoạn không có phần thân: padding (FF), RSTn (D0-D7), SOI (D8), EOI (D9).
                if (marker == 0xFF) { i++; continue; }
                if (marker == 0xD8 || marker == 0xD9 || (marker >= 0xD0 && marker <= 0xD7)) { i += 2; continue; }

                int doDai = DocBe16(b, i + 2);
                if (doDai < 2) return;   // hỏng khuôn — dừng, đừng đoán

                bool laSof =
                    (marker >= 0xC0 && marker <= 0xC3) ||
                    (marker >= 0xC5 && marker <= 0xC7) ||
                    (marker >= 0xC9 && marker <= 0xCB) ||
                    (marker >= 0xCD && marker <= 0xCF);

                if (laSof)
                {
                    // Thân đoạn SOF: [precision 1][height 2][width 2]...
                    if (i + 9 >= b.Length) return;
                    kq.Cao = DocBe16(b, i + 5);
                    kq.Rong = DocBe16(b, i + 7);
                    return;
                }

                // SOS (DA) = bắt đầu dữ liệu nén; sau đó không còn đoạn nào khai kích thước.
                if (marker == 0xDA) return;

                i += 2 + doDai;
            }
        }

        /// <summary>
        /// WebP có BA biến thể chunk, mỗi biến thể khai kích thước một kiểu khác nhau.
        /// Thiếu một nhánh là ảnh WebP hợp lệ bị từ chối với lý do "không đọc được kích thước".
        /// </summary>
        private static void DocKichThuocWebp(byte[] b, KetQuaDocAnh kq)
        {
            if (b.Length < 30) return;
            string chunk = System.Text.Encoding.ASCII.GetString(b, 12, 4);

            if (chunk == "VP8 ")
            {
                // Lossy: sau header chunk 8 byte là frame tag 3 byte, rồi mã đồng bộ 9D 01 2A.
                if (b.Length < 30 || b[23] != 0x9D || b[24] != 0x01 || b[25] != 0x2A) return;
                kq.Rong = DocLe16(b, 26) & 0x3FFF;
                kq.Cao = DocLe16(b, 28) & 0x3FFF;
            }
            else if (chunk == "VP8L")
            {
                // Lossless: 1 byte chữ ký 0x2F, rồi 4 byte gói 14 bit rộng + 14 bit cao, ĐỀU trừ 1.
                if (b.Length < 25 || b[20] != 0x2F) return;
                int bits = b[21] | (b[22] << 8) | (b[23] << 16) | (b[24] << 24);
                kq.Rong = (bits & 0x3FFF) + 1;
                kq.Cao = ((bits >> 14) & 0x3FFF) + 1;
            }
            else if (chunk == "VP8X")
            {
                // Mở rộng (có alpha/animation): 4 byte cờ, rồi 3 byte rộng-1 và 3 byte cao-1, LE.
                if (b.Length < 30) return;
                kq.Rong = (b[24] | (b[25] << 8) | (b[26] << 16)) + 1;
                kq.Cao = (b[27] | (b[28] << 8) | (b[29] << 16)) + 1;
            }
        }

        private static int DocBe32(byte[] b, int i) => (b[i] << 24) | (b[i + 1] << 16) | (b[i + 2] << 8) | b[i + 3];
        private static int DocBe16(byte[] b, int i) => (b[i] << 8) | b[i + 1];
        private static int DocLe16(byte[] b, int i) => b[i] | (b[i + 1] << 8);
    }
}
