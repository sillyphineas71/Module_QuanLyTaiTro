SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- ═══════════════════════════════════════════════════════════════════════════════════════════
-- "LỊCH SỬ TÀI TRỢ CỦA TÔI" — cựu SV ĐÃ ĐĂNG NHẬP xem MỌI lời khai CỦA CHÍNH MÌNH
-- ═══════════════════════════════════════════════════════════════════════════════════════════
-- 🔴 SP ĐẦU TIÊN CỦA CỔNG TRẢ DỮ LIỆU CHƯA DUYỆT. Nó KHÔNG thuộc lớp công khai và cố ý mang tên,
--    thư mục khác hẳn:
--        TT_CongKhai_*  — ai cũng gọi được · chỉ đọc view TT_v_*CongKhai · không bao giờ có dòng chưa duyệt
--        TT_CuuSV_*     — CHỈ gọi sau khi xác thực phiên cựu SV · đọc BẢNG · CÓ dòng chờ duyệt / từ chối
--    ⚠️ ĐỪNG nối SP này (hay bất kỳ TT_CuuSV_* nào) vào endpoint không yêu cầu đăng nhập.
--    ⚠️ ĐỪNG "gộp cho gọn" với TT_CongKhai_GetNhaTaiTroTheoChuongTrinh — hai SP trả hai hình dạng
--       khác nhau cho hai quyền khác nhau; một SP phục vụ hai phía là ranh giới biến thành tham số.
--
-- ═══════════════════════════════════════════════════════════════════════════════════════════
-- 🔴 CHẶN LỘ LỜI KHAI CỦA NGƯỜI KHÁC — BA LỚP
-- ═══════════════════════════════════════════════════════════════════════════════════════════
--  1. KHÔNG CÓ ĐƯỜNG NÀO LẤY "TẤT CẢ": SP không có nhánh nào bỏ điều kiện id_tai_khoan_csv, và không
--     có tham số nào khác để lọc. Không có "@id NULL = lấy hết" kiểu các SP quản trị.
--  2. @id_tai_khoan_csv = NULL ⇒ 0 DÒNG, chặn TƯỜNG MINH (dòng AND … IS NOT NULL bên dưới).
--     Vì sao phải viết dù `= NULL` vốn đã ra 0 dòng: điều đó CHỈ ĐÚNG dưới ANSI_NULLS ON. SP tạo dưới
--     ANSI_NULLS OFF thì `id_tai_khoan_csv = NULL` KHỚP MỌI DÒNG CỦA KHÁCH — tức một phiên hỏng
--     (claim thiếu id) đọc được toàn bộ lời khai của khách: tên thật người chọn ẩn danh, lời khai
--     chưa duyệt. Header ở đầu file + cờ -I + KIỂM 2 đã chặn; dòng IS NOT NULL là lớp chặn không phụ
--     thuộc vào việc ai đó nhớ các thứ đó.
--  3. 🔴 LỚP QUAN TRỌNG NHẤT NẰM NGOÀI SQL: @id_tai_khoan_csv PHẢI LẤY TỪ CLAIM CỦA JWT ĐÃ XÁC THỰC,
--     KHÔNG BAO GIỜ từ route/query/body. Endpoint là `GET .../lich-su-cua-toi`, KHÔNG có `{id}`.
--     Nhận id từ request là ai cũng đổi số trong URL để đọc lịch sử người khác (IDOR) — và SP này
--     không có cách nào biết id được truyền vào có phải của người đang gọi hay không.
--
-- ═══════════════════════════════════════════════════════════════════════════════════════════
-- TRẢ GÌ — và vì sao KHÁC view công khai
-- ═══════════════════════════════════════════════════════════════════════════════════════════
--  · ho_ten_don_vi THẬT + muc_an_danh: đây là lời khai CỦA CHÍNH NGƯỜI XEM — chữ họ tự gõ, lựa chọn họ
--    tự chọn. Che với chính họ là vô nghĩa; hiện muc_an_danh để họ thấy mình đã chọn ẩn danh chưa.
--    ⚠️ Kể cả khi họ khai HỘ tên người khác: vẫn là chữ họ gõ (xem id_tai_khoan_csv trong DDL).
--  · CẢ BA trạng thái duyệt (chờ · duyệt · TỪ CHỐI). Giấu dòng bị từ chối là lặp lại "lỗ đen" mà cột
--    liên hệ sinh ra để tránh: đã chuyển tiền, lời khai biến mất, không ai nói gì.
--  · so_tien NULL khi chờ — quản trị chưa nhập. FE hiện "Đang chờ xác nhận", không hiện 0.
--
--  CỐ Ý KHÔNG TRẢ (khi thêm, trả lời "người xem có cần, và có an toàn nếu phiên bị chiếm không?"):
--  · ly_do_tu_choi   — viết cho QUẢN TRỊ KHÁC đọc, câu chữ có thể nội bộ ("nghi ảnh sửa"). Hiện cho
--                      người tài trợ là quyết định của lead, không phải mặc định. (báo cáo lô P1b)
--  · email_lien_he / sdt_lien_he — phiên 7 ngày trên máy dùng chung ⇒ người khác mở lịch sử đọc được.
--  · ảnh chuyển khoản — chứa số tài khoản, số dư; phục vụ file cần endpoint có kiểm quyền riêng.
--  · thoi_diem_duyet / id_nguoi_duyet / audit — nội bộ.
--
-- CHƯƠNG TRÌNH: LEFT JOIN BẢNG, KHÔNG qua view công khai, KHÔNG lọc cong_khai / is_deleted.
--   Lời khai của một người không được BIẾN KHỎI lịch sử của chính họ chỉ vì quản trị ẩn chương trình
--   sau đó. Tên một chương trình mà người xem ĐÃ TÀI TRỢ không phải bí mật với họ.
CREATE OR ALTER PROCEDURE [dbo].[TT_CuuSV_GetLichSuTaiTroCuaToi]
    -- CSV_TaiKhoan.id — LẤY TỪ CLAIM JWT, KHÔNG TỪ REQUEST (lớp 3 ở trên).
    @id_tai_khoan_csv INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT nt.id,
           nt.id_chuong_trinh,
           ct.ten              AS ten_chuong_trinh,
           nt.loai,
           nt.ho_ten_don_vi,
           nt.muc_an_danh,
           nt.ten_he,
           nt.ten_khoa,
           nt.nien_khoa,
           nt.ten_lop,
           nt.trang_thai_duyet,
           nt.so_tien,
           nt.ngay_tai_tro,
           nt.created_time     AS thoi_diem_khai
    FROM   dbo.TT_NhaTaiTro nt
    LEFT JOIN dbo.TT_ChuongTrinh ct ON ct.id = nt.id_chuong_trinh
    WHERE  @id_tai_khoan_csv IS NOT NULL
      AND  nt.id_tai_khoan_csv = @id_tai_khoan_csv
      -- Xoá mềm = lời khai TRÙNG quản trị đã gỡ (DDL TT_NhaTaiTro) — không hiện, kể cả với người khai.
      AND  nt.is_deleted = 0
    ORDER BY nt.created_time DESC, nt.id DESC;
END
GO
