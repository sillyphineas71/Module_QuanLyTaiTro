namespace Models.Responses.TaiTro
{
    /// <summary>
    /// Một ảnh minh chứng — result set 2 của <c>TT_CongKhai_GetKhoanChiTheoChuongTrinh</c> (SP 04).
    /// </summary>
    /// <remarks>
    /// 🔴 TÊN PROPERTY = TÊN CỘT SP, TỪNG CHỮ. Bốn cột NOT NULL trong DDL <c>TT_MinhChungChi</c>.
    /// ⚠️ <c>ten_file</c> là TÊN FILE, không phải URL (khối đầu DDL) — FE tự dựng đường dẫn.
    /// ⚠️ <c>id_khoan_chi</c> chỉ để repository gắn ảnh vào đúng khoản chi. Nó vẫn ra JSON (thừa, vô hại:
    ///    trùng <c>id</c> của khoản chi cha); <c>IMinhChungChi</c> ở FE không đọc.
    /// </remarks>
    public class MinhChungChiResponse
    {
        public int id { get; set; }
        public int id_khoan_chi { get; set; }
        public string ten_file { get; set; } = string.Empty;
        public int thu_tu { get; set; }
    }
}
