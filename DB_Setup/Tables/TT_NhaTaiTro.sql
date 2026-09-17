/* ----------------------------------------------------------------------------------------------
   BẢNG TT_NhaTaiTro — MỘT LƯỢT TÀI TRỢ: lời khai của người tài trợ + xác nhận của quản trị
   ----------------------------------------------------------------------------------------------
   Luồng nghiệp vụ đã chốt:
     1. Người tài trợ chuyển khoản.
     2. Người tài trợ mở modal, KHAI ĐỊNH DANH + tải ảnh chuyển khoản (TT_AnhChuyenKhoan). KHÔNG khai tiền.
        Người khai là KHÁCH (không đăng nhập) hoặc CỰU SV (đăng nhập bằng tài khoản cổng cựu SV).
     3. Quản trị xem ảnh, NHẬP SỐ TIỀN, DUYỆT.
     4. Chỉ dòng đã duyệt mới lên trang công khai.
        Riêng cựu SV đã đăng nhập xem lại được MỌI lời khai CỦA CHÍNH MÌNH, kể cả đang chờ
        (SP TT_CuuSV_GetLichSuTaiTroCuaToi — nhóm SP KHÁC HẲN TT_CongKhai_*).
   ⇒ Mỗi dòng có HAI GIAI ĐOẠN, và các cột dưới đây chia đúng theo hai giai đoạn đó.

   🔴 BẢNG NÀY KHÔNG BAO GIỜ ĐƯỢC ĐỌC TRỰC TIẾP BỞI SP CÔNG KHAI.
      Trang công khai đọc qua DUY NHẤT view TT_v_NhaTaiTroCongKhai — nơi DUY NHẤT chứa vị từ "đã
      duyệt" và luật che ẩn danh. Kiểm bằng khối KIỂM 3 trong DB_Setup/99_KiemTra_P1.sql.
      Bảng này chứa: tên thật của người CHỌN ẨN DANH, tên người CHƯA CHẮC ĐÃ CHUYỂN TIỀN, số điện
      thoại/email, và lý do từ chối — không cột nào trong số đó được rời máy chủ qua trang công khai.

   Liên kết mềm, KHÔNG khoá ngoại (docs/01-kien-truc.md §3).
   Chạy lại nhiều lần AN TOÀN: bọc IF NOT EXISTS, không có DROP.
   ---------------------------------------------------------------------------------------------- */
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'TT_NhaTaiTro' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE dbo.TT_NhaTaiTro
    (
        id                  INT IDENTITY(1,1) NOT NULL,
        id_chuong_trinh     INT               NOT NULL,

        -- ══════════════════════════════════════════════════════════════════════════════════════
        -- GIAI ĐOẠN 1 — NGƯỜI TÀI TRỢ KHAI
        -- ══════════════════════════════════════════════════════════════════════════════════════

        -- 1 = Cá nhân · 2 = Tập thể / Lớp · 3 = Doanh nghiệp (khớp eLoaiNhaTaiTro).
        -- Giá trị hợp lệ kiểm ở TẦNG SERVICE, không CHECK constraint (lối của repo).
        loai                TINYINT           NOT NULL,

        -- 🔴 LUÔN LƯU TÊN THẬT, KỂ CẢ KHI ẨN DANH. NOT NULL.
        --    Quản trị phải đối chiếu tên này với ảnh chuyển khoản mới duyệt được. Ẩn danh là luật
        --    HIỂN THỊ, không phải luật LƯU TRỮ: che ở view, không xoá ở bảng.
        --    (Ở hợp đồng FE, `ho_ten_don_vi: null` là thứ VIEW trả ra — không phải thứ bảng chứa.)
        ho_ten_don_vi       NVARCHAR(300)     NOT NULL,

        -- ══ ẨN DANH — MỘT CỘT BA GIÁ TRỊ, KHÔNG PHẢI HAI CỘT BIT ══
        --   0 = công khai đầy đủ
        --   1 = ẨN TÊN, GIỮ ĐỊNH DANH   — "Nhà tài trợ ẩn danh", vẫn hiện Hệ/Khoa/Khoá/Lớp
        --                                (muốn giấu TÊN, không giấu việc mình là cựu SV khoá đó)
        --   2 = ẨN TẤT CẢ              — tên VÀ bốn cột định danh đều không ra ngoài
        -- Vì sao không hai BIT (an_ten, an_dinh_danh): hai bit cho ra tổ hợp VÔ NGHĨA "hiện tên, giấu
        -- lớp" — giấu lớp của một người đã lộ tên thì không giấu được gì, nhưng người chọn nó TƯỞNG
        -- là đã giấu. Một cột ba giá trị làm tổ hợp đó không biểu diễn được.
        -- 🔴 KHÔNG DEFAULT — cố ý. Đây là LỰA CHỌN CỦA NGƯỜI TÀI TRỢ; INSERT quên cột này phải LỖI,
        --    không được lặng lẽ chọn hộ họ "công khai".
        -- ⚠️ View che theo lối HỎNG VỀ PHÍA AN TOÀN: giá trị lạ (3, 9…) được xử như ẩn tất cả.
        muc_an_danh         TINYINT           NOT NULL,

        -- ══ BỐN CỘT ĐỊNH DANH (Hệ · Khoa · Khoá · Lớp) — ẢNH CHỤP TÊN, KHÔNG LƯU ID ══
        -- 🔴 KHÔNG CÓ `ten_chuyen_nganh` — đã gỡ (đối chiếu ảnh mẫu, lead duyệt): modal chỉ hỏi bốn cấp,
        --    và không màn nào hiện chuyên ngành. Gỡ lúc chưa có dữ liệu là miễn phí. Nếu P3 thấy cần
        --    chuyên ngành để lọc danh sách Lớp thì thêm lại — lúc đó mới có người đọc nó.
        -- 🔴 LƯU CHỮ tại thời điểm khai, KHÔNG lưu ID_he/ID_khoa/ID_lop rồi join STU_Lop/dm* lúc đọc.
        --   1. ĐÂY LÀ MỘT BẢN GHI LỊCH SỬ. "Tài trợ năm 2025, với tư cách lớp K39A" phải đứng yên kể
        --      cả khi lớp đổi tên, ngành sáp nhập, chuyên ngành bị xoá mềm. Join lại thì câu trả lời
        --      đổi theo thời gian hoặc rỗng — cùng nguyên tắc tieu_chi_loc_mo_ta của CSV_DotGuiMail.
        --   2. NGƯỜI TÀI TRỢ LÀ BẤT KỲ AI. Người ngoài, cựu SV khoá cũ chưa có trong STU_*, tập thể
        --      tự gõ tên — cột ID của họ sẽ NULL, tức vẫn phải có cột chữ. ID + chữ là HAI nguồn cho
        --      một thứ, và chúng sẽ lệch.
        --   3. SP CÔNG KHAI KHÔNG ĐỤNG BẢNG SINH VIÊN. Lưu ID thì mọi lượt khách xem trang đều join
        --      STU_Lop/dm* qua SP chạy bằng ownership chaining (docs/01-kien-truc.md §4). Lưu chữ
        --      thì đường công khai chỉ chạm bảng TT_*.
        -- Gợi ý khoá/lớp từ CSV_*/STU_* (điền sẵn form) vẫn làm được — service chép CHỮ vào đây.
        --
        -- 🔴 NULL = "KHÔNG CÓ DỮ LIỆU" (doanh nghiệp không có lớp) — FE hiện "—".
        --    KHÁC với "cố tình giấu", vốn được mã hoá bằng muc_an_danh, không bằng NULL. Hai nghĩa
        --    khác nhau không được dùng chung một ký hiệu (luật A7).
        -- ⚠️ Service chuẩn hoá chuỗi rỗng/khoảng trắng thành NULL trước khi ghi; view vẫn NULLIF
        --    thêm một lần cho dữ liệu nhập tay.
        ten_he              NVARCHAR(200)     NULL,
        ten_khoa            NVARCHAR(200)     NULL,
        -- Chuỗi dạng "1994-1998" (STU_Lop.Nien_khoa). KHÔNG dùng Khoa_hoc: đánh số riêng theo hệ nên
        -- "khoá 25" đứng một mình là vô nghĩa (A6.7 repo cũ).
        nien_khoa           NVARCHAR(50)      NULL,
        ten_lop             NVARCHAR(100)     NULL,

        -- 🔴 KHÔNG CÓ `ngay_sinh` — lead đã bỏ khỏi trang công khai (C3 / A6.4). Không lưu thứ không
        --    ai được xem: một cột không có trên màn nào vẫn là dữ liệu cá nhân chờ bị rò.

        -- Liên hệ RIÊNG TƯ — chỉ quản trị thấy, KHÔNG view công khai nào có hai cột này.
        -- Lý do tồn tại: KHÁCH không đăng nhập, nên khi lời khai của khách bị TỪ CHỐI (không thấy tiền
        -- về, ảnh sai) đây là kênh DUY NHẤT để báo cho họ biết. Thiếu nó, lời khai bị từ chối là một
        -- lỗ đen: người ta đã chuyển tiền và không bao giờ thấy tên mình.
        -- (Cựu SV đăng nhập thì tự thấy trạng thái ở "Lịch sử tài trợ của tôi" — nhưng khách vẫn cần.)
        email_lien_he       NVARCHAR(256)     NULL,
        sdt_lien_he         NVARCHAR(20)      NULL,

        -- ══ AI ĐÃ KHAI — tài khoản cổng cựu SV đang đăng nhập lúc gửi lời khai ══
        -- CSV_TaiKhoan.id. NULL = KHÁCH khai (không đăng nhập).
        -- 🔴 NGHĨA LÀ "NHỮNG LẦN TÔI KHAI", KHÔNG PHẢI "NHỮNG LẦN TÊN TÔI XUẤT HIỆN".
        --    Cựu SV A đăng nhập rồi khai hộ tên B ⇒ dòng mang id của A. ho_ten_don_vi là CHỮ người
        --    khai gõ, không phải định danh đã xác thực; cột này mới là thứ đã xác thực.
        --    Đó là thứ "Lịch sử tài trợ của tôi" hiện: A thấy lời khai A đã gửi (kể cả khai hộ B), B
        --    không thấy gì cả.
        -- 🔴 LỜI KHAI LÚC CÒN LÀ KHÁCH KHÔNG BAO GIỜ ĐƯỢC NỐI VÀO TÀI KHOẢN SAU NÀY. Không có dữ liệu
        --    nào CHỨNG MINH một lời khai khách là của ai: họ tên + lớp là chữ tự gõ, ai cũng gõ được
        --    tên người khác. Nối theo tên là cho người đăng nhập sau XEM lời khai (liên hệ, ảnh chuyển
        --    khoản) của một người trùng tên. Lý do đầy đủ: docs/01-kien-truc.md §2.
        -- 🔴 KHÔNG DÙNG created_user_id CHO VIỆC NÀY. created_user_id là NVARCHAR chung cho mọi bảng và
        --    ở cổng này mang id của TT_TaiKhoan (quản trị). Nhét id CSV_TaiKhoan vào cùng cột là HAI
        --    KHÔNG GIAN ID trong một cột: id 7 là quản trị số 7 hay cựu SV số 7? Không ai trả lời được
        --    — và "lịch sử của tôi" lọc theo cột đó sẽ trả lời sai cho đúng người mang id trùng.
        --    Cột riêng, kiểu INT, tên nói rõ bảng nguồn.
        id_tai_khoan_csv    INT               NULL,

        -- ══════════════════════════════════════════════════════════════════════════════════════
        -- GIAI ĐOẠN 2 — QUẢN TRỊ XÁC NHẬN
        -- ══════════════════════════════════════════════════════════════════════════════════════

        -- 1 = CHỜ DUYỆT · 2 = ĐÃ DUYỆT · 3 = TỪ CHỐI.
        -- Mặc định 1 = HỎNG VỀ PHÍA AN TOÀN: mọi dòng mới đứng ngoài trang công khai cho tới khi có
        -- người chủ động duyệt.
        -- 🔴 KHÔNG CÓ trạng thái "đã duyệt nhưng ẩn". Trang công khai tính tổng tiền, số nhà tài trợ
        --    và danh sách TỪ CÙNG MỘT TẬP DÒNG (luật B3; màn chi tiết còn tự cộng từ chính danh sách).
        --    Dòng "được tính nhưng không hiện" làm con số lớn khác tổng các dòng người ta đọc được.
        --    Nhu cầu thật đằng sau "ẩn" đã có chỗ khác:
        --      · người tài trợ xin giấu tên sau khi đã duyệt → đổi muc_an_danh
        --      · duyệt NHẦM (tiền không về)                  → chuyển sang 3 Từ chối, ghi lý do
        --      · lời khai TRÙNG (khai hai lần một khoản)     → xoá mềm is_deleted = 1
        trang_thai_duyet    TINYINT           NOT NULL CONSTRAINT DF_TT_NhaTaiTro_trang_thai_duyet DEFAULT(1),

        -- 🔴 SỐ TIỀN CHỈ DO QUẢN TRỊ NHẬP, đọc từ ảnh chuyển khoản. KHÔNG có "số khai" — modal không
        --    có ô tiền. MỘT con số duy nhất.
        -- NULL = chưa nhập (đang chờ duyệt, hoặc bị từ chối trước khi nhập).
        -- ⚠️ Luật "duyệt ⇒ so_tien > 0" kiểm ở SERVICE; view công khai VẪN lọc so_tien IS NOT NULL để
        --    một dòng lỗi dữ liệu không đẩy null vào phép cộng và vào bảng trên trang.
        so_tien             DECIMAL(18,0)     NULL,

        -- NGÀY TIỀN VÀO — ngày hiện ở cột "Thời gian" trên trang công khai.
        -- 🔴 TÁCH KHỎI created_time và khỏi thoi_diem_duyet, không phải trùng lặp:
        --      created_time    : lúc khai (dữ kiện kỹ thuật)
        --      thoi_diem_duyet : lúc quản trị bấm duyệt (có thể trễ nhiều ngày)
        --      ngay_tai_tro    : ngày người ta chuyển tiền — câu trả lời trang công khai muốn nói
        --    SP ghi đặt bằng NGÀY KHAI lúc INSERT (thường trùng ngày chuyển); quản trị SỬA ĐƯỢC khi
        --    duyệt nếu ảnh chuyển khoản ghi ngày khác. Không có ô bắt buộc mới cho quản trị.
        ngay_tai_tro        DATE              NOT NULL,

        -- Chỉ có nghĩa khi trang_thai_duyet = 3. Ghi cho QUẢN TRỊ KHÁC đọc (vì sao dòng này bị loại)
        -- và làm nội dung khi liên hệ lại người tài trợ.
        -- 🔴 KHÔNG BAO GIỜ ra trang công khai: "Từ chối — không thấy tiền về" gắn cạnh một cái tên
        --    là buộc tội công khai một người.
        ly_do_tu_choi       NVARCHAR(500)     NULL,

        -- Ai / lúc nào ĐỔI TRẠNG THÁI DUYỆT lần cuối (duyệt hoặc từ chối).
        -- 🔴 KHÔNG dùng last_modified_*: lần sửa chính tả tên sau đó sẽ ghi đè mất "ai đã duyệt". Một
        --    cột mang hai nghĩa thì lúc cần phân biệt không phân biệt được nữa.
        thoi_diem_duyet     DATETIME          NULL,
        id_nguoi_duyet      INT               NULL,     -- TT_TaiKhoan.id

        -- 5 trường audit BẮT BUỘC, khớp Models/Base/BaseModel.cs.
        -- created_user_id / last_modified_user_id CHỈ mang id TT_TaiKhoan (quản trị). Dòng do khách
        -- hoặc cựu SV tạo: created_user_id = NULL — người khai cựu SV nằm ở id_tai_khoan_csv (xem trên).
        is_deleted              BIT           NOT NULL CONSTRAINT DF_TT_NhaTaiTro_is_deleted   DEFAULT(0),
        created_time            DATETIME      NOT NULL CONSTRAINT DF_TT_NhaTaiTro_created_time DEFAULT(GETDATE()),
        created_user_id         NVARCHAR(36)  NULL,
        last_modified_times     DATETIME      NOT NULL CONSTRAINT DF_TT_NhaTaiTro_lmt          DEFAULT(GETDATE()),
        last_modified_user_id   NVARCHAR(36)  NULL,

        CONSTRAINT PK_TT_NhaTaiTro PRIMARY KEY CLUSTERED (id)
    );
END
GO

/* 🔴 CHẶN BẢNG TẠO TỪ BẢN DDL CŨ (còn ten_chuyen_nganh, chưa có id_tai_khoan_csv).
   `IF NOT EXISTS` ở trên bỏ qua LẶNG LẼ khi bảng đã có. Đặt TRƯỚC các index bên dưới: index trên
   id_tai_khoan_csv sẽ lỗi "cột không tồn tại" — đúng là lỗi, nhưng không nói được VÌ SAO.
   Bảng rỗng ⇒ DROP rồi chạy lại file. Có dữ liệu ⇒ viết script ALTER riêng, đừng DROP. */
IF COL_LENGTH('dbo.TT_NhaTaiTro', 'ten_chuyen_nganh') IS NOT NULL
   OR COL_LENGTH('dbo.TT_NhaTaiTro', 'id_tai_khoan_csv') IS NULL
    THROW 50011, N'TT_NhaTaiTro duoc tao tu ban DDL CU (P1 dot dau). Bang rong: DROP roi chay lai file nay. Co du lieu: viet script ALTER rieng.', 1;
GO

/* ----------------------------------------------------------------------------------------------
   INDEX — theo chương trình, rồi trạng thái duyệt.
   Phục vụ: SUM/COUNT của trang danh sách (mọi chương trình, mỗi lượt khách) · danh sách nhà tài trợ
   của trang chi tiết · và màn quản trị lọc "chờ duyệt" TRONG một chương trình.
   INCLUDE so_tien + is_deleted ⇒ SUM/COUNT không phải quay lại bảng.
   🔴 KHÔNG filtered (WHERE trang_thai_duyet = 2) dù trông vừa khít: filtered index kéo bảng vào luật
      QUOTED_IDENTIFIER cho MỌI lệnh ghi — và bảng này được ghi từ modal của khách công khai.
   ⚠️ Hàng đợi duyệt TOÀN CỔNG (mọi chương trình, WHERE trang_thai_duyet = 1) KHÔNG dùng được index
      này. Chưa thêm index cho nó: SP đó thuộc lô sau, và hàng đợi chờ duyệt là tập nhỏ.
   ---------------------------------------------------------------------------------------------- */
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_TT_NhaTaiTro_ChuongTrinh_TrangThai' AND object_id = OBJECT_ID('dbo.TT_NhaTaiTro'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_TT_NhaTaiTro_ChuongTrinh_TrangThai
        ON dbo.TT_NhaTaiTro (id_chuong_trinh, trang_thai_duyet)
        INCLUDE (is_deleted, so_tien);
END
GO

/* ----------------------------------------------------------------------------------------------
   INDEX — "Lịch sử tài trợ của tôi": WHERE id_tai_khoan_csv = @id (SP TT_CuuSV_GetLichSuTaiTroCuaToi).
   Không có nó, MỖI lần một cựu SV mở trang lịch sử là quét TOÀN BỘ lời khai của MỌI chương trình —
   và bảng này là bảng lớn nhanh nhất của cổng.
   Phần lớn dòng mang NULL (khách). Index lọc `WHERE id_tai_khoan_csv IS NOT NULL` sẽ nhỏ hơn, nhưng là
   FILTERED ⇒ kéo MỌI lệnh ghi lên bảng (kể cả modal của khách) vào luật QUOTED_IDENTIFIER. Không đáng.
   ---------------------------------------------------------------------------------------------- */
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_TT_NhaTaiTro_TaiKhoanCsv' AND object_id = OBJECT_ID('dbo.TT_NhaTaiTro'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_TT_NhaTaiTro_TaiKhoanCsv
        ON dbo.TT_NhaTaiTro (id_tai_khoan_csv)
        INCLUDE (is_deleted);
END
GO
