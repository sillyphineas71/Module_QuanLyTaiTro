SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- LỚP CÔNG KHAI — luật chung đọc ở đầu `01. TT_v_ChuongTrinhCongKhai.sql`.
-- Khoản đã chi của chương trình ĐÃ CÔNG BỐ. JOIN view cha ⇒ chương trình nháp không lộ khoản chi.
CREATE OR ALTER VIEW dbo.TT_v_KhoanChiCongKhai
AS
SELECT kc.id,
       kc.id_chuong_trinh,
       kc.noi_dung,
       kc.so_tien,
       kc.ngay_chi
FROM   dbo.TT_KhoanChi kc
JOIN   dbo.TT_v_ChuongTrinhCongKhai ct ON ct.id = kc.id_chuong_trinh
WHERE  kc.is_deleted = 0;
GO
