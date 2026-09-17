SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
GO
/* =============================================================================================
   TẠO LOGIN + USER CHO CỔNG VẬN ĐỘNG TÀI TRỢ — CHẠY ĐẦU TIÊN (hoặc bất cứ lúc nào)
   =============================================================================================
   File này CHỈ tạo tài khoản. KHÔNG cấp quyền nào — quyền ở DB_Setup/90_CapQuyen_TaiTro.sql, chạy SAU CÙNG.
   🔄 Lịch sử: trước 2026-09-17 hai việc nằm chung trong `01_CreateLogin_TaiTro.sql`; tên "01_" khiến phần
      cấp quyền bị chạy trước khi có SP ⇒ API lỗi "EXECUTE permission was denied". Tách để TÊN nói thứ tự
      (docs/03 N20). Thứ tự đầy đủ: DB_Setup/TRIEN_KHAI_P1.md.
   🔴 Cờ bắt buộc: sqlcmd -S <server> -E -d ESS_HOCVIENTAICHINH_DAOTAO -I -b -f 65001 -i "DB_Setup\00_TaoLogin_TaiTro.sql"
   ⚠️ Instance phải bật SQL Server authentication (Mixed Mode) — instance chỉ Windows auth thì login tạo được
      nhưng KHÔNG đăng nhập được (đã gặp ở MSSQLSERVER01, P2a).

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

/* --- 3. USER MỒ CÔI — nối lại với login ----------------------------------------------------------
   `CREATE USER` ở trên bị BỎ QUA khi user đã có. Nhưng user có thể đã có mà KHÔNG nối với login (DB được
   khôi phục/chép từ máy khác, hoặc login bị xoá rồi tạo lại ⇒ SID khác). Khi đó API báo "Login failed" dù
   mật khẩu đúng. Đã gặp thật ở P2a: MSSQLSERVER01 có USER TT_APP_USER nhưng không có login nào khớp SID.
   ------------------------------------------------------------------------------------------------ */
IF EXISTS (SELECT 1
           FROM   sys.database_principals dp
           WHERE  dp.name = N'TT_APP_USER'
             AND  NOT EXISTS (SELECT 1 FROM sys.server_principals sp
                              WHERE sp.name = N'TT_APP_LOGIN' AND sp.sid = dp.sid))
   BEGIN
      PRINT N'User TT_APP_USER mo coi - noi lai voi login TT_APP_LOGIN.';
      ALTER USER [TT_APP_USER] WITH LOGIN = [TT_APP_LOGIN];
   END
GO
/* --- 4. KIỂM ----------------------------------------------------------------------------------- */
SELECT sp.name AS login_ten,
       dp.name AS user_ten,
       CASE WHEN sp.sid = dp.sid THEN N'noi dung' ELSE N'LOI: user khong noi voi login' END AS trang_thai,
       SERVERPROPERTY('IsIntegratedSecurityOnly') AS chi_windows_auth -- PHẢI = 0
FROM   sys.database_principals dp
       LEFT JOIN sys.server_principals sp ON sp.name = N'TT_APP_LOGIN'
WHERE  dp.name = N'TT_APP_USER';
/* ✅ ĐÚNG khi: đúng 1 dòng, trang_thai = "noi dung", chi_windows_auth = 0. */
