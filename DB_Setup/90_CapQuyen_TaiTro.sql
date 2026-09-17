SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
GO
/* =============================================================================================
   CẤP QUYỀN CHO TT_APP_USER — CHẠY SAU CÙNG
   =============================================================================================
   🔴 THỨ TỰ: 00_TaoLogin_TaiTro.sql → bảng → view → SP → FILE NÀY (DB_Setup/TRIEN_KHAI_P1.md, Bước 4).
      Tiền tố "90_" nói đúng điều đó: chạy SAU mọi đối tượng. File cấp quyền cho đối tượng TT_* ĐANG CÓ lúc
      chạy — chạy trước khi có SP là API nhận "EXECUTE permission was denied".
   🔄 Lịch sử: trước 2026-09-17 phần này nằm chung với tạo login trong `01_CreateLogin_TaiTro.sql`. Tên "01_"
      đọc như bước đầu ⇒ lead chạy nó trước khi có SP ⇒ mọi endpoint lỗi EXECUTE denied (log API 15:07:57).
      Tách hai file để TÊN nói thứ tự (docs/03 N20).
   🔴 LÔ SAU THÊM bảng/view/SP TT_* ⇒ CHẠY LẠI FILE NÀY ở cuối lô. Chạy lại bao nhiêu lần cũng an toàn.
   🔴 Cờ bắt buộc: sqlcmd -S <server> -E -d ESS_HOCVIENTAICHINH_DAOTAO -I -b -f 65001 -i "DB_Setup\90_CapQuyen_TaiTro.sql"
      Thiếu -I (QUOTED_IDENTIFIER): DB có FILTERED INDEX trên CSV_TaiKhoan ⇒ Msg 1934. Thiếu -b: lỗi 50020/
      50021 bên dưới in ra rồi sqlcmd CHẠY TIẾP như không có gì.
   ============================================================================================= */
USE [ESS_HOCVIENTAICHINH_DAOTAO];
GO
/* --- 1. KIỂM TRƯỚC — thiếu là DỪNG, không "thành công giả" -------------------------------------
   🔄 Trước: nhánh `PRINT 'Chua co doi tuong TT_* nao'` — lẫn giữa output, sqlcmd trả mã 0.
   ⚠️ Số tối thiểu = số đối tượng P1 (là SÀN): lô sau THÊM đối tượng thì không cần sửa; chỉ sửa nếu XOÁ bớt. */
IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = N'TT_APP_USER')
   THROW 50022, N'CHUA CO USER TT_APP_USER. Chay DB_Setup/00_TaoLogin_TaiTro.sql truoc.', 1;

DECLARE @so_bang AS INT = (SELECT COUNT(*) FROM sys.tables     WHERE name LIKE 'TT[_]%' AND SCHEMA_NAME(schema_id) = 'dbo');
DECLARE @so_view AS INT = (SELECT COUNT(*) FROM sys.views      WHERE name LIKE 'TT[_]%' AND SCHEMA_NAME(schema_id) = 'dbo');
DECLARE @so_sp   AS INT = (SELECT COUNT(*) FROM sys.procedures WHERE name LIKE 'TT[_]%' AND SCHEMA_NAME(schema_id) = 'dbo');
IF @so_bang < 8 OR @so_view < 5 OR @so_sp < 5
   BEGIN
      DECLARE @thieu AS NVARCHAR (400) = CONCAT(
         N'CHUA DU DOI TUONG TT_* DE CAP QUYEN (bang ', @so_bang, N'/8, view ', @so_view, N'/5, SP ', @so_sp,
         N'/5). Chay het Buoc 1-3 cua DB_Setup/TRIEN_KHAI_P1.md roi CHAY LAI file nay.');
      THROW 50020, @thieu, 1;
   END

/* 🔴 Mọi đối tượng TT_* PHẢI do dbo sở hữu. Toàn bộ mô hình quyền của file này dựa trên OWNERSHIP CHAINING
   (SP dbo → view dbo → bảng dbo: SQL Server chỉ kiểm EXECUTE ở SP, không kiểm gì ở view/bảng). Một đối tượng
   chủ KHÁC làm ĐỨT CHUỖI: SP đọc view đó sẽ lỗi "SELECT permission denied" dù đã có EXECUTE — và quyền trên
   view lúc đó MỚI có tác dụng. Chuyện đó phải là quyết định có ý thức, không được lặng lẽ xảy ra ⇒ DỪNG.
   ("Chủ" = principal_id của đối tượng, NULL thì là chủ của schema.) */
DECLARE @chu_khac AS NVARCHAR (MAX) = (
   SELECT STRING_AGG(CONCAT(o.name, N' (chu: ', USER_NAME(COALESCE(o.principal_id, s.principal_id)), N')'), N', ')
   FROM   sys.objects o JOIN sys.schemas s ON s.schema_id = o.schema_id
   WHERE  o.name LIKE 'TT[_]%' AND o.type IN ('U', 'V', 'P')
     AND  COALESCE(o.principal_id, s.principal_id) <> USER_ID('dbo'));
IF @chu_khac IS NOT NULL
   BEGIN
      DECLARE @msg_chu AS NVARCHAR (MAX) = CONCAT(
         N'DOI TUONG TT_* KHONG DO dbo SO HUU — chuoi so huu DUT, SP doc no se loi du co EXECUTE: ', @chu_khac,
         N'. Doc muc 3b cua file nay truoc khi quyet dinh cap quyen rieng.');
      THROW 50021, @msg_chu, 1;
   END
GO
/* --- 2. KHÔNG cho vào role rộng ------------------------------------------------------------
   🔴 TUYỆT ĐỐI KHÔNG `ALTER ROLE db_datareader ADD MEMBER [TT_APP_USER]`.
   db_datareader = đọc MỌI bảng, tức đọc cả CMND / ảnh giấy tờ / số tài khoản ngân hàng của cựu
   sinh viên. Cả điểm của việc tạo tài khoản riêng này là KHÔNG có quyền đó.
   Nếu thấy ai đó thêm dòng ALTER ROLE vào đây, đó là lỗi, không phải tiện tay.
   ------------------------------------------------------------------------------------------ */
/* --- 3. QUYỀN ĐỌC — đúng những bảng cần để điền sẵn form ----------------------------------- */
/* 🔴 CSV_TaiKhoan THEO CỘT, không cả bảng: bảng có `mat_khau` và `provider_key` (khoá đăng nhập ngoài), cùng
   `ly_do_tu_choi` viết cho quản trị cổng kia. 🔄 Tới 2026-09-17 cấp cả bảng. Chỉ giữ cột P3/P4 cần: định danh +
   điều kiện phiên cựu SV (vai_tro IN (2,3), trang_thai = 1, is_deleted = 0 — docs/01 §2).
   REVOKE trước: GRANT theo cột KHÔNG gỡ quyền cả bảng đã cấp ở bản cũ — thiếu dòng REVOKE thì mat_khau vẫn đọc được. */
REVOKE SELECT
   ON dbo.CSV_TaiKhoan FROM [TT_APP_USER];
GRANT SELECT
   ON dbo.CSV_TaiKhoan (id, email_dang_nhap, id_sv, vai_tro, id_lop, trang_thai, is_deleted) TO [TT_APP_USER];

/* 🔴 CSV_ThongTin THEO CỘT: điền sẵn chỉ lấy SĐT + email (→ TT_NhaTaiTro.sdt_lien_he / email_lien_he), nối qua
   id_tai_khoan, lọc is_deleted. KHÔNG cấp dia_chi_hien_tai, ghi_chu (chữ tự do), id_tinh_thanh, id_xa_phuong —
   TT_NhaTaiTro không có cột địa chỉ nào để điền. 🔄 Tới 2026-09-17 cấp cả bảng. REVOKE trước, cùng lý do CSV_TaiKhoan. */
REVOKE SELECT
   ON dbo.CSV_ThongTin FROM [TT_APP_USER];
GRANT SELECT
   ON dbo.CSV_ThongTin (id_tai_khoan, sdt_hien_tai, email_hien_tai, is_deleted) TO [TT_APP_USER];

GRANT SELECT
   ON dbo.STU_Lop TO [TT_APP_USER];

GRANT SELECT
   ON dbo.dmHe TO [TT_APP_USER];

GRANT SELECT
   ON dbo.dmKhoa TO [TT_APP_USER];

GRANT SELECT
   ON dbo.dmChuyenNganh TO [TT_APP_USER];
GO
/* 🔴 CHỈ HAI CỘT của hồ sơ sinh viên. Bảng này chứa CMND/ảnh giấy tờ — GRANT cả bảng là hỏng
   đúng thứ mà tài khoản riêng này sinh ra để chặn. */
GRANT SELECT
   ON dbo.STU_HoSoSinhVien (Ho_ten, Ngay_sinh) TO [TT_APP_USER];
GO
/* ⚠️ GIỚI HẠN THẬT CỦA QUYỀN THEO CỘT — đừng tin là đã xong:
   Quyền theo cột chỉ chặn TRUY VẤN TRỰC TIẾP. Một Stored Procedure do dbo sở hữu mà đọc thêm cột
   CMND thì OWNERSHIP CHAINING của SQL Server BỎ QUA kiểm tra quyền trên bảng — TT_APP_USER vẫn
   đọc được qua SP đó.
   ⇒ Lớp chặn thứ nhất là KỶ LUẬT VIẾT SP: không SP nào của cổng Tài trợ được SELECT quá hai cột
     trên. Người review SP phải kiểm đúng điểm này, script này không làm thay được.
   Câu tra soát định kỳ (liệt kê SP của cổng có đụng bảng hồ sơ):
       SELECT OBJECT_NAME(referencing_id)
       FROM   sys.sql_expression_dependencies
       WHERE  referenced_entity_name = 'STU_HoSoSinhVien'
         AND  OBJECT_NAME(referencing_id) LIKE 'TT[_]%';
*/
/* 🔴 STU_DanhSach (nối sinh viên ↔ lớp) — CỐ Ý KHÔNG GRANT. Đọc hết trước khi "thêm cho P3 chạy".
   Yêu cầu 2026-09-17: thêm STU_DanhSach vì P3 cần điền sẵn khoá/lớp. ĐÃ THỬ TRÊN DB THẬT (transaction → ROLLBACK):
     · SP chủ dbo đọc STU_DanhSach JOIN STU_Lop JOIN STU_HoSoSinhVien ON ID_sv, gọi bằng TT_APP_USER — CHẠY ĐƯỢC,
       dù TT_APP_USER KHÔNG có quyền nào trên STU_DanhSach, và KHÔNG có quyền trên cột ID_sv (chỉ Ho_ten, Ngay_sinh).
     · TT_APP_USER đọc THẲNG STU_DanhSach — lỗi 229 (đúng).
   ⇒ Như view ở khối 3b: SP TT_* (chủ dbo) đọc bảng dbo qua OWNERSHIP CHAINING, GRANT trên bảng KHÔNG được kiểm.
   ⇒ Và STU_DanhSach có Mat_khau, Mat_khau_phu_huynh, No_hoc_phi, xếp hạng học lực — GRANT cả bảng là cho cổng CÔNG
      KHAI đọc được mật khẩu sinh viên. Bảng P3/P4 cần: CSV_TaiKhoan (id_sv, id_lop, vai_tro, trang_thai, is_deleted),
      STU_HoSoSinhVien (ID_sv, Ho_ten, Ngay_sinh), STU_DanhSach (ID_sv, ID_lop, IsDeleted), STU_Lop (Ten_lop, ID_he,
      ID_khoa, ID_chuyen_nganh, Nien_khoa), dmHe, dmKhoa, dmChuyenNganh — mọi thứ qua SP ⇒ KHÔNG bảng nào cần GRANT.
   ⚠️ NGOẠI LỆ DUY NHẤT — PHẢI GRANT khi: SP dùng SQL ĐỘNG (sp_executesql / EXEC(@sql)). Chuỗi sở hữu ĐỨT ở đó, câu động
      chạy bằng quyền TT_APP_USER — đã thử: SP dbo chạy sp_executesql đọc STU_DanhSach ⇒ lỗi 229. Khi đó cấp THEO CỘT,
      đúng cột câu động đọc, như STU_HoSoSinhVien ở trên — không bao giờ cả bảng.
   ⚠️ Cùng lý do đó, các GRANT SELECT ở khối 3 phía trên (CSV_TaiKhoan … STU_HoSoSinhVien) cũng KHÔNG cần cho SP tĩnh.
      Lead chốt GIỮ (2026-09-17): lưới an toàn cho SQL động, rủi ro thấp — docs/03 N22. Đừng lấy chúng làm tiền lệ
      để thêm bảng mới; bảng nào có cột mật khẩu/bí mật thì cấp THEO CỘT (như CSV_TaiKhoan, STU_HoSoSinhVien). */
/* --- 3b. QUYỀN TRÊN BẢNG + SP TT_* — sinh bằng vòng lặp, KHÔNG liệt kê tay ------------------------
   ⚠️ TT_MaDoiPhien và SP tạo mã ĐỨNG NGOÀI vòng lặp — xem khối 4 bên dưới.

   🔴 VIEW TT_v_*: KHÔNG CẤP QUYỀN NÀO — ĐỌC TRƯỚC KHI "THÊM CHO CHẮC"
   SP TT_CongKhai_* (chủ dbo) đọc view (chủ dbo) đọc bảng (chủ dbo) ⇒ OWNERSHIP CHAINING: SQL Server chỉ kiểm
   EXECUTE ở SP, không kiểm quyền trên view hay bảng phía sau. EXECUTE là đủ.
   ĐÃ CHỨNG MINH trên DB thật (2026-09-17): thu hết SELECT trên 5 view trong một transaction, TT_APP_USER vẫn
   gọi được cả 4 SP; rồi ROLLBACK.
   🔄 Chính lỗi này đã xảy ra: API lỗi khi triển khai P1 ⇒ chẩn đoán "thiếu GRANT SELECT trên view" ⇒ quyền đó
      được thêm (tay trên DB, rồi vào script) — nhưng lỗi THẬT là "EXECUTE permission was denied" (file quyền
      chạy trước khi có SP). Gặp lỗi quyền ⇒ ĐỌC NGUYÊN VĂN câu lỗi: nó nêu tên đối tượng và loại quyền.
   Không cấp vì: không cấp thứ không cần — mỗi quyền thừa là một đường đọc thẳng view, lách qua SP.

   ⚠️ KHI NÀO PHẢI CẤP quyền trên view: khi view (hoặc bảng nó đọc) do chủ sở hữu KHÁC dbo. Chuỗi sở hữu ĐỨT,
      SQL Server kiểm quyền tại đó, và SELECT trên view MỚI có tác dụng. Khối 1 dừng bằng lỗi 50021 đúng ca này.
      Khi đó: cấp quyền cho ĐÚNG view đó, CHỈ SELECT, và ghi lý do. 🔴 Không bao giờ INSERT/UPDATE/DELETE trên
      view — view đơn bảng cập nhật được, quyền ghi trên view là ghi xuống bảng gốc lách mọi luật của view.
   ------------------------------------------------------------------------------------------------ */
DECLARE @sql AS NVARCHAR (MAX) = N'';

SELECT @sql = @sql + N'GRANT SELECT, INSERT, UPDATE, DELETE ON dbo.' + QUOTENAME(name) + N' TO [TT_APP_USER];' + CHAR(10)
FROM   sys.tables
WHERE  name LIKE 'TT[_]%'
       AND SCHEMA_NAME(schema_id) = 'dbo'
       AND name <> 'TT_MaDoiPhien';

SELECT @sql = @sql + N'GRANT EXECUTE ON dbo.' + QUOTENAME(name) + N' TO [TT_APP_USER];' + CHAR(10)
FROM   sys.procedures
WHERE  name LIKE 'TT[_]%'
       AND SCHEMA_NAME(schema_id) = 'dbo'
       AND name <> 'TT_MaDoiPhien_Tao';

/* Gỡ quyền view mà bản CŨ của file này (hoặc tay) đã cấp. Chỉ bỏ khỏi vòng lặp thì quyền cũ Ở LẠI trên DB
   (cùng lý do DENY ở khối 4). CHỈ view do dbo sở hữu — view chủ khác đã bị chặn ở khối 1.
   REVOKE trên quyền không có là no-op ⇒ chạy lại an toàn. */
SELECT @sql = @sql + N'REVOKE SELECT, INSERT, UPDATE, DELETE ON dbo.' + QUOTENAME(v.name) + N' FROM [TT_APP_USER];' + CHAR(10)
FROM   sys.views v JOIN sys.schemas s ON s.schema_id = v.schema_id
WHERE  v.name LIKE 'TT[_]%'
       AND s.name = 'dbo'
       AND COALESCE(v.principal_id, s.principal_id) = USER_ID('dbo');

-- 🔴 SQL ĐỘNG DUY NHẤT của cả thư mục DB_Setup + StoredProcedures. `SET PARSEONLY` KHÔNG kiểm được nó
--    (chuỗi chỉ thành câu lệnh lúc chạy). Cách kiểm: DB_Setup/97_KiemTra_SqlDong.sql (sinh chuỗi y hệt, chạy
--    trong transaction rồi ROLLBACK). Sửa phần sinh chuỗi ở đây ⇒ sửa y hệt ở file đó.
PRINT @sql;
EXECUTE sp_executesql @sql;
GO
/* --- 4. 🔴 TT_MaDoiPhien — CỔNG NÀY ĐỔI MÃ, KHÔNG ĐƯỢC TẠO MÃ ------------------------------------
   Ai INSERT được vào TT_MaDoiPhien thì tự cấp cho mình phiên của BẤT KỲ cựu SV nào (chọn id rồi đổi
   mã). Bên tạo mã là CỔNG CỰU SV — nơi đã xác thực người dùng. Cổng Tài trợ là cổng CÔNG KHAI: một lỗi
   SQL injection ở đây không được phép leo thành "đăng nhập thay người khác".
   ⇒ TT_APP_USER: SELECT + DELETE (đổi mã = DELETE…OUTPUT), DENY INSERT + UPDATE.
   ⇒ DENY chứ không chỉ "không GRANT": DENY THẮNG mọi GRANT — kể cả GRANT mà vòng lặp bản CŨ của
      khối 3b đã cấp nếu file quyền từng chạy sau khi bảng có mặt. Chỉ bỏ khỏi vòng lặp thì quyền cũ ở lại.
   ⇒ SP tạo mã (tên CỐ ĐỊNH `TT_MaDoiPhien_Tao`, lô đăng nhập) cũng DENY EXECUTE: SP do dbo sở hữu
      INSERT qua ownership chaining, DENY trên BẢNG không chặn được đường đó — phải chặn ở SP.
   ⚠️ QUYỀN CỦA CỔNG CỰU SV không cấp ở file này — xem docs/01-kien-truc.md §4.
   ------------------------------------------------------------------------------------------------ */
IF OBJECT_ID('dbo.TT_MaDoiPhien', 'U') IS NOT NULL
   BEGIN
      GRANT SELECT, DELETE
         ON dbo.TT_MaDoiPhien TO [TT_APP_USER];
      DENY INSERT, UPDATE
         ON dbo.TT_MaDoiPhien TO [TT_APP_USER];
   END

IF OBJECT_ID('dbo.TT_MaDoiPhien_Tao', 'P') IS NOT NULL
   DENY EXECUTE
      ON dbo.TT_MaDoiPhien_Tao TO [TT_APP_USER];

/* 🔴 DẤU "ĐÃ CHẠY TỚI ĐÂY" — cho 97_ChayThu_CapQuyen. Đặt SAU khối ghi quyền cuối cùng.
   97_ nạp file này bằng `:r`. `:r` không nạp được (SSMS chưa bật SQLCMD Mode · sqlcmd đứng sai thư mục mà thiếu
   -b) thì 97_ vẫn chạy tiếp và kiểm trên quyền CŨ — đã báo PASS giả HAI lần (2026-09-17). 97_ xoá dấu này trước
   `:r` và THROW nếu sau `:r` không thấy nó. SESSION_CONTEXT sống theo PHIÊN, không bị ROLLBACK xoá.
   ⚠️ Đừng dời dấu này lên trên: đặt sớm thì 90_ dừng giữa chừng vẫn để lại dấu "đã chạy". */
EXEC sys.sp_set_session_context @key = N'TT_90_CapQuyen', @value = N'da_chay_het';
GO
/* --- 5. KIỂM CHỨNG — chạy và ĐỌC kết quả, đừng bỏ qua -------------------------------------- */
SELECT   pr.name AS nguoi_dung,
         p.state_desc, -- GRANT / DENY
         p.permission_name,
         OBJECT_NAME(p.major_id) AS doi_tuong,
         c.name AS cot -- NULL = cả bảng
FROM     sys.database_permissions AS p
         INNER JOIN
         sys.database_principals AS pr
         ON pr.principal_id = p.grantee_principal_id
         LEFT OUTER JOIN
         sys.columns AS c
         ON c.object_id = p.major_id
            AND c.column_id = p.minor_id
WHERE    pr.name = N'TT_APP_USER'
ORDER BY doi_tuong, p.permission_name;

/* ✅ ĐÚNG khi: dòng của STU_HoSoSinhVien có CỘT = Ho_ten và Ngay_sinh (hai dòng), KHÔNG có dòng
      nào cột = NULL cho bảng đó.
   🔴 SAI khi: thấy STU_HoSoSinhVien với cot = NULL  -> ai đó đã GRANT cả bảng, thu hồi ngay:
      REVOKE SELECT ON dbo.STU_HoSoSinhVien FROM [TT_APP_USER];
   🔴 SAI khi: SELECT * FROM sys.database_role_members cho thấy TT_APP_USER trong db_datareader.
   🔴 SAI khi: dòng TT_MaDoiPhien có INSERT hoặc UPDATE với state_desc = GRANT. ĐÚNG là hai dòng
      DENY (INSERT, UPDATE) + hai dòng GRANT (SELECT, DELETE).
   ✅ ĐÚNG khi: mỗi SP TT_* (trừ TT_MaDoiPhien_Tao) có một dòng GRANT EXECUTE — THIẾU dòng này là API nhận
      "EXECUTE permission was denied" (lỗi thật khi triển khai P1).
   ✅ ĐÚNG khi: KHÔNG có dòng nào cho view TT_v_* (khối 3b giải thích vì sao). */
