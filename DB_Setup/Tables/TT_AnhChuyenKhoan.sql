/* ----------------------------------------------------------------------------------------------
   BẢNG TT_AnhChuyenKhoan — ảnh chụp chuyển khoản, con của TT_NhaTaiTro (NHIỀU ảnh một lời khai)
   ----------------------------------------------------------------------------------------------
   Người tài trợ tải lên ở modal; quản trị xem để nhập số tiền và duyệt.

   🔴 BẢNG RIÊNG TƯ TUYỆT ĐỐI — KHÔNG CÓ VIEW CÔNG KHAI, KHÔNG SP CÔNG KHAI NÀO ĐƯỢC ĐỌC.
      Ảnh chuyển khoản chứa HỌ TÊN CHỦ TÀI KHOẢN, SỐ TÀI KHOẢN, NGÂN HÀNG, SỐ DƯ của người tài trợ —
      kể cả người đã chọn ẩn danh. KHÁC hẳn TT_MinhChungChi (minh chứng CHI TIÊU, công khai theo
      thiết kế). Hai bảng cùng hình dạng nhưng KHÔNG được gộp: gộp là một cột `loai` duy nhất đứng
      giữa ảnh ngân hàng của khách và trang công khai.
   ⚠️ Tệp ảnh cũng KHÔNG được phục vụ ở cùng đường tĩnh công khai với /anh-tai-tro/ — việc đó của lô
      upload (T4/P3), nhưng tên cột ở đây không tự bảo vệ được file trên đĩa.

   Liên kết mềm, KHÔNG khoá ngoại. Chạy lại nhiều lần AN TOÀN: IF NOT EXISTS, không có DROP.
   ---------------------------------------------------------------------------------------------- */
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'TT_AnhChuyenKhoan' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE dbo.TT_AnhChuyenKhoan
    (
        id                  INT IDENTITY(1,1) NOT NULL,
        id_nha_tai_tro      INT               NOT NULL,

        -- 🔴 LƯU TÊN FILE, KHÔNG LƯU URL — đường dẫn phục vụ có thể đổi, URL cứng trong DB sẽ mục.
        --    Cùng khuôn CSV_TinTuc.anh_dai_dien. Tên file do SERVER sinh (GUID), không lấy tên gốc
        --    người dùng gửi lên — tên gốc có thể chứa họ tên, số tài khoản.
        ten_file            NVARCHAR(260)     NOT NULL,

        -- Thứ tự người tài trợ tải lên.
        thu_tu              INT               NOT NULL,

        -- 5 trường audit BẮT BUỘC, khớp Models/Base/BaseModel.cs.
        is_deleted              BIT           NOT NULL CONSTRAINT DF_TT_AnhChuyenKhoan_is_deleted   DEFAULT(0),
        created_time            DATETIME      NOT NULL CONSTRAINT DF_TT_AnhChuyenKhoan_created_time DEFAULT(GETDATE()),
        created_user_id         NVARCHAR(36)  NULL,
        last_modified_times     DATETIME      NOT NULL CONSTRAINT DF_TT_AnhChuyenKhoan_lmt          DEFAULT(GETDATE()),
        last_modified_user_id   NVARCHAR(36)  NULL,

        CONSTRAINT PK_TT_AnhChuyenKhoan PRIMARY KEY CLUSTERED (id)
    );
END
GO

/* INDEX — đường đọc DUY NHẤT của bảng: ảnh của MỘT lời khai (màn duyệt, lô sau).
   Bảng này lớn nhanh hơn TT_NhaTaiTro (nhiều ảnh mỗi lời khai), nên quét cả bảng mỗi lần mở một lời
   khai là thứ sẽ chậm dần theo tuổi cổng. */
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_TT_AnhChuyenKhoan_NhaTaiTro' AND object_id = OBJECT_ID('dbo.TT_AnhChuyenKhoan'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_TT_AnhChuyenKhoan_NhaTaiTro
        ON dbo.TT_AnhChuyenKhoan (id_nha_tai_tro)
        INCLUDE (is_deleted, thu_tu);
END
GO
