/* ----------------------------------------------------------------------------------------------
   BẢNG TT_KhoanChi — khoản ĐÃ CHI, con của TT_ChuongTrinh
   ----------------------------------------------------------------------------------------------
   Khớp IKhoanChi (ClientApp/src/model/ITaiTro.ts). Ảnh minh chứng ở bảng con TT_MinhChungChi.
   Công khai theo thiết kế (minh bạch chi tiêu) — ra ngoài qua view TT_v_KhoanChiCongKhai.

   ⚠️ KHÔNG có trạng thái nháp/công bố riêng cho khoản chi. Khoản chi do quản trị nhập (không phải
      khách), nên nó hiện ngay khi INSERT nếu chương trình đã công bố — kể cả lúc CHƯA tải xong minh
      chứng. Có cần cờ riêng không là câu hỏi cho lead (xem báo cáo lô P1), chưa thêm.

   Liên kết mềm, KHÔNG khoá ngoại. Chạy lại nhiều lần AN TOÀN: IF NOT EXISTS, không có DROP.
   ---------------------------------------------------------------------------------------------- */
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'TT_KhoanChi' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE dbo.TT_KhoanChi
    (
        id                  INT IDENTITY(1,1) NOT NULL,
        id_chuong_trinh     INT               NOT NULL,

        noi_dung            NVARCHAR(500)     NOT NULL,
        -- VND, DECIMAL(18,0) — cùng kiểu mọi cột tiền của cổng (xem TT_DuKienChi).
        so_tien             DECIMAL(18,0)     NOT NULL,
        -- Ngày chi thực tế, không phải ngày nhập (created_time).
        ngay_chi            DATE              NOT NULL,

        -- 5 trường audit BẮT BUỘC, khớp Models/Base/BaseModel.cs.
        is_deleted              BIT           NOT NULL CONSTRAINT DF_TT_KhoanChi_is_deleted   DEFAULT(0),
        created_time            DATETIME      NOT NULL CONSTRAINT DF_TT_KhoanChi_created_time DEFAULT(GETDATE()),
        created_user_id         NVARCHAR(36)  NULL,
        last_modified_times     DATETIME      NOT NULL CONSTRAINT DF_TT_KhoanChi_lmt          DEFAULT(GETDATE()),
        last_modified_user_id   NVARCHAR(36)  NULL,

        CONSTRAINT PK_TT_KhoanChi PRIMARY KEY CLUSTERED (id)
    );
END
GO

/* INDEX — đường đọc DUY NHẤT của một bảng con: theo cha (trang chi tiết, tab khoản chi). */
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_TT_KhoanChi_ChuongTrinh' AND object_id = OBJECT_ID('dbo.TT_KhoanChi'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_TT_KhoanChi_ChuongTrinh
        ON dbo.TT_KhoanChi (id_chuong_trinh)
        INCLUDE (is_deleted);
END
GO
