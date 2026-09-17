SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- ═══════════════════════════════════════════════════════════════════════════════════════════
-- 🔴 LỚP CÔNG KHAI — ĐỌC KHỐI NÀY TRƯỚC KHI VIẾT BẤT KỲ SP CÔNG KHAI NÀO
-- ═══════════════════════════════════════════════════════════════════════════════════════════
-- Cổng này có dữ liệu KHÔNG ĐƯỢC ra ngoài nằm chung bảng với dữ liệu PHẢI ra ngoài: lời khai chưa
-- duyệt (tên người chưa chắc đã chuyển tiền), tên thật của người chọn ẩn danh, chương trình nháp.
-- Quên MỘT điều kiện ở MỘT SP là lộ.
--
-- ⇒ CHẶN BẰNG CẤU TRÚC, KHÔNG BẰNG LỜI DẶN:
--   1. Mọi luật "được phép ra ngoài" nằm ở NĂM VIEW `TT_v_*CongKhai` (thư mục này), MỖI LUẬT MỘT
--      CHỖ. Repo cũ phải chép vị từ làm ba bản cho CSV_TinTuc (và ghi chú chéo "sửa file này thì
--      mở hai file kia") — ở đây không có bản chép nào để lệch.
--   2. SP công khai mang tên `TT_CongKhai_*` và CHỈ ĐƯỢC ĐỌC VIEW `TT_v_*`, KHÔNG ĐỌC BẢNG `TT_*`
--      NÀO. Luật này KIỂM ĐƯỢC BẰNG MÁY: khối KIỂM 3 của DB_Setup/99_KiemTra_P1.sql liệt kê mọi SP
--      công khai có tham chiếu bảng — phải ra 0 dòng.
--   3. View chỉ liệt kê cột được phép ra ngoài. Không audit, không liên hệ, không lý do từ chối.
--      KIỂM 4 của cùng file dò tên cột riêng tư trong view — phải ra 0 dòng.
--   4. Mỗi view con JOIN view cha ⇒ chương trình nháp/xoá mềm kéo theo TOÀN BỘ con của nó.
--
-- 🔴 VÌ SAO KHÔNG DÙNG CỜ `@chi_da_duyet BIT = 1` (lối SP 03 CSV_TinTuc_GetById):
--    Cờ mặc định 1 chặn được người QUÊN truyền, nhưng không chặn được người TRUYỀN 0 — và chỗ truyền
--    0 chính là một endpoint quản trị bị ai đó nối nhầm vào route công khai. Một SP phục vụ hai phía
--    thì ranh giới công khai / quản trị là MỘT GIÁ TRỊ THAM SỐ. Tách hẳn thì SP công khai KHÔNG CÓ
--    đường nào tới dữ liệu chưa duyệt, dù gọi với tham số gì.
--    Giá phải trả: màn quản trị (lô sau) có SP đọc riêng từ bảng. Chấp nhận — hai phía cần cột
--    khác nhau ngay từ đầu (quản trị cần tên thật, liên hệ, ảnh chuyển khoản).
--
-- ═══════════════════════════════════════════════════════════════════════════════════════════
-- VIEW NÀY: chương trình đã CÔNG BỐ
-- ═══════════════════════════════════════════════════════════════════════════════════════════
-- `trang_thai` DẪN XUẤT, không lưu (xem khối đầu TT_ChuongTrinh.sql):
--     1 = Đang diễn ra   khi hôm nay <= den_ngay   ("đến HẾT ngày den_ngay")
--     2 = Đã diễn ra     khi hôm nay >  den_ngay
-- Khớp eTrangThaiChuongTrinh ở FE. Đồng hồ là GETDATE() của MÁY CHỦ, không phải máy người xem.
-- ⚠️ Không có trạng thái "sắp diễn ra": chương trình có tu_ngay ở tương lai vẫn ra "Đang diễn ra".
--    Hợp đồng FE chỉ có hai giá trị — thêm giá trị thứ ba là việc của FE + lead, không tự thêm ở đây.
CREATE OR ALTER VIEW dbo.TT_v_ChuongTrinhCongKhai
AS
SELECT ct.id,
       ct.ten,
       ct.phu_de,
       ct.loi_keu_goi,
       ct.mo_ta_day,
       ct.anh_bia,
       ct.tu_ngay,
       ct.den_ngay,
       CAST(CASE WHEN ct.den_ngay >= CAST(GETDATE() AS DATE) THEN 1 ELSE 2 END AS TINYINT) AS trang_thai,
       ct.don_vi_to_chuc,
       ct.stk,
       ct.ngan_hang,
       ct.ten_chu_tai_khoan,
       ct.noi_dung_ck,
       ct.anh_qr
FROM   dbo.TT_ChuongTrinh ct
WHERE  ct.is_deleted = 0
  AND  ct.cong_khai  = 1;
GO
