# ApiQuanLyTaiTro — Cổng Vận động tài trợ

API (.NET 8) + FE (React/CRA) cho cổng vận động tài trợ. **Repo riêng, domain riêng, mã nguồn riêng
cả BE lẫn FE**, nhưng **dùng chung database `ESS_HOCVIENTAICHINH_DAOTAO`** với cổng Cựu sinh viên.

📖 **Đọc [`docs/00-BAT-DAU-TU-DAY.md`](docs/00-BAT-DAU-TU-DAY.md) trước khi sửa bất cứ thứ gì.**

## Chạy

```bash
dotnet build QuanLyTaiTro.slnx
dotnet run --project ApiQuanLyTaiTro          # http://localhost:5052 — Swagger tự mở

cd ApiQuanLyTaiTro/ClientApp
npm install
npm start                                     # http://localhost:8082
```

Yêu cầu: .NET 8 SDK · Node 18+ · SQL Server.

⚠️ Lần đầu: chép `ApiQuanLyTaiTro/appsettings.Example.json` → `appsettings.json` rồi điền
connection string + SMTP. File `appsettings.json` bị gitignore (chứa secret).
⚠️ Connection string phải dùng **tài khoản SQL riêng** của cổng này — tạo ở
[`DB_Setup/00_TaoLogin_TaiTro.sql`](DB_Setup/00_TaoLogin_TaiTro.sql), cấp quyền ở
[`DB_Setup/90_CapQuyen_TaiTro.sql`](DB_Setup/90_CapQuyen_TaiTro.sql), lý do ở
[`docs/01-kien-truc.md`](docs/01-kien-truc.md).
🔴 Chạy theo [`DB_Setup/TRIEN_KHAI_P1.md`](DB_Setup/TRIEN_KHAI_P1.md): `00_` đầu tiên, `90_` **sau** bảng/view/SP.
Chạy `90_` trước là API lỗi "EXECUTE permission was denied" (file tự dừng bằng lỗi 50020 nếu thiếu đối tượng).

## Cổng chạy

| | Cựu sinh viên | **Tài trợ (repo này)** |
|---|---|---|
| API | 5042 / 7111 | **5052 / 7121** |
| FE | 8081 | **8082** |

Khác nhau là **cố ý** — hai cổng chạy song song trên cùng một máy.

## Trạng thái: P1 — dựng khung

Khung hạ tầng + module Tài trợ (danh sách, chi tiết) chạy trên **dữ liệu cứng**. Chưa có bảng
`TT_*`, chưa có nghiệp vụ, **chưa có luồng đăng nhập** (P4). Chi tiết:
[`docs/03-no-ky-thuat.md`](docs/03-no-ky-thuat.md).
