

namespace ApiQuanLyTaiTro.Services
{
    /// <summary>
    /// Wrapper gom các service "lõi" dùng chung (không thuộc nghiệp vụ cụ thể) như
    /// JwtToken (đọc thông tin user từ token). Tách khỏi IServiceWrapper (service nghiệp vụ)
    /// để phần hạ tầng và phần nghiệp vụ không lẫn vào nhau.
    /// </summary>
    public interface ICoreServiceWrapper
    {
        IJwtTokenService JwtToken { get; }

    }
}
