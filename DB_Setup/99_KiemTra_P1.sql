SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
/* =============================================================================================
   KIỂM CHỨNG LÔ P1 (DATABASE) — CHỈ ĐỌC, chạy bao nhiêu lần cũng được — 🔴 TỰ BÁO SAI
   =============================================================================================
   Chạy SAU khi đã tạo đủ bảng, view, SP VÀ chạy 90_CapQuyen (thứ tự: DB_Setup/TRIEN_KHAI_P1.md).
       sqlcmd -S <server> -E -d ESS_HOCVIENTAICHINH_DAOTAO -I -b -f 65001 -i "DB_Setup\99_KiemTra_P1.sql"

   ĐÚNG khi: dòng cuối "PASS: 7/7 KIEM" và mã thoát 0.
   SAI  khi: THROW mã 5010n — n là SỐ KIỂM hỏng (50101 = KIỂM 1 … 50107 = KIỂM 7). Ngay TRƯỚC dòng lỗi là
             bảng các dòng vi phạm. Có -b ⇒ sqlcmd DỪNG ở KIỂM hỏng đầu tiên, mã thoát ≠ 0.

   🔄 Trước 2026-09-17: script KHÔNG tự báo sai — mỗi khối ghi "PHẢI RA 0 DÒNG" và trông vào người ĐỌC output.
      Nó đã lừa một lần: KIỂM 7 có lỗi cú pháp (`p.perm  ission_name`) nên CHƯA TỪNG CHẠY, mà "KIỂM 3/6/7 ra 0
      dòng" vẫn được dùng để kết luận P1 xong (docs/02 C5, docs/03 N21).
   🔴 Mỗi KIỂM kiểm cả TIỀN ĐỀ, không chỉ "0 dòng vi phạm": truy vấn dò trên tập RỖNG thì luôn ra 0 dòng
      (SP không ghi phụ thuộc ⇒ KIỂM 3 đạt suông). Tiền đề hỏng ⇒ cùng mã THROW của KIỂM đó.
   ⚠️ Mã 5010n dành riêng cho file này. Mã khác đang dùng: 50001 (98_), 50010/50011 (file bảng),
      50020–50022 (90_), 50030 (97_), 50096 (96_).
   ============================================================================================= */
SET NOCOUNT ON;
GO

PRINT N'--- KIEM 1: du 8 bang, moi bang du 5 truong audit ---';
DECLARE @k1 TABLE (bang SYSNAME, van_de NVARCHAR (200));
INSERT @k1
SELECT v.ten, N'THIEU BANG'
FROM   (VALUES ('TT_TaiKhoan'), ('TT_ChuongTrinh'), ('TT_DuKienChi'), ('TT_NhaTaiTro'),
               ('TT_AnhChuyenKhoan'), ('TT_KhoanChi'), ('TT_MinhChungChi'), ('TT_MaDoiPhien')) v(ten)
WHERE  OBJECT_ID('dbo.' + v.ten, 'U') IS NULL;
INSERT @k1
SELECT t.name, CONCAT(N'chi co ', COUNT(c.name), N'/5 truong audit')
FROM   sys.tables t
LEFT JOIN sys.columns c
       ON c.object_id = t.object_id
      AND c.name IN ('is_deleted', 'created_time', 'created_user_id', 'last_modified_times', 'last_modified_user_id')
WHERE  t.name LIKE 'TT[_]%'
  AND  t.schema_id = SCHEMA_ID('dbo')
GROUP BY t.name
HAVING COUNT(c.name) <> 5;
IF EXISTS (SELECT 1 FROM @k1)
BEGIN
    SELECT * FROM @k1;
    THROW 50101, N'KIEM 1 HONG: thieu bang TT_ hoac bang thieu truong audit - xem bang ngay tren.', 1;
END
PRINT N'KIEM 1: DAT';
GO

PRINT N'--- KIEM 2: moi view/SP TT_ tao duoi ANSI_NULLS ON + QUOTED_IDENTIFIER ON ---';
/* Vi phạm = file đó chạy bằng sqlcmd THIẾU cờ -I, hoặc thiếu header. Chạy lại file đó với -I. (Bảng TT_* không
   có filtered index nên chưa chết Msg 1934 — nhưng giữ kỷ luật để ngày có người thêm filtered index không phải
   đi dò lại toàn bộ.)
   TIỀN ĐỀ: có ≥ 10 module (5 view + 5 SP của P1) — 0 module thì truy vấn vi phạm luôn rỗng. */
DECLARE @so_module INT = (SELECT COUNT(*) FROM sys.sql_modules m JOIN sys.objects o ON o.object_id = m.object_id WHERE o.name LIKE 'TT[_]%');
IF @so_module < 10
BEGIN
    DECLARE @m2 NVARCHAR (300) = CONCAT(N'KIEM 2 HONG (TIEN DE): chi co ', @so_module, N' view/SP TT_ (can >= 10). Chua chay het Buoc 2-3.');
    THROW 50102, @m2, 1;
END
IF EXISTS (SELECT 1 FROM sys.sql_modules m JOIN sys.objects o ON o.object_id = m.object_id
           WHERE o.name LIKE 'TT[_]%' AND (m.uses_ansi_nulls = 0 OR m.uses_quoted_identifier = 0))
BEGIN
    SELECT o.name, o.type_desc, m.uses_ansi_nulls, m.uses_quoted_identifier
    FROM   sys.sql_modules m JOIN sys.objects o ON o.object_id = m.object_id
    WHERE  o.name LIKE 'TT[_]%' AND (m.uses_ansi_nulls = 0 OR m.uses_quoted_identifier = 0);
    THROW 50102, N'KIEM 2 HONG: view/SP tao KHONG co ANSI_NULLS/QUOTED_IDENTIFIER ON - chay lai file do voi sqlcmd -I.', 1;
END
PRINT N'KIEM 2: DAT';
GO

PRINT N'--- KIEM 3: SP cong khai KHONG doc bang nao, chi doc view TT_v_*CongKhai ---';
/* 🔴 KHỐI QUAN TRỌNG NHẤT CỦA LÔ.
   Vi phạm (a) = một SP TT_CongKhai_* đọc thẳng một bảng (TT_NhaTaiTro, STU_*, CSV_*…) — tức đã đi vòng qua luật
   duyệt + che ẩn danh nằm ở view. Sửa SP cho đọc view, KHÔNG thêm điều kiện vào SP.
   Vi phạm (b) = view công khai chạm bảng tuyệt đối riêng tư.
   TIỀN ĐỀ: ≥ 4 SP công khai, và MỖI SP có ≥ 1 dòng trong sys.sql_expression_dependencies. SP không ghi phụ
   thuộc (vd. chỉ dùng SQL động) thì (a) luôn rỗng — đạt suông. */
DECLARE @k3 TABLE (doi_tuong SYSNAME, van_de NVARCHAR (300));
INSERT @k3
SELECT p.name, CONCAT(N'(a) doc THANG: ', d.referenced_entity_name)
FROM   sys.procedures p
JOIN   sys.sql_expression_dependencies d ON d.referencing_id = p.object_id
WHERE  p.name LIKE 'TT[_]CongKhai[_]%'
  AND  d.referenced_entity_name NOT LIKE 'TT[_]v[_]%CongKhai';
INSERT @k3
SELECT OBJECT_NAME(d.referencing_id), CONCAT(N'(b) view cong khai cham bang rieng tu: ', d.referenced_entity_name)
FROM   sys.sql_expression_dependencies d
JOIN   sys.views v ON v.object_id = d.referencing_id
WHERE  v.name LIKE 'TT[_]v[_]%'
  AND  d.referenced_entity_name IN ('TT_AnhChuyenKhoan', 'TT_TaiKhoan', 'TT_MaDoiPhien');
INSERT @k3
SELECT p.name, N'(tien de) SP KHONG ghi phu thuoc nao - khoi (a) khong kiem duoc SP nay'
FROM   sys.procedures p
WHERE  p.name LIKE 'TT[_]CongKhai[_]%'
  AND  NOT EXISTS (SELECT 1 FROM sys.sql_expression_dependencies d WHERE d.referencing_id = p.object_id);
IF (SELECT COUNT(*) FROM sys.procedures WHERE name LIKE 'TT[_]CongKhai[_]%') < 4
    INSERT @k3 VALUES (N'TT_CongKhai_*', N'(tien de) it hon 4 SP cong khai - thieu file Buoc 3');
IF EXISTS (SELECT 1 FROM @k3)
BEGIN
    SELECT * FROM @k3;
    THROW 50103, N'KIEM 3 HONG: lop cong khai co the LO du lieu chua duyet - xem bang ngay tren. KHONG noi API.', 1;
END
PRINT N'KIEM 3: DAT';
GO

PRINT N'--- KIEM 4: view cong khai khong lo cot rieng tu ---';
/* Vi phạm = ai đó đã thêm cột riêng tư vào view công khai.
   TIỀN ĐỀ: đủ 5 view TT_v_*CongKhai. */
DECLARE @k4 TABLE (doi_tuong SYSNAME, van_de NVARCHAR (300));
INSERT @k4
SELECT v.name, CONCAT(N'cot rieng tu: ', c.name)
FROM   sys.views v
JOIN   sys.columns c ON c.object_id = v.object_id
WHERE  v.name LIKE 'TT[_]v[_]%CongKhai'
  AND  c.name IN ('email_lien_he', 'sdt_lien_he', 'ly_do_tu_choi', 'trang_thai_duyet', 'muc_an_danh',
                  'thoi_diem_duyet', 'id_nguoi_duyet', 'cong_khai', 'mat_khau', 'email_dang_nhap',
                  'id_tai_khoan_csv', 'ma_hash',
                  'is_deleted', 'created_time', 'created_user_id', 'last_modified_times', 'last_modified_user_id');
IF (SELECT COUNT(*) FROM sys.views WHERE name LIKE 'TT[_]v[_]%CongKhai') < 5
    INSERT @k4 VALUES (N'TT_v_*CongKhai', N'(tien de) it hon 5 view cong khai - thieu file Buoc 2');
IF EXISTS (SELECT 1 FROM @k4)
BEGIN
    SELECT * FROM @k4;
    THROW 50104, N'KIEM 4 HONG: view cong khai lo cot rieng tu (hoac thieu view) - xem bang ngay tren.', 1;
END
PRINT N'KIEM 4: DAT';
GO

PRINT N'--- KIEM 5: khong filtered index, khong cot muc_tieu / cot da go ---';
DECLARE @k5 TABLE (doi_tuong SYSNAME, van_de NVARCHAR (300));
INSERT @k5
SELECT OBJECT_NAME(i.object_id), CONCAT(N'filtered index: ', i.name)
FROM   sys.indexes i
WHERE  i.has_filter = 1
  AND  OBJECT_NAME(i.object_id) LIKE 'TT[_]%';
INSERT @k5
SELECT OBJECT_NAME(c.object_id), CONCAT(N'cot cam: ', c.name)
FROM   sys.columns c
WHERE  OBJECT_NAME(c.object_id) LIKE 'TT[_]%'
  AND  c.name IN ('muc_tieu', 'tong_da_quyen', 'tong_da_chi', 'so_nha_tai_tro',
                  -- cột ĐÃ GỠ ở lô đối chiếu ảnh mẫu — còn thấy = bảng tạo từ DDL cũ
                  'mo_ta_ngan', 'ten_chuyen_nganh')
  AND  OBJECTPROPERTY(c.object_id, 'IsUserTable') = 1;
IF EXISTS (SELECT 1 FROM @k5)
BEGIN
    SELECT * FROM @k5;
    THROW 50105, N'KIEM 5 HONG: co filtered index hoac cot cam/cot da go - xem bang ngay tren.', 1;
END
PRINT N'KIEM 5: DAT';
GO

PRINT N'--- KIEM 6: SP TT_CuuSV_* (tra du lieu CHUA DUYET) deu loc theo tai khoan ---';
/* Mọi SP nhóm TT_CuuSV_* trả dữ liệu của MỘT cựu SV ⇒ phải nhận @id_tai_khoan_csv. Thiếu = SP không thể đang lọc
   theo người đăng nhập.
   (Khối này chỉ kiểm được THAM SỐ CÓ MẶT. Tham số có được DÙNG trong WHERE hay không thì người review phải đọc;
   hành vi thật kiểm ở 98_ThuNghiem FAIL 15–19; id lấy từ claim JWT chứ không từ request là việc của service.)
   TIỀN ĐỀ: ≥ 1 SP TT_CuuSV_*. */
DECLARE @k6 TABLE (doi_tuong SYSNAME, van_de NVARCHAR (300));
INSERT @k6
SELECT p.name, N'thieu tham so @id_tai_khoan_csv'
FROM   sys.procedures p
WHERE  p.name LIKE 'TT[_]CuuSV[_]%'
  AND  NOT EXISTS (SELECT 1 FROM sys.parameters pa
                   WHERE pa.object_id = p.object_id AND pa.name = '@id_tai_khoan_csv');
IF NOT EXISTS (SELECT 1 FROM sys.procedures WHERE name LIKE 'TT[_]CuuSV[_]%')
    INSERT @k6 VALUES (N'TT_CuuSV_*', N'(tien de) chua co SP TT_CuuSV_* nao - thieu file Buoc 3');
IF EXISTS (SELECT 1 FROM @k6)
BEGIN
    SELECT * FROM @k6;
    THROW 50106, N'KIEM 6 HONG: SP lich su cuu SV khong loc theo tai khoan (hoac chua co SP) - xem bang ngay tren.', 1;
END
PRINT N'KIEM 6: DAT';
GO

PRINT N'--- KIEM 7: TT_APP_USER KHONG tao duoc ma doi phien ---';
/* Vi phạm = có GRANT INSERT/UPDATE trên TT_MaDoiPhien, hoặc GRANT EXECUTE trên SP tạo mã, hoặc thiếu DENY.
   TIỀN ĐỀ: có user TT_APP_USER (chưa có ⇒ chưa chạy 00_TaoLogin / 90_CapQuyen — mọi truy vấn quyền ra rỗng).
   🔄 Khối này từng có `p.perm  ission_name` — lỗi cú pháp, CHƯA TỪNG CHẠY tới 2026-09-17. */
DECLARE @k7 TABLE (doi_tuong SYSNAME, van_de NVARCHAR (300));
IF USER_ID('TT_APP_USER') IS NULL
    INSERT @k7 VALUES (N'TT_APP_USER', N'(tien de) chua co user - chay 00_TaoLogin roi 90_CapQuyen');
INSERT @k7
SELECT OBJECT_NAME(p.major_id), CONCAT(p.state_desc, N' ', p.permission_name, N' - KHONG duoc co')
FROM   sys.database_permissions p
JOIN   sys.database_principals pr ON pr.principal_id = p.grantee_principal_id
WHERE  pr.name = N'TT_APP_USER'
  AND  p.state_desc IN ('GRANT', 'GRANT_WITH_GRANT_OPTION')
  AND  (   (p.major_id = OBJECT_ID('dbo.TT_MaDoiPhien')     AND p.permission_name IN ('INSERT', 'UPDATE'))
        OR (p.major_id = OBJECT_ID('dbo.TT_MaDoiPhien_Tao') AND p.permission_name = 'EXECUTE'));
IF USER_ID('TT_APP_USER') IS NOT NULL
   AND (SELECT COUNT(*) FROM sys.database_permissions p
        WHERE p.grantee_principal_id = USER_ID('TT_APP_USER')
          AND p.major_id = OBJECT_ID('dbo.TT_MaDoiPhien')
          AND p.state_desc = 'DENY' AND p.permission_name IN ('INSERT', 'UPDATE')) <> 2
    INSERT @k7 VALUES (N'TT_MaDoiPhien', N'khong co DU 2 dong DENY (INSERT, UPDATE) - khoi 4 cua 90_CapQuyen chua chay');
IF EXISTS (SELECT 1 FROM @k7)
BEGIN
    SELECT * FROM @k7;
    THROW 50107, N'KIEM 7 HONG: cong cong khai co the TAO MA DANG NHAP thay cuu SV - xem bang ngay tren.', 1;
END
PRINT N'KIEM 7: DAT';
GO

PRINT N'PASS: 7/7 KIEM - cau truc P1 dung. (Hanh vi: 98_ThuNghiem. DDL bang file <-> DB: 96_SoDDL_Bang.)';
GO
