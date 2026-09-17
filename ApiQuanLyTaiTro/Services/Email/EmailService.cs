using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Configuration;
using MimeKit;
using MimeKit.Text;

namespace ApiQuanLyTaiTro.Services.Email
{
    public class EmailService : IEmailService
    {
        private readonly IConfiguration _configuration;

        /// <summary>
        /// Sau bao nhiêu mail thì ĐÓNG kết nối và mở lại giữa lô.
        ///
        /// ⚠️ ĐÂY LÀ NGƯỠNG AN TOÀN, KHÔNG PHẢI SỐ ĐO. Chưa kiểm được trên SMTP thật (môi trường
        /// dev không có đường ra SMTP). Nhiều nhà cung cấp — Gmail nằm trong số đó — giới hạn số
        /// mail mỗi PHIÊN và tự ngắt kết nối sống quá lâu; bị ngắt giữa chừng thì những mail còn
        /// lại hỏng hàng loạt mà nhìn như lỗi ngẫu nhiên.
        ///
        /// Chọn 100 vì nó bằng đúng trần một lô mà lead đã chốt cho module gửi hàng loạt (và
        /// bằng <c>TaiKhoanService.MAX_TAI_KHOAN_MOI_LAN_DUYET</c>) ⇒ trong THỰC TẾ một lô chỉ
        /// dùng một kết nối, nhánh nối lại gần như không chạy. Nó ở đây làm lưới an toàn cho
        /// ngày trần lô được nâng, chứ không phải để chạy thường xuyên.
        ///
        /// Đo được rồi thì chỉnh con số này — và ghi số đo vào docs, đừng chỉnh mò.
        /// </summary>
        public const int SO_MAIL_TOI_DA_MOI_KET_NOI = 100;

        /// <summary>
        /// Bao nhiêu mail LIÊN TIẾP cùng thất bại thì coi là hỏng kết nối và DỪNG lô.
        ///
        /// ⚠️ ĐÂY LÀ HEURISTIC, KHÔNG PHẢI PHÂN LOẠI ĐÚNG. Nó KHÔNG thay thế việc kiểm mã lỗi
        /// thật của nhà cung cấp (ca kiểm 6 ở docs 115.5) — nó chỉ là lưới hứng bên dưới, cho
        /// những ca mà <see cref="LaLoiCuaRiengMotMail"/> phân loại SAI.
        ///
        /// Ca nó sinh ra để hứng: Gmail chặn vì vượt trần ngày và trả mã 5xx TRÔNG NHƯ "một
        /// người nhận bị từ chối". Không có lưới này thì hệ thống cần mẫn gửi tiếp 99 mail vào
        /// một kết nối đã bị chặn — vừa ghi sai 99 dòng lịch sử, vừa **ĐỐT THÊM HẠN MỨC CỦA
        /// NGÀY HÔM SAU** và có thể kéo dài thời gian bị khoá. Hệ quả thứ hai mới là nặng.
        ///
        /// Vì sao "LIÊN TIẾP" chứ không phải "tổng số": một lô có vài địa chỉ hỏng rải rác là
        /// bình thường (hộp thư đầy, hộp thư đã xoá). 5 cái LIỀN NHAU thì không phải trùng hợp.
        ///
        /// Vì sao 5 chứ không phải 10: mọi người nhận của cổng này đều ĐÃ ĐĂNG NHẬP ĐƯỢC bằng
        /// chính địa chỉ đó (lead chốt: chỉ gửi cho người có tài khoản), nên địa chỉ rác gần như
        /// không có — lỗi lẻ chỉ đến từ nguyên nhân lẻ tẻ, và 5 cái liền nhau đã là rất khó xảy
        /// ra. Đổi lại, mỗi lần đoán nhầm chỉ phí 5 mail thay vì 10. Với trần lô 100 thì 5 = 5%.
        /// </summary>
        public const int SO_LOI_LIEN_TIEP_TOI_DA = 5;

        public EmailService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        /// <summary>Cấu hình SMTP đọc từ <c>EmailSettings</c>. <c>HopLe</c> = đủ Host và Email.</summary>
        private sealed class CauHinhSmtp
        {
            public string? Host { get; init; }
            public int Port { get; init; }
            public string? FromEmail { get; init; }
            public string? Password { get; init; }
            public bool HopLe => !string.IsNullOrWhiteSpace(Host) && !string.IsNullOrWhiteSpace(FromEmail);
        }

        private CauHinhSmtp DocCauHinh()
        {
            var portStr = _configuration["EmailSettings:Port"];
            int port = 587;
            if (!string.IsNullOrWhiteSpace(portStr))
            {
                int.TryParse(portStr, out port);
            }
            return new CauHinhSmtp
            {
                Host = _configuration["EmailSettings:Host"],
                Port = port,
                FromEmail = _configuration["EmailSettings:Email"],
                Password = _configuration["EmailSettings:Password"],
            };
        }

        private static MimeMessage DungMail(CauHinhSmtp cauHinh, string toEmail, string subject, string body)
        {
            var emailMessage = new MimeMessage();
            emailMessage.From.Add(new MailboxAddress("Cổng Cựu Sinh Viên", cauHinh.FromEmail));
            emailMessage.To.Add(MailboxAddress.Parse(toEmail));
            emailMessage.Subject = subject;
            emailMessage.Body = new TextPart(TextFormat.Html) { Text = body };
            return emailMessage;
        }

        /// <summary>
        /// GIỮ NGUYÊN HÀNH VI CŨ — đừng "tối ưu" hàm này.
        ///
        /// Hai luồng đang chạy thật phụ thuộc vào nó: duyệt tài khoản (<c>TaiKhoanService</c>) và
        /// cấp tài khoản lớp trưởng (<c>CapTaiKhoanService</c>). Nó vẫn mở/đóng kết nối mỗi lần
        /// gọi, vẫn nuốt mọi lỗi và trả <c>bool</c>, vẫn ghi <c>Console</c> đúng câu cũ.
        ///
        /// Lô M1 chỉ rút hai việc THUẦN ra thành helper dùng chung (<see cref="DocCauHinh"/> và
        /// <see cref="DungMail"/>) — không đổi thứ tự thao tác, không đổi giá trị trả về, không
        /// đổi câu log. Phần điều phối connect/send/disconnect vẫn nằm nguyên tại đây, KHÔNG
        /// gọi vòng qua <see cref="SendManyAsync"/>: hai luồng kia đang chạy được, nên chúng
        /// không được phụ thuộc vào mã mới chưa ai kiểm trên SMTP thật.
        /// </summary>
        public async Task<bool> SendEmailAsync(string toEmail, string subject, string body)
        {
            try
            {
                var cauHinh = DocCauHinh();
                if (!cauHinh.HopLe)
                {
                    Console.WriteLine($"[Lỗi Email] Cấu hình EmailSettings chưa hợp lệ (Host/Email rỗng). Không thể gửi tới {toEmail}");
                    return false;
                }

                var emailMessage = DungMail(cauHinh, toEmail, subject, body);

                using var smtp = new SmtpClient();
                await smtp.ConnectAsync(cauHinh.Host, cauHinh.Port, SecureSocketOptions.Auto);

                if (!string.IsNullOrWhiteSpace(cauHinh.Password))
                {
                    await smtp.AuthenticateAsync(cauHinh.FromEmail, cauHinh.Password);
                }

                await smtp.SendAsync(emailMessage);
                await smtp.DisconnectAsync(true);
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Lỗi Email] Không thể gửi tới {toEmail}: {ex.Message}");
                return false;
            }
        }

        public async Task<KetQuaGuiHangLoat> SendManyAsync(
            IReadOnlyList<MailCanGui> danhSach,
            Func<KetQuaGuiMotMail, Task<bool>>? daGuiXongMotMail = null,
            CancellationToken cancellationToken = default)
        {
            var ketQua = new KetQuaGuiHangLoat();
            if (danhSach == null || danhSach.Count == 0) return ketQua;

            var cauHinh = DocCauHinh();
            if (!cauHinh.HopLe)
            {
                // Chưa gửi được cái nào, và lý do là CẤU HÌNH chứ không phải mail nào hỏng.
                // Trả về dạng "dừng sớm với 0 mail đã thử" để tầng trên phân biệt được với
                // "đã gửi hết, tất cả đều lỗi" - hai thứ đó cần hai thông điệp khác nhau.
                ketQua.DungSom = true;
                ketQua.LyDoDungSom = "Cấu hình EmailSettings chưa hợp lệ (Host/Email rỗng).";
                ketQua.SoChuaThu = danhSach.Count;
                return ketQua;
            }

            SmtpClient? smtp = null;
            int soMailTrenKetNoiHienTai = 0;
            // Đếm LIÊN TIẾP: reset về 0 mỗi lần có một mail đi được.
            int soLoiLienTiep = 0;

            try
            {
                for (int i = 0; i < danhSach.Count; i++)
                {
                    cancellationToken.ThrowIfCancellationRequested();
                    var mail = danhSach[i];

                    // ─── Mở kết nối: lần đầu, hoặc nối lại sau ngưỡng, hoặc khi rớt ───
                    if (smtp == null || !smtp.IsConnected || soMailTrenKetNoiHienTai >= SO_MAIL_TOI_DA_MOI_KET_NOI)
                    {
                        try
                        {
                            if (smtp != null)
                            {
                                // Đóng tử tế rồi mới bỏ. Lỗi lúc đóng KHÔNG được làm hỏng cả lô -
                                // kết nối cũ dù sao cũng sắp bị thay.
                                try { if (smtp.IsConnected) await smtp.DisconnectAsync(true, cancellationToken); }
                                catch { /* bỏ qua có chủ đích */ }
                                smtp.Dispose();
                                smtp = null;
                            }

                            smtp = new SmtpClient();
                            await smtp.ConnectAsync(cauHinh.Host, cauHinh.Port, SecureSocketOptions.Auto, cancellationToken);
                            if (!string.IsNullOrWhiteSpace(cauHinh.Password))
                            {
                                await smtp.AuthenticateAsync(cauHinh.FromEmail, cauHinh.Password, cancellationToken);
                            }
                            soMailTrenKetNoiHienTai = 0;
                        }
                        catch (Exception ex)
                        {
                            // Không nối được = mọi mail còn lại cũng hỏng y hệt. Dừng, và nói rõ
                            // còn bao nhiêu cái CHƯA THỬ để tầng trên không ghi nhầm chúng là "lỗi".
                            ketQua.DungSom = true;
                            ketQua.LyDoDungSom = $"Không kết nối được máy chủ mail: {ex.Message}";
                            ketQua.SoChuaThu = danhSach.Count - i;
                            return ketQua;
                        }
                    }

                    // ─── Gửi một mail ───
                    var motKetQua = new KetQuaGuiMotMail { Mail = mail };
                    try
                    {
                        var mimeMessage = DungMail(cauHinh, mail.ToEmail, mail.Subject, mail.Body);
                        await smtp.SendAsync(mimeMessage, cancellationToken);
                        motKetQua.ThanhCong = true;
                        soMailTrenKetNoiHienTai++;
                        soLoiLienTiep = 0;
                    }
                    catch (Exception ex) when (LaLoiCuaRiengMotMail(ex))
                    {
                        // Lỗi của RIÊNG mail này (địa chỉ sai định dạng, người nhận bị từ chối...).
                        // Kết nối vẫn sống ⇒ ghi lại rồi GỬI TIẾP. Dừng cả lô ở đây nghĩa là những
                        // người phía sau không nhận được mà cũng không ai biết vì sao.
                        motKetQua.ThanhCong = false;
                        motKetQua.Loi = RutGonLoi(ex);
                        soMailTrenKetNoiHienTai++;
                        soLoiLienTiep++;
                    }
                    catch (OperationCanceledException)
                    {
                        throw;
                    }
                    catch (Exception ex)
                    {
                        // Còn lại coi là LỖI KẾT NỐI. Mail này tính là đã thử và thất bại (nó có
                        // thể đã đi một phần), rồi dừng lô.
                        motKetQua.ThanhCong = false;
                        motKetQua.Loi = RutGonLoi(ex);
                        ketQua.DaThu.Add(motKetQua);
                        // Bỏ qua giá trị trả về: đằng nào cũng dừng ngay dưới đây.
                        if (daGuiXongMotMail != null) await daGuiXongMotMail(motKetQua);

                        ketQua.DungSom = true;
                        ketQua.LyDoDungSom = $"Mất kết nối tới máy chủ mail: {ex.Message}";
                        ketQua.SoChuaThu = danhSach.Count - i - 1;
                        return ketQua;
                    }

                    ketQua.DaThu.Add(motKetQua);

                    // Gọi NGAY, trước khi sang mail kế tiếp. Đây là chỗ tầng trên ghi DB để
                    // tiến trình chết giữa chừng vẫn còn ranh giới "ai đã nhận".
                    if (daGuiXongMotMail != null && !await daGuiXongMotMail(motKetQua))
                    {
                        // Người gọi bảo dừng - gần như chắc chắn là ghi DB hỏng. Từ đây trở đi
                        // hệ thống sẽ gửi MÙ (mail đi mà không ghi lại được ai đã nhận), nên dừng
                        // là lựa chọn đúng: gửi thiếu thì bù được, mất dấu vết thì không.
                        ketQua.DungSom = true;
                        ketQua.LyDoDungSom = "Dừng lô theo yêu cầu của tầng gọi sau khi gửi tới "
                            + $"{motKetQua.Mail.ToEmail} - nhiều khả năng không ghi được kết quả xuống CSDL. "
                            + "Mail cho những người còn lại CHƯA được gửi.";
                        ketQua.SoChuaThu = danhSach.Count - i - 1;
                        return ketQua;
                    }

                    // LƯỚI AN TOÀN (xem SO_LOI_LIEN_TIEP_TOI_DA). Đặt SAU khi đã ghi kết quả và
                    // đã gọi callback: mail thứ N vẫn phải được ghi nhận là đã thử và đã lỗi,
                    // chỉ những mail SAU nó mới là "chưa thử".
                    if (soLoiLienTiep >= SO_LOI_LIEN_TIEP_TOI_DA)
                    {
                        ketQua.DungSom = true;
                        ketQua.LyDoDungSom = $"Dừng lô vì {soLoiLienTiep} mail liên tiếp đều thất bại - "
                            + "nhiều khả năng máy chủ mail đang chặn (vượt hạn mức gửi?) chứ không phải "
                            + "do từng địa chỉ. Gửi tiếp chỉ đốt thêm hạn mức. Xem lý do lỗi của các dòng cuối.";
                        ketQua.SoChuaThu = danhSach.Count - i - 1;
                        return ketQua;
                    }
                }

                return ketQua;
            }
            finally
            {
                if (smtp != null)
                {
                    try { if (smtp.IsConnected) await smtp.DisconnectAsync(true, CancellationToken.None); }
                    catch { /* đóng kết nối hỏng không được che mất kết quả đã gom */ }
                    smtp.Dispose();
                }
            }
        }

        /// <summary>
        /// Lỗi này là của RIÊNG một mail (gửi tiếp được), hay của KẾT NỐI (gửi tiếp vô nghĩa)?
        ///
        /// - <c>SmtpCommandException</c> với mã <c>RecipientNotAccepted</c> / <c>SenderNotAccepted</c>
        ///   / <c>MessageNotAccepted</c>: máy chủ từ chối CHÍNH mail này, kết nối vẫn dùng được.
        /// - <c>ParseException</c> / <c>FormatException</c>: địa chỉ sai định dạng, hỏng ngay từ
        ///   lúc dựng mail, chưa chạm tới máy chủ.
        /// - Mọi thứ khác (<c>SmtpProtocolException</c>, <c>IOException</c>, socket, chưa
        ///   authenticate…): coi là hỏng kết nối ⇒ dừng lô.
        ///
        /// ⚠️ Phân loại này dựa trên tài liệu MailKit, CHƯA kiểm được trên SMTP thật. Ca đáng ngờ
        /// nhất là Gmail chặn vì vượt trần ngày — nó trả mã 5xx trông như "một mail bị từ chối",
        /// nhưng thực chất mọi mail sau đó cũng sẽ hỏng. Khi QA được, xem lại nhánh này trước.
        /// </summary>
        private static bool LaLoiCuaRiengMotMail(Exception ex)
        {
            if (ex is SmtpCommandException cmd)
            {
                return cmd.ErrorCode == SmtpErrorCode.RecipientNotAccepted
                    || cmd.ErrorCode == SmtpErrorCode.SenderNotAccepted
                    || cmd.ErrorCode == SmtpErrorCode.MessageNotAccepted;
            }
            return ex is ParseException || ex is FormatException;
        }

        /// <summary>Câu lỗi ngắn, đủ cho người đọc và đủ ngắn để nhét vào một cột DB.</summary>
        private static string RutGonLoi(Exception ex)
        {
            var message = ex.Message?.Trim();
            if (string.IsNullOrWhiteSpace(message)) message = ex.GetType().Name;
            const int MAX = 500;
            return message!.Length <= MAX ? message : message.Substring(0, MAX);
        }
    }
}
