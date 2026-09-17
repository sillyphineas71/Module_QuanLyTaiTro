SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- ═══════════════════════════════════════════════════════════════════════════════════════════
-- KHOẢN ĐÃ CHI + MINH CHỨNG của một chương trình (tab "Khoản chi", T2). CÔNG KHAI.
-- ═══════════════════════════════════════════════════════════════════════════════════════════
-- 🔴 SP `TT_CongKhai_*` CHỈ ĐỌC VIEW `TT_v_*CongKhai` — xem đầu DB_Setup/Views/01.
--
-- HAI RESULT SET (Dapper QueryMultiple):
--   1. khoan_chi  — IKhoanChi[] (chưa có mảng minh_chung)
--   2. minh_chung — MỌI ảnh của MỌI khoản chi ở set 1, kèm id_khoan_chi để service gắn vào đúng cha.
-- Vì sao hai set thay vì N+1 lượt gọi (một lượt mỗi khoản chi): một chương trình vài chục khoản chi
-- là vài chục round-trip cho một lượt khách xem trang. Hai set = một round-trip.
-- Vì sao không JOIN thành một set: khoản chi có 3 ảnh sẽ ra 3 dòng, service phải gom lại, và khoản
-- chi 0 ảnh cần LEFT JOIN với cột ảnh NULL — hai chỗ dễ sai hơn hai set phẳng.
--
-- 🔴 Minh chứng lọc bằng @id_chuong_trinh QUA VIEW 05 → view 04 → view 01, không qua danh sách id ở
--    set 1. Nên set 2 không thể chứa ảnh của khoản chi mà set 1 không có.
--
-- ⚠️ tong_da_chi FE tự cộng từ set 1 (tongDaChi) — cùng lý do KHÔNG có TOP như SP 03.
CREATE OR ALTER PROCEDURE [dbo].[TT_CongKhai_GetKhoanChiTheoChuongTrinh]
    @id_chuong_trinh INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT kc.id,
           kc.noi_dung,
           kc.so_tien,
           kc.ngay_chi
    FROM   dbo.TT_v_KhoanChiCongKhai kc
    WHERE  kc.id_chuong_trinh = @id_chuong_trinh
    ORDER BY kc.ngay_chi, kc.id;

    SELECT mc.id,
           mc.id_khoan_chi,
           mc.ten_file,
           mc.thu_tu
    FROM   dbo.TT_v_MinhChungChiCongKhai mc
    JOIN   dbo.TT_v_KhoanChiCongKhai     kc ON kc.id = mc.id_khoan_chi
    WHERE  kc.id_chuong_trinh = @id_chuong_trinh
    ORDER BY mc.id_khoan_chi, mc.thu_tu, mc.id;
END
GO
