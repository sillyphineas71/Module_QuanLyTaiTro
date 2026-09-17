namespace Models.Responses.TaiTro
{
    /// <summary>
    /// Một dòng "Chi tiết dự kiến chi" — result set 2 của <c>TT_CongKhai_GetChiTietChuongTrinh</c> (SP 02).
    /// </summary>
    /// <remarks>
    /// 🔴 TÊN PROPERTY = TÊN CỘT SP, TỪNG CHỮ. Cả bốn cột NOT NULL trong DDL <c>TT_DuKienChi</c>.
    /// </remarks>
    public class DuKienChiResponse
    {
        public int id { get; set; }
        public string noi_dung { get; set; } = string.Empty;
        public decimal so_tien { get; set; }
        public int thu_tu { get; set; }
    }
}
