namespace Models.Request.Base
{
    /// <summary>
    /// Bọc danh sách id kiểu string — dùng khi khóa là GUID/nvarchar
    /// (ví dụ: danh sách id_sv nvarchar(50), id_cb nvarchar(36)).
    /// </summary>
    public class StrIdsRequest
    {
        public List<string> ids { get; set; } = new();
    }
}
