using System.Text;

namespace ApiQuanLyTaiTro.Common
{
    /// <summary>
    /// Chuẩn hoá và kiểm định dạng SĐT dùng chung cho các luồng ghi dữ liệu cổng.
    /// Chỉ chuẩn hoá định dạng chắc chắn vô nghĩa; không bao giờ đoán ý người dùng.
    /// </summary>
    public static class PhoneValidation
    {
        /// <summary>
        /// Ký tự phân cách được phép trong số điện thoại người ta hay gõ. Bỏ những ký tự này là
        /// chuẩn hoá định dạng, không làm thay đổi ý người viết.
        /// </summary>
        private const string PhoneSeparators = " .-()";

        /// <summary>
        /// Chuẩn hoá số điện thoại: bỏ các ký tự phân cách ở <see cref="PhoneSeparators"/>,
        /// "+84"/"84" đầu số -> "0". LƯU VÀO DB LÀ GIÁ TRỊ ĐÃ CHUẨN HOÁ.
        ///
        /// RANH GIỚI QUAN TRỌNG: CHUẨN HOÁ ĐỊNH DẠNG thì được, ĐOÁN Ý NGƯỜI DÙNG thì KHÔNG.
        /// Vì vậy hàm này KHÔNG lọc bỏ chữ cái hay ký tự lạ - nó GIỮ NGUYÊN để
        /// IsValidNormalizedPhone bắt thành dòng lỗi. Bản trước lọc sạch mọi thứ không phải
        /// chữ số, dẫn tới:
        ///   "0912345678 (nhà riêng)"        -> âm thầm thành 0912345678
        ///   "0912345678 hoặc 0987654321"    -> âm thầm LƯU SỐ ĐẦU, VỨT SỐ SAU
        /// Cả hai đều không báo cho ai. Sự im lặng đó mới là vấn đề, không phải sự dễ dãi.
        /// Nay cả hai ca đều thành dòng lỗi để lớp trưởng tự quyết định giữ số nào.
        /// </summary>
        public static string NormalizePhone(string? raw)
        {
            if (string.IsNullOrWhiteSpace(raw)) return string.Empty;

            var sb = new StringBuilder(raw.Length);
            foreach (char c in raw)
            {
                if (PhoneSeparators.IndexOf(c) >= 0) continue;
                sb.Append(c);
            }
            string phone = sb.ToString();

            if (phone.StartsWith("+84")) phone = "0" + phone.Substring(3);
            else if (phone.StartsWith("84") && phone.Length >= 11) phone = "0" + phone.Substring(2);

            return phone;
        }

        /// <summary>
        /// Kiểm SĐT đã chuẩn hoá: chỉ chữ số, dài 9–11. Cố ý không kiểm đầu số nhà mạng vì danh
        /// sách thay đổi theo thời gian; hard-code sẽ từ chối oan số hợp lệ trong tương lai.
        /// </summary>
        public static bool IsValidNormalizedPhone(string normalized)
        {
            if (normalized.Length < 9 || normalized.Length > 11) return false;
            foreach (char c in normalized)
            {
                if (!char.IsDigit(c)) return false;
            }
            return true;
        }

        /// <summary>
        /// CẢNH BÁO (không phải loại bỏ) cho số ĐÃ HỢP LỆ nhưng có hình dạng đáng ngờ.
        /// Trả về câu cảnh báo, hoặc null nếu không có gì đáng nói.
        ///
        /// 🔴 ĐÂY LÀ KIỂM HÌNH DẠNG, KHÔNG PHẢI KIỂM ĐẦU SỐ NHÀ MẠNG — phân biệt này quan trọng:
        /// B1 cố ý KHÔNG kiểm đầu số nhà mạng ("danh sách thay đổi theo thời gian; hard-code sẽ từ
        /// chối oan số hợp lệ trong tương lai"), và quyết định đó VẪN NGUYÊN. Ở đây không hỏi
        /// "096 hay 034 có phải Viettel không" - chỉ hỏi "số này có bắt đầu bằng 0 không", một
        /// tính chất đúng với MỌI số điện thoại Việt Nam, không phụ thuộc nhà mạng nào và không
        /// bao giờ lỗi thời. <see cref="NormalizePhone"/> đã đưa "+84"/"84" về "0" trước đó, nên
        /// số quốc tế viết đúng cũng không rơi vào đây.
        ///
        /// VÌ SAO CẦN: số mất chữ số đầu (vd "819666088" - 9 chữ số) VẪN QUA
        /// <see cref="IsValidNormalizedPhone"/> vì luật chỉ đòi 9-11 chữ số. Không có cảnh báo thì
        /// nó vào thẳng DB mà không ai biết.
        ///
        /// VÌ SAO KHÔNG LOẠI BỎ: ta không chắc chắn 100% - có thể là số nước ngoài, có thể là quy
        /// ước nội bộ nào đó. Ranh giới của cả file này là: chuẩn hoá định dạng thì được, ĐOÁN Ý
        /// NGƯỜI DÙNG thì không. Loại bỏ là đoán; cảnh báo là đưa cho người ta tự quyết.
        /// </summary>
        public static string? CanhBaoHinhDangSo(string? normalized)
        {
            if (string.IsNullOrWhiteSpace(normalized)) return null;
            // Chỉ cảnh báo cho số ĐÃ hợp lệ. Số không hợp lệ đã thành dòng lỗi, cảnh báo thêm
            // chỉ làm nhiễu.
            if (!IsValidNormalizedPhone(normalized)) return null;
            if (normalized.StartsWith("0")) return null;

            return "Số điện thoại không bắt đầu bằng 0 - có thể đã mất chữ số đầu. Vui lòng kiểm tra lại.";
        }
    }
}
