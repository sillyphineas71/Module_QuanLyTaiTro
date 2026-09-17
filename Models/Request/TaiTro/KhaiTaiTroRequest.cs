namespace Models.Request.TaiTro
{
    /// <summary>
    /// Phần CHỮ của một lời khai tài trợ (multipart/form-data). Ảnh chuyển khoản đi riêng ở field <c>anh</c>.
    /// </summary>
    /// <remarks>
    /// 🔴 CỐ Ý KHÔNG CÓ các trường sau — thêm vào là mở cửa cho client tự quyết thứ không phải của nó:
    /// <list type="bullet">
    /// <item><c>id_tai_khoan_csv</c> — lấy từ CLAIM JWT ở service. Nhận từ body thì ai cũng gắn lời khai vào tài khoản người khác.</item>
    /// <item><c>trang_thai_duyet</c> — SP ép = 1 (chờ).</item>
    /// <item><c>so_tien</c> — quản trị nhập khi duyệt (P5).</item>
    /// <item><c>id_chuong_trinh</c> — lấy từ ROUTE.</item>
    /// </list>
    /// Mọi trường đều nullable để model binding KHÔNG tự điền giá trị mặc định (0, ngày 01/01/0001) cho
    /// trường thiếu — service kiểm "thiếu" và "sai" theo LOẠI nhà tài trợ, với câu báo lỗi tiếng Việt.
    /// </remarks>
    public class KhaiTaiTroRequest
    {
        /// <summary>1 Cá nhân · 2 Tập thể / Lớp · 3 Doanh nghiệp.</summary>
        public int? loai { get; set; }
        public string? ho_ten_don_vi { get; set; }
        /// <summary>Chỉ cá nhân. Dạng yyyy-MM-dd.</summary>
        public DateTime? ngay_sinh { get; set; }
        public string? ten_he { get; set; }
        public string? ten_khoa { get; set; }
        public string? nien_khoa { get; set; }
        public string? ten_lop { get; set; }
        public string? email_lien_he { get; set; }
        public string? sdt_lien_he { get; set; }
        /// <summary>0 công khai · 1 giấu tên, giữ định danh · 2 giấu tất cả. BẮT BUỘC, không có mặc định.</summary>
        public int? muc_an_danh { get; set; }
    }
}
