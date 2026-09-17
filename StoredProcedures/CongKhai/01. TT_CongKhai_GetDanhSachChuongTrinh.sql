SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- ═══════════════════════════════════════════════════════════════════════════════════════════
-- TRANG DANH SÁCH CHƯƠNG TRÌNH (T1) — CÔNG KHAI, không đăng nhập
-- ═══════════════════════════════════════════════════════════════════════════════════════════
-- Hình dạng: IChuongTrinhTomTat (ClientApp/src/model/ITaiTro.ts).
--
-- 🔴 SP `TT_CongKhai_*` CHỈ ĐỌC VIEW `TT_v_*CongKhai`, KHÔNG ĐỌC BẢNG `TT_*` NÀO.
--    Lý do + cách kiểm bằng máy: đầu DB_Setup/Views/01. TT_v_ChuongTrinhCongKhai.sql.
--
-- 🔴 BA CON SỐ SUM TỪ BẢNG CON MỖI LẦN ĐỌC, không đọc cột tổng (luật B3):
--      tong_du_kien_chi = SUM dự kiến chi          = MỤC TIÊU (không có cột muc_tieu)
--      tong_da_quyen    = SUM tiền nhà tài trợ ĐÃ DUYỆT
--      so_nha_tai_tro   = SỐ LƯỢT tài trợ đã duyệt — một người tài trợ hai lần đếm là hai
-- ⚠️ Lấy tổng từ view NhaTaiTroCongKhai — CÙNG tập dòng với danh sách ở trang chi tiết (SP 03). Tổng
--    ở đây và tổng FE tự cộng ở trang chi tiết KHỚP NHAU theo cấu trúc, không theo may mắn.
--
-- 🔴 OUTER APPLY, KHÔNG JOIN HAI BẢNG CON RỒI GROUP BY.
--    JOIN cùng lúc dự kiến chi (3 dòng) và nhà tài trợ (5 dòng) ra 15 dòng mỗi chương trình ⇒ SUM
--    dự kiến chi bị nhân 5, SUM tiền bị nhân 3. Không lỗi nào báo, chỉ con số sai — và chỉ sai ở
--    chương trình có đủ cả hai loại con (chương trình mới, 0 nhà tài trợ, vẫn ra đúng khi thử).
--    Mỗi APPLY cộng MỘT bảng con ⇒ không có tích chéo.
--
-- ⚠️ KHÔNG CÓ TOP / trần số dòng — cố ý, khác CSV_TinTuc_GetCongKhai. Bảng tăng vài chương trình mỗi
--    năm; trần ở đây chỉ có tác dụng CẮT ÂM THẦM chương trình cũ khỏi trang. Lớp chống lạm dụng của
--    endpoint công khai là cache ở tầng service (P2), không phải TOP.
-- ⚠️ Không trả loi_keu_goi / mo_ta_day / thông tin chuyển khoản / QR: danh sách không dùng — SP 02
--    trả cho trang chi tiết.
CREATE OR ALTER PROCEDURE [dbo].[TT_CongKhai_GetDanhSachChuongTrinh]
AS
BEGIN
    SET NOCOUNT ON;

    SELECT ct.id,
           ct.ten,
           -- Dòng mô tả trên thẻ chương trình = phụ đề (một dòng). KHÔNG trả loi_keu_goi / mo_ta_day:
           -- thẻ không có chỗ cho đoạn văn, và kéo chúng về cho mọi chương trình là tải thừa mỗi lượt.
           ct.phu_de,
           ct.anh_bia,
           ct.tu_ngay,
           ct.den_ngay,
           ct.trang_thai,
           ct.don_vi_to_chuc,
           ISNULL(dk.tong, 0)  AS tong_du_kien_chi,
           ISNULL(nt.tong, 0)  AS tong_da_quyen,
           nt.so_luot         AS so_nha_tai_tro
    FROM   dbo.TT_v_ChuongTrinhCongKhai ct
    OUTER APPLY (
        SELECT SUM(d.so_tien) AS tong
        FROM   dbo.TT_v_DuKienChiCongKhai d
        WHERE  d.id_chuong_trinh = ct.id
    ) dk
    -- COUNT(*) trong APPLY có aggregate LUÔN trả đúng một dòng (0 khi không có con) ⇒ không cần ISNULL.
    -- SUM thì trả NULL khi không có con ⇒ phải ISNULL, nếu không FE nhận null và phép % ra NaN.
    OUTER APPLY (
        SELECT SUM(n.so_tien) AS tong,
               COUNT(*)       AS so_luot
        FROM   dbo.TT_v_NhaTaiTroCongKhai n
        WHERE  n.id_chuong_trinh = ct.id
    ) nt
    -- Thứ tự mặc định; FE tự chia hai nhóm Đang / Đã diễn ra và tự sắp nhóm "Đã" theo den_ngay.
    ORDER BY ct.tu_ngay DESC, ct.id DESC;
END
GO
