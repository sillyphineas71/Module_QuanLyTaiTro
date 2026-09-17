:on error exit
GO
SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
GO
/* =============================================================================================
   CHẠY THỬ 90_CapQuyen_TaiTro.sql TRONG MỘT TRANSACTION RỒI ROLLBACK — KIỂM CẢ SQL ĐỘNG
   =============================================================================================
   🔴 FILE NÀY TỰ CHỨNG MINH NÓ ĐÃ NẠP ĐƯỢC 90_ TRƯỚC KHI BÁO KẾT QUẢ (docs/02 C5).
   🔄 Trước 2026-09-17: báo PASS GIẢ hai lần — lead chạy (1) SSMS thường, không bật SQLCMD Mode: dòng `:r` là lỗi
      cú pháp, SSMS bỏ qua batch đó rồi chạy tiếp; (2) sqlcmd sai thư mục (thiếu -b): `:r` không thấy file, in lỗi
      rồi chạy tiếp. Cả hai lần phần kiểm chạy trên quyền CŨ của DB và in "PASS". Hai lỗi khác nhau, cùng hậu quả.
   Nay có HAI lớp:
     · `:on error exit` (dòng đầu file) — sqlcmd/SSMS SQLCMD Mode dừng ở lỗi đầu tiên, KỂ CẢ khi quên -b.
       SSMS thường không hiểu dòng đó (lỗi cú pháp, bỏ qua) ⇒ không che được ca (1) ⇒ cần lớp dưới.
     · DẤU PHIÊN: xoá SESSION_CONTEXT 'TT_90_CapQuyen' trước `:r`; 90_ đặt lại ở cuối file; không thấy ⇒ THROW 50031.
       Che được MỌI cách `:r` không chạy, không cần biết vì sao.
   =============================================================================================
   Vì sao có file này: `SET PARSEONLY ON` chỉ kiểm cú pháp chữ viết trong file. Khối 3b của 90_CapQuyen sinh
   câu GRANT/REVOKE thành CHUỖI rồi `sp_executesql` — chuỗi đó chỉ thành câu lệnh LÚC CHẠY, nên PARSEONLY
   không thấy nó. Cách kiểm duy nhất là CHẠY THẬT. File này chạy chính 90_CapQuyen (qua `:r`, không chép lại
   logic — chép lại là hai bản trôi khỏi nhau), kiểm quyền thu được, rồi ROLLBACK: DB không đổi.

   🔴 CHẠY TỪ THƯ MỤC GỐC REPO (đường dẫn `:r` tương đối), bằng sqlcmd — SSMS phải bật SQLCMD Mode:
        sqlcmd -S <server> -E -d ESS_HOCVIENTAICHINH_DAOTAO -I -b -f 65001 -i "DB_Setup\97_ChayThu_CapQuyen.sql"
   ĐÚNG khi dòng cuối là "PASS: ..." và mã thoát 0. Trước và sau phải cùng số quyền (dòng "khong doi").
   ⚠️ Cần user TT_APP_USER và đủ đối tượng P1 — nếu không, 90_CapQuyen tự THROW 50020/50022 và phiên đóng
      (transaction tự rollback).
   ⚠️ GRANT/REVOKE/DENY trong SQL Server CÓ nằm trong transaction (rollback được) — đã kiểm 2026-09-17.
   ============================================================================================= */
SET NOCOUNT ON;
SET XACT_ABORT ON;

IF OBJECT_ID('tempdb..#truoc') IS NOT NULL DROP TABLE #truoc;
SELECT p.class, p.major_id, p.minor_id, p.permission_name, p.state_desc
INTO   #truoc
FROM   sys.database_permissions p
WHERE  p.grantee_principal_id = USER_ID('TT_APP_USER');

-- Xoá dấu của lần chạy trước trong CÙNG phiên (SSMS giữ phiên giữa các lần bấm Execute).
EXEC sys.sp_set_session_context @key = N'TT_90_CapQuyen', @value = NULL;

BEGIN TRAN;
GO
:r DB_Setup\90_CapQuyen_TaiTro.sql
GO
/* ── 🔴 CHỨNG MINH 90_ ĐÃ CHẠY HẾT — trước mọi kiểm tra. Không có dấu ⇒ mọi thứ bên dưới kiểm trên trạng thái CŨ. ── */
IF ISNULL(CAST(SESSION_CONTEXT(N'TT_90_CapQuyen') AS NVARCHAR (20)), N'') <> N'da_chay_het'
BEGIN
    IF @@TRANCOUNT > 0 ROLLBACK;
    THROW 50031, N'90_CapQuyen KHONG DUOC NAP / KHONG CHAY HET - ket qua kiem se VO NGHIA. Kiem: (1) SSMS phai bat Query > SQLCMD Mode; (2) sqlcmd phai dung o THU MUC GOC repo (duong dan :r tuong doi); (3) doc loi ngay tren - 90_ co the da THROW 50020/50021/50022.', 1;
END
GO
/* ── Kiểm quyền THU ĐƯỢC sau khi 90_CapQuyen chạy (vẫn trong transaction) ── */
/* 🔴 BIẾN BẢNG, không bảng tạm: ROLLBACK xoá bảng tạm TẠO TRONG transaction (lần chạy đầu gặp đúng lỗi này —
   Msg 208 Invalid object name) và xoá cả dòng INSERT vào bảng tạm. Biến bảng không bị ROLLBACK đụng tới, nhưng
   chỉ sống trong MỘT batch ⇒ kiểm + ROLLBACK + so sánh phải ở CÙNG batch, không có GO ở giữa. */
DECLARE @loi TABLE (ca NVARCHAR (400));

-- 1. Mọi SP TT_* (trừ SP tạo mã) có GRANT EXECUTE — thiếu là lỗi thật đã gặp khi triển khai P1.
INSERT @loi
SELECT CONCAT(N'FAIL 1: SP thieu GRANT EXECUTE: ', pr.name)
FROM   sys.procedures pr
WHERE  pr.name LIKE 'TT[_]%' AND pr.name <> 'TT_MaDoiPhien_Tao'
  AND  NOT EXISTS (SELECT 1 FROM sys.database_permissions p
                   WHERE p.major_id = pr.object_id AND p.grantee_principal_id = USER_ID('TT_APP_USER')
                     AND p.permission_name = 'EXECUTE' AND p.state_desc = 'GRANT');

-- 2. View TT_* do dbo sở hữu: KHÔNG quyền nào (90_CapQuyen khối 3b).
INSERT @loi
SELECT CONCAT(N'FAIL 2: view co quyen (phai KHONG co): ', OBJECT_NAME(p.major_id), N' ', p.state_desc, N' ', p.permission_name)
FROM   sys.database_permissions p JOIN sys.views v ON v.object_id = p.major_id
WHERE  p.grantee_principal_id = USER_ID('TT_APP_USER') AND v.name LIKE 'TT[_]%';

-- 3. TT_MaDoiPhien: DENY INSERT + DENY UPDATE, không GRANT INSERT/UPDATE.
IF (SELECT COUNT(*) FROM sys.database_permissions p
    WHERE p.major_id = OBJECT_ID('dbo.TT_MaDoiPhien') AND p.grantee_principal_id = USER_ID('TT_APP_USER')
      AND p.state_desc = 'DENY' AND p.permission_name IN ('INSERT', 'UPDATE')) <> 2
   INSERT @loi VALUES (N'FAIL 3: TT_MaDoiPhien thieu DENY INSERT/UPDATE.');
IF EXISTS (SELECT 1 FROM sys.database_permissions p
           WHERE p.major_id = OBJECT_ID('dbo.TT_MaDoiPhien') AND p.grantee_principal_id = USER_ID('TT_APP_USER')
             AND p.state_desc LIKE 'GRANT%' AND p.permission_name IN ('INSERT', 'UPDATE'))
   INSERT @loi VALUES (N'FAIL 4: TT_MaDoiPhien co GRANT INSERT/UPDATE - cong cong khai tao duoc ma dang nhap.');

-- 4. STU_HoSoSinhVien: chỉ quyền theo CỘT, đúng Ho_ten + Ngay_sinh; không quyền cả bảng.
IF EXISTS (SELECT 1 FROM sys.database_permissions p
           WHERE p.major_id = OBJECT_ID('dbo.STU_HoSoSinhVien') AND p.grantee_principal_id = USER_ID('TT_APP_USER')
             AND p.minor_id = 0)
   INSERT @loi VALUES (N'FAIL 5: STU_HoSoSinhVien co quyen CA BANG (CMND, anh giay to...).');
IF (SELECT COUNT(*) FROM sys.database_permissions p JOIN sys.columns c ON c.object_id = p.major_id AND c.column_id = p.minor_id
    WHERE p.major_id = OBJECT_ID('dbo.STU_HoSoSinhVien') AND p.grantee_principal_id = USER_ID('TT_APP_USER')
      AND p.permission_name = 'SELECT' AND c.name IN ('Ho_ten', 'Ngay_sinh')) <> 2
   INSERT @loi VALUES (N'FAIL 6: STU_HoSoSinhVien khong co dung 2 cot Ho_ten, Ngay_sinh.');

-- 5. Không role rộng.
IF EXISTS (SELECT 1 FROM sys.database_role_members rm
           WHERE rm.member_principal_id = USER_ID('TT_APP_USER')
             AND USER_NAME(rm.role_principal_id) IN ('db_owner', 'db_datareader', 'db_datawriter'))
   INSERT @loi VALUES (N'FAIL 7: TT_APP_USER nam trong role rong.');

-- 6. SQL động thật sự đã chạy: có ít nhất một GRANT trên bảng TT_* (không phải chuỗi rỗng).
IF NOT EXISTS (SELECT 1 FROM sys.database_permissions p JOIN sys.tables t ON t.object_id = p.major_id
               WHERE p.grantee_principal_id = USER_ID('TT_APP_USER') AND t.name LIKE 'TT[_]%' AND t.name <> 'TT_MaDoiPhien'
                 AND p.permission_name = 'SELECT' AND p.state_desc = 'GRANT')
   INSERT @loi VALUES (N'FAIL 8: khong co GRANT nao tren bang TT_* - sql dong khong chay?');

SELECT ca AS ket_qua_kiem FROM @loi;

ROLLBACK;   -- 🔴 LUÔN rollback. File này KHÔNG được đổi quyền trên DB.

/* ── Sau ROLLBACK: quyền phải y như trước ── */
DECLARE @khac INT = (
   SELECT COUNT(*) FROM (
      SELECT class, major_id, minor_id, permission_name, state_desc FROM #truoc
      EXCEPT
      SELECT class, major_id, minor_id, permission_name, state_desc FROM sys.database_permissions WHERE grantee_principal_id = USER_ID('TT_APP_USER')
      UNION ALL
      (SELECT class, major_id, minor_id, permission_name, state_desc FROM sys.database_permissions WHERE grantee_principal_id = USER_ID('TT_APP_USER')
       EXCEPT
       SELECT class, major_id, minor_id, permission_name, state_desc FROM #truoc)
   ) x);
DECLARE @so_loi INT = (SELECT COUNT(*) FROM @loi);
SELECT @@TRANCOUNT AS tran_con_mo, @khac AS so_quyen_khac_truoc_sau,
       CASE WHEN @khac = 0 THEN N'khong doi' ELSE N'LOI: ROLLBACK KHONG TRA LAI QUYEN' END AS sau_rollback;
DROP TABLE #truoc;

-- 🔴 KIỂM LẠI DẤU ngay trước PASS: SSMS (không SQLCMD Mode) KHÔNG dừng sau THROW 50031 ở batch trên — nó chạy
--    tiếp các batch sau. Thiếu dòng này thì PASS vẫn in ra sau lỗi, đúng kiểu PASS giả đã xảy ra.
IF ISNULL(CAST(SESSION_CONTEXT(N'TT_90_CapQuyen') AS NVARCHAR (20)), N'') <> N'da_chay_het'
   THROW 50031, N'90_CapQuyen KHONG DUOC NAP - KHONG co PASS. Xem loi 50031 dau tien o tren.', 1;
IF @so_loi > 0 OR @khac <> 0 OR @@TRANCOUNT <> 0
   THROW 50030, N'CHAY THU 90_CapQuyen: CO CA FAIL - doc cac dong FAIL o tren.', 1;
PRINT N'PASS: 90_CapQuyen chay duoc (ca SQL dong), quyen dung 8 ca, da ROLLBACK - quyen tren DB khong doi.';
GO
