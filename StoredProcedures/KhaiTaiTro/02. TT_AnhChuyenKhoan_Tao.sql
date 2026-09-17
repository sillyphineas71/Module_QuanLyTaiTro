SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- ═══════════════════════════════════════════════════════════════════════════════════════════
-- GẮN MỘT ẢNH CHUYỂN KHOẢN VÀO LỜI KHAI (P3a)
-- ═══════════════════════════════════════════════════════════════════════════════════════════
-- Gọi ngay sau TT_NhaTaiTro_Tao, TRONG CÙNG transaction của repository.
--
-- 🔴 CHỈ gắn vào lời khai CÒN CHỜ DUYỆT và chưa xoá. Không có lối "bổ sung ảnh" cho lời khai đã duyệt/từ
--    chối qua endpoint công khai — quản trị đã quyết trên bộ ảnh cũ. Không hợp lệ ⇒ RETURN 0, không ghi;
--    repository coi 0 là lỗi và ROLLBACK cả lời khai.
-- ⚠️ @ten_file là tên do SERVER sinh ("{guid}.{jpg|png|webp}"), không phải tên gốc người dùng — tên gốc có
--    thể chứa họ tên, số tài khoản. SP không kiểm khuôn tên: service là nơi duy nhất sinh ra nó.
--
-- Trả: RETURN id ảnh (> 0), hoặc 0.
CREATE OR ALTER PROCEDURE [dbo].[TT_AnhChuyenKhoan_Tao]
    @id_nha_tai_tro     INT,
    @ten_file           NVARCHAR(260),
    @thu_tu             INT
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1
                   FROM   dbo.TT_NhaTaiTro nt
                   WHERE  nt.id = @id_nha_tai_tro
                     AND  nt.is_deleted = 0
                     AND  nt.trang_thai_duyet = 1)
        RETURN 0;

    INSERT dbo.TT_AnhChuyenKhoan (id_nha_tai_tro, ten_file, thu_tu)
    VALUES (@id_nha_tai_tro, @ten_file, @thu_tu);

    RETURN CAST(SCOPE_IDENTITY() AS INT);
END
GO
