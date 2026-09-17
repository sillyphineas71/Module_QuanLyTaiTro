using ApiQuanLyTaiTro.Common;
using ApiQuanLyTaiTro.Middleware;
using ApiQuanLyTaiTro.Repositories;
using ApiQuanLyTaiTro.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.Extensions.FileProviders;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Diagnostics;
using System.Reflection;
using System.Text;

var builder = WebApplication.CreateBuilder(args);
IConfiguration configuration = builder.Configuration;

// ============================================================
// 1. SERVICES REGISTRATION
// ============================================================

// --- HttpContextAccessor ---
// QUAN TRỌNG: Bắt buộc phải đăng ký trước ServiceWrapper
builder.Services.AddSingleton<IHttpContextAccessor, HttpContextAccessor>();

// --- Controllers ---
builder.Services.AddControllers(options =>
{
    // Bật MustLogged filter khi đã implement xác thực JWT
    // options.Filters.Add<MustLogged>();
})
.AddJsonOptions(opts =>
{
    // Giữ nguyên tên field (không camelCase) – chuẩn của hệ thống công ty
    opts.JsonSerializerOptions.PropertyNamingPolicy = null;
});

// --- CORS ---
var corsOrigins = configuration["CorsWithOrigins"]?.Split(',') ?? ["http://localhost:3000"];
builder.Services.AddCors(options =>
{
    options.AddPolicy("ClientPermission", policy =>
    {
        policy.AllowAnyHeader()
              .AllowAnyMethod()
              .WithOrigins(corsOrigins)
              .AllowCredentials()    // Cho phép FE gửi cookie/credential qua CORS
              .WithExposedHeaders("Content-Disposition"); // Cho phép client đọc header khi download file
    });
});

// --- Swagger / OpenAPI ---
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "QuanLyTaiTro API",
        Version = "v1",
        Description = "API cổng Vận động tài trợ – .NET"
    });

    // Nạp mô tả <summary> từ file XML doc (bật bởi GenerateDocumentationFile trong .csproj)
    var xmlFile = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
    if (File.Exists(xmlPath))
        options.IncludeXmlComments(xmlPath);

    // Hỗ trợ nhập JWT token trực tiếp trên Swagger UI
    options.AddSecurityDefinition(JwtBearerDefaults.AuthenticationScheme, new OpenApiSecurityScheme
    {
        Description = "JWT Authorization. Format: \"Bearer {token}\"",
        In = ParameterLocation.Header,
        Name = "Authorization",
        Type = SecuritySchemeType.ApiKey,
        Scheme = JwtBearerDefaults.AuthenticationScheme
    });
    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id   = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// --- JWT Bearer Authentication (verify chữ ký + hạn + issuer/audience) ---
// PHẢI dùng ĐÚNG secret/issuer/audience với lúc sinh token ở JwtTokenService.GenerateToken,
// nếu không mọi token cũ (và token mới sinh ra) sẽ verify fail.
var jwtSecret = configuration["Jwt:Secret"] ?? "SECRET_KEY_FOR_JWT_TOKEN_GENERATION_32_BYTES_MIN";
var jwtIssuer = configuration["Jwt:Issuer"] ?? "QuanLyTaiTroApi";
var jwtAudience = configuration["Jwt:Audience"] ?? "QuanLyTaiTroClient";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
        ValidateIssuer = true,
        ValidIssuer = jwtIssuer,
        ValidateAudience = true,
        ValidAudience = jwtAudience,
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero
    };
});
builder.Services.AddAuthorization();

// --- Bộ nhớ đệm trong tiến trình (lô N1: Tin tức) ---
// Dùng cho danh sách tin tức CÔNG KHAI (TinTucService, TTL 60 giây). Có sẵn trong .NET, KHÔNG
// thêm gói nào.
// ⚠️ IN-PROCESS: chạy nhiều instance thì mỗi instance có cache riêng, và thao tác ghi ở instance
// A không xoá cache của instance B ⇒ B có thể trả bản cũ tới 60 giây. Cổng hiện chạy một
// instance nên chưa thành vấn đề; khi nào scale ngang thì phải đổi sang cache phân tán.
builder.Services.AddMemoryCache();

// --- Trần kích thước tải lên (lô N4: ảnh tin tức) ---
// 🔴 HẠ TỪ MẶC ĐỊNH 128 MB XUỐNG 8 MB. Mặc định của ASP.NET Core cho phép một request multipart
// tới 128 MB; nghĩa là trước lô này, bất kỳ ai gọi được endpoint import Excel đều có thể bắt máy
// chủ đọc 128 MB vào bộ nhớ mỗi request.
//
// ⚠️ 8 MB, KHÔNG phải 2 MB, dù trần ảnh là 2 MB — vì trần này dùng CHUNG cho mọi endpoint nhận
// file, và ExcelController vẫn nhận file .xlsx danh sách lớp. 8 MB là trần của TẦNG VẬN CHUYỂN
// (chặn thứ vô lý); trần 2 MB của ảnh là luật NGHIỆP VỤ, kiểm trong TinTucService và trả về thông
// báo tiếng Việt đọc được.
// Nếu để tầng vận chuyển chặn ở đúng 2 MB thì người dùng tải ảnh 3 MB sẽ nhận một lỗi 413 trống
// trơn thay vì câu "Ảnh vượt quá 2 MB".
builder.Services.Configure<Microsoft.AspNetCore.Http.Features.FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = 8 * 1024 * 1024;
});
builder.WebHost.ConfigureKestrel(options =>
{
    // Kestrel chặn ở tầng thấp hơn FormOptions; thiếu dòng này thì body vẫn được nhận đủ 128 MB
    // rồi mới bị FormOptions từ chối lúc phân tích — tức đã tốn xong băng thông.
    options.Limits.MaxRequestBodySize = 8 * 1024 * 1024;
});

// --- Core services ---
// JwtTokenService không giữ state (chỉ đọc claim từ HttpContext truyền vào)
// → Singleton là an toàn và cho phép exception handler lấy được từ lúc khởi động.
ConfigurationHelper.RepositorysConfig(builder.Services);

// --- Hybrid DI: Repository + Service Wrapper ---
// Scoped: mỗi HTTP request nhận 1 instance riêng → hợp với Lazy Loading + HttpContext lifecycle.
ConfigurationHelper.ServicesConfig(builder.Services);

// --- Forwarded Headers (khi deploy sau reverse proxy Nginx/Apache/IIS) ---
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    // Xoá whitelist để trust tất cả proxy nội bộ
    options.KnownProxies.Clear();
});

// ============================================================
// 2. KHỞI TẠO APP SETTINGS TĨNH
// ============================================================
SerilogConfig.Configure(configuration);
AppSettings.Initialize(configuration);

var app = builder.Build();

// ============================================================
// 3. MIDDLEWARE PIPELINE
// ============================================================

// Phải đặt UseForwardedHeaders TRƯỚC mọi middleware khác
app.UseForwardedHeaders();

// Exception handler đặt ngoài cùng để bắt lỗi của mọi middleware/controller phía sau,
// trả về JSON lỗi thống nhất.
app.ConfigureExceptionHandler(app.Services.GetRequiredService<IJwtTokenService>());

// Ghi log request/response ra file (bật/tắt qua "EnableRequestLog" trong appsettings).
app.UseMiddleware<RequestLoggingMiddleware>();

// Swagger chỉ expose ở môi trường dev
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "QuanLyTaiTro API V1"));
}

// Serve file tĩnh từ Assets/Template (ví dụ: template Word/Excel)
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(
        Path.Combine(app.Environment.ContentRootPath, "Assets", "Template")),
    RequestPath = "/Assets/Template"
});

// Serve file tĩnh từ Assets/Upload (ảnh, tài liệu upload)
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(
        Path.Combine(app.Environment.ContentRootPath, "Assets", "Upload")),
    RequestPath = "/Assets/Upload"
});

app.UseHttpsRedirection();
app.UseRouting();

// UseCors PHẢI đặt sau UseRouting và trước UseAuthentication
app.UseCors("ClientPermission");

app.UseAuthentication();
app.UseAuthorization();

// ============================================================
// 4. ENDPOINT MAPPING
// ============================================================

// Map tất cả API Controllers
app.MapControllers();

// Vào "/" thì nhảy thẳng sang Swagger UI (chỉ ở Development).
if (app.Environment.IsDevelopment())
{
    app.MapGet("/", () => Results.Redirect("/swagger")).ExcludeFromDescription();

    // Tự mở trình duyệt vào Swagger khi app khởi động xong.
    // `dotnet run` KHÔNG đọc "launchBrowser" của launchSettings.json (chỉ IDE dùng field đó),
    // nên phải tự mở ở đây.
    app.Lifetime.ApplicationStarted.Register(() =>
    {
        var url = app.Urls.FirstOrDefault(u => u.StartsWith("https://"))
                  ?? app.Urls.FirstOrDefault();
        if (string.IsNullOrEmpty(url)) return;
        try
        {
            Process.Start(new ProcessStartInfo($"{url}/swagger") { UseShellExecute = true });
        }
        catch
        {
            // Không mở được trình duyệt (máy build/CI, không có shell...) thì bỏ qua,
            // tuyệt đối không làm chết app.
        }
    });
}

try
{
    app.Run();
}
finally
{
    // Đảm bảo ghi nốt log còn trong buffer khi app tắt.
    Serilog.Log.CloseAndFlush();
}
