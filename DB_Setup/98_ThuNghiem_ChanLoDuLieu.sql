SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
/* =============================================================================================
   THỬ NGHIỆM HÀNH VI CHẶN LỘ DỮ LIỆU — ghi dữ liệu thử TRONG MỘT TRANSACTION RỒI ROLLBACK
   =============================================================================================
   🔴 CHỈ CHẠY TRÊN DB DEV / BẢN SAO. Không để lại dòng nào, nhưng vẫn giữ khoá bảng TT_* trong vài
      mili giây và TIÊU IDENTITY (id sau này nhảy cóc) — không đáng làm trên production.

   99_KiemTra_P1.sql chứng minh CẤU TRÚC. File này chứng minh HÀNH VI của hai lớp:
     · LỚP CÔNG KHAI (TT_CongKhai_*) — không lộ chưa duyệt / từ chối / nháp; che ẩn danh đúng.
     · LỊCH SỬ CỦA TÔI (TT_CuuSV_*)  — chỉ trả lời khai của đúng tài khoản; id NULL không mở ra lời
                                        khai của khách.
   Kết thúc bằng một dòng "PASS: ..." hoặc lỗi 50001 kèm các dòng FAIL (sqlcmd -b trả mã ≠ 0).

       sqlcmd -S <server> -E -d ESS_HOCVIENTAICHINH_DAOTAO -I -b -f 65001 -i "DB_Setup\98_ThuNghiem_ChanLoDuLieu.sql"

   Dữ liệu thử cố ý KHÔNG DẤU (tránh phụ thuộc codepage của sqlcmd).
   id_tai_khoan_csv thử là SỐ ÂM (-901, -902): CSV_TaiKhoan.id không bao giờ âm, nên trên DB đã có dữ
   liệu thật thì SP lịch sử cũng không kéo nhầm dòng thật vào phép đếm.
   ============================================================================================= */
SET NOCOUNT ON;
SET XACT_ABORT ON;

DECLARE @loi INT = 0;
DECLARE @homnay DATE = CAST(GETDATE() AS DATE);

BEGIN TRAN;

/* ── Ba chương trình: công khai hết hạn HÔM NAY (biên) · công khai đã hết hạn · NHÁP ── */
INSERT dbo.TT_ChuongTrinh (ten, phu_de, loi_keu_goi, mo_ta_day, tu_ngay, den_ngay, don_vi_to_chuc, stk, ngan_hang, ten_chu_tai_khoan, noi_dung_ck, cong_khai)
VALUES (N'TEST_P1 cong khai', N'x', N'x', N'x', DATEADD(DAY, -30, @homnay), @homnay, N'x', N'1', N'x', N'X', N'x', 1);
DECLARE @ct INT = SCOPE_IDENTITY();

INSERT dbo.TT_ChuongTrinh (ten, phu_de, loi_keu_goi, mo_ta_day, tu_ngay, den_ngay, don_vi_to_chuc, stk, ngan_hang, ten_chu_tai_khoan, noi_dung_ck, cong_khai)
VALUES (N'TEST_P1 da ket thuc', N'x', N'x', N'x', DATEADD(DAY, -30, @homnay), DATEADD(DAY, -1, @homnay), N'x', N'1', N'x', N'X', N'x', 1);
DECLARE @ct_het INT = SCOPE_IDENTITY();

INSERT dbo.TT_ChuongTrinh (ten, phu_de, loi_keu_goi, mo_ta_day, tu_ngay, den_ngay, don_vi_to_chuc, stk, ngan_hang, ten_chu_tai_khoan, noi_dung_ck, cong_khai)
VALUES (N'TEST_P1 nhap', N'x', N'x', N'x', @homnay, DATEADD(DAY, 30, @homnay), N'x', N'1', N'x', N'X', N'x', 0);
DECLARE @ct_nhap INT = SCOPE_IDENTITY();

/* ── Dự kiến chi 5000 + 7000 = 12000 cho @ct ── */
INSERT dbo.TT_DuKienChi (id_chuong_trinh, noi_dung, so_tien, thu_tu)
VALUES (@ct, N'a', 5000, 1), (@ct, N'b', 7000, 2);

/* ── Tám lượt KHÁCH khai vào @ct (id_tai_khoan_csv = NULL), mỗi lượt một ca ── */
DECLARE @A INT, @B INT, @C INT, @D INT, @E INT, @F INT, @G INT, @H INT;

-- A: đã duyệt, công khai đầy đủ                                  → HIỆN, có tên
INSERT dbo.TT_NhaTaiTro (id_chuong_trinh, loai, ho_ten_don_vi, muc_an_danh, ten_lop, trang_thai_duyet, so_tien, ngay_tai_tro)
VALUES (@ct, 1, N'Nguoi A', 0, N'K39A', 2, 1000, @homnay);  SET @A = SCOPE_IDENTITY();
-- B: CHỜ DUYỆT                                                   → KHÔNG hiện
INSERT dbo.TT_NhaTaiTro (id_chuong_trinh, loai, ho_ten_don_vi, muc_an_danh, ten_lop, ngay_tai_tro)
VALUES (@ct, 1, N'Nguoi B chua duyet', 0, N'K39A', @homnay); SET @B = SCOPE_IDENTITY();
-- C: đã duyệt, ẩn tên giữ lớp                                    → HIỆN, tên NULL, lớp còn
INSERT dbo.TT_NhaTaiTro (id_chuong_trinh, loai, ho_ten_don_vi, muc_an_danh, ten_lop, trang_thai_duyet, so_tien, ngay_tai_tro)
VALUES (@ct, 1, N'Nguoi C that', 1, N'K39A', 2, 2000, @homnay); SET @C = SCOPE_IDENTITY();
-- D: đã duyệt, ẩn tất cả                                         → HIỆN, tên + lớp NULL
INSERT dbo.TT_NhaTaiTro (id_chuong_trinh, loai, ho_ten_don_vi, muc_an_danh, ten_lop, trang_thai_duyet, so_tien, ngay_tai_tro)
VALUES (@ct, 1, N'Nguoi D that', 2, N'K40B', 2, 3000, @homnay); SET @D = SCOPE_IDENTITY();
-- E: TỪ CHỐI                                                     → KHÔNG hiện
INSERT dbo.TT_NhaTaiTro (id_chuong_trinh, loai, ho_ten_don_vi, muc_an_danh, trang_thai_duyet, ly_do_tu_choi, ngay_tai_tro)
VALUES (@ct, 1, N'Nguoi E tu choi', 0, 3, N'khong thay tien', @homnay); SET @E = SCOPE_IDENTITY();
-- F: đã duyệt, muc_an_danh LẠ (9)                                → HIỆN, CHE HẾT (hỏng về phía an toàn)
INSERT dbo.TT_NhaTaiTro (id_chuong_trinh, loai, ho_ten_don_vi, muc_an_danh, ten_lop, trang_thai_duyet, so_tien, ngay_tai_tro)
VALUES (@ct, 1, N'Nguoi F that', 9, N'K41C', 2, 4000, @homnay); SET @F = SCOPE_IDENTITY();
-- G: "đã duyệt" nhưng THIẾU số tiền (lỗi dữ liệu)                 → KHÔNG hiện
INSERT dbo.TT_NhaTaiTro (id_chuong_trinh, loai, ho_ten_don_vi, muc_an_danh, trang_thai_duyet, ngay_tai_tro)
VALUES (@ct, 1, N'Nguoi G thieu tien', 0, 2, @homnay); SET @G = SCOPE_IDENTITY();
-- H: đã duyệt nhưng XOÁ MỀM                                      → KHÔNG hiện
INSERT dbo.TT_NhaTaiTro (id_chuong_trinh, loai, ho_ten_don_vi, muc_an_danh, trang_thai_duyet, so_tien, ngay_tai_tro, is_deleted)
VALUES (@ct, 1, N'Nguoi H da xoa', 0, 2, 9999, @homnay, 1); SET @H = SCOPE_IDENTITY();

-- Lượt ĐÃ DUYỆT thuộc chương trình NHÁP                           → KHÔNG hiện ở trang công khai
INSERT dbo.TT_NhaTaiTro (id_chuong_trinh, loai, ho_ten_don_vi, muc_an_danh, trang_thai_duyet, so_tien, ngay_tai_tro)
VALUES (@ct_nhap, 1, N'Nguoi trong CT nhap', 0, 2, 5000, @homnay);

/* ── Lời khai của CỰU SV ĐĂNG NHẬP ──
   Không lượt nào ở đây được đổi kết quả của lớp công khai: X1/Y1 chờ, X2 từ chối, X3 thuộc CT nháp,
   X4 xoá mềm ⇒ FAIL 1/9 bên dưới vẫn kỳ vọng đúng 4 lượt / 10000. */
DECLARE @X1 INT, @X2 INT, @X3 INT, @X4 INT, @Y1 INT;

-- X1: cựu SV -901, CHỜ DUYỆT, khai HỘ tên người khác               → CÓ trong lịch sử -901
INSERT dbo.TT_NhaTaiTro (id_chuong_trinh, loai, ho_ten_don_vi, muc_an_danh, ngay_tai_tro, id_tai_khoan_csv)
VALUES (@ct, 1, N'Ten nguoi duoc khai ho', 1, @homnay, -901); SET @X1 = SCOPE_IDENTITY();
-- X2: cựu SV -901, TỪ CHỐI                                         → CÓ trong lịch sử -901
INSERT dbo.TT_NhaTaiTro (id_chuong_trinh, loai, ho_ten_don_vi, muc_an_danh, trang_thai_duyet, ly_do_tu_choi, ngay_tai_tro, id_tai_khoan_csv)
VALUES (@ct, 1, N'X2', 0, 3, N'noi bo', @homnay, -901); SET @X2 = SCOPE_IDENTITY();
-- X3: cựu SV -901, đã duyệt, vào chương trình NHÁP                 → CÓ trong lịch sử -901, kèm tên CT
INSERT dbo.TT_NhaTaiTro (id_chuong_trinh, loai, ho_ten_don_vi, muc_an_danh, trang_thai_duyet, so_tien, ngay_tai_tro, id_tai_khoan_csv)
VALUES (@ct_nhap, 1, N'X3', 0, 2, 700, @homnay, -901); SET @X3 = SCOPE_IDENTITY();
-- X4: cựu SV -901, XOÁ MỀM (lời khai trùng)                        → KHÔNG trong lịch sử
INSERT dbo.TT_NhaTaiTro (id_chuong_trinh, loai, ho_ten_don_vi, muc_an_danh, ngay_tai_tro, id_tai_khoan_csv, is_deleted)
VALUES (@ct, 1, N'X4', 0, @homnay, -901, 1); SET @X4 = SCOPE_IDENTITY();
-- Y1: cựu SV KHÁC (-902), chờ duyệt                                → KHÔNG trong lịch sử -901
INSERT dbo.TT_NhaTaiTro (id_chuong_trinh, loai, ho_ten_don_vi, muc_an_danh, ngay_tai_tro, id_tai_khoan_csv)
VALUES (@ct, 1, N'Y1 nguoi khac', 0, @homnay, -902); SET @Y1 = SCOPE_IDENTITY();

/* ── Khoản chi của chương trình nháp — KHÔNG được lộ ── */
INSERT dbo.TT_KhoanChi (id_chuong_trinh, noi_dung, so_tien, ngay_chi) VALUES (@ct_nhap, N'chi nhap', 100, @homnay);
INSERT dbo.TT_MinhChungChi (id_khoan_chi, ten_file, thu_tu) VALUES (SCOPE_IDENTITY(), N'TEST_P1_nhap.jpg', 1);

/* ═════════════════ LỚP CÔNG KHAI ═════════════════ */
CREATE TABLE #nt (id INT, loai TINYINT, ho_ten_don_vi NVARCHAR(300), an_danh BIT, an_dinh_danh BIT,
                  ten_he NVARCHAR(200), ten_khoa NVARCHAR(200), nien_khoa NVARCHAR(50),
                  ten_lop NVARCHAR(100), so_tien DECIMAL(18,0), ngay_tai_tro DATE);
INSERT #nt EXEC dbo.TT_CongKhai_GetNhaTaiTroTheoChuongTrinh @id_chuong_trinh = @ct;

IF (SELECT COUNT(*) FROM #nt) <> 4
    BEGIN PRINT N'FAIL 1: SP03 phai tra dung 4 luot (A, C, D, F).'; SET @loi += 1; END
IF EXISTS (SELECT 1 FROM #nt WHERE id IN (@B, @E, @G, @H, @X1, @X2, @X4, @Y1))
    BEGIN PRINT N'FAIL 2: SP03 LO luot chua duyet / tu choi / thieu tien / da xoa.'; SET @loi += 1; END
IF NOT EXISTS (SELECT 1 FROM #nt WHERE id = @A AND ho_ten_don_vi = N'Nguoi A' AND an_danh = 0 AND an_dinh_danh = 0)
    BEGIN PRINT N'FAIL 3: luot cong khai A phai co ten.'; SET @loi += 1; END
IF NOT EXISTS (SELECT 1 FROM #nt WHERE id = @C AND ho_ten_don_vi IS NULL AND ten_lop = N'K39A' AND an_danh = 1 AND an_dinh_danh = 0)
    BEGIN PRINT N'FAIL 4: an ten giu lop (C) sai.'; SET @loi += 1; END
IF NOT EXISTS (SELECT 1 FROM #nt WHERE id = @D AND ho_ten_don_vi IS NULL AND ten_lop IS NULL AND an_danh = 1 AND an_dinh_danh = 1)
    BEGIN PRINT N'FAIL 5: an tat ca (D) sai.'; SET @loi += 1; END
IF NOT EXISTS (SELECT 1 FROM #nt WHERE id = @F AND ho_ten_don_vi IS NULL AND ten_lop IS NULL AND an_dinh_danh = 1)
    BEGIN PRINT N'FAIL 6: muc_an_danh la (F) phai CHE HET.'; SET @loi += 1; END

CREATE TABLE #nt_nhap (id INT, loai TINYINT, ho_ten_don_vi NVARCHAR(300), an_danh BIT, an_dinh_danh BIT,
                       ten_he NVARCHAR(200), ten_khoa NVARCHAR(200), nien_khoa NVARCHAR(50),
                       ten_lop NVARCHAR(100), so_tien DECIMAL(18,0), ngay_tai_tro DATE);
INSERT #nt_nhap EXEC dbo.TT_CongKhai_GetNhaTaiTroTheoChuongTrinh @id_chuong_trinh = @ct_nhap;
IF EXISTS (SELECT 1 FROM #nt_nhap)
    BEGIN PRINT N'FAIL 7: LO nha tai tro cua chuong trinh NHAP.'; SET @loi += 1; END

CREATE TABLE #ds (id INT, ten NVARCHAR(300), phu_de NVARCHAR(300), anh_bia NVARCHAR(260), tu_ngay DATE,
                  den_ngay DATE, trang_thai TINYINT, don_vi_to_chuc NVARCHAR(300),
                  tong_du_kien_chi DECIMAL(38,0), tong_da_quyen DECIMAL(38,0), so_nha_tai_tro INT);
INSERT #ds EXEC dbo.TT_CongKhai_GetDanhSachChuongTrinh;

IF EXISTS (SELECT 1 FROM #ds WHERE id = @ct_nhap)
    BEGIN PRINT N'FAIL 8: LO chuong trinh NHAP o danh sach.'; SET @loi += 1; END
-- 12000 / 10000 / 4. Có tích chéo JOIN thì tong_du_kien_chi ra 48000 — đó là lý do có ca này.
IF NOT EXISTS (SELECT 1 FROM #ds WHERE id = @ct AND tong_du_kien_chi = 12000 AND tong_da_quyen = 10000 AND so_nha_tai_tro = 4)
    BEGIN PRINT N'FAIL 9: tong/so luot sai (tich cheo JOIN?) - ky vong 12000/10000/4.'; SET @loi += 1; END
IF NOT EXISTS (SELECT 1 FROM #ds WHERE id = @ct AND trang_thai = 1)
    BEGIN PRINT N'FAIL 10: den_ngay = HOM NAY phai con "Dang dien ra" (den het ngay).'; SET @loi += 1; END
IF NOT EXISTS (SELECT 1 FROM #ds WHERE id = @ct_het AND trang_thai = 2 AND tong_du_kien_chi = 0 AND so_nha_tai_tro = 0)
    BEGIN PRINT N'FAIL 11: chuong trinh het han hom qua phai "Da dien ra", 0 con phai ra 0 (khong NULL).'; SET @loi += 1; END

/* SP02 / SP04 trả HAI result set nên không INSERT...EXEC được — kiểm qua view mà chúng đọc. */
IF EXISTS (SELECT 1 FROM dbo.TT_v_ChuongTrinhCongKhai WHERE id = @ct_nhap)
    BEGIN PRINT N'FAIL 12: view chuong trinh LO ban NHAP (SP02 se tra ve).'; SET @loi += 1; END
IF EXISTS (SELECT 1 FROM dbo.TT_v_KhoanChiCongKhai WHERE id_chuong_trinh = @ct_nhap)
    BEGIN PRINT N'FAIL 13: view khoan chi LO khoan chi cua chuong trinh NHAP.'; SET @loi += 1; END
IF EXISTS (SELECT 1 FROM dbo.TT_v_MinhChungChiCongKhai WHERE ten_file = N'TEST_P1_nhap.jpg')
    BEGIN PRINT N'FAIL 14: view minh chung LO anh cua chuong trinh NHAP.'; SET @loi += 1; END

/* ═════════════════ LỊCH SỬ TÀI TRỢ CỦA TÔI ═════════════════ */
CREATE TABLE #ls (id INT, id_chuong_trinh INT, ten_chuong_trinh NVARCHAR(300), loai TINYINT,
                  ho_ten_don_vi NVARCHAR(300), muc_an_danh TINYINT, ten_he NVARCHAR(200), ten_khoa NVARCHAR(200),
                  nien_khoa NVARCHAR(50), ten_lop NVARCHAR(100), trang_thai_duyet TINYINT,
                  so_tien DECIMAL(18,0), ngay_tai_tro DATE, thoi_diem_khai DATETIME);
INSERT #ls EXEC dbo.TT_CuuSV_GetLichSuTaiTroCuaToi @id_tai_khoan_csv = -901;

IF (SELECT COUNT(*) FROM #ls) <> 3
    BEGIN PRINT N'FAIL 15: lich su -901 phai dung 3 dong (X1 cho, X2 tu choi, X3 CT nhap).'; SET @loi += 1; END
IF EXISTS (SELECT 1 FROM #ls WHERE id NOT IN (@X1, @X2, @X3))
    BEGIN PRINT N'FAIL 16: lich su -901 LO dong cua NGUOI KHAC / cua khach / da xoa.'; SET @loi += 1; END
IF NOT EXISTS (SELECT 1 FROM #ls WHERE id = @X1 AND trang_thai_duyet = 1 AND so_tien IS NULL
                                    AND ho_ten_don_vi = N'Ten nguoi duoc khai ho' AND muc_an_danh = 1)
    BEGIN PRINT N'FAIL 17: dong CHO DUYET (X1) phai co, so_tien NULL, giu ten da khai ho + muc an danh.'; SET @loi += 1; END
IF NOT EXISTS (SELECT 1 FROM #ls WHERE id = @X3 AND ten_chuong_trinh = N'TEST_P1 nhap')
    BEGIN PRINT N'FAIL 18: loi khai vao CT da an (X3) khong duoc bien mat khoi lich su cua chinh nguoi khai.'; SET @loi += 1; END

-- 🔴 CA QUAN TRỌNG NHẤT: phiên hỏng (claim thiếu id) KHÔNG được mở ra lời khai của KHÁCH (id NULL).
DELETE FROM #ls;
INSERT #ls EXEC dbo.TT_CuuSV_GetLichSuTaiTroCuaToi @id_tai_khoan_csv = NULL;
IF EXISTS (SELECT 1 FROM #ls)
    BEGIN PRINT N'FAIL 19: @id_tai_khoan_csv = NULL tra ve du lieu - LO TOAN BO LOI KHAI CUA KHACH.'; SET @loi += 1; END

ROLLBACK;   -- 🔴 LUÔN rollback, kể cả khi PASS. Không dòng thử nào được ở lại.

DROP TABLE #nt; DROP TABLE #nt_nhap; DROP TABLE #ds; DROP TABLE #ls;

IF @loi > 0
    THROW 50001, N'THU NGHIEM CHAN LO DU LIEU: CO CA FAIL - doc cac dong FAIL o tren. KHONG noi API.', 1;

PRINT N'PASS: 19/19 ca - cong khai chan chua duyet/tu choi/nhap/an danh; lich su chi tra dung tai khoan. Da ROLLBACK.';
GO
