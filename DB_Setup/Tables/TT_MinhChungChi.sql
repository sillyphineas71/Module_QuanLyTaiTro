/* ----------------------------------------------------------------------------------------------
   BẢNG TT_MinhChungChi — ảnh minh chứng, con của TT_KhoanChi (NHIỀU ảnh một khoản chi)
   ----------------------------------------------------------------------------------------------
   Khớp IMinhChungChi (ClientApp/src/model/ITaiTro.ts): thực thể riêng chứ không phải cột, vì mẫu
   có 3 khoản chi mà ghi "Xem tất cả minh chứng (5)".
   Công khai theo thiết kế — ra ngoài qua view TT_v_MinhChungChiCongKhai.
   🔴 KHÔNG gộp với TT_AnhChuyenKhoan dù cùng hình dạng — đọc khối đầu file đó.

   Liên kết mềm, KHÔNG khoá ngoại. Chạy lại nhiều lần AN TOÀN: IF NOT EXISTS, không có DROP.
   ---------------------------------------------------------------------------------------------- */
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'TT_MinhChungChi' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE dbo.TT_MinhChungChi
    (
        id                  INT IDENTITY(1,1) NOT NULL,
        id_khoan_chi        INT               NOT NULL,

        -- 🔴 LƯU TÊN FILE, KHÔNG LƯU URL. Đường dẫn phục vụ (/anh-tai-tro/) có thể đổi — thư mục con,
        --    CDN, đổi host — và URL cứng trong DB sẽ MỤC, phải UPDATE toàn bảng. FE ghép URL ở MỘT
        --    chỗ: duongDanAnh() trong ITaiTro.ts. Cùng khuôn CSV_TinTuc.anh_dai_dien.
        -- ⚠️ Mock hiện chứa URL placehold.co ở cột tương ứng — đó là ĐỒ TẠM của giai đoạn mock
        --    (xem khối "ẢNH GIỮ CHỖ" trong taiTroMock.ts), không phải hình dạng dữ liệu thật.
        ten_file            NVARCHAR(260)     NOT NULL,

        thu_tu              INT               NOT NULL,

        -- 5 trường audit BẮT BUỘC, khớp Models/Base/BaseModel.cs.
        is_deleted              BIT           NOT NULL CONSTRAINT DF_TT_MinhChungChi_is_deleted   DEFAULT(0),
        created_time            DATETIME      NOT NULL CONSTRAINT DF_TT_MinhChungChi_created_time DEFAULT(GETDATE()),
        created_user_id         NVARCHAR(36)  NULL,
        last_modified_times     DATETIME      NOT NULL CONSTRAINT DF_TT_MinhChungChi_lmt          DEFAULT(GETDATE()),
        last_modified_user_id   NVARCHAR(36)  NULL,

        CONSTRAINT PK_TT_MinhChungChi PRIMARY KEY CLUSTERED (id)
    );
END
GO

/* INDEX — đường đọc DUY NHẤT của một bảng con: theo cha (minh chứng của các khoản chi). */
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_TT_MinhChungChi_KhoanChi' AND object_id = OBJECT_ID('dbo.TT_MinhChungChi'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_TT_MinhChungChi_KhoanChi
        ON dbo.TT_MinhChungChi (id_khoan_chi)
        INCLUDE (is_deleted, thu_tu);
END
GO
