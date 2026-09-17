# Triển khai lô P1 — Database cổng Tài trợ

Tạo 8 bảng + 5 view công khai + 4 SP đọc công khai (`TT_CongKhai_*`) + 1 SP lịch sử cựu SV
(`TT_CuuSV_*`) trên `ESS_HOCVIENTAICHINH_DAOTAO`.
**Không đụng bảng nào có sẵn**, không ALTER, không DROP: mọi file bọc `IF NOT EXISTS` (bảng) hoặc
`CREATE OR ALTER` (view, SP) ⇒ chạy lại cả kịch bản bao nhiêu lần cũng được.

## 🔴 Đã từng chạy bản P1 ĐỢT ĐẦU trên DB này chưa?

Lô đối chiếu ảnh mẫu đã đổi cấu trúc hai bảng: `TT_ChuongTrinh` (`mo_ta_ngan` → `phu_de`, thêm
`loi_keu_goi`, `ten_chu_tai_khoan`) và `TT_NhaTaiTro` (bỏ `ten_chuyen_nganh`, thêm `id_tai_khoan_csv`,
thêm lại `ngay_sinh` theo mẫu sếp).

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

```
Bước 0 LOGIN (00_TaoLogin)  →  1 BẢNG  →  2 VIEW  →  3 SP  →  4 QUYỀN (90_CapQuyen)  →  5–6 kiểm (98_, 99_)
```

Tên file trong `DB_Setup/` **nói luôn thứ tự**: `00_` đầu tiên, `90_` sau mọi đối tượng, `98_`/`99_` kiểm.
🔄 Trước 2026-09-17: login và quyền nằm chung trong `01_CreateLogin_TaiTro.sql`. Tên `01_` đọc như bước đầu
⇒ lead chạy nó **trước khi có SP** ⇒ API lỗi `The EXECUTE permission was denied on the object
'TT_CongKhai_…'` (log API 15:07:57). Đã tách làm hai file (docs/03 N20).
⚠️ `90_CapQuyen` tự **dừng bằng lỗi 50020** nếu chưa đủ 8 bảng / 5 view / 5 SP, và **50022** nếu chưa có
user — chạy nhầm thứ tự thì thấy ngay, không "thành công" giả.
⚠️ Lô sau **thêm** bảng/view/SP `TT_*` ⇒ **chạy lại `90_CapQuyen`** ở cuối lô đó. `CREATE OR ALTER` giữ quyền
của SP **đã có**, nhưng SP **mới** không có quyền nào cho tới khi file đó chạy lại.

Mỗi dòng là **một lệnh độc lập** — dán được vào cả PowerShell lẫn cmd. Lệnh nào báo lỗi thì **dừng**,
đừng chạy tiếp.

### Bước 0 — Login + user `TT_APP_USER` (không cấp quyền nào)

⚠️ Điền mật khẩu vào dòng `CREATE LOGIN` trước (đừng commit). Login đã có thì dòng đó bị bỏ qua.
⚠️ Instance phải bật **SQL Server authentication** (Mixed Mode). File tự nối lại user mồ côi (user có sẵn
nhưng không khớp SID với login — đã gặp ở P2a).

```
sqlcmd -S <server> -E -d ESS_HOCVIENTAICHINH_DAOTAO -I -b -f 65001 -i "DB_Setup\00_TaoLogin_TaiTro.sql"
```

ĐÚNG khi dòng kiểm cuối: `trang_thai = noi dung`, `chi_windows_auth = 0`.

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

⚠️ **Ghi nhận (2026-09-17), không cần làm riêng:** bản `TT_CuuSV_GetLichSuTaiTroCuaToi` đang chạy trên `MSSQLSERVER01`
lệch file **một chữ trong chú thích** ("quyền akhác nhau" — file là "khác"); thân SP khớp từng từ. Lần triển khai
tới chạy lại dòng cuối ở trên là hết lệch. Không ảnh hưởng hành vi.

### Bước 4 — Cấp quyền cho `TT_APP_USER` — 🔴 SAU BƯỚC 1–3

`90_CapQuyen_TaiTro.sql` tự cấp quyền cho **mọi bảng/SP `TT_*` đang có** (sinh bằng vòng lặp — không liệt kê
tay), nên chỉ chạy **sau** bước 1–3. Chạy lại bao nhiêu lần cũng an toàn.
Thấy `Msg 50020 … CHUA DU DOI TUONG` ⇒ bước 1–3 chưa xong. `Msg 50022` ⇒ chưa chạy Bước 0.
`Msg 50021 … KHONG DO dbo SO HUU` ⇒ đọc mục 3b của file trước khi làm gì.

```
sqlcmd -S <server> -E -d ESS_HOCVIENTAICHINH_DAOTAO -I -b -f 65001 -i "DB_Setup\90_CapQuyen_TaiTro.sql"
```

🔴 **View `TT_v_*` KHÔNG được cấp quyền nào — cố ý.** SP (chủ `dbo`) đọc view (chủ `dbo`) qua **ownership
chaining**: SQL Server chỉ kiểm `EXECUTE` ở SP. Đã chứng minh trên DB thật 2026-09-17: thu hết SELECT trên 5
view trong transaction, `TT_APP_USER` vẫn gọi được 4 SP, rồi ROLLBACK. File còn **gỡ** quyền view mà bản cũ
hoặc tay đã cấp.
⚠️ **Khi nào PHẢI cấp:** view (hoặc thứ nó đọc) do chủ sở hữu **khác `dbo`** — chuỗi đứt, quyền view mới có
tác dụng. File dừng bằng lỗi 50021 đúng ca này.
🔄 Lịch sử: mục này từng ghi "Đừng thêm GRANT SELECT trên view" → ngày 2026-09-17 quyền đó bị thêm vào do chẩn
đoán sai một lỗi triển khai (lỗi thật là EXECUTE denied) → gỡ lại cùng ngày. **Gặp lỗi quyền: đọc nguyên văn
câu lỗi** — nó nêu tên đối tượng và loại quyền.
🔴 Khối 4 của file đó **DENY INSERT/UPDATE** trên `TT_MaDoiPhien` cho `TT_APP_USER`: cổng này đổi mã,
không bao giờ tạo mã. Đọc lý do ở chính file đó trước khi "sửa cho thông".

**Sửa `90_CapQuyen` ⇒ chạy thử trước** (file đó có SQL động — quét cú pháp không kiểm được, docs/02 C5):

```
sqlcmd -S <server> -E -d ESS_HOCVIENTAICHINH_DAOTAO -I -b -f 65001 -i "DB_Setup\97_ChayThu_CapQuyen.sql"
```

ĐÚNG khi dòng cuối `PASS: …` + mã thoát 0. File chạy chính `90_` trong transaction, tự kiểm 8 ca, rồi ROLLBACK
— quyền trên DB không đổi. Phải đứng ở thư mục gốc repo (`:r` dùng đường dẫn tương đối).
🔴 **`96_` và `97_` dùng `:r` — chỉ chạy bằng sqlcmd từ thư mục gốc repo, hoặc SSMS ĐÃ BẬT Query → SQLCMD Mode.**
🔄 Lead chạy `97_` ba lần (2026-09-17): SSMS thường · sqlcmd sai thư mục — **cả hai báo PASS mà chưa nạp được
`90_`** (kiểm trên quyền cũ); lần ba từ gốc repo mới chạy thật. Nay hai file **tự chứng minh đã nạp**: `:r` không
chạy ⇒ `97_` THROW **50031**, `96_` THROW **50095**, không in PASS (đã thử cả ba cách chạy sai — docs/03 N21).

### Bước 5 — Kiểm cấu trúc (chỉ đọc) — TỰ BÁO SAI

Hai lệnh, cả hai **tự THROW + mã thoát ≠ 0** khi sai — không cần đọc từng dòng output. Lệnh lỗi thì **DỪNG**.

**5a — DDL bảng trên DB có khớp file không** (tên cột, kiểu, độ dài, nullable). Dựng 8 bảng từ file trong
`tempdb` (transaction → ROLLBACK), so `INFORMATION_SCHEMA.COLUMNS` với DB. Đứng ở thư mục gốc repo (`:r`).

```
sqlcmd -S <server> -E -d ESS_HOCVIENTAICHINH_DAOTAO -I -b -f 65001 -i "DB_Setup\96_SoDDL_Bang.sql"
```

ĐÚNG: `PASS: 8 bang / N cot tren DB khop file`. **Msg 50096** ⇒ bảng các cột lệch in ngay trên; bảng rỗng thì DROP
rồi chạy lại file bảng, có dữ liệu thì viết script ALTER. **Msg 50095** ⇒ tiền đề hỏng, so sánh vô nghĩa.
🔴 Chạy 5a mỗi khi **sửa file bảng** sau lần triển khai đầu — `IF NOT EXISTS` trong file bảng bỏ qua lặng lẽ.

**5b — Cấu trúc lớp công khai + quyền.**

```
sqlcmd -S <server> -E -d ESS_HOCVIENTAICHINH_DAOTAO -I -b -f 65001 -i "DB_Setup\99_KiemTra_P1.sql"
```

ĐÚNG: dòng cuối `PASS: 7/7 KIEM` + mã thoát 0. SAI: dừng ở KIỂM hỏng ĐẦU TIÊN, mã lỗi cho biết KIỂM nào; bảng
dòng vi phạm in ngay trên dòng lỗi.

| Mã | KIỂM hỏng | Nghĩa là |
|---|---|---|
| 50101 | 1 | thiếu bảng TT_ / bảng thiếu 5 trường audit |
| 50102 | 2 | view/SP tạo thiếu `ANSI_NULLS`/`QUOTED_IDENTIFIER` ON (chạy lại file đó với `-I`), hoặc chưa đủ 10 view/SP |
| **50103** | **3** | **SP công khai đọc thẳng bảng / view công khai chạm bảng riêng tư — KHÔNG nối API** |
| 50104 | 4 | view công khai lộ cột riêng tư, hoặc thiếu view |
| 50105 | 5 | có filtered index, hoặc cột cấm / cột đã gỡ (bảng tạo từ DDL cũ) |
| 50106 | 6 | SP `TT_CuuSV_*` thiếu `@id_tai_khoan_csv`, hoặc chưa có SP |
| **50107** | **7** | **`TT_APP_USER` tạo được mã đăng nhập, hoặc thiếu DENY — chạy lại `90_CapQuyen`** |

🔄 Trước 2026-09-17: bảng trên là "ĐÚNG khi … 0 dòng" và trông vào người đọc output. KIỂM 7 khi đó có lỗi cú pháp,
**chưa từng chạy**, mà vẫn được báo "ra 0 dòng" (docs/02 C5). Mỗi KIỂM nay còn kiểm **tiền đề** — truy vấn dò trên
tập rỗng thì luôn ra 0 dòng.

### Bước 6 — Thử hành vi — 🔴 CHỈ TRÊN DB DEV / BẢN SAO

Ghi dữ liệu thử trong một transaction rồi **ROLLBACK**. Không để lại dòng nào, nhưng tiêu IDENTITY —
đừng chạy trên production.

```
sqlcmd -S <server> -E -d ESS_HOCVIENTAICHINH_DAOTAO -I -b -f 65001 -i "DB_Setup\98_ThuNghiem_ChanLoDuLieu.sql"
```

ĐÚNG khi dòng cuối là `PASS: 19/19 ca …` và mã thoát 0.
🔴 **Chạy bước này TRƯỚC khi nhập dữ liệu mẫu** — nó tiêu IDENTITY (id đầu tiên của `TT_ChuongTrinh` sau đó
là 4, không phải 1).
✅ `MSSQLSERVER01`: lead đã chạy 2026-09-17 — **PASS 19/19**, đã ROLLBACK. 🔄 Trước đó (cùng ngày) bước này được
phát hiện **chưa từng chạy** (`last_value` IDENTITY mọi bảng TT_ là NULL) dù "PASS 19/19" đã được nêu — docs/03 N21.

## Lô P3a — SP ghi lời khai tài trợ (thêm sau P1)

Hai SP mới, rồi **chạy lại file quyền** (SP mới chưa có EXECUTE cho tới khi `90_` chạy lại — lỗi đã gặp ở P1):

```
sqlcmd -S <server> -E -d ESS_HOCVIENTAICHINH_DAOTAO -I -b -f 65001 -i "StoredProcedures\KhaiTaiTro\01. TT_NhaTaiTro_Tao.sql"
sqlcmd -S <server> -E -d ESS_HOCVIENTAICHINH_DAOTAO -I -b -f 65001 -i "StoredProcedures\KhaiTaiTro\02. TT_AnhChuyenKhoan_Tao.sql"
sqlcmd -S <server> -E -d ESS_HOCVIENTAICHINH_DAOTAO -I -b -f 65001 -i "DB_Setup\90_CapQuyen_TaiTro.sql"
sqlcmd -S <server> -E -d ESS_HOCVIENTAICHINH_DAOTAO -I -b -f 65001 -i "DB_Setup\97_ChayThu_CapQuyen.sql"
```

`97_` phải PASS (FAIL 1 = SP mới thiếu EXECUTE). `99_` KIỂM 3 không bị ảnh hưởng: hai SP này không mang tiền tố `TT_CongKhai_`.
⚠️ Ảnh chuyển khoản lưu ở `<content root>/Assets/RiengTu/AnhChuyenKhoan/` — thư mục **không** phục vụ tĩnh. Tiến trình API
cần quyền GHI thư mục đó, và thư mục **không** được nằm trong phần bị ghi đè khi deploy (docs/03 N26).

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
