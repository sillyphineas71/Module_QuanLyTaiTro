/* ----------------------------------------------------------------------------------------------
   BẢNG TT_TaiKhoan — tài khoản QUẢN TRỊ cổng Vận động tài trợ
   ----------------------------------------------------------------------------------------------
   🔴 KHÔNG LIÊN QUAN CSV_TaiKhoan. Hai luồng tài khoản không giao nhau (docs/01-kien-truc.md §2):
   người tài trợ là KHÁCH, không có dòng nào ở đây; cựu sinh viên không đăng nhập được vào cổng này.
   Dựng ở P1 vì TT_NhaTaiTro.id_nguoi_duyet và các cột audit trỏ về đây. Luồng đăng nhập là P4.

   Chạy lại nhiều lần AN TOÀN: bọc IF NOT EXISTS, không có DROP.
   ---------------------------------------------------------------------------------------------- */
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'TT_TaiKhoan' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE dbo.TT_TaiKhoan
    (
        id                  INT IDENTITY(1,1) NOT NULL,

        email_dang_nhap     NVARCHAR(256)     NOT NULL,

        -- Hash BCrypt (đúng 60 ký tự — Services/Password/PasswordService.cs). VARCHAR vì hash chỉ có
        -- ký tự ASCII; dư tới 100 để đổi thuật toán sau này không phải ALTER cột.
        -- ⚠️ CHỈ SP đăng nhập được đọc cột này. SP trả thông tin tài khoản thì KHÔNG liệt kê nó.
        mat_khau            VARCHAR(100)      NOT NULL,

        ho_ten              NVARCHAR(200)     NOT NULL,

        -- Khớp eVaiTro ở FE: 1 = Quản trị. Hiện CHỈ có một vai (docs/01-kien-truc.md §2).
        -- Giá trị hợp lệ kiểm ở TẦNG SERVICE, không CHECK constraint — cùng lối CSV_TaiKhoan.vai_tro.
        vai_tro             TINYINT           NOT NULL,

        -- 1 = hoạt động · 0 = khoá. KHÁC is_deleted: khoá là tạm, mở lại được, dòng vẫn hiện ở màn
        -- quản lý tài khoản; xoá mềm là rời hệ thống.
        trang_thai          TINYINT           NOT NULL,

        -- Mặc định 1 = HỎNG VỀ PHÍA AN TOÀN: tài khoản tạo bằng script với mật khẩu ban đầu phải đổi
        -- ở lần đăng nhập đầu. Quên truyền thì người dùng bị buộc đổi, không giữ được mật khẩu tạm.
        phai_doi_mat_khau   BIT               NOT NULL CONSTRAINT DF_TT_TaiKhoan_phai_doi_mat_khau DEFAULT(1),

        -- 5 trường audit BẮT BUỘC, khớp Models/Base/BaseModel.cs.
        is_deleted              BIT           NOT NULL CONSTRAINT DF_TT_TaiKhoan_is_deleted   DEFAULT(0),
        created_time            DATETIME      NOT NULL CONSTRAINT DF_TT_TaiKhoan_created_time DEFAULT(GETDATE()),
        created_user_id         NVARCHAR(36)  NULL,
        last_modified_times     DATETIME      NOT NULL CONSTRAINT DF_TT_TaiKhoan_lmt          DEFAULT(GETDATE()),
        last_modified_user_id   NVARCHAR(36)  NULL,

        CONSTRAINT PK_TT_TaiKhoan PRIMARY KEY CLUSTERED (id)
    );
END
GO

/* ----------------------------------------------------------------------------------------------
   INDEX — đường đọc của ĐĂNG NHẬP (P4): WHERE email_dang_nhap = @email AND is_deleted = 0.
   🔴 THƯỜNG, KHÔNG UNIQUE, KHÔNG FILTERED — cố ý:
     · UNIQUE thường chặn tạo lại tài khoản cùng email sau khi xoá mềm dòng cũ.
     · UNIQUE ... WHERE is_deleted = 0 giải được chuyện đó nhưng là FILTERED index ⇒ kéo bảng vào
       luật QUOTED_IDENTIFIER (Msg 1934) — đúng cái bẫy đã trả giá ở CSV_TaiKhoan.
   ⇒ Không trùng email là việc của SERVICE (kiểm trước khi INSERT), cùng lối IX_CSV_TaiKhoan_Email.
   ---------------------------------------------------------------------------------------------- */
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_TT_TaiKhoan_Email' AND object_id = OBJECT_ID('dbo.TT_TaiKhoan'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_TT_TaiKhoan_Email
        ON dbo.TT_TaiKhoan (email_dang_nhap)
        INCLUDE (is_deleted);
END
GO
