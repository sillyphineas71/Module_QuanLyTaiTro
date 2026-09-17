SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- LỚP CÔNG KHAI — luật chung đọc ở đầu `01. TT_v_ChuongTrinhCongKhai.sql`.
-- Dự kiến chi của chương trình ĐÃ CÔNG BỐ. JOIN view cha ⇒ chương trình nháp không lộ dự kiến chi.
-- SUM(so_tien) của view này theo id_chuong_trinh = MỤC TIÊU QUYÊN GÓP (không có cột muc_tieu).
CREATE OR ALTER VIEW dbo.TT_v_DuKienChiCongKhai
AS
SELECT dk.id,
       dk.id_chuong_trinh,
       dk.noi_dung,
       dk.so_tien,
       dk.thu_tu
FROM   dbo.TT_DuKienChi dk
JOIN   dbo.TT_v_ChuongTrinhCongKhai ct ON ct.id = dk.id_chuong_trinh
WHERE  dk.is_deleted = 0;
GO
