/* ----------------------------------------------------------------------------------------------
   BẢNG TT_ChuongTrinh — chương trình vận động tài trợ
   ----------------------------------------------------------------------------------------------
   Khớp IChuongTrinhTaiTro (ClientApp/src/model/ITaiTro.ts).

   🔴 KHÔNG CÓ CỘT `muc_tieu`, và không được thêm. Mục tiêu quyên góp CHÍNH LÀ tổng
      TT_DuKienChi.so_tien. Hai con số rời nhau là hai nguồn sự thật cho cùng một thứ — chúng sẽ
      lệch, và trang công khai nói dối đúng chỗ người ta nhìn để quyết định có đóng góp hay không.
   🔴 KHÔNG CÓ CỘT TỔNG NÀO (tong_da_quyen, tong_da_chi, so_nha_tai_tro). SP SUM từ bảng con mỗi
      lần đọc, không cột tổng + trigger (luật B3). Quy mô hàng chục dòng mỗi chương trình.
   🔴 KHÔNG LƯU `trang_thai` ĐANG / ĐÃ DIỄN RA. Nó là hàm của `den_ngay` theo đồng hồ MÁY CHỦ, tính
      ở view TT_v_ChuongTrinhCongKhai. Lưu cột thì ngày kết thúc qua đi mà không ai bật cờ, trang vẫn
      ghi "Đang diễn ra" — đúng lớp lỗi trang_thai / trang_thai_thuc_te (mục 60 repo cũ).

   Chạy lại nhiều lần AN TOÀN: bọc IF NOT EXISTS, không có DROP.
   ---------------------------------------------------------------------------------------------- */
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'TT_ChuongTrinh' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE dbo.TT_ChuongTrinh
    (
        id              INT IDENTITY(1,1) NOT NULL,

        ten             NVARCHAR(300)     NOT NULL,

        -- ══ BA TẦNG VĂN BẢN — mỗi cột MỘT VAI, tên cột nói vai, KHÔNG dùng chung tiền tố ══
        -- Ảnh mẫu trang chi tiết có ba khối chữ KHÁC NHAU (đối chiếu ảnh mẫu, lead duyệt):
        --   phu_de      — MỘT dòng dưới tên chương trình, trong banner. Cũng là dòng mô tả trên thẻ
        --                 ở trang danh sách (T1) — đủ ngắn để đứng trên thẻ.
        --   loi_keu_goi — ĐOẠN văn trong banner, lời kêu gọi đóng góp (~600-1000 ký tự).
        --   mo_ta_day   — khối "Thông tin chương trình" cuối trang, dài, nhiều đoạn.
        -- 🔴 TỪNG LÀ hai cột `mo_ta_ngan` / `mo_ta_day` và FE in `mo_ta_day` HAI LẦN (banner + khối
        --    thông tin) vì không có cột cho đoạn banner. Hai cột cùng tiền tố `mo_ta_` khác vai là
        --    lời mời nhầm; `mo_ta_ngan` đổi thành `phu_de` để tên tự nói nó là dòng phụ đề.
        -- Cả ba là văn bản THUẦN, không HTML — cùng quyết định CSV_TinTuc.noi_dung (HTML trên trang
        -- công khai kéo theo sanitise hai đầu + rủi ro XSS). FE hiển thị `white-space: pre-wrap`.
        phu_de          NVARCHAR(300)     NOT NULL,
        loi_keu_goi     NVARCHAR(1000)    NOT NULL,
        mo_ta_day       NVARCHAR(MAX)     NOT NULL,

        -- 🔴 LƯU TÊN FILE, KHÔNG LƯU URL. Ví dụ "a3f2c1d0-....jpg", KHÔNG phải
        --    "https://.../anh-tai-tro/a3f2c1d0-....jpg".
        --    Đường dẫn phục vụ có thể đổi (thư mục con, CDN, đổi host); URL cứng trong DB sẽ MỤC và
        --    phải UPDATE toàn bảng để sửa. FE ghép URL ở MỘT chỗ: duongDanAnh() trong ITaiTro.ts.
        -- ⚠️ URL dán vào đây còn là đường nhúng ẢNH TỪ MIỀN LẠ lên trang công khai — service ghi phải
        --    từ chối giá trị chứa "/" hoặc "\".
        -- NULL = chưa có ảnh bìa (FE có ô thay thế).
        anh_bia         NVARCHAR(260)     NULL,

        -- DATE, không DATETIME: "đến hết ngày X" là ý người dùng nói. View cắt GETDATE() về DATE để so.
        tu_ngay         DATE              NOT NULL,
        den_ngay        DATE              NOT NULL,

        don_vi_to_chuc  NVARCHAR(300)     NOT NULL,

        -- Thông tin chuyển khoản HIỆN CÔNG KHAI — đó là mục đích của trang. NVARCHAR cho stk vì
        -- ngân hàng hay in số tài khoản kèm dấu cách.
        stk             NVARCHAR(50)      NOT NULL,
        ngan_hang       NVARCHAR(200)     NOT NULL,
        -- 🔴 KHÔNG CÓ TRÊN ẢNH MẪU — thêm có chủ đích (lead duyệt). App ngân hàng hiện TÊN CHỦ TÀI
        --    KHOẢN ngay khi người ta gõ số tài khoản; trang phải cho họ một cái tên để ĐỐI CHIẾU
        --    trước khi bấm chuyển. Thiếu nó, người tài trợ không phân biệt được tài khoản của Khoa
        --    với một số tài khoản bị sửa/giả mạo — và tiền chuyển nhầm thì không lấy lại được.
        -- Ghi đúng chữ in HOA KHÔNG DẤU như ngân hàng hiện (vd "KHOA TOAN CO TIN HOC") để so được
        -- bằng mắt, không phải tên đơn vị có dấu.
        ten_chu_tai_khoan NVARCHAR(200)   NOT NULL,
        noi_dung_ck     NVARCHAR(200)     NOT NULL,

        -- Ảnh QR do QUẢN TRỊ TẢI LÊN (lead chốt không sinh VietQR). TÊN FILE, cùng lý do anh_bia.
        -- NULL = không có QR ⇒ FE ẨN HẲN khối (luật A8: ô giữ chỗ ở chỗ QR là một lời hứa sai).
        anh_qr          NVARCHAR(260)     NULL,

        -- 0 = NHÁP (chỉ quản trị thấy) · 1 = CÔNG BỐ. Cờ tay.
        -- 🔴 KHÔNG CÓ TRONG MÔ TẢ LÔ P1 — thêm vì thiếu nó thì chương trình soạn dở hiện ra ngoài
        --    ngay lúc INSERT. Mặc định 0 = HỎNG VỀ PHÍA AN TOÀN.
        -- ⚠️ Chỉ view TT_v_ChuongTrinhCongKhai đọc cờ này. Mọi bảng con ra ngoài QUA view đó ⇒ chương
        --    trình nháp kéo theo cả dự kiến chi, nhà tài trợ, khoản chi của nó.
        cong_khai       BIT               NOT NULL CONSTRAINT DF_TT_ChuongTrinh_cong_khai DEFAULT(0),

        -- 5 trường audit BẮT BUỘC, khớp Models/Base/BaseModel.cs.
        is_deleted              BIT           NOT NULL CONSTRAINT DF_TT_ChuongTrinh_is_deleted   DEFAULT(0),
        created_time            DATETIME      NOT NULL CONSTRAINT DF_TT_ChuongTrinh_created_time DEFAULT(GETDATE()),
        created_user_id         NVARCHAR(36)  NULL,
        last_modified_times     DATETIME      NOT NULL CONSTRAINT DF_TT_ChuongTrinh_lmt          DEFAULT(GETDATE()),
        last_modified_user_id   NVARCHAR(36)  NULL,

        CONSTRAINT PK_TT_ChuongTrinh PRIMARY KEY CLUSTERED (id)
    );
END
GO

/* KHÔNG có index phụ: bảng tăng vài chương trình mỗi năm, quét PK clustered là đủ. Thêm index ở đây
   là trả chi phí ghi để đổi lấy một kế hoạch thực thi không khác gì. */

/* ----------------------------------------------------------------------------------------------
   🔴 CHẶN BẢNG TẠO TỪ BẢN DDL CŨ (P1 đợt đầu: mo_ta_ngan, không có loi_keu_goi / ten_chu_tai_khoan)
   ----------------------------------------------------------------------------------------------
   `IF NOT EXISTS` ở trên BỎ QUA LẶNG LẼ khi bảng đã có — tức chạy file mới lên DB đã chạy bản cũ
   thì "thành công" mà schema vẫn cũ, và lỗi chỉ lộ ra ở bước tạo view. Khối này biến lỗi câm đó
   thành lỗi to, ngay tại file gây ra nó.
   Cách xử khi gặp: bảng CHƯA có dữ liệu thật ⇒ DROP rồi chạy lại file (xem "Quay lui" trong
   DB_Setup/TRIEN_KHAI_P1.md). Đã có dữ liệu ⇒ viết script ALTER riêng, đừng DROP.
   ---------------------------------------------------------------------------------------------- */
IF COL_LENGTH('dbo.TT_ChuongTrinh', 'mo_ta_ngan') IS NOT NULL
   OR COL_LENGTH('dbo.TT_ChuongTrinh', 'phu_de') IS NULL
   OR COL_LENGTH('dbo.TT_ChuongTrinh', 'loi_keu_goi') IS NULL
   OR COL_LENGTH('dbo.TT_ChuongTrinh', 'ten_chu_tai_khoan') IS NULL
    THROW 50010, N'TT_ChuongTrinh duoc tao tu ban DDL CU (P1 dot dau). Bang rong: DROP roi chay lai file nay. Co du lieu: viet script ALTER rieng.', 1;
GO
