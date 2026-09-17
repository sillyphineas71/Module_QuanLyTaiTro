namespace Models.Responses.TaiTro
{
    /// <summary>
    /// Một dòng của <c>TT_CongKhai_GetDanhSachChuongTrinh</c> (SP 01) — thẻ chương trình ở trang danh sách.
    /// </summary>
    /// <remarks>
    /// 🔴 TÊN PROPERTY = TÊN CỘT SP, TỪNG CHỮ. Dapper map theo tên: lệch một chữ là trường về giá trị
    /// mặc định (null / 0), KHÔNG LỖI, build vẫn xanh. Đổi cột ở SP thì đổi ở đây CÙNG LÚC.
    ///
    /// Nullable theo KIỂU CỘT NGUỒN (DDL + view), không theo "thường có dữ liệu":
    /// <list type="bullet">
    /// <item><c>anh_bia</c> NULL được ⇒ <c>string?</c>.</item>
    /// <item><c>tong_du_kien_chi</c> / <c>tong_da_quyen</c> đã <c>ISNULL(…, 0)</c> trong SP ⇒ <c>decimal</c>.</item>
    /// <item><c>so_nha_tai_tro</c> là <c>COUNT(*)</c> trong APPLY — luôn một dòng ⇒ <c>int</c>.</item>
    /// </list>
    /// ⚠️ <c>trang_thai</c> là TINYINT tính trong view (1 Đang · 2 Đã diễn ra), KHÔNG CÓ giá trị 0.
    ///    Thấy 0 trong JSON nghĩa là cột không map được — không phải trạng thái thật.
    /// ⚠️ HAI CỘT metadata SQL báo "nullable" nhưng KHÔNG THỂ null — cố ý khai không nullable (đối chiếu
    ///    <c>sys.dm_exec_describe_first_result_set</c>, P2a):
    ///    · <c>trang_thai</c>: <c>CASE … THEN 1 ELSE 2</c> trên <c>den_ngay</c> NOT NULL — SQL Server đánh
    ///      mọi biểu thức CASE là nullable.
    ///    · <c>so_nha_tai_tro</c>: <c>COUNT(*)</c> không GROUP BY luôn trả đúng một dòng; nullable chỉ vì nằm
    ///      trong OUTER APPLY. Đổi APPLY đó (thêm GROUP BY chẳng hạn) thì PHẢI xem lại dòng này.
    /// ⚠️ Không có <c>loi_keu_goi</c> / <c>mo_ta_day</c> — SP 01 cố ý không trả (chú thích đầu SP).
    /// </remarks>
    public class ChuongTrinhTomTatResponse
    {
        public int id { get; set; }
        public string ten { get; set; } = string.Empty;
        public string phu_de { get; set; } = string.Empty;
        public string? anh_bia { get; set; }
        public DateTime tu_ngay { get; set; }
        public DateTime den_ngay { get; set; }
        public int trang_thai { get; set; }
        public string don_vi_to_chuc { get; set; } = string.Empty;
        public decimal tong_du_kien_chi { get; set; }
        public decimal tong_da_quyen { get; set; }
        public int so_nha_tai_tro { get; set; }
    }
}
