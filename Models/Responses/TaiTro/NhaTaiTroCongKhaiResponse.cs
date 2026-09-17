namespace Models.Responses.TaiTro
{
    /// <summary>
    /// Một nhà tài trợ ĐÃ DUYỆT — một dòng của <c>TT_CongKhai_GetNhaTaiTroTheoChuongTrinh</c> (SP 03).
    /// </summary>
    /// <remarks>
    /// 🔴 TÊN PROPERTY = TÊN CỘT SP, TỪNG CHỮ. Dapper map theo tên; lệch là về null, KHÔNG LỖI.
    ///
    /// 🔴 NULLABLE THEO VIEW <c>TT_v_NhaTaiTroCongKhai</c>, KHÔNG THEO BẢNG. View CHE cột bằng
    /// <c>CASE WHEN muc_an_danh …</c>, nên cột NOT NULL ở bảng vẫn ra NULL ở đây:
    /// <list type="bullet">
    /// <item><c>ho_ten_don_vi</c> — NOT NULL ở bảng, NULL khi ẩn danh ⇒ <c>string?</c>.</item>
    /// <item><c>ngay_sinh</c> — NULL khi không có (doanh nghiệp, tập thể) HOẶC bị che (ẩn danh) ⇒ <c>DateTime?</c>.
    ///       Hai nghĩa tách bằng <see cref="an_danh"/>, không bằng giá trị này.</item>
    /// <item><c>ten_he</c> / <c>ten_khoa</c> / <c>nien_khoa</c> / <c>ten_lop</c> — NULL ở bảng + bị che ở mức 2 ⇒ <c>string?</c>.</item>
    /// <item><c>so_tien</c> — NULL ở bảng khi CHƯA DUYỆT. View đã lọc <c>so_tien IS NOT NULL</c> nên
    ///       hiện không bao giờ về null, nhưng khai <c>decimal?</c>: khai <c>decimal</c> mà có ngày điều
    ///       kiện lọc bị gỡ khỏi view thì Dapper trả <b>0</b> — một khoản tài trợ 0đ trên trang công khai,
    ///       không lỗi nào nổ (bài học <c>int?</c> repo cũ).</item>
    /// </list>
    /// ⚠️ <c>an_danh</c> / <c>an_dinh_danh</c>: metadata SQL báo nullable (biểu thức CASE) nhưng
    ///    <c>CAST(CASE … THEN 0 ELSE 1 END AS BIT)</c> không thể null ⇒ khai <c>bool</c>. Nếu có ngày nó null thì
    ///    Dapper trả <c>false</c> = "không ẩn danh" — nhưng tên/ngày sinh vẫn bị view che độc lập, nên hỏng
    ///    về phía hiện "—" chứ không lộ tên.
    /// ⚠️ <c>loai</c> là TINYINT 1 Cá nhân · 2 Tập thể · 3 Doanh nghiệp — không có 0.
    /// ⚠️ <c>an_dinh_danh</c> CHƯA có trong hợp đồng FE (<c>ITaiTro.ts</c>) — lệch đã biết, lô P2b.
    /// </remarks>
    public class NhaTaiTroCongKhaiResponse
    {
        public int id { get; set; }
        public int loai { get; set; }
        public string? ho_ten_don_vi { get; set; }
        public bool an_danh { get; set; }
        public bool an_dinh_danh { get; set; }
        public DateTime? ngay_sinh { get; set; }
        public string? ten_he { get; set; }
        public string? ten_khoa { get; set; }
        public string? nien_khoa { get; set; }
        public string? ten_lop { get; set; }
        public decimal? so_tien { get; set; }
        public DateTime ngay_tai_tro { get; set; }
    }
}
