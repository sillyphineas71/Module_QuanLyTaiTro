namespace ApiQuanLyTaiTro.Services.Email
{
    /// <summary>
    /// Một mail cần gửi trong lô. <see cref="Khoa"/> là thứ để người gọi map NGƯỢC kết quả về
    /// dòng dữ liệu của mình (vd <c>id_tai_khoan</c>) mà không phải dò theo địa chỉ email —
    /// email có thể trùng nhau, khoá thì không.
    /// </summary>
    public class MailCanGui
    {
        public string ToEmail { get; set; } = string.Empty;
        public string Subject { get; set; } = string.Empty;
        public string Body { get; set; } = string.Empty;
        public object? Khoa { get; set; }
    }

    /// <summary>Kết quả của ĐÚNG MỘT mail đã thử gửi.</summary>
    public class KetQuaGuiMotMail
    {
        public MailCanGui Mail { get; set; } = new();
        public bool ThanhCong { get; set; }

        /// <summary>
        /// Lý do lỗi, đã rút gọn cho người đọc. <c>null</c> khi thành công.
        /// 🔴 ĐÂY LÀ THỨ <c>SendEmailAsync</c> CŨ LÀM MẤT: nó <c>catch</c> rồi
        /// <c>Console.WriteLine</c> và chỉ trả <c>false</c>, nên tầng trên không có gì để ghi
        /// vào DB. Không có cột này thì màn "xem lại lần gửi" chỉ nói được "hỏng", không nói
        /// được hỏng vì sao — mà đó mới là thứ Quản lý cần để xử lý.
        /// </summary>
        public string? Loi { get; set; }
    }

    /// <summary>Kết quả cả lô.</summary>
    public class KetQuaGuiHangLoat
    {
        /// <summary>Những mail ĐÃ THỬ gửi, theo đúng thứ tự vào. Dừng sớm thì danh sách ngắn hơn đầu vào.</summary>
        public List<KetQuaGuiMotMail> DaThu { get; set; } = new();

        /// <summary>
        /// <c>true</c> = lô DỪNG GIỮA CHỪNG vì lỗi KẾT NỐI (không phải lỗi của một mail cụ thể).
        /// Phân biệt này quan trọng: lỗi một mail thì bỏ qua và gửi tiếp, lỗi kết nối thì gửi
        /// tiếp là vô nghĩa — mọi mail sau đó cũng sẽ hỏng y hệt.
        /// </summary>
        public bool DungSom { get; set; }

        public string? LyDoDungSom { get; set; }

        /// <summary>Số mail CHƯA hề được thử. Luôn 0 khi <see cref="DungSom"/> là <c>false</c>.</summary>
        public int SoChuaThu { get; set; }

        public int SoThanhCong => DaThu.Count(x => x.ThanhCong);
        public int SoLoi => DaThu.Count(x => !x.ThanhCong);
    }

    public interface IEmailService
    {
        /// <summary>
        /// Gửi MỘT mail — mở kết nối, gửi, đóng kết nối.
        ///
        /// ⚠️ ĐỪNG gọi hàm này trong vòng lặp để gửi nhiều mail. Mỗi lần gọi phải trả giá bắt
        /// tay TCP + TLS + đăng nhập SMTP (~0,5–2 giây với Gmail), nên N mail tốn N lần chi phí
        /// đó. Gửi nhiều thì dùng <see cref="SendManyAsync"/> — nó bắt tay MỘT lần cho cả lô.
        ///
        /// Giữ nguyên chữ ký và hành vi cũ (nuốt lỗi, trả <c>bool</c>) vì hai luồng đang chạy
        /// thật phụ thuộc vào nó: duyệt tài khoản và cấp tài khoản lớp trưởng.
        /// </summary>
        Task<bool> SendEmailAsync(string toEmail, string subject, string body);

        /// <summary>
        /// Gửi NHIỀU mail trên MỘT kết nối: connect 1 lần → authenticate 1 lần → gửi N →
        /// disconnect 1 lần.
        ///
        /// <para><b>Lỗi giữa chừng:</b> lỗi của MỘT mail (địa chỉ sai, người nhận bị từ chối)
        /// thì ghi lại rồi GỬI TIẾP. Lỗi KẾT NỐI thì dừng lô và đặt <see cref="KetQuaGuiHangLoat.DungSom"/>.</para>
        ///
        /// <para><b><paramref name="daGuiXongMotMail"/> — tham số quan trọng nhất:</b> được gọi
        /// NGAY sau mỗi mail, trước khi sang mail kế tiếp. Người gọi ghi kết quả xuống DB trong
        /// callback này thì tiến trình có chết giữa chừng, DB vẫn biết CHÍNH XÁC ai đã nhận.
        /// Đây là cách gỡ đúng cái vấn đề mà <c>TaiKhoanService</c> đang ghi nợ: "trạng thái hỗn
        /// hợp… KHÔNG có gì ghi lại ranh giới đó". Gom kết quả rồi mới ghi một lượt ở cuối là
        /// dựng lại y nguyên vấn đề cũ.</para>
        ///
        /// <para>🔴 <b>Callback trả <c>bool</c> = "có gửi tiếp không".</b> Trả <c>false</c> để
        /// DỪNG lô một cách có trật tự (kết quả đã gom vẫn được trả về đầy đủ).
        /// Đây là đường thoát cho ca <b>ghi DB hỏng</b>: mail đã đi rồi mà dòng ghi lại thất bại,
        /// nghĩa là từ đó trở đi hệ thống đang gửi mù — không còn biết ai đã nhận. Gửi tiếp trong
        /// trạng thái đó tệ hơn gửi thiếu, vì thiếu thì gửi bù được, còn mất dấu vết thì không.
        /// ⚠️ Callback <b>KHÔNG được ném exception</b>: ném thì cả <c>KetQuaGuiHangLoat</c> đã gom
        /// được cũng mất theo. Bắt lỗi bên trong rồi trả <c>false</c>.</para>
        /// </summary>
        Task<KetQuaGuiHangLoat> SendManyAsync(
            IReadOnlyList<MailCanGui> danhSach,
            Func<KetQuaGuiMotMail, Task<bool>>? daGuiXongMotMail = null,
            CancellationToken cancellationToken = default);
    }
}
