namespace ApiQuanLyTaiTro.Filters
{
    /// <summary>
    /// Attribute đánh dấu 1 Action/Controller "LUÔN ghi log", kể cả khi request
    /// chạy nhanh và thành công (mặc định các Action Select nhanh sẽ bị bỏ qua log).
    /// Đặt [ForceLogging] lên method/class cần theo dõi kỹ. Xử lý ở RequestLoggingMiddleware.
    /// </summary>
    [AttributeUsage(AttributeTargets.Method | AttributeTargets.Class, AllowMultiple = false)]
    public class ForceLogging : Attribute
    {
    }
}
