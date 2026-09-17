SET ANSI_NULLS ON;


GO
SET QUOTED_IDENTIFIER ON;


GO
/* =============================================================================================
   TÀI KHOẢN SQL RIÊNG CHO CỔNG VẬN ĐỘNG TÀI TRỢ
   =============================================================================================
   🔴 CHẠY BẰNG sqlcmd PHẢI CÓ CỜ -I:
        sqlcmd -S <server> -d ESS_HOCVIENTAICHINH_DAOTAO -i 01_CreateLogin_TaiTro.sql -I
   Mặc định của sqlcmd là QUOTED_IDENTIFIER OFF (SSMS là ON). DB này có FILTERED INDEX trên
   CSV_TaiKhoan, và SQL Server bắt buộc QUOTED_IDENTIFIER ON cho mọi INSERT/UPDATE/DELETE lên bảng
   có filtered index — thiếu -I thì script chạy được nhưng SP tạo ra sẽ chết Msg 1934 lúc GỌI.

   ⚠️ LEAD ĐIỀN mật khẩu ở dòng CREATE LOGIN rồi hãy chạy. Đừng commit mật khẩu thật vào repo.
   ⚠️ Chạy trên ĐÚNG database ESS_HOCVIENTAICHINH_DAOTAO (dùng chung với cổng Cựu sinh viên).
   ============================================================================================= */
/* --- 1. LOGIN cấp server ------------------------------------------------------------------ */
IF NOT EXISTS (SELECT 1
               FROM   sys.server_principals
               WHERE  name = N'TT_APP_LOGIN')
   BEGIN
      CREATE LOGIN [TT_APP_LOGIN]
         WITH PASSWORD = N'Haikonga12345~~', CHECK_POLICY = ON, DEFAULT_DATABASE = [ESS_HOCVIENTAICHINH_DAOTAO];
   END


GO
/* --- 2. USER trong database --------------------------------------------------------------- */
USE [ESS_HOCVIENTAICHINH_DAOTAO];


GO
IF NOT EXISTS (SELECT 1
               FROM   sys.database_principals
               WHERE  name = N'TT_APP_USER')
   BEGIN
      CREATE USER [TT_APP_USER] FOR LOGIN [TT_APP_LOGIN];
   END


GO
/* --- 3. KHÔNG cho vào role rộng ------------------------------------------------------------
   🔴 TUYỆT ĐỐI KHÔNG `ALTER ROLE db_datareader ADD MEMBER [TT_APP_USER]`.
   db_datareader = đọc MỌI bảng, tức đọc cả CMND / ảnh giấy tờ / số tài khoản ngân hàng của cựu
   sinh viên. Cả điểm của việc tạo tài khoản riêng này là KHÔNG có quyền đó.
   Nếu thấy ai đó thêm dòng ALTER ROLE vào đây, đó là lỗi, không phải tiện tay.
   ------------------------------------------------------------------------------------------ */
/* --- 4. QUYỀN ĐỌC — đúng những bảng cần để điền sẵn form ----------------------------------- */
GRANT SELECT
   ON dbo.CSV_TaiKhoan TO [TT_APP_USER];

GRANT SELECT
   ON dbo.CSV_ThongTin TO [TT_APP_USER];

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
/* --- 5. QUYỀN GHI — chỉ trên bảng của cổng này -------------------------------------------- */
/* Bảng TT_* chưa tồn tại ở P1. Chạy lại đoạn này SAU KHI tạo bảng, hoặc dùng vòng lặp bên dưới
   để cấp cho mọi bảng/SP mang tiền tố TT_ đang có. */
DECLARE @sql AS NVARCHAR (MAX) = N'';

-- ⚠️ TT_MaDoiPhien và SP tạo mã ĐỨNG NGOÀI vòng lặp — xem khối 5b ngay dưới.
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

IF @sql = N''
   PRINT N'Chua co doi tuong TT_* nao. Chay lai buoc 5 sau khi tao bang/SP.';
ELSE
   BEGIN
      PRINT @sql;
      EXECUTE sp_executesql @sql;
   END


GO
/* --- 5b. 🔴 TT_MaDoiPhien — CỔNG NÀY ĐỔI MÃ, KHÔNG ĐƯỢC TẠO MÃ ------------------------------------
   Ai INSERT được vào TT_MaDoiPhien thì tự cấp cho mình phiên của BẤT KỲ cựu SV nào (chọn id rồi đổi
   mã). Bên tạo mã là CỔNG CỰU SV — nơi đã xác thực người dùng. Cổng Tài trợ là cổng CÔNG KHAI: một lỗi
   SQL injection ở đây không được phép leo thành "đăng nhập thay người khác".
   ⇒ TT_APP_USER: SELECT + DELETE (đổi mã = DELETE…OUTPUT), DENY INSERT + UPDATE.
   ⇒ DENY chứ không chỉ "không GRANT": DENY THẮNG mọi GRANT — kể cả GRANT mà vòng lặp bản CŨ của
      bước 5 đã cấp nếu file này từng chạy sau khi bảng có mặt. Chỉ bỏ khỏi vòng lặp thì quyền cũ ở lại.
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


GO
/* --- 6. KIỂM CHỨNG — chạy và ĐỌC kết quả, đừng bỏ qua -------------------------------------- */
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
      DENY (INSERT, UPDATE) + hai dòng GRANT (SELECT, DELETE). */