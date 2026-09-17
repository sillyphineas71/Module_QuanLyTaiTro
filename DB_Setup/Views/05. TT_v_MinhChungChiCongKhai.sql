SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- LỚP CÔNG KHAI — luật chung đọc ở đầu `01. TT_v_ChuongTrinhCongKhai.sql`.
-- Minh chứng của khoản chi CÔNG KHAI. JOIN view KHOẢN CHI (không phải bảng) ⇒ khoản chi xoá mềm hoặc
-- thuộc chương trình nháp kéo theo ảnh của nó.
-- ⚠️ PHẢI CHẠY SAU `04.` — view không có deferred name resolution như SP: tạo view này khi view 04
--    chưa tồn tại là lỗi ngay.
-- 🔴 KHÔNG có view nào cho TT_AnhChuyenKhoan, và không được tạo — xem khối đầu file DDL của bảng đó.
CREATE OR ALTER VIEW dbo.TT_v_MinhChungChiCongKhai
AS
SELECT mc.id,
       mc.id_khoan_chi,
       mc.ten_file,
       mc.thu_tu
FROM   dbo.TT_MinhChungChi mc
JOIN   dbo.TT_v_KhoanChiCongKhai kc ON kc.id = mc.id_khoan_chi
WHERE  mc.is_deleted = 0;
GO
