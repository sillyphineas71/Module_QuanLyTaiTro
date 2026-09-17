SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- ═══════════════════════════════════════════════════════════════════════════════════════════
-- TRANG CHI TIẾT CHƯƠNG TRÌNH (T2) — phần đầu trang + bảng dự kiến chi. CÔNG KHAI.
-- ═══════════════════════════════════════════════════════════════════════════════════════════
-- 🔴 SP `TT_CongKhai_*` CHỈ ĐỌC VIEW `TT_v_*CongKhai` — xem đầu DB_Setup/Views/01.
--
-- HAI RESULT SET (Dapper QueryMultiple):
--   1. Chương trình — 0 hoặc 1 dòng. Phần vô hướng của IChuongTrinhTaiTro.
--   2. du_kien_chi  — IDuKienChi[], theo thu_tu.
-- Nhà tài trợ và khoản chi ở SP 03 / SP 04. Service (P2) ghép bốn phần thành một IChuongTrinhTaiTro.
--
-- 🔴 id KHÔNG TỒN TẠI · ĐÃ XOÁ MỀM · CÒN NHÁP ⇒ CẢ BA ĐỀU RA "0 DÒNG", GIỐNG HỆT NHAU.
--    Service trả DATA_NULL cho cả ba. Không nhánh nào được phân biệt "có nhưng chưa công bố" với
--    "không có": nói ra câu đó là đã tiết lộ chương trình nháp tồn tại, và id là số tăng dần — đoán
--    được. Cùng lối trang chi tiết tin tức ở repo cũ.
--
-- ⚠️ KHÔNG có muc_tieu trong result set 1: mục tiêu = SUM result set 2 (FE: tongDuKienChi).
CREATE OR ALTER PROCEDURE [dbo].[TT_CongKhai_GetChiTietChuongTrinh]
    @id INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT ct.id,
           ct.ten,
           -- Ba tầng văn bản, mỗi cột MỘT khối trên trang (khối đầu TT_ChuongTrinh.sql):
           ct.phu_de,        -- dòng dưới tên, trong banner
           ct.loi_keu_goi,   -- đoạn văn trong banner
           ct.mo_ta_day,     -- khối "Thông tin chương trình"
           ct.anh_bia,
           ct.tu_ngay,
           ct.den_ngay,
           ct.trang_thai,
           ct.don_vi_to_chuc,
           ct.stk,
           ct.ngan_hang,
           ct.ten_chu_tai_khoan,
           ct.noi_dung_ck,
           ct.anh_qr
    FROM   dbo.TT_v_ChuongTrinhCongKhai ct
    WHERE  ct.id = @id;

    -- View dự kiến chi đã JOIN view chương trình ⇒ chương trình nháp ra 0 dòng ở đây NỮA, không chỉ ở
    -- result set 1. Không dựa vào việc service "thấy set 1 rỗng thì bỏ qua set 2".
    SELECT dk.id,
           dk.noi_dung,
           dk.so_tien,
           dk.thu_tu
    FROM   dbo.TT_v_DuKienChiCongKhai dk
    WHERE  dk.id_chuong_trinh = @id
    ORDER BY dk.thu_tu, dk.id;
END
GO
