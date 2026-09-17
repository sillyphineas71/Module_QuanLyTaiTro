SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- ═══════════════════════════════════════════════════════════════════════════════════════════
-- TẠO MỘT LỜI KHAI TÀI TRỢ (P3a) — gọi từ endpoint CÔNG KHAI POST api/tai-tro/chuong-trinh/{id}/tai-tro
-- ═══════════════════════════════════════════════════════════════════════════════════════════
-- Luồng: người tài trợ chuyển khoản → khai định danh + tải ảnh CK → dòng này, CHỜ DUYỆT. Quản trị nhập
-- số tiền và duyệt ở P5.
--
-- 🔴 BA THỨ CLIENT KHÔNG ĐƯỢC QUYẾT — SP KHÔNG NHẬN THAM SỐ CHO CHÚNG:
--    · trang_thai_duyet = 1 (chờ) ÉP Ở ĐÂY. Nhận từ tham số là cho người khai tự duyệt lời khai của mình.
--    · so_tien = NULL. Người khai không khai tiền (CLAUDE.md §5 "Số tiền do quản trị nhập").
--    · id_tai_khoan_csv: CÓ tham số, nhưng service lấy từ CLAIM JWT, KHÔNG BAO GIỜ từ body request.
--
-- 🔴 CHỈ NHẬN khai vào chương trình ĐANG CÔNG KHAI VÀ CHƯA KẾT THÚC — kiểm qua view TT_v_ChuongTrinhCongKhai
--    (trang_thai = 1), không tự viết lại điều kiện cong_khai / is_deleted / den_ngay. Một định nghĩa duy nhất.
--    Không nhận ⇒ RETURN 0, KHÔNG ghi gì. Không tồn tại · nháp · đã xoá · đã kết thúc ⇒ CÙNG kết quả 0, để
--    endpoint công khai không dò được chương trình nháp (cùng luật P2a).
--
-- ⚠️ @muc_an_danh KHÔNG có default — thiếu là lỗi gọi SP, không lặng lẽ thành "công khai đầy đủ".
-- ⚠️ ngay_tai_tro = NGÀY KHAI (giờ DB). Modal không hỏi ngày chuyển khoản; quản trị sửa lúc duyệt nếu lệch.
-- ⚠️ Độ dài chuỗi KIỂM Ở SERVICE trước khi gọi: tham số SP cắt ÂM THẦM phần vượt (bài học repo cũ).
--
-- Trả: RETURN id vừa tạo (> 0), hoặc 0 khi chương trình không nhận khai. Gọi trong transaction của
-- repository cùng TT_AnhChuyenKhoan_Tao — lời khai không có ảnh nào sẽ không bao giờ được commit.
CREATE OR ALTER PROCEDURE [dbo].[TT_NhaTaiTro_Tao]
    @id_chuong_trinh    INT,
    @loai               TINYINT,
    @ho_ten_don_vi      NVARCHAR(300),
    @ngay_sinh          DATE          = NULL,
    @ten_he             NVARCHAR(200) = NULL,
    @ten_khoa           NVARCHAR(200) = NULL,
    @nien_khoa          NVARCHAR(50)  = NULL,
    @ten_lop            NVARCHAR(100) = NULL,
    @email_lien_he      NVARCHAR(256) = NULL,
    @sdt_lien_he        NVARCHAR(20)  = NULL,
    @muc_an_danh        TINYINT,                 -- 🔴 không default
    @id_tai_khoan_csv   INT           = NULL     -- NULL = khách. Service lấy từ claim, không từ request.
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1
                   FROM   dbo.TT_v_ChuongTrinhCongKhai ct
                   WHERE  ct.id = @id_chuong_trinh
                     AND  ct.trang_thai = 1)          -- 1 = Đang diễn ra (view tính từ den_ngay)
        RETURN 0;

    INSERT dbo.TT_NhaTaiTro (id_chuong_trinh, loai, ho_ten_don_vi, muc_an_danh,
                             ten_he, ten_khoa, nien_khoa, ten_lop, ngay_sinh,
                             email_lien_he, sdt_lien_he, id_tai_khoan_csv,
                             trang_thai_duyet, so_tien, ngay_tai_tro)
    VALUES (@id_chuong_trinh, @loai, @ho_ten_don_vi, @muc_an_danh,
            @ten_he, @ten_khoa, @nien_khoa, @ten_lop, @ngay_sinh,
            @email_lien_he, @sdt_lien_he, @id_tai_khoan_csv,
            1,                                         -- 🔴 CHỜ DUYỆT — ép, không nhận từ ngoài
            NULL,                                      -- 🔴 số tiền: quản trị nhập ở P5
            CAST(GETDATE() AS DATE));

    RETURN CAST(SCOPE_IDENTITY() AS INT);
END
GO
