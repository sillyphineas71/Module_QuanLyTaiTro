SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- ═══════════════════════════════════════════════════════════════════════════════════════════
-- 🔴 NƠI DUY NHẤT QUYẾT ĐỊNH MỘT NHÀ TÀI TRỢ ĐƯỢC HIỆN RA NGOÀI, VÀ HIỆN NHỮNG GÌ
-- ═══════════════════════════════════════════════════════════════════════════════════════════
-- Luật chung của lớp công khai: đầu `01. TT_v_ChuongTrinhCongKhai.sql`.
--
-- ĐƯỢC HIỆN khi CẢ BỐN:
--   · nt.is_deleted = 0
--   · nt.trang_thai_duyet = 2            (Đã duyệt — chờ duyệt và từ chối KHÔNG BAO GIỜ ra ngoài)
--   · nt.so_tien IS NOT NULL             (lưới an toàn: dòng "đã duyệt" mà thiếu tiền là lỗi dữ liệu;
--                                         thà vắng một dòng còn hơn đẩy null vào phép cộng + bảng)
--   · chương trình cha đang công khai    (JOIN view cha)
--
-- HIỆN NHỮNG GÌ — che ẩn danh Ở ĐÂY, TRÊN MÁY CHỦ, KHÔNG ở FE:
--   Tên thật LUÔN nằm trong bảng (quản trị cần để đối chiếu). Nếu view trả tên thật rồi FE giấu đi
--   thì tên ĐÃ RỜI máy chủ — mở DevTools là đọc được. Lọc ở FE là không lọc.
--
--   muc_an_danh │ ho_ten_don_vi │ 4 cột định danh │ an_danh │ an_dinh_danh
--   ────────────┼───────────────┼─────────────────┼─────────┼─────────────
--        0      │ tên thật      │ giá trị thật    │    0    │     0
--        1      │ NULL          │ giá trị thật    │    1    │     0
--        2      │ NULL          │ NULL            │    1    │     1
--     khác      │ NULL          │ NULL            │    1    │     1      ← HỎNG VỀ PHÍA AN TOÀN
--   Các CASE viết theo "chỉ hiện khi BẰNG giá trị cho phép", không theo "che khi bằng 1/2", để một
--   giá trị lạ lọt vào cột (lỗi service, sửa tay) rơi về CHE chứ không rơi về LỘ.
--
-- 🔴 `an_dinh_danh` KHÔNG CÓ TRONG HỢP ĐỒNG FE (INhaTaiTro chỉ có `an_danh`). Không có nó thì FE
--    không phân biệt được "ẩn tất cả" (mức 2) với "ẩn tên + không có dữ liệu lớp" (mức 1 của một
--    người ngoài) — cả hai ra bốn cột NULL, và FE sẽ vẽ "—" = "không có dữ liệu" cho một người
--    CỐ TÌNH GIẤU, trái luật A7. Cột trả thừa không làm vỡ FE hiện tại; FE cần đọc nó ở P2.
--
-- NULL = "không có dữ liệu" (doanh nghiệp không có lớp). NULLIF(LTRIM(RTRIM())) chuẩn hoá chuỗi rỗng
-- nhập tay về NULL để FE chỉ phải xử một ca.
--
-- CỐ Ý KHÔNG CÓ: email_lien_he · sdt_lien_he · ly_do_tu_choi · trang_thai_duyet · muc_an_danh ·
-- thoi_diem_duyet · id_nguoi_duyet · id_tai_khoan_csv · 5 trường audit.
-- 🔴 id_tai_khoan_csv đặc biệt: nó nối một dòng công khai (kể cả dòng ẩn danh!) với một TÀI KHOẢN cựu
--    SV — tức là với họ tên thật trong CSV_TaiKhoan/STU_HoSoSinhVien. Lộ cột này là GỠ ẨN DANH. Thêm cột vào view này thì trả lời trước câu
-- của luật C3: "ghép với các cột đang có thì định danh được ai?".
CREATE OR ALTER VIEW dbo.TT_v_NhaTaiTroCongKhai
AS
SELECT nt.id,
       nt.id_chuong_trinh,
       nt.loai,

       CASE WHEN nt.muc_an_danh = 0
            THEN NULLIF(LTRIM(RTRIM(nt.ho_ten_don_vi)), N'') END                  AS ho_ten_don_vi,
       CAST(CASE WHEN nt.muc_an_danh = 0 THEN 0 ELSE 1 END AS BIT)                AS an_danh,
       CAST(CASE WHEN nt.muc_an_danh IN (0, 1) THEN 0 ELSE 1 END AS BIT)          AS an_dinh_danh,

       CASE WHEN nt.muc_an_danh IN (0, 1)
            THEN NULLIF(LTRIM(RTRIM(nt.ten_he)), N'') END                         AS ten_he,
       CASE WHEN nt.muc_an_danh IN (0, 1)
            THEN NULLIF(LTRIM(RTRIM(nt.ten_khoa)), N'') END                       AS ten_khoa,
       CASE WHEN nt.muc_an_danh IN (0, 1)
            THEN NULLIF(LTRIM(RTRIM(nt.nien_khoa)), N'') END                      AS nien_khoa,
       CASE WHEN nt.muc_an_danh IN (0, 1)
            THEN NULLIF(LTRIM(RTRIM(nt.ten_lop)), N'') END                        AS ten_lop,

       nt.so_tien,
       nt.ngay_tai_tro
FROM   dbo.TT_NhaTaiTro nt
JOIN   dbo.TT_v_ChuongTrinhCongKhai ct ON ct.id = nt.id_chuong_trinh
WHERE  nt.is_deleted       = 0
  AND  nt.trang_thai_duyet = 2
  AND  nt.so_tien IS NOT NULL;
GO
