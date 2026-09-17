namespace Models.Responses.TaiTro
{
    /// <summary>
    /// Trang chi tiết một chương trình — GHÉP từ BA SP ở <c>TaiTroService.GetChiTietChuongTrinh</c>:
    /// <list type="bullet">
    /// <item>phần vô hướng = result set 1 của <c>TT_CongKhai_GetChiTietChuongTrinh</c> (SP 02)</item>
    /// <item><see cref="du_kien_chi"/> = result set 2 của SP 02</item>
    /// <item><see cref="nha_tai_tro"/> = <c>TT_CongKhai_GetNhaTaiTroTheoChuongTrinh</c> (SP 03)</item>
    /// <item><see cref="khoan_chi"/> = <c>TT_CongKhai_GetKhoanChiTheoChuongTrinh</c> (SP 04)</item>
    /// </list>
    /// </summary>
    /// <remarks>
    /// 🔴 TÊN PROPERTY VÔ HƯỚNG = TÊN CỘT SP 02, TỪNG CHỮ (xem <see cref="ChuongTrinhTomTatResponse"/>).
    /// Ba danh sách KHÔNG có cột nào trùng tên nên Dapper bỏ qua chúng; service gán sau.
    ///
    /// Nullable theo DDL <c>TT_ChuongTrinh</c>: chỉ <c>anh_bia</c> và <c>anh_qr</c> NULL được.
    /// ⚠️ KHÔNG có <c>muc_tieu</c> — mục tiêu = tổng <see cref="du_kien_chi"/> (quyết định P1).
    /// </remarks>
    public class ChuongTrinhChiTietResponse
    {
        public int id { get; set; }
        public string ten { get; set; } = string.Empty;
        public string phu_de { get; set; } = string.Empty;
        public string loi_keu_goi { get; set; } = string.Empty;
        public string mo_ta_day { get; set; } = string.Empty;
        public string? anh_bia { get; set; }
        public DateTime tu_ngay { get; set; }
        public DateTime den_ngay { get; set; }
        /// <summary>
        /// 1 Đang diễn ra · 2 Đã diễn ra. Không có 0 — thấy 0 là cột không map được.
        /// Metadata SQL báo nullable (mọi CASE đều vậy) nhưng <c>CASE … ELSE 2</c> trên cột NOT NULL không thể null.
        /// </summary>
        public int trang_thai { get; set; }
        public string don_vi_to_chuc { get; set; } = string.Empty;
        public string stk { get; set; } = string.Empty;
        public string ngan_hang { get; set; } = string.Empty;
        public string ten_chu_tai_khoan { get; set; } = string.Empty;
        public string noi_dung_ck { get; set; } = string.Empty;
        public string? anh_qr { get; set; }

        public List<DuKienChiResponse> du_kien_chi { get; set; } = new();
        public List<NhaTaiTroCongKhaiResponse> nha_tai_tro { get; set; } = new();
        public List<KhoanChiResponse> khoan_chi { get; set; } = new();
    }
}
