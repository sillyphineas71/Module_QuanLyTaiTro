using System.Data;
using Serilog;
// Serilog.Sinks.MSSqlServer chưa được cài. Uncommment khi thêm package Serilog.Sinks.MSSqlServer.
// using Serilog.Sinks.MSSqlServer;

namespace ApiQuanLyTaiTro.Middleware
{
    /// <summary>
    /// Cấu hình Serilog cho toàn app (gọi 1 lần ở Program.cs qua SerilogConfig.Configure).
    /// Hiện ghi log ra file trong thư mục /log (xoay vòng theo ngày, giữ 30 ngày).
    /// Cờ IsEnabled đọc từ "EnableRequestLog" — RequestLoggingMiddleware dựa vào cờ này.
    /// (Phần ghi log vào SQL Server đang tạm tắt vì chưa cài package Serilog.Sinks.MSSqlServer.)
    /// </summary>
    public static class SerilogConfig
    {
        public static bool IsEnabled { get; private set; }

        public static void Configure(IConfiguration configuration)
        {
            // Mac dinh = true (bat). Chi tat khi can (local dev)
            IsEnabled = configuration.GetValue<bool>("EnableRequestLog", true);
            if (!IsEnabled)
                return;

            // Bat SelfLog de debug loi Serilog (tam thoi)
            //var selfLogPath = Path.Combine(AppContext.BaseDirectory, "serilog_selflog.txt");
            //SelfLog.Enable(msg => File.AppendAllText(selfLogPath, msg + Environment.NewLine));

            // Serilog.Sinks.MSSqlServer dung Microsoft.Data.SqlClient (mac dinh Encrypt=true)
            // trong khi project dung System.Data.SqlClient (mac dinh Encrypt=false)
            // => can them TrustServerCertificate=true de tranh loi SSL
            var connectionString = configuration.GetConnectionString("DefaultConnection");
            if (!connectionString.Contains("TrustServerCertificate", StringComparison.OrdinalIgnoreCase))
                connectionString += ";TrustServerCertificate=true";



            // SQL Sink tạm thời bị comment do Serilog.Sinks.MSSqlServer chưa được cài.
            // Fallback: ghi log ra file.
            Log.Logger = new LoggerConfiguration()
                .MinimumLevel.Information()
                .WriteTo.File(
                    path: Path.Combine(AppContext.BaseDirectory, "log", "request_.log"),
                    rollingInterval: RollingInterval.Day,
                    retainedFileCountLimit: 30)
                .CreateLogger();

            // ── Kết nối SQL (uncommment khi có Serilog.Sinks.MSSqlServer) ────────────────
            //var columnOptions = new ColumnOptions();
            //columnOptions.Store.Remove(StandardColumn.Id);
            //... (cài đặt cột custom tương tự ApiMarkMan)
            //var sinkOptions = new MSSqlServerSinkOptions { TableName = "COVAN_RequestLogs" };
            //Log.Logger = new LoggerConfiguration()
            //    .MinimumLevel.Information()
            //    .Filter.ByIncludingOnly(e => e.MessageTemplate.Text == "RequestLog")
            //    .WriteTo.MSSqlServer(connectionString, sinkOptions, columnOptions: columnOptions)
            //    .CreateLogger();
        }
    }
}

