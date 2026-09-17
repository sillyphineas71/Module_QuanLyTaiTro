SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
GO
/* =============================================================================================
   DỮ LIỆU MẪU — CHỈ DB DEV. Nguồn: ClientApp/src/pages/tai-tro/taiTroMock.ts (+ dòng thêm để kiểm view)
   =============================================================================================
   Chạy (từ thư mục gốc repo, SAU 90_CapQuyen):
       sqlcmd -S <server> -E -d ESS_HOCVIENTAICHINH_DAOTAO -I -b -f 65001 -i "DB_Setup\91_DuLieuMau_Nhap.sql"
   Xoá sạch:  DB_Setup\92_DuLieuMau_XoaSach.sql

   🔴 KHÔNG CHẠY TRÊN PRODUCTION. Mọi dòng mang created_user_id = 'DU_LIEU_MAU' — 92_ xoá theo dấu này.
   🔴 -f 65001 BẮT BUỘC: chuỗi N'…' tiếng Việt. Thiếu cờ ⇒ dữ liệu hỏng âm thầm — file tự THROW 50041 nếu phát hiện.
   ⚠️ Chạy lần hai khi chưa xoá ⇒ THROW 50040 (không nhân đôi dữ liệu). Cả file một transaction: lỗi là không còn gì.
   ⚠️ KHÔNG viết cứng id: IDENTITY không bắt đầu từ 1 (98_ThuNghiem đã tiêu số). Con nối cha qua SCOPE_IDENTITY().

   ── 7 CA XẤU CỦA MOCK — GIỮ NGUYÊN (lý do mock tồn tại, xem đầu taiTroMock.ts) ──
     1. Tên 66 ký tự                          → CT2
     2. Doanh nghiệp / tập thể thiếu cấp      → CT1 "Công ty TNHH ABC", "Tập thể lớp K39A…"; CT3 hai dòng
     3. 0 nhà tài trợ (CÔNG KHAI)             → CT2 — có 1 dòng CHỜ DUYỆT, trang công khai vẫn phải ra 0
     4. Không ảnh bìa                         → CT2 (anh_bia NULL)
     5. Vượt 100%                             → CT3 350.000.000 / 300.000.000 = 117%
     6. Kết thúc mà chưa đạt                  → CT4 65.000.000 / 150.000.000 = 43%
     7. Ẩn danh, 2 biến thể                   → CT1 mức 1 (giấu tên, GIỮ lớp) · CT4 mức 2 (giấu hết)
        🔴 Hai dòng này LƯU tên + ngày sinh + lớp THẬT trong bảng (mock để null vì mock là đầu ra của view).
           Có vậy mới kiểm được view CHE: đọc qua API mà thấy "Ngô Thị Mai" / "Bùi Quang Huy" là view hỏng.

   ── DÒNG THÊM (không có trong mock) — để lỗi lọc của view LỘ RA được ──
     · CT1: 2 CHỜ DUYỆT (một thường, một ẩn danh) + 1 TỪ CHỐI   → công khai KHÔNG được thấy
     · CT2: 1 CHỜ DUYỆT                                           → công khai vẫn 0 nhà tài trợ (ca 3)
     · CT5 NHÁP (cong_khai = 0): có dự kiến chi, 1 nhà tài trợ ĐÃ DUYỆT, 1 khoản chi + minh chứng
                                                                  → danh sách và chi tiết KHÔNG được thấy (404)
     · TT_AnhChuyenKhoan: ảnh CK cho dòng chờ/từ chối/vài dòng đã duyệt (màn quản trị P5 cần)
     · TT_TaiKhoan: 1 quản trị mẫu — chỉ để điền id_nguoi_duyet. KHÔNG đăng nhập được (xem dưới).
     · TT_MaDoiPhien: KHÔNG có dòng nào — mã sống 2 phút, dòng mẫu vô nghĩa; và một mã có hash đã biết là lỗ.

   ── KỲ VỌNG QUA API CÔNG KHAI sau khi chạy ──
     | Chương trình | Trạng thái | Nhà tài trợ | Đã quyên     | Mục tiêu     | Khoản chi |
     | CT1          | Đang       | 7           | 182.750.000  | 300.000.000  | 3 (5 ảnh) |
     | CT2          | Đang       | 0           | 0            | 170.000.000  | 0         |
     | CT3          | Đã         | 2           | 350.000.000  | 300.000.000  | 2         |
     | CT4          | Đã         | 2           | 65.000.000   | 150.000.000  | 1         |
     | CT5 (nháp)   | —          | KHÔNG HIỆN  |              |              |           |

   ── KHÁC MOCK (có chủ đích) ──
     · Ngày CT1, CT2 TÍNH TỪ HÔM NAY: ngày gốc của mock (2025-09… / 2026-06-30) đã qua ⇒ view sẽ ra "Đã diễn ra" và
       mất hết ca "Đang diễn ra". Giữ nguyên KHOẢNG CÁCH giữa các ngày như mock. CT3, CT4 giữ ngày gốc (đã qua là đúng).
     · mo_ta_ngan (mock) → phu_de (DDL). loi_keu_goi, ten_chu_tai_khoan không có trong mock ⇒ viết câu mẫu ngắn.
     · ten_chuyen_nganh của mock BỎ — cột đã gỡ khỏi DDL.
     · anh_bia / ten_file minh chứng: GIỮ URL NGOÀI như mock (picsum / placehold) để P2b nhìn được màn thật.
       🔴 TẠM — DDL lưu TÊN FILE. Cùng 11 dòng mock ghi phải đổi ở T4; và nhánh "URL tuyệt đối" trong
       duongDanAnh() (ITaiTro.ts) là thứ duy nhất làm chúng hiện được.
   ============================================================================================= */
SET NOCOUNT ON;
SET XACT_ABORT ON;

IF EXISTS (SELECT 1 FROM dbo.TT_ChuongTrinh WHERE created_user_id = N'DU_LIEU_MAU')
    THROW 50040, N'DA CO DU LIEU MAU (created_user_id = DU_LIEU_MAU). Chay DB_Setup\92_DuLieuMau_XoaSach.sql truoc.', 1;

DECLARE @M NVARCHAR (36) = N'DU_LIEU_MAU';
DECLARE @homnay DATE = CAST(GETDATE() AS DATE);
-- CT1: mock bắt đầu 2025-09-01, khoản chi cuối 2025-09-25 (+24 ngày) ⇒ lùi 40 ngày để mọi ngày tài trợ/chi đều ĐÃ QUA.
DECLARE @ct1_bd DATE = DATEADD(DAY, -40, @homnay);
DECLARE @ct2_bd DATE = DATEADD(DAY, -10, @homnay);

BEGIN TRAN;

/* ── Quản trị mẫu — chỉ để làm id_nguoi_duyet ──
   🔴 mat_khau KHÔNG PHẢI hash BCrypt ⇒ không mật khẩu nào khớp, KHÔNG đăng nhập được; trang_thai = 0 (khoá).
      Đừng thay bằng hash của một mật khẩu đã biết: file này nằm trong repo, chạy nhầm lên server là có cửa vào. */
INSERT dbo.TT_TaiKhoan (email_dang_nhap, mat_khau, ho_ten, vai_tro, trang_thai, phai_doi_mat_khau, created_user_id, last_modified_user_id)
VALUES (N'quantri.mau@du-lieu-mau.invalid', '!KHONG-PHAI-HASH-KHONG-DANG-NHAP-DUOC', N'Quản trị (dữ liệu mẫu)', 1, 0, 1, @M, @M);
DECLARE @qt INT = SCOPE_IDENTITY();

DECLARE @ct INT, @nt INT, @kc INT;

/* ═════════════ CT1 — "bình thường": đang diễn ra, có ảnh, đủ ba loại, có ẩn danh mức 1 ═════════════ */
INSERT dbo.TT_ChuongTrinh (ten, phu_de, loi_keu_goi, mo_ta_day, anh_bia, tu_ngay, den_ngay, don_vi_to_chuc,
                           stk, ngan_hang, ten_chu_tai_khoan, noi_dung_ck, anh_qr, cong_khai, created_user_id, last_modified_user_id)
VALUES (N'Tiếp bước đến trường 2025',
        N'Hỗ trợ sinh viên có hoàn cảnh khó khăn vươn lên trong học tập',
        N'Mỗi đóng góp, dù nhỏ, đều giúp một sinh viên tiếp tục đến trường.',
        N'Chương trình kêu gọi sự chung tay của các thế hệ cựu sinh viên, phụ huynh và các nhà hảo tâm để trao học bổng cho sinh viên có hoàn cảnh khó khăn của Khoa Toán - Cơ - Tin học, giúp các em có thêm động lực vươn lên trong học tập và cuộc sống.',
        N'https://picsum.photos/seed/graduation-ceremony/1200/400',
        @ct1_bd, DATEADD(DAY, 120, @ct1_bd), N'Khoa Toán - Cơ - Tin học',
        N'1234 5678 9999', N'Vietcombank', N'KHOA TOAN - CO - TIN HOC', N'Tai tro Tiep buoc den truong', N'tai-tro-qr-1.png', 1, @M, @M);
SET @ct = SCOPE_IDENTITY();

-- 🔴 Kiểm mã hoá NGAY sau dòng tiếng Việt đầu tiên: 'ế' (U+1EBF = 7871) ở vị trí 3 của "Tiếp". Sai ⇒ sqlcmd đọc file
--    không phải UTF-8 (thiếu -f 65001) ⇒ mọi chuỗi N'…' đã hỏng. Dừng trước khi ghi thêm.
IF UNICODE(SUBSTRING((SELECT ten FROM dbo.TT_ChuongTrinh WHERE id = @ct), 3, 1)) <> 7871
    THROW 50041, N'CHUOI TIENG VIET BI HONG - chay lai voi sqlcmd -f 65001. Da ROLLBACK, khong ghi gi.', 1;

INSERT dbo.TT_DuKienChi (id_chuong_trinh, noi_dung, so_tien, thu_tu, created_user_id, last_modified_user_id) VALUES
    (@ct, N'Học bổng cho sinh viên', 200000000, 1, @M, @M),
    (@ct, N'Tổ chức chương trình',    60000000, 2, @M, @M),
    (@ct, N'Chi phí khác',            40000000, 3, @M, @M);

-- Bảy dòng ĐÃ DUYỆT của mock — tổng 182.750.000
INSERT dbo.TT_NhaTaiTro (id_chuong_trinh, loai, ho_ten_don_vi, muc_an_danh, ten_he, ten_khoa, nien_khoa, ten_lop, ngay_sinh,
                         trang_thai_duyet, so_tien, ngay_tai_tro, thoi_diem_duyet, id_nguoi_duyet, created_user_id, last_modified_user_id) VALUES
    (@ct, 1, N'Nguyễn Khánh Tùng', 0, N'Chính quy', N'Toán - Cơ - Tin học', N'1994-1998', N'K39A', '1976-03-15', 2,   5000000, DATEADD(DAY,  1, @ct1_bd), DATEADD(DAY,  2, @ct1_bd), @qt, @M, @M),
    (@ct, 1, N'Trần Văn Nam',      0, N'Chính quy', N'Toán - Cơ - Tin học', N'1995-1999', N'K40B', '1977-10-05', 2,   3000000, DATEADD(DAY,  4, @ct1_bd), DATEADD(DAY,  5, @ct1_bd), @qt, @M, @M),
    (@ct, 1, N'Lê Thị Hoa',        0, N'Chính quy', N'Toán - Cơ - Tin học', N'1994-1998', N'K39A', '1976-11-22', 2,   2000000, DATEADD(DAY,  6, @ct1_bd), DATEADD(DAY,  7, @ct1_bd), @qt, @M, @M),
    -- CA XẤU 2: doanh nghiệp — không hệ/khoa/khoá/lớp, không ngày sinh
    (@ct, 3, N'Công ty TNHH ABC',  0, NULL, NULL, NULL, NULL, NULL,                                               2, 120000000, DATEADD(DAY,  9, @ct1_bd), DATEADD(DAY, 10, @ct1_bd), @qt, @M, @M),
    -- CA XẤU 7a: ẩn danh MỨC 1 — giấu tên, GIỮ lớp. Tên + ngày sinh THẬT trong bảng; view phải che cả hai.
    (@ct, 1, N'Ngô Thị Mai',       1, N'Chính quy', N'Toán - Cơ - Tin học', N'1994-1998', N'K39A', '1976-06-20', 2,  40000000, DATEADD(DAY, 11, @ct1_bd), DATEADD(DAY, 12, @ct1_bd), @qt, @M, @M),
    (@ct, 1, N'Phạm Thị Lan',      0, N'Vừa làm vừa học', N'Toán - Cơ - Tin học', N'1996-2000', N'K41C', '1978-02-03', 2, 750000, DATEADD(DAY, 14, @ct1_bd), DATEADD(DAY, 15, @ct1_bd), @qt, @M, @M),
    -- CA XẤU 2 (bản hai): tập thể lớp — có lớp/khoá, không ngày sinh
    (@ct, 2, N'Tập thể lớp K39A - Khoá 1994-1998', 0, N'Chính quy', N'Toán - Cơ - Tin học', N'1994-1998', N'K39A', NULL, 2, 12000000, DATEADD(DAY, 17, @ct1_bd), DATEADD(DAY, 18, @ct1_bd), @qt, @M, @M);

-- Ảnh CK cho một dòng đã duyệt (Nguyễn Khánh Tùng)
SET @nt = (SELECT id FROM dbo.TT_NhaTaiTro WHERE id_chuong_trinh = @ct AND ho_ten_don_vi = N'Nguyễn Khánh Tùng' AND created_user_id = @M);
INSERT dbo.TT_AnhChuyenKhoan (id_nha_tai_tro, ten_file, thu_tu, created_user_id, last_modified_user_id)
VALUES (@nt, N'mau-ck-nguyen-khanh-tung.jpg', 1, @M, @M);

-- THÊM: CHỜ DUYỆT (khách, công khai đầy đủ) — so_tien NULL, có liên hệ, 2 ảnh CK
INSERT dbo.TT_NhaTaiTro (id_chuong_trinh, loai, ho_ten_don_vi, muc_an_danh, ten_he, ten_khoa, nien_khoa, ten_lop, ngay_sinh,
                         email_lien_he, sdt_lien_he, trang_thai_duyet, so_tien, ngay_tai_tro, created_user_id, last_modified_user_id)
VALUES (@ct, 1, N'Hoàng Văn Chờ Duyệt', 0, N'Chính quy', N'Toán - Cơ - Tin học', N'2001-2005', N'K46A', '1983-05-09',
        N'cho.duyet@du-lieu-mau.invalid', N'0900000001', 1, NULL, DATEADD(DAY, -2, @homnay), @M, @M);
SET @nt = SCOPE_IDENTITY();
INSERT dbo.TT_AnhChuyenKhoan (id_nha_tai_tro, ten_file, thu_tu, created_user_id, last_modified_user_id) VALUES
    (@nt, N'mau-ck-cho-duyet-1a.jpg', 1, @M, @M),
    (@nt, N'mau-ck-cho-duyet-1b.jpg', 2, @M, @M);

-- THÊM: CHỜ DUYỆT + ẩn danh mức 2 — không được lộ cả khi đã ẩn danh
INSERT dbo.TT_NhaTaiTro (id_chuong_trinh, loai, ho_ten_don_vi, muc_an_danh, ten_he, ten_khoa, nien_khoa, ten_lop, ngay_sinh,
                         email_lien_he, sdt_lien_he, trang_thai_duyet, so_tien, ngay_tai_tro, created_user_id, last_modified_user_id)
VALUES (@ct, 1, N'Đinh Thị Chờ Ẩn Danh', 2, N'Chính quy', N'Toán - Cơ - Tin học', N'1999-2003', N'K44B', '1981-12-01',
        N'cho.an.danh@du-lieu-mau.invalid', N'0900000002', 1, NULL, DATEADD(DAY, -1, @homnay), @M, @M);
SET @nt = SCOPE_IDENTITY();
INSERT dbo.TT_AnhChuyenKhoan (id_nha_tai_tro, ten_file, thu_tu, created_user_id, last_modified_user_id)
VALUES (@nt, N'mau-ck-cho-duyet-2.jpg', 1, @M, @M);

-- THÊM: TỪ CHỐI — lý do viết cho quản trị, không bao giờ ra ngoài
INSERT dbo.TT_NhaTaiTro (id_chuong_trinh, loai, ho_ten_don_vi, muc_an_danh, email_lien_he, sdt_lien_he,
                         trang_thai_duyet, so_tien, ngay_tai_tro, ly_do_tu_choi, thoi_diem_duyet, id_nguoi_duyet, created_user_id, last_modified_user_id)
VALUES (@ct, 1, N'Người Bị Từ Chối', 0, N'tu.choi@du-lieu-mau.invalid', N'0900000003',
        3, NULL, DATEADD(DAY, -5, @homnay), N'Ảnh chuyển khoản không khớp sao kê (dữ liệu mẫu)', DATEADD(DAY, -4, @homnay), @qt, @M, @M);
SET @nt = SCOPE_IDENTITY();
INSERT dbo.TT_AnhChuyenKhoan (id_nha_tai_tro, ten_file, thu_tu, created_user_id, last_modified_user_id)
VALUES (@nt, N'mau-ck-tu-choi.jpg', 1, @M, @M);

-- Khoản chi + minh chứng (5 ảnh)
INSERT dbo.TT_KhoanChi (id_chuong_trinh, noi_dung, so_tien, ngay_chi, created_user_id, last_modified_user_id)
VALUES (@ct, N'Học bổng cho sinh viên', 80000000, DATEADD(DAY, 14, @ct1_bd), @M, @M);
SET @kc = SCOPE_IDENTITY();
INSERT dbo.TT_MinhChungChi (id_khoan_chi, ten_file, thu_tu, created_user_id, last_modified_user_id) VALUES
    (@kc, N'https://placehold.co/220x130/E8EDF5/1F2328?text=Danh+sach+nhan+hoc+bong', 1, @M, @M),
    (@kc, N'https://placehold.co/220x130/E8EDF5/1F2328?text=Phieu+chi+hoc+bong',      2, @M, @M),
    (@kc, N'https://placehold.co/220x130/E8EDF5/1F2328?text=Bien+ban+trao+hoc+bong',  3, @M, @M);

INSERT dbo.TT_KhoanChi (id_chuong_trinh, noi_dung, so_tien, ngay_chi, created_user_id, last_modified_user_id)
VALUES (@ct, N'Tổ chức chương trình', 30000000, DATEADD(DAY, 19, @ct1_bd), @M, @M);
SET @kc = SCOPE_IDENTITY();
INSERT dbo.TT_MinhChungChi (id_khoan_chi, ten_file, thu_tu, created_user_id, last_modified_user_id)
VALUES (@kc, N'https://placehold.co/220x130/E8EDF5/1F2328?text=Hoa+don+to+chuc', 1, @M, @M);

INSERT dbo.TT_KhoanChi (id_chuong_trinh, noi_dung, so_tien, ngay_chi, created_user_id, last_modified_user_id)
VALUES (@ct, N'Chi phí khác', 10000000, DATEADD(DAY, 24, @ct1_bd), @M, @M);
SET @kc = SCOPE_IDENTITY();
INSERT dbo.TT_MinhChungChi (id_khoan_chi, ten_file, thu_tu, created_user_id, last_modified_user_id)
VALUES (@kc, N'https://placehold.co/220x130/E8EDF5/1F2328?text=Phieu+chi+khac', 1, @M, @M);

/* ═════════════ CT2 — CA XẤU 1 + 3 + 4: tên 66 ký tự · 0 nhà tài trợ công khai · không ảnh bìa ═════════════ */
INSERT dbo.TT_ChuongTrinh (ten, phu_de, loi_keu_goi, mo_ta_day, anh_bia, tu_ngay, den_ngay, don_vi_to_chuc,
                           stk, ngan_hang, ten_chu_tai_khoan, noi_dung_ck, anh_qr, cong_khai, created_user_id, last_modified_user_id)
VALUES (N'Học bổng khuyến khích tài năng Toán học dành cho sinh viên năm nhất',
        N'Tìm kiếm và đồng hành cùng sinh viên năm nhất có năng khiếu đặc biệt về Toán học',
        N'Cùng Khoa chắp cánh cho những tài năng Toán học trẻ.',
        N'Chương trình dành cho sinh viên năm nhất có thành tích nổi bật trong các kỳ thi học sinh giỏi quốc gia và quốc tế, nhằm khuyến khích các em tiếp tục theo đuổi con đường nghiên cứu Toán học tại Khoa.',
        NULL,   -- 🔴 CA XẤU 4: giữ NULL
        @ct2_bd, DATEADD(DAY, 272, @ct2_bd), N'Khoa Toán - Cơ - Tin học',
        N'1234 5678 0001', N'Vietcombank', N'KHOA TOAN - CO - TIN HOC', N'Tai tro Hoc bong tai nang Toan hoc', NULL, 1, @M, @M);
SET @ct = SCOPE_IDENTITY();

INSERT dbo.TT_DuKienChi (id_chuong_trinh, noi_dung, so_tien, thu_tu, created_user_id, last_modified_user_id) VALUES
    (@ct, N'Học bổng toàn phần (5 suất)', 150000000, 1, @M, @M),
    (@ct, N'Chi phí tổ chức xét chọn',     20000000, 2, @M, @M);

-- THÊM: CHỜ DUYỆT — trang công khai CT2 vẫn phải ra 0 nhà tài trợ (ca xấu 3 giữ nguyên)
INSERT dbo.TT_NhaTaiTro (id_chuong_trinh, loai, ho_ten_don_vi, muc_an_danh, email_lien_he, trang_thai_duyet, so_tien, ngay_tai_tro, created_user_id, last_modified_user_id)
VALUES (@ct, 3, N'Công ty Chờ Duyệt CT2', 0, N'ct2.cho@du-lieu-mau.invalid', 1, NULL, @homnay, @M, @M);
SET @nt = SCOPE_IDENTITY();
INSERT dbo.TT_AnhChuyenKhoan (id_nha_tai_tro, ten_file, thu_tu, created_user_id, last_modified_user_id)
VALUES (@nt, N'mau-ck-ct2-cho-duyet.jpg', 1, @M, @M);

/* ═════════════ CT3 — CA XẤU 5: đã diễn ra, VƯỢT mục tiêu 117% ═════════════ */
INSERT dbo.TT_ChuongTrinh (ten, phu_de, loi_keu_goi, mo_ta_day, anh_bia, tu_ngay, den_ngay, don_vi_to_chuc,
                           stk, ngan_hang, ten_chu_tai_khoan, noi_dung_ck, anh_qr, cong_khai, created_user_id, last_modified_user_id)
VALUES (N'Quỹ hỗ trợ thực tập sinh viên 2024',
        N'Hỗ trợ chi phí đi lại và sinh hoạt cho sinh viên thực tập xa',
        N'Cảm ơn mọi đóng góp đã giúp chương trình vượt mục tiêu.',
        N'Quỹ hỗ trợ sinh viên năm cuối trong kỳ thực tập tại doanh nghiệp, đặc biệt là các em phải di chuyển xa nơi ở. Chương trình đã kết thúc và vượt mục tiêu đề ra.',
        N'https://picsum.photos/seed/students-classroom/1200/400',
        '2024-03-01', '2024-08-31', N'Khoa Toán - Cơ - Tin học',
        N'1234 5678 0002', N'Vietcombank', N'KHOA TOAN - CO - TIN HOC', N'Tai tro Quy thuc tap 2024', N'tai-tro-qr-3.png', 1, @M, @M);
SET @ct = SCOPE_IDENTITY();

INSERT dbo.TT_DuKienChi (id_chuong_trinh, noi_dung, so_tien, thu_tu, created_user_id, last_modified_user_id) VALUES
    (@ct, N'Hỗ trợ đi lại',        180000000, 1, @M, @M),
    (@ct, N'Hỗ trợ sinh hoạt phí', 120000000, 2, @M, @M);

INSERT dbo.TT_NhaTaiTro (id_chuong_trinh, loai, ho_ten_don_vi, muc_an_danh, ten_he, ten_khoa, nien_khoa, ten_lop, ngay_sinh,
                         trang_thai_duyet, so_tien, ngay_tai_tro, thoi_diem_duyet, id_nguoi_duyet, created_user_id, last_modified_user_id) VALUES
    (@ct, 3, N'Tập đoàn Công nghệ XYZ',          0, NULL, NULL, NULL, NULL, NULL,                        2, 250000000, '2024-03-15', '2024-03-16', @qt, @M, @M),
    (@ct, 2, N'Ban liên lạc cựu sinh viên Khoa', 0, NULL, N'Toán - Cơ - Tin học', NULL, NULL, NULL,      2, 100000000, '2024-05-20', '2024-05-21', @qt, @M, @M);

INSERT dbo.TT_KhoanChi (id_chuong_trinh, noi_dung, so_tien, ngay_chi, created_user_id, last_modified_user_id)
VALUES (@ct, N'Hỗ trợ đi lại đợt 1', 180000000, '2024-06-10', @M, @M);
SET @kc = SCOPE_IDENTITY();
INSERT dbo.TT_MinhChungChi (id_khoan_chi, ten_file, thu_tu, created_user_id, last_modified_user_id)
VALUES (@kc, N'https://placehold.co/220x130/E8EDF5/1F2328?text=Phieu+chi+di+lai+dot+1', 1, @M, @M);

INSERT dbo.TT_KhoanChi (id_chuong_trinh, noi_dung, so_tien, ngay_chi, created_user_id, last_modified_user_id)
VALUES (@ct, N'Hỗ trợ sinh hoạt phí', 120000000, '2024-07-05', @M, @M);
SET @kc = SCOPE_IDENTITY();
INSERT dbo.TT_MinhChungChi (id_khoan_chi, ten_file, thu_tu, created_user_id, last_modified_user_id)
VALUES (@kc, N'https://placehold.co/220x130/E8EDF5/1F2328?text=Phieu+chi+sinh+hoat+phi', 1, @M, @M);

/* ═════════════ CT4 — CA XẤU 6: kết thúc mà CHƯA đạt (43%) · CA XẤU 7b: ẩn danh mức 2 ═════════════ */
INSERT dbo.TT_ChuongTrinh (ten, phu_de, loi_keu_goi, mo_ta_day, anh_bia, tu_ngay, den_ngay, don_vi_to_chuc,
                           stk, ngan_hang, ten_chu_tai_khoan, noi_dung_ck, anh_qr, cong_khai, created_user_id, last_modified_user_id)
VALUES (N'Trang bị phòng máy tính thực hành',
        N'Nâng cấp phòng máy phục vụ học phần lập trình và mô phỏng số',
        N'Số kinh phí vận động được đã thay mới 13 máy cho sinh viên.',
        N'Chương trình vận động kinh phí thay mới 30 máy tính cho phòng thực hành của Khoa. Chương trình đã kết thúc; số kinh phí vận động được đã dùng để thay mới 13 máy.',
        N'https://picsum.photos/seed/university-library/1200/400',
        '2023-09-01', '2023-12-31', N'Khoa Toán - Cơ - Tin học',
        N'1234 5678 0003', N'Vietcombank', N'KHOA TOAN - CO - TIN HOC', N'Tai tro Phong may thuc hanh', NULL, 1, @M, @M);
SET @ct = SCOPE_IDENTITY();

INSERT dbo.TT_DuKienChi (id_chuong_trinh, noi_dung, so_tien, thu_tu, created_user_id, last_modified_user_id) VALUES
    (@ct, N'Máy tính (30 bộ)',          135000000, 1, @M, @M),
    (@ct, N'Lắp đặt, cài đặt phần mềm',  15000000, 2, @M, @M);

INSERT dbo.TT_NhaTaiTro (id_chuong_trinh, loai, ho_ten_don_vi, muc_an_danh, ten_he, ten_khoa, nien_khoa, ten_lop, ngay_sinh,
                         trang_thai_duyet, so_tien, ngay_tai_tro, thoi_diem_duyet, id_nguoi_duyet, created_user_id, last_modified_user_id) VALUES
    (@ct, 1, N'Đỗ Minh Quân',  0, N'Chính quy', N'Toán - Cơ - Tin học', N'1996-2000', N'K41A', '1978-07-17', 2, 50000000, '2023-09-20', '2023-09-21', @qt, @M, @M),
    -- CA XẤU 7b: ẩn danh MỨC 2 — giấu TẤT CẢ. Bảng có đủ tên/hệ/khoa/khoá/lớp/ngày sinh THẬT; view phải che hết.
    (@ct, 1, N'Bùi Quang Huy', 2, N'Chính quy', N'Toán - Cơ - Tin học', N'1996-2000', N'K41A', '1978-04-11', 2, 15000000, '2023-11-02', '2023-11-03', @qt, @M, @M);

INSERT dbo.TT_KhoanChi (id_chuong_trinh, noi_dung, so_tien, ngay_chi, created_user_id, last_modified_user_id)
VALUES (@ct, N'Máy tính (13 bộ)', 58500000, '2024-01-15', @M, @M);
SET @kc = SCOPE_IDENTITY();
INSERT dbo.TT_MinhChungChi (id_khoan_chi, ten_file, thu_tu, created_user_id, last_modified_user_id)
VALUES (@kc, N'https://placehold.co/220x130/E8EDF5/1F2328?text=Hoa+don+13+may+tinh', 1, @M, @M);

/* ═════════════ CT5 — THÊM: NHÁP (cong_khai = 0). Có đủ con để view nào lọc sai là LỘ ra ngay ═════════════ */
INSERT dbo.TT_ChuongTrinh (ten, phu_de, loi_keu_goi, mo_ta_day, anh_bia, tu_ngay, den_ngay, don_vi_to_chuc,
                           stk, ngan_hang, ten_chu_tai_khoan, noi_dung_ck, anh_qr, cong_khai, created_user_id, last_modified_user_id)
VALUES (N'[NHÁP] Chương trình chưa công bố — KHÔNG được hiện ở trang công khai',
        N'Dữ liệu mẫu kiểm view chặn chương trình nháp',
        N'Thấy dòng này trên trang công khai nghĩa là view công khai đang hỏng.',
        N'Chương trình nháp: có dự kiến chi, một nhà tài trợ đã duyệt và một khoản chi kèm minh chứng. Không thứ nào được lọt ra API công khai.',
        NULL, @homnay, DATEADD(DAY, 60, @homnay), N'Khoa Toán - Cơ - Tin học',
        N'1234 5678 0004', N'Vietcombank', N'KHOA TOAN - CO - TIN HOC', N'Tai tro chuong trinh nhap', NULL, 0, @M, @M);
SET @ct = SCOPE_IDENTITY();

INSERT dbo.TT_DuKienChi (id_chuong_trinh, noi_dung, so_tien, thu_tu, created_user_id, last_modified_user_id)
VALUES (@ct, N'Dự kiến chi của chương trình nháp', 99000000, 1, @M, @M);

INSERT dbo.TT_NhaTaiTro (id_chuong_trinh, loai, ho_ten_don_vi, muc_an_danh, trang_thai_duyet, so_tien, ngay_tai_tro, thoi_diem_duyet, id_nguoi_duyet, created_user_id, last_modified_user_id)
VALUES (@ct, 1, N'Nhà Tài Trợ Của Chương Trình Nháp', 0, 2, 9000000, @homnay, @homnay, @qt, @M, @M);

INSERT dbo.TT_KhoanChi (id_chuong_trinh, noi_dung, so_tien, ngay_chi, created_user_id, last_modified_user_id)
VALUES (@ct, N'Khoản chi của chương trình nháp', 1000000, @homnay, @M, @M);
SET @kc = SCOPE_IDENTITY();
INSERT dbo.TT_MinhChungChi (id_khoan_chi, ten_file, thu_tu, created_user_id, last_modified_user_id)
VALUES (@kc, N'mau-minh-chung-chuong-trinh-nhap.jpg', 1, @M, @M);

COMMIT;

/* ── Số dòng đã nhập (đọc để đối chiếu báo cáo) ── */
SELECT N'TT_TaiKhoan' AS bang, COUNT(*) AS so_dong FROM dbo.TT_TaiKhoan WHERE created_user_id = @M
UNION ALL SELECT N'TT_ChuongTrinh',    COUNT(*) FROM dbo.TT_ChuongTrinh    WHERE created_user_id = @M
UNION ALL SELECT N'TT_DuKienChi',      COUNT(*) FROM dbo.TT_DuKienChi      WHERE created_user_id = @M
UNION ALL SELECT N'TT_NhaTaiTro',      COUNT(*) FROM dbo.TT_NhaTaiTro      WHERE created_user_id = @M
UNION ALL SELECT N'TT_AnhChuyenKhoan', COUNT(*) FROM dbo.TT_AnhChuyenKhoan WHERE created_user_id = @M
UNION ALL SELECT N'TT_KhoanChi',       COUNT(*) FROM dbo.TT_KhoanChi       WHERE created_user_id = @M
UNION ALL SELECT N'TT_MinhChungChi',   COUNT(*) FROM dbo.TT_MinhChungChi   WHERE created_user_id = @M
UNION ALL SELECT N'TT_MaDoiPhien',     COUNT(*) FROM dbo.TT_MaDoiPhien     WHERE created_user_id = @M;
/* ĐÚNG: TaiKhoan 1 · ChuongTrinh 5 · DuKienChi 10 · NhaTaiTro 16 · AnhChuyenKhoan 6 · KhoanChi 7 · MinhChungChi 9 · MaDoiPhien 0
   NhaTaiTro 16 = CT1 7 duyệt + 2 chờ + 1 từ chối · CT2 1 chờ · CT3 2 · CT4 2 · CT5 (nháp) 1 */
PRINT N'XONG: da nhap du lieu mau. Xoa sach: DB_Setup\92_DuLieuMau_XoaSach.sql';
GO
