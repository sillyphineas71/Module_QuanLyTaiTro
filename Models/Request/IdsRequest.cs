namespace Models.Request.Base
{
    /// <summary>
    /// Bọc danh sách id kiểu int — dùng cho các request thao tác hàng loạt
    /// (ví dụ: xoá nhiều hội thoại, đánh dấu đã đọc nhiều tin...).
    /// </summary>
    public class IdsRequest
    {
        public List<int> ids { get; set; } = new();
    }
}
