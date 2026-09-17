/* ----------------------------------------------------------------------------------------------
   BẢNG TT_DuKienChi — khoản DỰ KIẾN chi, con của TT_ChuongTrinh
   ----------------------------------------------------------------------------------------------
   Khớp IDuKienChi (ClientApp/src/model/ITaiTro.ts).
   🔴 SUM(so_tien) của bảng này CHÍNH LÀ mục tiêu quyên góp của chương trình. Không có cột muc_tieu
      ở đâu cả — xem khối đầu TT_ChuongTrinh.sql.
   Liên kết mềm, KHÔNG khoá ngoại (docs/01-kien-truc.md §3).

   Chạy lại nhiều lần AN TOÀN: bọc IF NOT EXISTS, không có DROP.
   ---------------------------------------------------------------------------------------------- */
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'TT_DuKienChi' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE dbo.TT_DuKienChi
    (
        id                  INT IDENTITY(1,1) NOT NULL,
        id_chuong_trinh     INT               NOT NULL,

        noi_dung            NVARCHAR(500)     NOT NULL,

        -- Tiền VND, không có phần lẻ ⇒ DECIMAL(18,0). Dùng chung kiểu này cho MỌI cột tiền của cổng:
        -- SUM qua các bảng khác kiểu là chỗ ép kiểu ngầm và làm tròn âm thầm.
        so_tien             DECIMAL(18,0)     NOT NULL,

        -- Thứ tự hiện trong bảng "Chi tiết dự kiến chi". Quản trị sắp tay.
        thu_tu              INT               NOT NULL,

        -- 5 trường audit BẮT BUỘC, khớp Models/Base/BaseModel.cs.
        is_deleted              BIT           NOT NULL CONSTRAINT DF_TT_DuKienChi_is_deleted   DEFAULT(0),
        created_time            DATETIME      NOT NULL CONSTRAINT DF_TT_DuKienChi_created_time DEFAULT(GETDATE()),
        created_user_id         NVARCHAR(36)  NULL,
        last_modified_times     DATETIME      NOT NULL CONSTRAINT DF_TT_DuKienChi_lmt          DEFAULT(GETDATE()),
        last_modified_user_id   NVARCHAR(36)  NULL,

        CONSTRAINT PK_TT_DuKienChi PRIMARY KEY CLUSTERED (id)
    );
END
GO

/* ----------------------------------------------------------------------------------------------
   INDEX — đường đọc DUY NHẤT của một bảng con là theo cha: WHERE id_chuong_trinh = ...
   Phục vụ cả SUM của trang danh sách (chạy cho MỌI chương trình mỗi lượt) lẫn trang chi tiết.
   INCLUDE đúng các cột hai SP đó đọc ⇒ SUM không phải quay lại bảng.
   ---------------------------------------------------------------------------------------------- */
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_TT_DuKienChi_ChuongTrinh' AND object_id = OBJECT_ID('dbo.TT_DuKienChi'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_TT_DuKienChi_ChuongTrinh
        ON dbo.TT_DuKienChi (id_chuong_trinh)
        INCLUDE (is_deleted, so_tien, thu_tu);
END
GO
