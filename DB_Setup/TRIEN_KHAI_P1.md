# Triển khai lô P1 — Database cổng Tài trợ

Tạo 8 bảng + 5 view công khai + 4 SP đọc công khai (`TT_CongKhai_*`) + 1 SP lịch sử cựu SV
(`TT_CuuSV_*`) trên `ESS_HOCVIENTAICHINH_DAOTAO`.
**Không đụng bảng nào có sẵn**, không ALTER, không DROP: mọi file bọc `IF NOT EXISTS` (bảng) hoặc
`CREATE OR ALTER` (view, SP) ⇒ chạy lại cả kịch bản bao nhiêu lần cũng được.

## 🔴 Đã từng chạy bản P1 ĐỢT ĐẦU trên DB này chưa?

Lô đối chiếu ảnh mẫu đã đổi cấu trúc hai bảng: `TT_ChuongTrinh` (`mo_ta_ngan` → `phu_de`, thêm
`loi_keu_goi`, `ten_chu_tai_khoan`) và `TT_NhaTaiTro` (bỏ `ten_chuyen_nganh`, thêm `id_tai_khoan_csv`).

`IF NOT EXISTS` **bỏ qua lặng lẽ** bảng đã có ⇒ chạy file mới lên DB đã có bảng cũ sẽ "thành công"
mà schema vẫn cũ. Hai file bảng đó có khối chặn: gặp schema cũ thì **dừng bằng lỗi 50010 / 50011**.

Gặp lỗi đó:
- **Bảng CHƯA có dữ liệu thật** (P1 chưa nối API ⇒ gần như chắc chắn): chạy khối **Quay lui** ở cuối
  file này, rồi chạy lại từ Bước 1.
- **Đã có dữ liệu**: DỪNG. Viết script ALTER riêng — không DROP.

## Trước khi chạy

- **Tài khoản chạy:** tài khoản quản trị DB (`-E` Windows auth, hoặc `-U` của db_owner).
  🔴 **KHÔNG** dùng `TT_APP_LOGIN` — nó không có quyền `CREATE TABLE`, và không được có.
- **Đứng ở thư mục gốc repo** (`ApiQuanLyTaiTro/`) — mọi đường dẫn dưới đây là tương đối.
- Thay `<server>` bằng tên máy chủ (vd `localhost\SQLEXPRESS`).

### Bốn cờ bắt buộc ở MỌI lệnh

| Cờ | Vì sao |
|---|---|
| **`-I`** | Bật `QUOTED_IDENTIFIER`. Mặc định của sqlcmd là **OFF** (SSMS là ON). View/SP ghi nhớ thiết lập lúc CREATE; DB này có filtered index ⇒ thiếu cờ là lỗi **Msg 1934** lúc GỌI, không phải lúc tạo. |
| **`-b`** | Dừng và trả mã lỗi ≠ 0 khi có lỗi. Không có nó sqlcmd in lỗi rồi **chạy tiếp** file sau. |
| **`-f 65001`** | Đọc file là UTF-8. Chú thích trong file là tiếng Việt có dấu; thiếu cờ thì sqlcmd đọc bằng codepage OEM. Hôm nay chỉ làm hỏng chú thích (vô hại), nhưng ngày có một chuỗi `N'…'` tiếng Việt trong SQL thì **dữ liệu hỏng âm thầm**. |
| `-d ESS_HOCVIENTAICHINH_DAOTAO` | Đúng DB dùng chung. |

## Thứ tự chạy

Mỗi dòng là **một lệnh độc lập** — dán được vào cả PowerShell lẫn cmd. Lệnh nào báo lỗi thì **dừng**,
đừng chạy tiếp.

### Bước 1 — 8 bảng (kèm index của từng bảng)

Không có khoá ngoại nên thứ tự giữa các bảng không bắt buộc; xếp cha trước con cho dễ đọc.

```
sqlcmd -S <server> -E -d ESS_HOCVIENTAICHINH_DAOTAO -I -b -f 65001 -i "DB_Setup\Tables\TT_TaiKhoan.sql"
sqlcmd -S <server> -E -d ESS_HOCVIENTAICHINH_DAOTAO -I -b -f 65001 -i "DB_Setup\Tables\TT_ChuongTrinh.sql"
sqlcmd -S <server> -E -d ESS_HOCVIENTAICHINH_DAOTAO -I -b -f 65001 -i "DB_Setup\Tables\TT_DuKienChi.sql"
sqlcmd -S <server> -E -d ESS_HOCVIENTAICHINH_DAOTAO -I -b -f 65001 -i "DB_Setup\Tables\TT_NhaTaiTro.sql"
sqlcmd -S <server> -E -d ESS_HOCVIENTAICHINH_DAOTAO -I -b -f 65001 -i "DB_Setup\Tables\TT_AnhChuyenKhoan.sql"
sqlcmd -S <server> -E -d ESS_HOCVIENTAICHINH_DAOTAO -I -b -f 65001 -i "DB_Setup\Tables\TT_KhoanChi.sql"
sqlcmd -S <server> -E -d ESS_HOCVIENTAICHINH_DAOTAO -I -b -f 65001 -i "DB_Setup\Tables\TT_MinhChungChi.sql"
sqlcmd -S <server> -E -d ESS_HOCVIENTAICHINH_DAOTAO -I -b -f 65001 -i "DB_Setup\Tables\TT_MaDoiPhien.sql"
```

### Bước 2 — 5 view công khai — 🔴 ĐÚNG THỨ TỰ SỐ

View **không** có deferred name resolution như SP: tạo view trỏ tới view chưa có là lỗi ngay.
`02`–`04` đọc `01`; `05` đọc `04`.

```
sqlcmd -S <server> -E -d ESS_HOCVIENTAICHINH_DAOTAO -I -b -f 65001 -i "DB_Setup\Views\01. TT_v_ChuongTrinhCongKhai.sql"
sqlcmd -S <server> -E -d ESS_HOCVIENTAICHINH_DAOTAO -I -b -f 65001 -i "DB_Setup\Views\02. TT_v_DuKienChiCongKhai.sql"
sqlcmd -S <server> -E -d ESS_HOCVIENTAICHINH_DAOTAO -I -b -f 65001 -i "DB_Setup\Views\03. TT_v_NhaTaiTroCongKhai.sql"
sqlcmd -S <server> -E -d ESS_HOCVIENTAICHINH_DAOTAO -I -b -f 65001 -i "DB_Setup\Views\04. TT_v_KhoanChiCongKhai.sql"
sqlcmd -S <server> -E -d ESS_HOCVIENTAICHINH_DAOTAO -I -b -f 65001 -i "DB_Setup\Views\05. TT_v_MinhChungChiCongKhai.sql"
```

### Bước 3 — SP đọc: 4 công khai + 1 lịch sử cựu SV

```
sqlcmd -S <server> -E -d ESS_HOCVIENTAICHINH_DAOTAO -I -b -f 65001 -i "StoredProcedures\CongKhai\01. TT_CongKhai_GetDanhSachChuongTrinh.sql"
sqlcmd -S <server> -E -d ESS_HOCVIENTAICHINH_DAOTAO -I -b -f 65001 -i "StoredProcedures\CongKhai\02. TT_CongKhai_GetChiTietChuongTrinh.sql"
sqlcmd -S <server> -E -d ESS_HOCVIENTAICHINH_DAOTAO -I -b -f 65001 -i "StoredProcedures\CongKhai\03. TT_CongKhai_GetNhaTaiTroTheoChuongTrinh.sql"
sqlcmd -S <server> -E -d ESS_HOCVIENTAICHINH_DAOTAO -I -b -f 65001 -i "StoredProcedures\CongKhai\04. TT_CongKhai_GetKhoanChiTheoChuongTrinh.sql"
sqlcmd -S <server> -E -d ESS_HOCVIENTAICHINH_DAOTAO -I -b -f 65001 -i "StoredProcedures\CuuSV\01. TT_CuuSV_GetLichSuTaiTroCuaToi.sql"
```

### Bước 4 — Cấp quyền cho `TT_APP_USER`

Bước 5 của `01_CreateLogin_TaiTro.sql` tự cấp quyền cho **mọi bảng/SP `TT_*` đang có**, nên phải chạy
lại **sau** bước 1–3. File an toàn khi chạy lại (login/user bọc `IF NOT EXISTS`).

```
sqlcmd -S <server> -E -d ESS_HOCVIENTAICHINH_DAOTAO -I -b -f 65001 -i "DB_Setup\01_CreateLogin_TaiTro.sql"
```

⚠️ Nếu **chưa từng** chạy file này: điền mật khẩu vào dòng `CREATE LOGIN` trước (đừng commit).
Nếu login đã có: dòng đó bị bỏ qua, placeholder không sao.
⚠️ View **không** được cấp quyền, và không cần: SP do `dbo` sở hữu đọc view do `dbo` sở hữu qua
ownership chaining — `EXECUTE` trên SP là đủ. Đừng thêm `GRANT SELECT` trên view.
🔴 Bước 5b của file đó **DENY INSERT/UPDATE** trên `TT_MaDoiPhien` cho `TT_APP_USER`: cổng này đổi mã,
không bao giờ tạo mã. Đọc lý do ở chính file đó trước khi "sửa cho thông".

### Bước 5 — Kiểm cấu trúc (chỉ đọc) — 🔴 ĐỌC KẾT QUẢ

```
sqlcmd -S <server> -E -d ESS_HOCVIENTAICHINH_DAOTAO -I -b -f 65001 -i "DB_Setup\99_KiemTra_P1.sql"
```

| Khối | ĐÚNG khi |
|---|---|
| KIỂM 1 | 8 dòng, `so_cot_audit = 5` mọi dòng; truy vấn `thieu_bang` ra 0 dòng |
| KIỂM 2 | 0 dòng |
| **KIỂM 3** | **0 dòng** ở hai truy vấn đầu; truy vấn thứ ba ra **đúng 4** SP |
| KIỂM 4 | 0 dòng |
| KIỂM 5 | 0 dòng ở cả hai truy vấn |
| **KIỂM 6** | **0 dòng** ở truy vấn đầu; truy vấn sau ra ≥ 1 SP `TT_CuuSV_*` |
| **KIỂM 7** | **0 dòng** ở truy vấn đầu; truy vấn sau ra **đúng 2 dòng DENY** (INSERT, UPDATE) |

### Bước 6 — Thử hành vi — 🔴 CHỈ TRÊN DB DEV / BẢN SAO

Ghi dữ liệu thử trong một transaction rồi **ROLLBACK**. Không để lại dòng nào, nhưng tiêu IDENTITY —
đừng chạy trên production.

```
sqlcmd -S <server> -E -d ESS_HOCVIENTAICHINH_DAOTAO -I -b -f 65001 -i "DB_Setup\98_ThuNghiem_ChanLoDuLieu.sql"
```

ĐÚNG khi dòng cuối là `PASS: 19/19 ca …` và mã thoát 0.

## Chưa có trong kịch bản này — thuộc lô đăng nhập

- SP tạo mã `TT_MaDoiPhien_Tao` (cổng cựu SV gọi) và SP đổi mã (cổng này gọi).
- **Quyền của cổng cựu SV:** `GRANT EXECUTE ON dbo.TT_MaDoiPhien_Tao TO <principal của cổng cựu SV>` —
  CHỈ trên SP đó, không quyền nào trên bảng. Cổng cựu SV đang nối bằng `Trusted_Connection` (Windows
  auth) nên `<principal>` là login Windows của app pool bên đó, lead điền. Lý do: docs/01-kien-truc.md §4.

## Quay lui

Chỉ an toàn **khi bảng còn rỗng** (chưa có dữ liệu thật). Có dữ liệu rồi thì **không** drop — sửa tiến.
Thứ tự ngược với lúc tạo (SP → view 05…01 → bảng):

```sql
DROP PROCEDURE IF EXISTS dbo.TT_CuuSV_GetLichSuTaiTroCuaToi,
                         dbo.TT_CongKhai_GetKhoanChiTheoChuongTrinh, dbo.TT_CongKhai_GetNhaTaiTroTheoChuongTrinh,
                         dbo.TT_CongKhai_GetChiTietChuongTrinh, dbo.TT_CongKhai_GetDanhSachChuongTrinh;
DROP VIEW IF EXISTS dbo.TT_v_MinhChungChiCongKhai, dbo.TT_v_KhoanChiCongKhai, dbo.TT_v_NhaTaiTroCongKhai,
                    dbo.TT_v_DuKienChiCongKhai, dbo.TT_v_ChuongTrinhCongKhai;
DROP TABLE IF EXISTS dbo.TT_MaDoiPhien, dbo.TT_MinhChungChi, dbo.TT_KhoanChi, dbo.TT_AnhChuyenKhoan,
                     dbo.TT_NhaTaiTro, dbo.TT_DuKienChi, dbo.TT_ChuongTrinh, dbo.TT_TaiKhoan;
```
`DROP … IF EXISTS` cần SQL Server 2016+.
