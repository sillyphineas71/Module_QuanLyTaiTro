using ApiQuanLyTaiTro.Common;
using ApiQuanLyTaiTro.Repositories.KhaiTaiTro;
using ApiQuanLyTaiTro.Services.Base;
using Models;
using Models.Request.TaiTro;

namespace ApiQuanLyTaiTro.Services.KhaiTaiTro
{
    /// <summary>
    /// Cài đặt <see cref="IKhaiTaiTroService"/> — đường GHI đầu tiên của cổng, và lần đầu nhận FILE từ người dùng.
    /// </summary>
    public class KhaiTaiTroService : BaseService, IKhaiTaiTroService
    {
        // ═══════════════════════════════════════════════════════════════════════════════════════
        // TRẦN ẢNH CHUYỂN KHOẢN — ảnh CK là ẢNH CHỤP MÀN HÌNH ĐIỆN THOẠI (đôi khi là ảnh chụp biên lai)
        // ═══════════════════════════════════════════════════════════════════════════════════════
        // · 5 MB / ảnh: chụp màn hình PNG của máy màn cao nhất (1440×3200, 1290×2796) thường 1–3 MB, hiếm khi
        //   quá 4 MB; ảnh chụp biên lai bằng camera 12 MP (JPEG) ~2–4 MB. 5 MB đủ cho cả hai; ảnh 50 MP gốc
        //   (8–12 MB) bị từ chối — câu báo gợi ý gửi ảnh chụp màn hình.
        // · 5 ảnh / lượt: một giao dịch thường 1–2 ảnh (màn xác nhận + chi tiết); 5 cho ca tài trợ nhiều lần gộp.
        // · TỔNG 7,5 MB / lượt: PHẢI dưới trần tầng vận chuyển 8 MB (Program.cs, và [RequestSizeLimit] ở controller).
        //   Để tổng = 8 MB thì một lượt "vừa đúng trần" bị Kestrel cắt với lỗi 413 trống trơn — thân multipart còn
        //   có ranh giới + các trường chữ. 0,5 MB chừa cho phần đó; lượt vượt nhận câu tiếng Việt thay vì 413.
        // · Mỗi cạnh ≤ 10.000 px và ≤ 40 triệu điểm ảnh: màn hình điện thoại < 4 triệu, ảnh 12 MP = 12 triệu. Trần
        //   điểm ảnh chặn "bom giải nén": file nhỏ khai kích thước khổng lồ — server không giải mã, nhưng TRÌNH DUYỆT
        //   của quản trị thì có (P5), và một tab treo khi mở hàng đợi duyệt là đủ để phá luồng duyệt.
        // · Mỗi cạnh ≥ 100 px: ảnh 1×1 / icon không phải ảnh chuyển khoản.
        private const long TRAN_MOI_ANH = 5 * 1024 * 1024;
        private const long TRAN_TONG = 7_864_320;                 // 7,5 MB
        private const int SO_ANH_TOI_DA = 5;
        private const int TRAN_CANH = 10_000;
        private const long TRAN_DIEM_ANH = 40_000_000;
        private const int CANH_TOI_THIEU = 100;

        /// <summary>Đuôi tên file được nhận (kiểm TRƯỚC magic-byte). 🔴 KHÔNG có .svg/.gif — xem AnhHelper.</summary>
        private static readonly HashSet<string> DUOI_CHO_PHEP = new(StringComparer.OrdinalIgnoreCase) { ".jpg", ".jpeg", ".png", ".webp" };

        /// <summary>
        /// Claim mà JWT CỰU SV (P4) sẽ mang. 🔴 Lô P4 PHÁT token phải dùng ĐÚNG tên này — hằng số để hai nơi
        /// không trôi khỏi nhau. Chưa token nào mang claim này ⇒ hiện luôn NULL (khách).
        /// </summary>
        public const string CLAIM_ID_TAI_KHOAN_CSV = "id_tai_khoan_csv";

        private readonly string _thuMucAnh;

        public KhaiTaiTroService(IServiceProvider serviceProvider) : base(serviceProvider)
        {
            // 🔴 THƯ MỤC KHÔNG ĐƯỢC PHỤC VỤ TĨNH. Program.cs phục vụ công khai `Assets/Upload` tại /Assets/Upload ⇒
            //    lưu ảnh CK ở đó là ai có URL cũng xem được ảnh ngân hàng của người tài trợ (kể cả người chọn ẩn danh).
            //    DDL TT_AnhChuyenKhoan đã ghi: "Tệp ảnh cũng KHÔNG được phục vụ ở cùng đường tĩnh công khai".
            //    Quản trị xem ảnh qua endpoint CÓ [Authorize] ở P5. Mất khi deploy — docs/03 N26.
            var env = serviceProvider.GetRequiredService<IWebHostEnvironment>();
            _thuMucAnh = Path.Combine(env.ContentRootPath, "Assets", "RiengTu", "AnhChuyenKhoan");
        }

        public async Task<Response> KhaiTaiTro(int idChuongTrinh, KhaiTaiTroRequest request, IReadOnlyList<IFormFile>? anh)
        {
            var response = new Response();
            var fileDaGhi = new List<string>();   // đường dẫn đầy đủ — để dọn nếu ghi DB hỏng
            bool daGhiDb = false;
            try
            {
                if (idChuongTrinh <= 0) return KhongNhanKhai(response);

                // ── 1. Kiểm CHỮ trước (rẻ), rồi mới đọc ẢNH (đắt) ──
                var loiKhai = KiemDuLieuKhai(idChuongTrinh, request, out string? loiChu);
                if (loiKhai == null) return LoiDauVao(response, loiChu!);

                // ── 2. Kiểm HẾT mọi ảnh TRONG BỘ NHỚ — chưa ghi byte nào xuống đĩa ──
                var (anhDaKiem, loiAnh) = await KiemAnh(anh);
                if (anhDaKiem == null) return LoiDauVao(response, loiAnh!);

                // ── 3. Thứ tự GHI: FILE TRƯỚC, DB SAU (lý do: khối cuối file) ──
                Directory.CreateDirectory(_thuMucAnh);
                var tenFile = new List<string>(anhDaKiem.Count);
                foreach (var a in anhDaKiem)
                {
                    string ten = $"{Guid.NewGuid():N}.{a.Duoi}";
                    string duongDan = Path.Combine(_thuMucAnh, ten);
                    // CreateNew: trùng tên (không thể với GUID, nhưng nếu có) thì NÉM, không ghi đè ảnh của người khác.
                    await using (var ra = new FileStream(duongDan, FileMode.CreateNew, FileAccess.Write))
                    {
                        fileDaGhi.Add(duongDan);
                        await ra.WriteAsync(a.Byte);
                    }
                    tenFile.Add(ten);
                }

                int idLoiKhai = await _repositoryWrapper.KhaiTaiTro.TaoLoiKhai(loiKhai, tenFile);
                if (idLoiKhai <= 0) return KhongNhanKhai(response);   // finally dọn file — DB không ghi gì
                daGhiDb = true;

                // KHÔNG trả id lời khai: endpoint công khai, id tăng dần — trả ra là cho đếm được hàng đợi duyệt.
                response.message = "Đã gửi thông tin tài trợ. Khoa sẽ đối chiếu với sao kê và xác nhận.";
                return response;
            }
            catch (Exception ex)
            {
                ex.ErrorSysResponse(response);
                return response;
            }
            finally
            {
                // DB KHÔNG ghi (từ chối / lỗi) ⇒ xoá mọi file vừa ghi. Xoá hỏng thì nuốt: file mồ côi vô hại hơn một
                // lỗi che mất câu trả lời thật (docs/03 N26 — dọn định kỳ).
                if (!daGhiDb)
                    foreach (var f in fileDaGhi)
                        try { File.Delete(f); } catch { /* mồ côi — xem N26 */ }
            }
        }

        // ═══════════════════════════════════════════════════════════════════════════════════════
        // 🔴 VÌ SAO FILE TRƯỚC, DB SAU (ca TẠO — khác ca XOÁ ở repo cũ "DB trước, xoá file sau")
        // ═══════════════════════════════════════════════════════════════════════════════════════
        //   FILE trước, DB sau — hỏng giữa chừng để lại FILE MỒ CÔI: ảnh trên đĩa, không dòng nào trỏ tới.
        //     · Không ai thấy (thư mục không phục vụ tĩnh), không màn nào vỡ, người khai nhận lỗi và gửi lại được.
        //     · Tốn đĩa; dọn được bằng so thư mục ↔ TT_AnhChuyenKhoan. finally ở trên còn xoá ngay trong đa số ca.
        //   DB trước, file sau — hỏng giữa chừng để lại DÒNG TRỎ VÀO HƯ KHÔNG: lời khai "chờ duyệt" có ảnh không mở được.
        //     · HIỆN RA trong hàng đợi duyệt: quản trị thấy lời khai mà không có chứng cứ ⇒ không duyệt được, không
        //       biết người khai có gửi ảnh hay không. Sửa phải ghi DB lần nữa (xoá dòng) — một lệnh ghi cũng có thể hỏng.
        //   ⇒ Hỏng kiểu 1 VÔ HÌNH và tự dọn được; kiểu 2 HIỆN RA ở đúng người phải ra quyết định. Chọn kiểu 1.
        //   Ca XOÁ ở repo cũ ngược lại vì hỏng kiểu nào thì DB vẫn là nguồn sự thật: xoá DB trước ⇒ file thừa (vô hình).
        //   Cùng một nguyên tắc: để phần hỏng rơi vào FILE THỪA, không bao giờ vào DÒNG THIẾU FILE.
        // ⚠️ Kiểm HẾT ảnh trong bộ nhớ TRƯỚC khi ghi file nào: ảnh thứ 3 hỏng thì chưa có gì để dọn.
        // ═══════════════════════════════════════════════════════════════════════════════════════

        /// <summary>
        /// Kiểm dữ liệu chữ THEO LOẠI nhà tài trợ, trả bản đã chuẩn hoá — hoặc null kèm câu lỗi tiếng Việt.
        /// </summary>
        /// <remarks>
        /// 🔴 ĐỘ DÀI KIỂM Ở ĐÂY, KHÔNG TRÔNG VÀO SP: tham số SP khai NVARCHAR(n) cắt ÂM THẦM phần vượt — "Công ty ABC
        /// …(350 ký tự)" lưu thành 300 ký tự đầu, không lỗi nào báo. Bài học repo cũ. Số ở <see cref="DO_DAI"/> khớp DDL.
        /// </remarks>
        private LoiKhaiDaKiem? KiemDuLieuKhai(int idChuongTrinh, KhaiTaiTroRequest r, out string? loi)
        {
            loi = null;

            if (r.loai is not (1 or 2 or 3)) { loi = "Chọn loại nhà tài trợ: cá nhân, tập thể hoặc doanh nghiệp."; return null; }
            if (r.muc_an_danh is not (0 or 1 or 2)) { loi = "Chọn mức hiển thị tên trên danh sách công khai."; return null; }
            byte loai = (byte)r.loai.Value;

            string? hoTen = Sach(r.ho_ten_don_vi);
            string? tenHe = Sach(r.ten_he), tenKhoa = Sach(r.ten_khoa), nienKhoa = Sach(r.nien_khoa), tenLop = Sach(r.ten_lop);
            string? email = Sach(r.email_lien_he);
            string? sdt = string.IsNullOrWhiteSpace(r.sdt_lien_he) ? null : PhoneValidation.NormalizePhone(r.sdt_lien_he);

            if (hoTen == null)
            {
                loi = loai == 1 ? "Nhập họ tên." : loai == 2 ? "Nhập tên tập thể / lớp." : "Nhập tên doanh nghiệp.";
                return null;
            }

            // ── Theo loại. 🔴 Không bắt buộc chung: doanh nghiệp không có ngày sinh hay lớp. ──
            //    Gửi trường KHÔNG thuộc loại đó ⇒ TỪ CHỐI, không lặng lẽ vứt: vứt đi là đoán ý người dùng.
            switch (loai)
            {
                case 1: // Cá nhân — ngày sinh BẮT BUỘC (mẫu sếp: "Ngày sinh *", CLAUDE.md §5 lớp 3). Hệ/khoa/khoá/lớp tuỳ:
                        // nhà tài trợ không bắt buộc là cựu SV.
                    if (r.ngay_sinh == null) { loi = "Nhập ngày sinh."; return null; }
                    if (r.ngay_sinh.Value.Date > DateTime.Today || r.ngay_sinh.Value.Year < 1900)
                    { loi = "Ngày sinh không hợp lệ."; return null; }
                    break;
                case 2: // Tập thể / lớp — KHÔNG ngày sinh. Hệ/khoa/khoá/lớp ĐƯỢC PHÉP ("Tập thể lớp K39A" có lớp, khoá).
                    if (r.ngay_sinh != null) { loi = "Tập thể không có ngày sinh — bỏ trống trường này."; return null; }
                    break;
                case 3: // Doanh nghiệp — không ngày sinh, không hệ/khoa/khoá/lớp.
                    if (r.ngay_sinh != null || tenHe != null || tenKhoa != null || nienKhoa != null || tenLop != null)
                    { loi = "Doanh nghiệp không khai ngày sinh, hệ, khoa, khoá, lớp — bỏ trống các trường này."; return null; }
                    break;
            }

            // ── Độ dài — khớp cột DDL TT_NhaTaiTro ──
            if (!VuaCot(hoTen, DO_DAI.HoTen, "Tên", out loi)
                || !VuaCot(tenHe, DO_DAI.TenHe, "Hệ", out loi) || !VuaCot(tenKhoa, DO_DAI.TenKhoa, "Khoa", out loi)
                || !VuaCot(nienKhoa, DO_DAI.NienKhoa, "Khoá", out loi) || !VuaCot(tenLop, DO_DAI.TenLop, "Lớp", out loi)
                || !VuaCot(email, DO_DAI.Email, "Email", out loi) || !VuaCot(sdt, DO_DAI.Sdt, "Số điện thoại", out loi))
                return null;

            // ── Liên hệ — BẮT BUỘC ÍT NHẤT MỘT trong hai (lead chốt 2026-09-17), có thì phải đúng dạng ──
            //    Vì sao: người khai KHÔNG xem được ly_do_tu_choi (CLAUDE.md §5) — kênh báo lại là NGƯỜI của Khoa, nên phải
            //    có đường liên lạc. Không bắt cả hai: nhiều người chỉ muốn để lại một.
            //    🔄 P3a bản đầu: cả hai tuỳ chọn.
            if (email == null && sdt == null)
            { loi = "Cần ít nhất một cách liên hệ: nhập email hoặc số điện thoại (không bắt buộc cả hai)."; return null; }
            if (email != null && !EmailValidation.IsValidEmailFormat(email)) { loi = "Email không đúng định dạng."; return null; }
            if (sdt != null && !PhoneValidation.IsValidNormalizedPhone(sdt)) { loi = "Số điện thoại không đúng định dạng (9–11 chữ số)."; return null; }

            return new LoiKhaiDaKiem
            {
                IdChuongTrinh = idChuongTrinh,
                Loai = loai,
                HoTenDonVi = hoTen,
                NgaySinh = loai == 1 ? r.ngay_sinh!.Value.Date : null,
                TenHe = tenHe, TenKhoa = tenKhoa, NienKhoa = nienKhoa, TenLop = tenLop,
                EmailLienHe = email,
                SdtLienHe = sdt,
                MucAnDanh = (byte)r.muc_an_danh!.Value,
                IdTaiKhoanCsv = LayIdTaiKhoanCsvTuPhien(),
            };
        }

        /// <summary>Độ dài cột TT_NhaTaiTro (DB_Setup/Tables/TT_NhaTaiTro.sql). Đổi DDL ⇒ đổi ở đây.</summary>
        private static class DO_DAI
        {
            public const int HoTen = 300, TenHe = 200, TenKhoa = 200, NienKhoa = 50, TenLop = 100, Email = 256, Sdt = 20;
        }

        /// <summary>
        /// 🔴 id tài khoản cựu SV LẤY TỪ PHIÊN (claim JWT đã được middleware xác thực), KHÔNG BAO GIỜ từ request.
        /// </summary>
        /// <remarks>
        /// Nhận từ request thì ai cũng gắn lời khai vào tài khoản người khác — và "Lịch sử tài trợ của tôi" của người
        /// đó hiện lời khai lạ. Request DTO cố ý không có trường này.
        /// ⚠️ Hiện LUÔN null: chưa có đăng nhập cựu SV (P4). Token quản trị không mang claim này ⇒ cũng null.
        /// ⚠️ P4 PHẢI thêm ở đây: kiểm lại CSV_TaiKhoan còn sống (is_deleted = 0 AND trang_thai = 1 AND vai_tro IN (2,3)) —
        ///    token còn hạn không có nghĩa tài khoản bên kia còn hợp lệ (docs/01 §2). Chưa có SP cho việc đó.
        /// </remarks>
        private int? LayIdTaiKhoanCsvTuPhien()
        {
            var user = _serviceWrapper.HttpContextAccessor?.HttpContext?.User;
            if (user?.Identity?.IsAuthenticated != true) return null;
            string? giaTri = user.FindFirst(CLAIM_ID_TAI_KHOAN_CSV)?.Value;
            return int.TryParse(giaTri, out int id) && id > 0 ? id : null;
        }

        private sealed record AnhDaKiem(byte[] Byte, string Duoi);

        /// <summary>
        /// Kiểm MỌI ảnh, đọc HẾT vào bộ nhớ. Trả danh sách đã kiểm, hoặc null kèm câu lỗi. KHÔNG ghi đĩa.
        /// </summary>
        /// <remarks>
        /// Năm hàng rào, theo thứ tự rẻ → đắt: số lượng · dung lượng (từ header multipart, chưa đọc byte nào) ·
        /// đuôi tên · magic-byte · kích thước điểm ảnh. Đọc hết vào RAM chấp nhận được: tổng ≤ 7,5 MB/lượt.
        /// </remarks>
        private static async Task<(List<AnhDaKiem>? ds, string? loi)> KiemAnh(IReadOnlyList<IFormFile>? anh)
        {
            var dsAnh = (anh ?? Array.Empty<IFormFile>()).Where(f => f != null).ToList();
            if (dsAnh.Count == 0) return (null, "Tải lên ít nhất một ảnh chuyển khoản.");
            if (dsAnh.Count > SO_ANH_TOI_DA) return (null, $"Tối đa {SO_ANH_TOI_DA} ảnh cho một lần gửi.");

            // Dung lượng — trước khi đọc byte nào.
            long tong = 0;
            for (int i = 0; i < dsAnh.Count; i++)
            {
                var f = dsAnh[i];
                if (f.Length == 0) return (null, $"Ảnh thứ {i + 1} rỗng.");
                if (f.Length > TRAN_MOI_ANH)
                    return (null, $"Ảnh thứ {i + 1} vượt quá {TRAN_MOI_ANH / 1024 / 1024} MB. Hãy gửi ảnh chụp màn hình thay vì ảnh chụp bằng máy ảnh.");
                tong += f.Length;
            }
            if (tong > TRAN_TONG) return (null, "Tổng dung lượng ảnh vượt quá 7,5 MB. Hãy bớt ảnh hoặc gửi ảnh chụp màn hình.");

            var kq = new List<AnhDaKiem>(dsAnh.Count);
            for (int i = 0; i < dsAnh.Count; i++)
            {
                var f = dsAnh[i];

                // Đuôi tên — do người dùng đặt, KHÔNG tin; chỉ là cửa chặn sớm cho .svg/.gif/.pdf/.heic.
                // 🔴 Tên gốc KHÔNG được dùng ở bất cứ đâu khác: không lưu, không log, không ghép đường dẫn.
                string duoi = Path.GetExtension(f.FileName ?? string.Empty);
                if (!DUOI_CHO_PHEP.Contains(duoi))
                    return (null, $"Ảnh thứ {i + 1} không đúng định dạng. Chỉ nhận JPG, PNG hoặc WEBP.");

                byte[] noiDung;
                await using (var vao = f.OpenReadStream())
                using (var ms = new MemoryStream((int)f.Length))
                {
                    await vao.CopyToAsync(ms);
                    noiDung = ms.ToArray();
                }

                // Magic-byte — định dạng THẬT. Đuôi đổi được bằng một cú đổi tên; header thì không.
                var thongTin = AnhHelper.Doc(noiDung.Length > AnhHelper.SO_BYTE_DOC_HEADER
                    ? noiDung[..AnhHelper.SO_BYTE_DOC_HEADER]
                    : noiDung);
                if (!thongTin.HopLe)
                    return (null, $"Ảnh thứ {i + 1} không phải ảnh hợp lệ. Chỉ nhận JPG, PNG hoặc WEBP.");

                if (thongTin.Rong > TRAN_CANH || thongTin.Cao > TRAN_CANH || (long)thongTin.Rong * thongTin.Cao > TRAN_DIEM_ANH)
                    return (null, $"Ảnh thứ {i + 1} ({thongTin.Rong}×{thongTin.Cao}) quá lớn.");
                if (thongTin.Rong < CANH_TOI_THIEU || thongTin.Cao < CANH_TOI_THIEU)
                    return (null, $"Ảnh thứ {i + 1} ({thongTin.Rong}×{thongTin.Cao}) quá nhỏ để đối chiếu.");

                // Đuôi LƯU lấy từ định dạng THẬT, không từ tên gửi lên: "anh.png" mà thật là JPEG ⇒ lưu ".jpg".
                kq.Add(new AnhDaKiem(noiDung, thongTin.DuoiThat));
            }
            return (kq, null);
        }

        // ── Tiện ích ─────────────────────────────────────────────────────────────────────────────

        /// <summary>Trim; rỗng/toàn khoảng trắng ⇒ null (một trạng thái "không khai", không ba).</summary>
        private static string? Sach(string? s) => string.IsNullOrWhiteSpace(s) ? null : s.Trim();

        private static bool VuaCot(string? giaTri, int toiDa, string nhan, out string? loi)
        {
            loi = giaTri != null && giaTri.Length > toiDa ? $"{nhan} dài quá {toiDa} ký tự." : null;
            return loi == null;
        }

        private static Response LoiDauVao(Response r, string loi)
        {
            r.is_success = false;
            r.code = ResponseCode.INPUTDATA_ERROR;
            r.message = loi;
            return r;
        }

        /// <summary>
        /// 🔴 MỘT câu cho MỌI ca "không nhận khai": không tồn tại · nháp · đã xoá · đã kết thúc. Khác một chữ là dò được
        /// chương trình nháp (cùng luật TaiTroService.KhongTimThay, P2a).
        /// </summary>
        private static Response KhongNhanKhai(Response r)
        {
            r.is_success = false;
            r.code = ResponseCode.DATA_NULL;
            r.message = "Chương trình không tồn tại hoặc không còn nhận tài trợ.";
            r.data = null;
            return r;
        }
    }
}
