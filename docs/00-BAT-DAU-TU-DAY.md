# Bắt đầu từ đây — Cổng Vận động tài trợ

Repo này là **bản clone KIẾN TRÚC** của `ApiQuanLyCuuSinhVien`, không phải bản clone nghiệp vụ.
Đọc đúng ba file, theo thứ tự:

| File | Trả lời câu hỏi |
|---|---|
| [01-kien-truc.md](01-kien-truc.md) | Hai cổng quan hệ thế nào? Dùng chung cái gì? Tài khoản SQL nào? |
| [02-luat-chung.md](02-luat-chung.md) | Những luật đã trả giá để học được, áp cho MỌI màn |
| [03-no-ky-thuat.md](03-no-ky-thuat.md) | Chỗ nào đang tạm, ai phải dọn, khi nào |

## Chạy lên trong 4 câu lệnh

```bash
dotnet build QuanLyTaiTro.slnx              # API
dotnet run --project ApiQuanLyTaiTro        # http://localhost:5052  (Swagger tự mở)
cd ApiQuanLyTaiTro/ClientApp && npm install # lần đầu
npm start                                   # http://localhost:8082
```

**Cổng 5052 / 8082 là CỐ Ý khác cổng Cựu sinh viên (5042 / 8081)** để hai hệ chạy song song trên
cùng một máy. Đổi số thì phải đổi đồng thời ba chỗ: `ClientApp/.env`, `appsettings.json`
(`CorsWithOrigins`), `Properties/launchSettings.json`.

## Trạng thái hiện tại (P1 — dựng khung)

Có: khung API build sạch · FE lên được · header/footer/khung trang công khai · module **Tài trợ
T1+T2** (danh sách + chi tiết) chạy trên **dữ liệu cứng** `taiTroMock.ts`.

Chưa có: bảng `TT_*` nào · Controller/Service/Repository nghiệp vụ nào · **luồng đăng nhập (P4)** ·
API thật (module tài trợ đang đọc mock, điểm thay thế ghi ngay trong `taiTroMock.ts`).

## Vướng lúc chạy — hai cái đã gặp thật trên máy dev

### 1. `dotnet run` báo "You must install or update .NET"

```
Framework: 'Microsoft.NETCore.App', version '8.0.0' (x64)
The following frameworks were found:  9.0.20 … 10.0.11 … 10.0.12
```

Máy có **SDK** .NET 10 (build được `net8.0`) nhưng **không có RUNTIME .NET 8**. Đây là tình trạng
của máy, **không phải lỗi repo** — đã kiểm: repo `ApiQuanLyCuuSinhVien` chạy cũng hỏng y hệt.

Hai cách:
```bash
DOTNET_ROLL_FORWARD=Major dotnet run --project ApiQuanLyTaiTro   # tạm, mỗi lần chạy
```
hoặc **cài .NET 8 Desktop/ASP.NET Core Runtime** (cách nên làm — chạy đúng runtime mà project khai).

⚠️ **Không** thêm `<RollForward>Major</RollForward>` vào `.csproj` nếu chỉ để chữa máy dev: nó đổi
hành vi lúc deploy và làm repo này lệch khỏi repo gốc. Nếu quyết định thêm thì thêm ở **cả hai repo**.

### 2. Chạy thẳng file `.dll` trong `bin/` thì chết `DirectoryNotFoundException: …\Assets\Template\`

`Program.cs` phục vụ file tĩnh từ `Assets/Template` và `Assets/Upload` theo **ContentRootPath**.
Chạy bằng `dotnet run --project …` thì ContentRoot là thư mục project (có sẵn hai thư mục đó);
chạy `dotnet Bin/…dll` thì ContentRoot là `bin/` và ở đó không có.

⇒ **Luôn chạy bằng `dotnet run --project ApiQuanLyTaiTro`.** (Khi publish thật thì
`CopyToPublishDirectory` trong `.csproj` lo phần này.)

### 3. `node_modules` đang là bản CHÉP từ repo Cựu sinh viên

Chép sang để `npm start` chạy được ngay ở lô này (hai `package.json` giống nhau, trừ `name`).
Bình thường thì **`npm install`** mới là cách đúng — xoá `node_modules` rồi cài lại nếu gặp thứ gì
lạ về phụ thuộc.
