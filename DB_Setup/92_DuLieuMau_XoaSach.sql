SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
GO
/* =============================================================================================
   XOÁ SẠCH DỮ LIỆU MẪU do 91_DuLieuMau_Nhap.sql tạo — XOÁ THẬT (DELETE), không xoá mềm
   =============================================================================================
       sqlcmd -S <server> -E -d ESS_HOCVIENTAICHINH_DAOTAO -I -b -f 65001 -i "DB_Setup\92_DuLieuMau_XoaSach.sql"

   Chỉ xoá dòng có created_user_id = 'DU_LIEU_MAU'. Dòng nhập thật (qua modal / màn quản trị) không mang dấu đó.
   🔴 DỮ LIỆU THẬT TREO VÀO DỮ LIỆU MẪU ⇒ DỪNG (THROW 50042), không xoá gì: vd. ai đó khai tài trợ thật vào CT1 mẫu,
      hoặc quản trị thật thêm khoản chi cho chương trình mẫu. Xoá cha mẫu lúc đó là để lại con mồ côi (không khoá ngoại).
   ⚠️ IDENTITY KHÔNG về lại: dữ liệu nhập sau vẫn nối tiếp số cũ. Muốn đưa về, xem khối cuối file (tự chạy, có cân nhắc).
   Cả file một transaction. Con trước, cha sau.
   ============================================================================================= */
SET NOCOUNT ON;
SET XACT_ABORT ON;

DECLARE @M NVARCHAR (36) = N'DU_LIEU_MAU';

-- Dòng KHÔNG mang dấu mẫu nhưng treo vào dòng mẫu
DECLARE @treo TABLE (bang SYSNAME, so_dong INT);
INSERT @treo
SELECT N'TT_DuKienChi', COUNT(*) FROM dbo.TT_DuKienChi x
WHERE ISNULL(x.created_user_id, N'') <> @M AND x.id_chuong_trinh IN (SELECT id FROM dbo.TT_ChuongTrinh WHERE created_user_id = @M)
UNION ALL
SELECT N'TT_NhaTaiTro', COUNT(*) FROM dbo.TT_NhaTaiTro x
WHERE ISNULL(x.created_user_id, N'') <> @M AND x.id_chuong_trinh IN (SELECT id FROM dbo.TT_ChuongTrinh WHERE created_user_id = @M)
UNION ALL
SELECT N'TT_KhoanChi', COUNT(*) FROM dbo.TT_KhoanChi x
WHERE ISNULL(x.created_user_id, N'') <> @M AND x.id_chuong_trinh IN (SELECT id FROM dbo.TT_ChuongTrinh WHERE created_user_id = @M)
UNION ALL
SELECT N'TT_AnhChuyenKhoan', COUNT(*) FROM dbo.TT_AnhChuyenKhoan x
WHERE ISNULL(x.created_user_id, N'') <> @M AND x.id_nha_tai_tro IN (SELECT id FROM dbo.TT_NhaTaiTro WHERE created_user_id = @M)
UNION ALL
SELECT N'TT_MinhChungChi', COUNT(*) FROM dbo.TT_MinhChungChi x
WHERE ISNULL(x.created_user_id, N'') <> @M AND x.id_khoan_chi IN (SELECT id FROM dbo.TT_KhoanChi WHERE created_user_id = @M)
UNION ALL
SELECT N'TT_NhaTaiTro (id_nguoi_duyet = quan tri mau)', COUNT(*) FROM dbo.TT_NhaTaiTro x
WHERE ISNULL(x.created_user_id, N'') <> @M AND x.id_nguoi_duyet IN (SELECT id FROM dbo.TT_TaiKhoan WHERE created_user_id = @M);

IF EXISTS (SELECT 1 FROM @treo WHERE so_dong > 0)
BEGIN
    SELECT bang, so_dong AS dong_that_treo_vao_du_lieu_mau FROM @treo WHERE so_dong > 0;
    THROW 50042, N'CO DU LIEU THAT TREO VAO DU LIEU MAU - KHONG xoa gi. Xu ly cac dong o bang ngay tren truoc.', 1;
END

BEGIN TRAN;
DELETE FROM dbo.TT_MinhChungChi   WHERE created_user_id = @M;
DELETE FROM dbo.TT_KhoanChi       WHERE created_user_id = @M;
DELETE FROM dbo.TT_AnhChuyenKhoan WHERE created_user_id = @M;
DELETE FROM dbo.TT_NhaTaiTro      WHERE created_user_id = @M;
DELETE FROM dbo.TT_DuKienChi      WHERE created_user_id = @M;
DELETE FROM dbo.TT_ChuongTrinh    WHERE created_user_id = @M;
DELETE FROM dbo.TT_MaDoiPhien     WHERE created_user_id = @M;   -- 91_ không tạo; để phòng ai đó thêm tay với dấu mẫu
DELETE FROM dbo.TT_TaiKhoan       WHERE created_user_id = @M;
COMMIT;

SELECT (SELECT COUNT(*) FROM dbo.TT_ChuongTrinh    WHERE created_user_id = @M)
     + (SELECT COUNT(*) FROM dbo.TT_DuKienChi      WHERE created_user_id = @M)
     + (SELECT COUNT(*) FROM dbo.TT_NhaTaiTro      WHERE created_user_id = @M)
     + (SELECT COUNT(*) FROM dbo.TT_AnhChuyenKhoan WHERE created_user_id = @M)
     + (SELECT COUNT(*) FROM dbo.TT_KhoanChi       WHERE created_user_id = @M)
     + (SELECT COUNT(*) FROM dbo.TT_MinhChungChi   WHERE created_user_id = @M)
     + (SELECT COUNT(*) FROM dbo.TT_MaDoiPhien     WHERE created_user_id = @M)
     + (SELECT COUNT(*) FROM dbo.TT_TaiKhoan       WHERE created_user_id = @M) AS dong_mau_con_lai_phai_0;
PRINT N'XONG: da xoa du lieu mau.';
GO

/* ── TUỲ CHỌN — đưa IDENTITY về lại (KHÔNG tự chạy). Chỉ khi bảng RỖNG HẲN (không còn dòng thật nào):
   RESEED 0 ⇒ dòng kế tiếp nhận id 1. Bảng còn dòng thật thì ĐỪNG: id mới có thể trùng id đang có ⇒ lỗi khoá chính.
       DBCC CHECKIDENT ('dbo.TT_ChuongTrinh', RESEED, 0);   -- lặp cho từng bảng, SAU KHI đã kiểm COUNT(*) = 0
*/
