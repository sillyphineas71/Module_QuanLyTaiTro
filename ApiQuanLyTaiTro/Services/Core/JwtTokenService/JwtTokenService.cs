using ApiQuanLyTaiTro.Common;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using Microsoft.Net.Http.Headers;
using Models.Base;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace ApiQuanLyTaiTro.Services
{
    /// <summary>
    /// Triển khai IJwtTokenService.
    /// Đọc & Sinh thông tin người dùng qua JWT token.
    /// </summary>
    public class JwtTokenService : IJwtTokenService
    {
        private readonly IConfiguration _configuration;

        public JwtTokenService(IServiceProvider serviceProvider)
        {
            _configuration = serviceProvider.GetRequiredService<IConfiguration>();
        }

        // 🔴 ĐÃ GỠ overload `GenerateToken(CSV_TaiKhoan)` — xem ghi chú ở IJwtTokenService.cs.

        public string GenerateToken(string userId, string userName, string role, IDictionary<string, string>? extraClaims = null)
        {
            var secret = _configuration["Jwt:Secret"] ?? "SECRET_KEY_FOR_JWT_TOKEN_GENERATION_32_BYTES_MIN";
            var issuer = _configuration["Jwt:Issuer"] ?? "QuanLyTaiTroApi";
            var audience = _configuration["Jwt:Audience"] ?? "QuanLyTaiTroClient";
            var expiryMinutes = int.TryParse(_configuration["Jwt:ExpiryMinutes"], out int exp) ? exp : 60;

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claimsList = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Sub, userId),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new Claim(ClaimTypes.NameIdentifier, userId),
                new Claim(ClaimTypes.Name, userName),
                new Claim(ClaimTypes.Role, role)
            };

            if (extraClaims != null)
            {
                foreach (var kvp in extraClaims)
                {
                    claimsList.Add(new Claim(kvp.Key, kvp.Value));
                }
            }

            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claimsList,
                expires: DateTime.Now.AddMinutes(expiryMinutes),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        public void SetModifyInfo(HttpContext httpContext, ModifyInfo info)
        {
            try
            {
                var userId = GetUserID(httpContext);
                if (string.IsNullOrEmpty(userId)) return;

                info.created_user_id = userId;
                info.last_modified_user_id = userId;
                info.created_time = DateTime.Now;
                info.last_modified_times = DateTime.Now;
            }
            catch { /* Silently ignore */ }
        }

        // LƯU Ý: đọc từ HttpContext.User (đã được AddJwtBearer verify chữ ký/hạn/issuer/audience),
        // KHÔNG tự parse token thủ công nữa. Tên claim PHẢI khớp với lúc GenerateToken() sinh ra.
        public string GetUserName(HttpContext httpContext)
        {
            try
            {
                return httpContext?.User?.FindFirst(ClaimTypes.Name)?.Value ?? "";
            }
            catch { return ""; }
        }

        public string GetUserID(HttpContext httpContext)
        {
            try
            {
                return httpContext?.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "";
            }
            catch { return ""; }
        }

        public string GetIP(HttpContext httpContext)
        {
            try
            {
                return httpContext?.Connection?.RemoteIpAddress?.ToString() ?? "";
            }
            catch { return ""; }
        }

        public string GetUserToken(HttpContext httpContext)
        {
            try
            {
                var auth = httpContext.Request.Headers[HeaderNames.Authorization]
                                              .ConvertToString()
                                              .Replace("Bearer ", "");
                return auth;
            }
            catch { return ""; }
        }
    }
}
