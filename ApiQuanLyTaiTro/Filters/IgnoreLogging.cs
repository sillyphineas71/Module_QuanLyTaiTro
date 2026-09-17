namespace ApiQuanLyTaiTro.Filters
{
    /// <summary>
    /// Attribute đánh dấu 1 Action/Controller "KHÔNG ghi log request" (ngược với ForceLogging).
    /// Dùng cho endpoint gọi rất nhiều / không cần theo dõi. Xử lý ở RequestLoggingMiddleware.
    /// </summary>
    [AttributeUsage(AttributeTargets.Method | AttributeTargets.Class, AllowMultiple = false)]
    public class IgnoreLogging : Attribute
    {
    }
}
