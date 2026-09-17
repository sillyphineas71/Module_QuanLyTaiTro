SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
/* =============================================================================================
   KIỂM CHỨNG LÔ P1 (DATABASE) — CHỈ ĐỌC, chạy bao nhiêu lần cũng được
   =============================================================================================
   Chạy SAU khi đã tạo đủ bảng, view, SP (thứ tự: DB_Setup/TRIEN_KHAI_P1.md).
       sqlcmd -S <server> -E -d ESS_HOCVIENTAICHINH_DAOTAO -I -b -f 65001 -i "DB_Setup\99_KiemTra_P1.sql"

   🔴 ĐỌC KẾT QUẢ, ĐỪNG CHỈ NHÌN "không lỗi". Script này không tự báo sai — mỗi khối ghi rõ kết quả
      ĐÚNG trông thế nào. Khối nào ghi "PHẢI RA 0 DÒNG" mà ra dòng là DỪNG, chưa nối API.
   ============================================================================================= */

PRINT N'--- KIEM 1: du 8 bang, moi bang du 5 truong audit ---';
/* ĐÚNG: 8 dòng, cột so_cot_audit = 5 ở MỌI dòng, cột thieu_bang không có dòng nào ở truy vấn thứ hai. */
SELECT t.name        AS bang,
       COUNT(c.name) AS so_cot_audit
FROM   sys.tables t
LEFT JOIN sys.columns c
       ON c.object_id = t.object_id
      AND c.name IN ('is_deleted', 'created_time', 'created_user_id', 'last_modified_times', 'last_modified_user_id')
WHERE  t.name LIKE 'TT[_]%'
  AND  t.schema_id = SCHEMA_ID('dbo')
GROUP BY t.name
ORDER BY t.name;

SELECT v.ten AS thieu_bang   -- PHẢI RA 0 DÒNG
FROM   (VALUES ('TT_TaiKhoan'), ('TT_ChuongTrinh'), ('TT_DuKienChi'), ('TT_NhaTaiTro'),
               ('TT_AnhChuyenKhoan'), ('TT_KhoanChi'), ('TT_MinhChungChi'), ('TT_MaDoiPhien')) v(ten)
WHERE  OBJECT_ID('dbo.' + v.ten, 'U') IS NULL;
GO

PRINT N'--- KIEM 2: moi view/SP TT_ tao duoi ANSI_NULLS ON + QUOTED_IDENTIFIER ON ---';
/* PHẢI RA 0 DÒNG. Ra dòng = file đó chạy bằng sqlcmd THIẾU cờ -I, hoặc thiếu header. Chạy lại file
   đó với -I. (Bảng TT_* không có filtered index nên chưa chết Msg 1934 — nhưng giữ kỷ luật để ngày
   có người thêm filtered index không phải đi dò lại toàn bộ.) */
SELECT o.name, o.type_desc, m.uses_ansi_nulls, m.uses_quoted_identifier
FROM   sys.sql_modules m
JOIN   sys.objects o ON o.object_id = m.object_id
WHERE  o.name LIKE 'TT[_]%'
  AND  (m.uses_ansi_nulls = 0 OR m.uses_quoted_identifier = 0);
GO

PRINT N'--- KIEM 3: SP cong khai KHONG doc bang nao, chi doc view TT_v_*CongKhai ---';
/* 🔴 KHỐI QUAN TRỌNG NHẤT CỦA LÔ. PHẢI RA 0 DÒNG.
   Ra dòng = một SP TT_CongKhai_* đang đọc thẳng một bảng (TT_NhaTaiTro, STU_*, CSV_*…) — tức đã đi
   vòng qua luật duyệt + che ẩn danh nằm ở view. Sửa SP cho đọc view, KHÔNG thêm điều kiện vào SP. */
SELECT p.name                   AS sp_cong_khai,
       d.referenced_entity_name AS doi_tuong_bi_cam
FROM   sys.procedures p
JOIN   sys.sql_expression_dependencies d ON d.referencing_id = p.object_id
WHERE  p.name LIKE 'TT[_]CongKhai[_]%'
  AND  d.referenced_entity_name NOT LIKE 'TT[_]v[_]%CongKhai';

/* PHẢI RA 0 DÒNG: không view công khai nào chạm bảng tuyệt đối riêng tư. */
SELECT OBJECT_NAME(d.referencing_id) AS view_cong_khai,
       d.referenced_entity_name      AS bang_rieng_tu
FROM   sys.sql_expression_dependencies d
JOIN   sys.views v ON v.object_id = d.referencing_id
WHERE  v.name LIKE 'TT[_]v[_]%'
  AND  d.referenced_entity_name IN ('TT_AnhChuyenKhoan', 'TT_TaiKhoan', 'TT_MaDoiPhien');

/* ĐÚNG: đúng 4 dòng (4 SP công khai của lô P1). Ít hơn = thiếu file; khối trên ra 0 dòng cũng vô
   nghĩa nếu SP chưa được tạo. */
SELECT name AS sp_cong_khai_dang_co
FROM   sys.procedures
WHERE  name LIKE 'TT[_]CongKhai[_]%'
ORDER BY name;
GO

PRINT N'--- KIEM 4: view cong khai khong lo cot rieng tu ---';
/* PHẢI RA 0 DÒNG. Ra dòng = ai đó đã thêm cột riêng tư vào view công khai. */
SELECT v.name AS view_cong_khai,
       c.name AS cot_rieng_tu
FROM   sys.views v
JOIN   sys.columns c ON c.object_id = v.object_id
WHERE  v.name LIKE 'TT[_]v[_]%CongKhai'
  AND  c.name IN ('email_lien_he', 'sdt_lien_he', 'ly_do_tu_choi', 'trang_thai_duyet', 'muc_an_danh',
                  'thoi_diem_duyet', 'id_nguoi_duyet', 'cong_khai', 'mat_khau', 'email_dang_nhap',
                  'id_tai_khoan_csv', 'ma_hash',
                  'is_deleted', 'created_time', 'created_user_id', 'last_modified_times', 'last_modified_user_id');
GO

PRINT N'--- KIEM 5: khong filtered index, khong cot muc_tieu ---';
/* PHẢI RA 0 DÒNG (cả hai truy vấn). */
SELECT OBJECT_NAME(i.object_id) AS bang, i.name AS filtered_index
FROM   sys.indexes i
WHERE  i.has_filter = 1
  AND  OBJECT_NAME(i.object_id) LIKE 'TT[_]%';

SELECT OBJECT_NAME(c.object_id) AS doi_tuong, c.name AS cot_cam
FROM   sys.columns c
WHERE  OBJECT_NAME(c.object_id) LIKE 'TT[_]%'
  AND  c.name IN ('muc_tieu', 'tong_da_quyen', 'tong_da_chi', 'so_nha_tai_tro',
                  -- cột ĐÃ GỠ ở lô đối chiếu ảnh mẫu — còn thấy = bảng tạo từ DDL cũ
                  'mo_ta_ngan', 'ten_chuyen_nganh')
  AND  OBJECTPROPERTY(c.object_id, 'IsUserTable') = 1;
GO

PRINT N'--- KIEM 6: SP TT_CuuSV_* (tra du lieu CHUA DUYET) deu loc theo tai khoan ---';
/* PHẢI RA 0 DÒNG. Mọi SP nhóm TT_CuuSV_* trả dữ liệu của MỘT cựu SV ⇒ phải nhận @id_tai_khoan_csv.
   Ra dòng = có SP nhóm này không có tham số đó — tức nó không thể đang lọc theo người đăng nhập.
   (Khối này chỉ kiểm được THAM SỐ CÓ MẶT. Tham số có được DÙNG trong WHERE hay không thì người review
   phải đọc; và việc id lấy từ claim JWT chứ không từ request là việc của service.) */
SELECT p.name AS sp_cuu_sv_thieu_tham_so
FROM   sys.procedures p
WHERE  p.name LIKE 'TT[_]CuuSV[_]%'
  AND  NOT EXISTS (SELECT 1 FROM sys.parameters pa
                   WHERE pa.object_id = p.object_id AND pa.name = '@id_tai_khoan_csv');

/* ĐÚNG: ít nhất 1 dòng (TT_CuuSV_GetLichSuTaiTroCuaToi). 0 dòng = chưa tạo SP, khối trên vô nghĩa. */
SELECT name AS sp_cuu_sv_dang_co FROM sys.procedures WHERE name LIKE 'TT[_]CuuSV[_]%' ORDER BY name;
GO

PRINT N'--- KIEM 7: TT_APP_USER KHONG tao duoc ma doi phien ---';
/* Chạy SAU bước cấp quyền (01_CreateLogin_TaiTro.sql). Chưa có TT_APP_USER thì cả hai ra 0 dòng.
   PHẢI RA 0 DÒNG: không có GRANT INSERT/UPDATE nào trên TT_MaDoiPhien, không GRANT EXECUTE trên SP tạo mã. */
SELECT OBJECT_NAME(p.major_id) AS doi_tuong, p.state_desc, p.permission_name
FROM   sys.database_permissions p
JOIN   sys.database_principals pr ON pr.principal_id = p.grantee_principal_id
WHERE  pr.name = N'TT_APP_USER'
  AND  p.state_desc IN ('GRANT', 'GRANT_WITH_GRANT_OPTION')
  AND  (   (p.major_id = OBJECT_ID('dbo.TT_MaDoiPhien')     AND p.permission_name IN ('INSERT', 'UPDATE'))
        OR (p.major_id = OBJECT_ID('dbo.TT_MaDoiPhien_Tao') AND p.permission_name = 'EXECUTE'));

/* ĐÚNG: đúng 2 dòng DENY (INSERT, UPDATE) trên TT_MaDoiPhien. Thiếu = bước 5b chưa chạy. */
SELECT p.state_desc, p.permission_name
FROM   sys.database_permissions p
JOIN   sys.database_principals pr ON pr.principal_id = p.grantee_principal_id
WHERE  pr.name = N'TT_APP_USER'
  AND  p.major_id = OBJECT_ID('dbo.TT_MaDoiPhien')
  AND  p.state_desc = 'DENY';
GO
