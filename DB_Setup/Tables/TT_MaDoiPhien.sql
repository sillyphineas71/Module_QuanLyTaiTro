/* ----------------------------------------------------------------------------------------------
   BẢNG TT_MaDoiPhien — MÃ ĐỔI PHIÊN một lần, để cựu SV đăng nhập cổng Tài trợ bằng tài khoản cổng cựu SV
   ----------------------------------------------------------------------------------------------
   🔴 RANH GIỚI SỞ HỮU — ĐỌC TRƯỚC KHI SỬA BẤT CỨ GÌ Ở ĐÂY
      · Bảng mang tiền tố TT_ và DDL nằm ở repo ApiQuanLyTaiTro — repo này giữ SCHEMA.
      · Nhưng bên GHI (INSERT) là CỔNG CỰU SV (repo ApiQuanLyCuuSinhVien), KHÔNG PHẢI cổng này.
      · Cổng Tài trợ CHỈ ĐỌC-RỒI-XOÁ (đổi mã). Nó KHÔNG BAO GIỜ được tạo mã.
      Nhìn tiền tố TT_ rồi tưởng cổng Tài trợ ghi vào đây là sai lầm nguy hiểm nhất có thể mắc với
      bảng này: ai tạo được mã thì ĐĂNG NHẬP ĐƯỢC THÀNH BẤT KỲ CỰU SV NÀO. Cổng Tài trợ là cổng công
      khai, bề mặt tấn công rộng hơn; quyền tạo mã phải nằm ở phía ĐÃ XÁC THỰC người dùng — cổng cựu SV.
      ⇒ TT_APP_USER bị DENY INSERT/UPDATE trên bảng này (DB_Setup/90_CapQuyen_TaiTro.sql, khối 4).
      ⇒ Sửa cấu trúc bảng = sửa hợp đồng giữa HAI repo. Mở cả hai phía cùng lúc.

   LUỒNG (docs/01-kien-truc.md §2):
     1. Cổng Tài trợ: "Bạn là Cựu sinh viên? → Đăng nhập ngay" → chuyển sang cổng cựu SV /login?quay_lai=<url>
     2. Cổng cựu SV xác thực (hoặc đã có phiên) → SINH MÃ NGẪU NHIÊN → INSERT một dòng ở đây
     3. Cổng cựu SV chuyển về cổng Tài trợ /doi-phien?ma=<mã>
     4. Cổng Tài trợ băm mã → XOÁ dòng khớp VÀ lấy id_tai_khoan_csv TRONG CÙNG MỘT LỆNH → kiểm lại
        CSV_TaiKhoan → cấp JWT RIÊNG của cổng Tài trợ (7 ngày)

   HỢP ĐỒNG KỸ THUẬT CHO LÔ ĐĂNG NHẬP (chưa có SP — ghi sẵn ở đây để hai phía làm khớp):
     · MÃ: ≥ 32 byte ngẫu nhiên từ RandomNumberGenerator (KHÔNG Guid, KHÔNG Random), mã hoá base64url.
     · BĂM: SHA-256 trên BYTE UTF-8 của CHUỖI mã đúng như nằm trong URL → BINARY(32). Hai phía phải
       băm GIỐNG HỆT từng byte, nên viết đúng câu này vào code của cả hai.
     · HẠN 2 PHÚT tính bằng created_time theo ĐỒNG HỒ DB (GETDATE()), KHÔNG theo đồng hồ web server:
       hai cổng chạy hai máy/hai domain, lệch giờ vài phút là chuyện thường ⇒ mã "hết hạn ngay khi
       sinh" hoặc "sống 5 phút". SP tạo mã phải để created_time lấy DEFAULT — KHÔNG đi qua
       BaseModel.SetInsertInfo (nó gán DateTime.Now của web server).
     · ĐỔI MÃ = MỘT LỆNH NGUYÊN TỬ, không SELECT rồi DELETE:
           DELETE FROM dbo.TT_MaDoiPhien
           OUTPUT deleted.id_tai_khoan_csv
           WHERE ma_hash = @ma_hash
             AND created_time >= DATEADD(MINUTE, -2, GETDATE());
       SELECT-rồi-DELETE thì hai request cùng mã chen giữa hai lệnh sẽ CÙNG đổi được — "dùng một lần"
       thành "dùng hai lần". DELETE…OUTPUT: request thứ hai không còn dòng nào để xoá.
     · Mã sai / hết hạn / đã dùng ⇒ CÙNG MỘT câu trả lời. Phân biệt là cho kẻ dò biết mã nào từng có thật.
     · DỌN MÃ BỎ DỞ (người bấm đăng nhập rồi đóng tab ⇒ mã không bao giờ được đổi): SP đổi mã chạy
       thêm, TRƯỚC lệnh trên,
           DELETE FROM dbo.TT_MaDoiPhien WHERE created_time < DATEADD(MINUTE, -2, GETDATE());
       Không cần job riêng: mỗi lượt đăng nhập tự dọn, bảng không bao giờ lớn quá vài dòng.

   Chạy lại nhiều lần AN TOÀN: bọc IF NOT EXISTS, không có DROP.
   ---------------------------------------------------------------------------------------------- */
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'TT_MaDoiPhien' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE dbo.TT_MaDoiPhien
    (
        id                  INT IDENTITY(1,1) NOT NULL,

        -- 🔴 LƯU BĂM, KHÔNG LƯU MÃ. Mã trong bảng này là một CHÌA KHOÁ ĐĂNG NHẬP còn sống. Ai đọc được
        --    bảng (TT_APP_USER có SELECT; bản sao DB; SQL Profiler/trace ghi tham số) trong 2 phút đó
        --    thì đổi được phiên của người khác. Băm SHA-256 thì dòng đọc được là vô dụng: không đảo
        --    ngược được, và mã 256 bit thì không dò được.
        -- Không cần salt/BCrypt như mật khẩu: mã là ngẫu nhiên đủ dài, không có từ điển để dò.
        ma_hash             BINARY(32)        NOT NULL,

        -- CSV_TaiKhoan.id của người vừa xác thực ở cổng cựu SV. Liên kết mềm, không khoá ngoại.
        -- ⚠️ Mã hợp lệ CHƯA có nghĩa là được vào: lúc đổi mã, cổng Tài trợ KIỂM LẠI CSV_TaiKhoan
        --    (docs/01-kien-truc.md §2) — tài khoản có thể bị xoá/từ chối giữa lúc sinh mã và lúc đổi.
        id_tai_khoan_csv    INT               NOT NULL,

        -- ══ KHÔNG có cột het_han_luc — cố ý ══
        -- Hạn 2 phút là LUẬT CỦA BÊN ĐỔI MÃ, viết ở lệnh DELETE bên trên, tính từ created_time. Có cột
        -- hạn do bên GHI điền thì bên ghi quyết được mã sống bao lâu — một lỗi ở cổng kia (đặt hạn 2
        -- ngày thay vì 2 phút) biến link "chụp được cũng vô dụng" thành link dùng được cả tuần.

        -- 5 trường audit BẮT BUỘC, khớp Models/Base/BaseModel.cs.
        -- 🔴 NGOẠI LỆ CÓ Ý THỨC VỚI LUẬT "XOÁ MỀM": dòng ở đây bị XOÁ CỨNG khi đổi mã, và mã hết hạn
        --    bị xoá cứng khi dọn. `is_deleted` vẫn có cho đủ khuôn nhưng không luồng nào đặt nó = 1.
        --    Lý do: xoá mềm một mã đăng nhập nghĩa là "dùng một lần" phụ thuộc vào việc MỌI truy vấn
        --    nhớ lọc is_deleted = 0 — quên một chỗ là mã đã dùng lại dùng được. Dòng không còn tồn tại
        --    thì không có gì để quên. Và bảng này không có gì đáng giữ làm lịch sử: vết đăng nhập
        --    thuộc về log, không thuộc về kho chìa khoá.
        -- ⚠️ created_time là ĐỒNG HỒ HẠN MÃ (xem khối hợp đồng ở đầu file) — PHẢI lấy DEFAULT GETDATE().
        is_deleted              BIT           NOT NULL CONSTRAINT DF_TT_MaDoiPhien_is_deleted   DEFAULT(0),
        created_time            DATETIME      NOT NULL CONSTRAINT DF_TT_MaDoiPhien_created_time DEFAULT(GETDATE()),
        created_user_id         NVARCHAR(36)  NULL,
        last_modified_times     DATETIME      NOT NULL CONSTRAINT DF_TT_MaDoiPhien_lmt          DEFAULT(GETDATE()),
        last_modified_user_id   NVARCHAR(36)  NULL,

        CONSTRAINT PK_TT_MaDoiPhien PRIMARY KEY CLUSTERED (id)
    );
END
GO

/* ----------------------------------------------------------------------------------------------
   INDEX — tra theo băm khi đổi mã. UNIQUE, KHÔNG filtered.
   UNIQUE ở đây AN TOÀN (khác IX_TT_TaiKhoan_Email): dòng bị xoá CỨNG nên không có "dòng đã xoá mềm
   giữ chỗ" chặn dòng mới. Hai mã 256 bit trùng băm là không xảy ra được — nên nếu INSERT lỗi trùng
   khoá thì đó là LỖI Ở BÊN SINH MÃ (sinh mã không ngẫu nhiên, gửi lại cùng mã), và phải lỗi to.
   Không index created_time: bảng chỉ chứa mã của 2 phút gần nhất (+ mã bỏ dở chờ dọn) — vài dòng.
   ---------------------------------------------------------------------------------------------- */
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UX_TT_MaDoiPhien_MaHash' AND object_id = OBJECT_ID('dbo.TT_MaDoiPhien'))
BEGIN
    CREATE UNIQUE NONCLUSTERED INDEX UX_TT_MaDoiPhien_MaHash
        ON dbo.TT_MaDoiPhien (ma_hash);
END
GO
