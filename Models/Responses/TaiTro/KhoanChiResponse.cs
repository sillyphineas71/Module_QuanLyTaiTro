namespace Models.Responses.TaiTro
{
    /// <summary>
    /// Một khoản đã chi — result set 1 của <c>TT_CongKhai_GetKhoanChiTheoChuongTrinh</c> (SP 04),
    /// kèm <see cref="minh_chung"/> gom từ result set 2.
    /// </summary>
    /// <remarks>
    /// 🔴 TÊN PROPERTY = TÊN CỘT SP, TỪNG CHỮ. Bốn cột NOT NULL trong DDL <c>TT_KhoanChi</c>.
    /// <see cref="minh_chung"/> không trùng cột nào nên Dapper bỏ qua; repository gán sau.
    /// </remarks>
    public class KhoanChiResponse
    {
        public int id { get; set; }
        public string noi_dung { get; set; } = string.Empty;
        public decimal so_tien { get; set; }
        public DateTime ngay_chi { get; set; }

        /// <summary>Rỗng (không null) khi khoản chi chưa có ảnh.</summary>
        public List<MinhChungChiResponse> minh_chung { get; set; } = new();
    }
}
