namespace ApiQuanLyTaiTro.Common
{
    /// <summary>
    /// Các hàm tiện ích xử lý họ tên tiếng Việt — dùng để hiển thị tên cựu sinh viên,
    /// tạo chữ cái avatar, và sắp xếp danh sách theo tên.
    /// </summary>
    public static class AppCommon
    {
        /// <summary>
        /// Ví dụ: "Nguyễn Văn An" -> "An"
        /// </summary>
        public static string GetName(string? hoTen)
        {
            if (string.IsNullOrWhiteSpace(hoTen))
                return string.Empty;

            var parts = hoTen.Trim().Split(new[] { ' ' }, StringSplitOptions.RemoveEmptyEntries);
            if (parts.Length == 0)
                return string.Empty;

            // Trả về từ cuối cùng (tên)
            return parts[parts.Length - 1];
        }

        /// <summary>
        /// Ví dụ: "Nguyễn Văn An" -> "A"
        /// </summary>
        public static string GetFirstCharacterOfName(string? hoTen)
        {
            var ten = GetName(hoTen);
            return string.IsNullOrEmpty(ten) ? string.Empty : ten.Substring(0, 1).ToUpper();
        }

        /// <summary>
        /// Lấy họ đệm từ họ tên đầy đủ (bỏ tên cuối cùng)
        /// Ví dụ: "Nguyễn Văn An" -> "Nguyễn Văn"
        /// </summary>
        public static string GetHoDem(string? hoTen)
        {
            if (string.IsNullOrWhiteSpace(hoTen))
                return string.Empty;

            // Chuẩn hóa: Trim và loại bỏ khoảng trắng thừa
            var normalized = hoTen.Trim();
            var parts = normalized.Split(new[] { ' ' }, StringSplitOptions.RemoveEmptyEntries);

            if (parts.Length == 0)
                return string.Empty;

            if (parts.Length == 1)
                return string.Empty; // Chỉ có 1 từ thì không có họ đệm

            // Lấy tất cả các từ trừ từ cuối cùng (tên)
            return string.Join(" ", parts.Take(parts.Length - 1));
        }

        /// <summary>
        /// Chuyển đổi tên tiếng Việt có dấu sang không dấu (Latin)
        /// Ví dụ: "Nguyễn Văn An" -> "Nguyen Van An"
        /// Tương tự hàm KhongDau trong SQL Server
        /// </summary>
        public static string ConvertNameToEnglish(string? vietnameseName)
        {
            if (string.IsNullOrWhiteSpace(vietnameseName))
                return string.Empty;

            // Chuỗi ký tự có dấu và không dấu tương ứng (giống hàm SQL KhongDau)
            const string SIGN_CHARS = "ăâđêôơưàảãạáằẳẵặắầẩẫậấèẻẽẹéềểễệếìỉĩịíòỏõọóồổỗộốờởỡợớùủũụúừửữựứỳỷỹỵýĂÂĐÊÔƠƯÀẢÃẠÁẰẲẴẶẮẦẨẪẬẤÈẺẼẸÉỀỂỄỆẾÌỈĨỊÍÒỎÕỌÓỒỔỖỘỐỜỞỠỢỚÙỦŨỤÚỪỬỮỰỨỲỶỸỴÝđĐ";
            const string UNSIGN_CHARS = "aadeoouaaaaaaaaaaaaaaaeeeeeeeeeeiiiiiooooooooooooooouuuuuuuuuuyyyyyAADEOOUAAAAAAAAAAAAAAAEEEEEEEEEEIIIIIOOOOOOOOOOOOOOOUUUUUUUUUUYYYYYdD";

            var result = new System.Text.StringBuilder(vietnameseName.Length);

            foreach (char c in vietnameseName)
            {
                int index = SIGN_CHARS.IndexOf(c);
                if (index >= 0 && index < UNSIGN_CHARS.Length)
                {
                    result.Append(UNSIGN_CHARS[index]);
                }
                else
                {
                    result.Append(c);
                }
            }

            return result.ToString().Trim();
        }


    }
}
