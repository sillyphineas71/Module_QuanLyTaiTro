SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- ═══════════════════════════════════════════════════════════════════════════════════════════
-- DANH SÁCH NHÀ TÀI TRỢ ĐÃ DUYỆT của một chương trình (tab "Danh sách nhà tài trợ", T2). CÔNG KHAI.
-- ═══════════════════════════════════════════════════════════════════════════════════════════
-- 🔴 SP `TT_CongKhai_*` CHỈ ĐỌC VIEW `TT_v_*CongKhai` — xem đầu DB_Setup/Views/01.
--
-- SP NÀY KHÔNG TỰ LỌC GÌ VỀ DUYỆT / ẨN DANH — và đó là thiết kế. Toàn bộ luật "ai được hiện, hiện
-- những gì" nằm ở DB_Setup/Views/03. TT_v_NhaTaiTroCongKhai.sql. Thêm một điều kiện duyệt ở đây là
-- tạo BẢN CHÉP THỨ HAI của luật đó — thứ mà cấu trúc này dựng lên để không có.
-- ⚠️ Nếu cần thêm cột: thêm VÀO VIEW trước (và trả lời câu hỏi C3 ghi ở đó), không JOIN bảng ở đây.
--
-- Hình dạng: INhaTaiTro + cột `an_dinh_danh` (chưa có trong hợp đồng FE — lý do ở view 03).
--
-- ⚠️ KHÔNG CÓ TOP, KHÔNG PHÂN TRANG — cố ý. Màn chi tiết TỰ CỘNG tong_da_quyen TỪ MẢNG NÀY
--    (tongDaQuyen trong ITaiTro.ts). Cắt bớt dòng ở đây là con số lớn trên trang chi tiết nhỏ hơn con
--    số ở trang danh sách (SP 01) — lệch âm thầm. Quy mô: hàng chục tới vài trăm lượt/chương trình.
--    Muốn phân trang thì phải đổi hợp đồng FE (tổng lấy từ server) CÙNG LÚC, không đổi riêng SP.
CREATE OR ALTER PROCEDURE [dbo].[TT_CongKhai_GetNhaTaiTroTheoChuongTrinh]
    @id_chuong_trinh INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT nt.id,
           nt.loai,
           nt.ho_ten_don_vi,
           nt.an_danh,
           nt.an_dinh_danh,
           nt.ngay_sinh,       -- đã che theo muc_an_danh = 0 TRONG VIEW; đừng tự che lại ở đây
           nt.ten_he,
           nt.ten_khoa,
           nt.nien_khoa,
           nt.ten_lop,
           nt.so_tien,
           nt.ngay_tai_tro
    FROM   dbo.TT_v_NhaTaiTroCongKhai nt
    WHERE  nt.id_chuong_trinh = @id_chuong_trinh
    -- Cũ trước, mới sau — khớp thứ tự mock mà màn T2 đã được duyệt với. Bảng FE sắp lại được.
    ORDER BY nt.ngay_tai_tro, nt.id;
END
GO
