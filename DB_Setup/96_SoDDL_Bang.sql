:on error exit
GO
SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
GO
/* =============================================================================================
   🔴 FILE NÀY TỰ CHỨNG MINH `:r` ĐÃ NẠP ĐƯỢC 8 FILE BẢNG trước khi báo kết quả (docs/02 C5) — cùng lý do 97_
      (hai lần PASS giả khi SSMS không bật SQLCMD Mode / sqlcmd sai thư mục). Hai lớp:
      · `:on error exit` — sqlcmd/SQLCMD Mode dừng ở lỗi đầu tiên kể cả khi quên -b.
      · DẤU LÀ CHÍNH KẾT QUẢ: bảng chỉ có trong tempdb nếu file bảng đã chạy trong phiên này (tempdb được kiểm
        RỖNG trước `:r`). Dựng không đủ 8 bảng ⇒ THROW 50095 TRƯỚC khi so. Không cần dấu phiên như 97_: 97_ kiểm
        quyền — thứ ĐÃ CÓ SẴN trên DB trước khi chạy, nên phải có dấu riêng; ở đây không có gì có sẵn để nhầm.
   SO DDL BẢNG: FILE (8 file trong DB_Setup/Tables) ↔ DB ĐANG CHẠY — tên cột, kiểu, độ dài, nullable
   ⚠️ Đừng viết "Tables/" + dấu sao + ".sql" trong chú thích khối: cặp gạch-chéo-sao MỞ chú thích lồng, cả
      batch lỗi Msg 113 "Missing end comment mark" (đã gặp khi viết file này).
   =============================================================================================
   Vì sao có file này: file bảng bọc `IF NOT EXISTS` ⇒ chạy lên DB đã có bảng thì BỎ QUA LẶNG LẼ. DDL đã đổi
   BỐN LẦN sau lần chạy đầu (thêm ngay_sinh, loi_keu_goi, ten_chu_tai_khoan; bỏ ten_chuyen_nganh). Khối chặn
   50010/50011 trong file bảng chỉ bắt đúng mấy cột đã biết — lệch KIỂU hay ĐỘ DÀI một cột thì không bảng nào
   báo, và mọi thứ dựng sau đó (view, SP, DTO C#) đứng trên nền sai.
   View/SP thì so được bằng văn bản (sys.sql_modules); bảng KHÔNG lưu văn bản DDL ⇒ so bằng METADATA.

   CÁCH LÀM — "chạy file THẬT", không phân tích chữ CREATE TABLE (cùng tinh thần 97_ChayThu_CapQuyen):
     1. Trong tempdb, BEGIN TRAN, chạy CHÍNH 8 file bảng qua `:r` ⇒ dựng bảng đúng như file mô tả.
     2. So tempdb.INFORMATION_SCHEMA.COLUMNS với ESS_HOCVIENTAICHINH_DAOTAO.INFORMATION_SCHEMA.COLUMNS.
     3. ROLLBACK — tempdb không còn gì, DB thật KHÔNG bị đụng (chỉ đọc metadata).
   So: có bảng · có cột · DATA_TYPE · CHARACTER_MAXIMUM_LENGTH · NUMERIC_PRECISION/SCALE · IS_NULLABLE.
   KHÔNG so: thứ tự cột (ALTER thêm cột luôn nằm cuối — lệch thứ tự không đổi hành vi, chỉ in để biết) ·
   collation (tempdb có collation riêng) · default · index · identity.

   🔴 CHẠY TỪ THƯ MỤC GỐC REPO (đường dẫn `:r` tương đối), bằng sqlcmd — SSMS phải bật SQLCMD Mode:
        sqlcmd -S <server> -E -d ESS_HOCVIENTAICHINH_DAOTAO -I -b -f 65001 -i "DB_Setup\96_SoDDL_Bang.sql"
   ĐÚNG khi dòng cuối "PASS: …" + mã thoát 0. SAI: THROW 50096 (lệch — bảng lệch in ngay trên) hoặc 50095
   (tiền đề: tempdb đã có bảng TT_ / không dựng đủ 8 bảng / DB không có bảng nào).
   ⚠️ Thêm file bảng mới ⇒ thêm một dòng `:r` bên dưới VÀ tên bảng vào danh sách @tap_bang.
   ============================================================================================= */
SET NOCOUNT ON;
SET XACT_ABORT ON;
USE tempdb;
GO
IF EXISTS (SELECT 1 FROM tempdb.sys.tables WHERE name LIKE 'TT[_]%' AND schema_id = SCHEMA_ID('dbo'))
    THROW 50095, N'TIEN DE HONG: tempdb.dbo DA CO bang TT_ (ai do tao tay?) - khong the dung bang tu file de so.', 1;
BEGIN TRAN;
GO
:r DB_Setup\Tables\TT_TaiKhoan.sql
GO
:r DB_Setup\Tables\TT_ChuongTrinh.sql
GO
:r DB_Setup\Tables\TT_DuKienChi.sql
GO
:r DB_Setup\Tables\TT_NhaTaiTro.sql
GO
:r DB_Setup\Tables\TT_AnhChuyenKhoan.sql
GO
:r DB_Setup\Tables\TT_KhoanChi.sql
GO
:r DB_Setup\Tables\TT_MinhChungChi.sql
GO
:r DB_Setup\Tables\TT_MaDoiPhien.sql
GO
/* ── So sánh — kiểm + ROLLBACK + báo phải cùng MỘT batch: ROLLBACK xoá bảng tạm tạo trong transaction,
   biến bảng thì không bị đụng nhưng chỉ sống trong một batch (bài học 97_). ── */
USE tempdb;
DECLARE @tap_bang TABLE (ten SYSNAME PRIMARY KEY);
INSERT @tap_bang VALUES ('TT_TaiKhoan'), ('TT_ChuongTrinh'), ('TT_DuKienChi'), ('TT_NhaTaiTro'),
                        ('TT_AnhChuyenKhoan'), ('TT_KhoanChi'), ('TT_MinhChungChi'), ('TT_MaDoiPhien');

DECLARE @file TABLE (bang SYSNAME, cot SYSNAME, thu_tu INT, kieu NVARCHAR (128), do_dai INT, chinh_xac TINYINT, thang_do INT, nullable VARCHAR (3));
INSERT @file
SELECT c.TABLE_NAME, c.COLUMN_NAME, c.ORDINAL_POSITION, c.DATA_TYPE, c.CHARACTER_MAXIMUM_LENGTH, c.NUMERIC_PRECISION, c.NUMERIC_SCALE, c.IS_NULLABLE
FROM   tempdb.INFORMATION_SCHEMA.COLUMNS c
JOIN   tempdb.INFORMATION_SCHEMA.TABLES t ON t.TABLE_SCHEMA = c.TABLE_SCHEMA AND t.TABLE_NAME = c.TABLE_NAME AND t.TABLE_TYPE = 'BASE TABLE'
WHERE  c.TABLE_SCHEMA = 'dbo' AND c.TABLE_NAME IN (SELECT ten FROM @tap_bang);

DECLARE @db TABLE (bang SYSNAME, cot SYSNAME, thu_tu INT, kieu NVARCHAR (128), do_dai INT, chinh_xac TINYINT, thang_do INT, nullable VARCHAR (3));
INSERT @db
SELECT c.TABLE_NAME, c.COLUMN_NAME, c.ORDINAL_POSITION, c.DATA_TYPE, c.CHARACTER_MAXIMUM_LENGTH, c.NUMERIC_PRECISION, c.NUMERIC_SCALE, c.IS_NULLABLE
FROM   ESS_HOCVIENTAICHINH_DAOTAO.INFORMATION_SCHEMA.COLUMNS c
JOIN   ESS_HOCVIENTAICHINH_DAOTAO.INFORMATION_SCHEMA.TABLES t ON t.TABLE_SCHEMA = c.TABLE_SCHEMA AND t.TABLE_NAME = c.TABLE_NAME AND t.TABLE_TYPE = 'BASE TABLE'
WHERE  c.TABLE_SCHEMA = 'dbo' AND c.TABLE_NAME LIKE 'TT[_]%';

DECLARE @lech TABLE (bang SYSNAME, cot SYSNAME NULL, van_de NVARCHAR (400));
-- Bảng
INSERT @lech SELECT b.ten, NULL, N'CO FILE, KHONG CO TREN DB' FROM @tap_bang b WHERE NOT EXISTS (SELECT 1 FROM @db d WHERE d.bang = b.ten);
INSERT @lech SELECT DISTINCT d.bang, NULL, N'CO TREN DB, KHONG CO FILE (bang TT_ ngoai danh sach - cua lo khac? them file hoac bo khoi DB)'
             FROM @db d WHERE d.bang NOT IN (SELECT ten FROM @tap_bang);
-- Cột, chỉ trong bảng có cả hai phía
INSERT @lech SELECT f.bang, f.cot, N'cot CO trong file, KHONG CO tren DB'
             FROM @file f WHERE EXISTS (SELECT 1 FROM @db d WHERE d.bang = f.bang)
                            AND NOT EXISTS (SELECT 1 FROM @db d WHERE d.bang = f.bang AND d.cot = f.cot);
INSERT @lech SELECT d.bang, d.cot, N'cot CO tren DB, KHONG CO trong file (cot da go khoi DDL?)'
             FROM @db d WHERE d.bang IN (SELECT ten FROM @tap_bang)
                          AND NOT EXISTS (SELECT 1 FROM @file f WHERE f.bang = d.bang AND f.cot = d.cot);
INSERT @lech
SELECT f.bang, f.cot,
       CONCAT_WS(N' · ',
         CASE WHEN f.kieu <> d.kieu THEN CONCAT(N'KIEU file=', f.kieu, N' db=', d.kieu) END,
         CASE WHEN ISNULL(f.do_dai, -9) <> ISNULL(d.do_dai, -9) THEN CONCAT(N'DO DAI file=', f.do_dai, N' db=', d.do_dai) END,
         CASE WHEN ISNULL(f.chinh_xac, 0) <> ISNULL(d.chinh_xac, 0) OR ISNULL(f.thang_do, -9) <> ISNULL(d.thang_do, -9)
              THEN CONCAT(N'CHINH XAC file=(', f.chinh_xac, N',', f.thang_do, N') db=(', d.chinh_xac, N',', d.thang_do, N')') END,
         CASE WHEN f.nullable <> d.nullable THEN CONCAT(N'NULLABLE file=', f.nullable, N' db=', d.nullable) END)
FROM   @file f JOIN @db d ON d.bang = f.bang AND d.cot = f.cot
WHERE  f.kieu <> d.kieu OR ISNULL(f.do_dai, -9) <> ISNULL(d.do_dai, -9)
    OR ISNULL(f.chinh_xac, 0) <> ISNULL(d.chinh_xac, 0) OR ISNULL(f.thang_do, -9) <> ISNULL(d.thang_do, -9)
    OR f.nullable <> d.nullable;

-- Thông tin (KHÔNG tính là lệch): thứ tự cột khác nhau
DECLARE @thu_tu_khac INT = (SELECT COUNT(*) FROM @file f JOIN @db d ON d.bang = f.bang AND d.cot = f.cot WHERE f.thu_tu <> d.thu_tu);

DECLARE @so_bang_file INT = (SELECT COUNT(DISTINCT bang) FROM @file), @so_cot_file INT = (SELECT COUNT(*) FROM @file),
        @so_bang_db INT = (SELECT COUNT(DISTINCT bang) FROM @db), @so_cot_db INT = (SELECT COUNT(*) FROM @db);

ROLLBACK;   -- 🔴 LUÔN rollback: tempdb không giữ lại bảng nào.

SELECT @so_bang_file AS bang_dung_tu_file, @so_cot_file AS cot_file, @so_bang_db AS bang_tren_db, @so_cot_db AS cot_db,
       @thu_tu_khac AS cot_khac_thu_tu_chi_de_biet, @@TRANCOUNT AS tran_con_mo,
       (SELECT COUNT(*) FROM tempdb.sys.tables WHERE name LIKE 'TT[_]%') AS bang_TT_con_trong_tempdb;

IF @so_bang_file <> (SELECT COUNT(*) FROM @tap_bang) OR @so_bang_db = 0
BEGIN
    DECLARE @m95 NVARCHAR (500) = CONCAT(N'TIEN DE HONG: dung duoc ', @so_bang_file, N' bang tu file (can ', (SELECT COUNT(*) FROM @tap_bang),
                                         N'), DB co ', @so_bang_db, N' bang TT_ - so sanh VO NGHIA. Dung 0 bang = :r khong nap duoc: ',
                                         N'SSMS phai bat Query > SQLCMD Mode; sqlcmd phai dung o THU MUC GOC repo.');
    THROW 50095, @m95, 1;
END
IF EXISTS (SELECT 1 FROM @lech)
BEGIN
    SELECT bang, cot, van_de FROM @lech ORDER BY bang, cot;
    THROW 50096, N'DDL BANG TREN DB LECH FILE - xem bang ngay tren. Bang rong: DROP roi chay lai file bang. Co du lieu: viet script ALTER.', 1;
END
PRINT CONCAT(N'PASS: ', @so_bang_db, N' bang / ', @so_cot_db, N' cot tren DB khop file (ten, kieu, do dai, nullable). Da ROLLBACK tempdb.');
GO
USE ESS_HOCVIENTAICHINH_DAOTAO;
GO
