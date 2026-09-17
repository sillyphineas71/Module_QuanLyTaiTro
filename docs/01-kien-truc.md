# 01 — Kiến trúc (đã chốt)

## 1. Hai cổng, một cơ sở dữ liệu

```
ApiQuanLyCuuSinhVien   (repo riêng, domain riêng, FE+BE riêng)  ─┐
                                                                 ├─► ESS_HOCVIENTAICHINH_DAOTAO
ApiQuanLyTaiTro        (repo NÀY,   domain riêng, FE+BE riêng)  ─┘    (CÙNG DB, cùng server)
```

Mã nguồn tách hoàn toàn. Thứ dùng chung **chỉ là dữ liệu**.

**Tiền tố mọi bảng và Stored Procedure của cổng này: `TT_`** (cổng kia dùng `CSV_`).
Không có bảng nào tên trùng, không có SP nào dùng chung.

## 2. 🔴 BA VAI, HAI NGUỒN TÀI KHOẢN

Đây là câu hỏi sẽ có người hỏi lại sau sáu tháng, nên trả lời sẵn ở đây.

> 🔄 **ĐÃ ĐỔI (lô P1b).** Bản trước ghi "Cựu sinh viên KHÔNG đăng nhập được vào cổng Tài trợ". Lead
> mở rộng phạm vi: cựu SV đăng nhập để **điền sẵn form** và xem **"Lịch sử tài trợ của tôi"**.
> Người tài trợ không đăng nhập vẫn là KHÁCH và vẫn khai được như cũ.

| Vai | Tài khoản ở đâu | Đăng nhập thế nào | Làm được gì |
|---|---|---|---|
| **Khách** | không có | không | khai + tải ảnh chuyển khoản; **không xem lại được** |
| **Cựu SV** | `CSV_TaiKhoan` (cổng cựu SV) — cổng này **CHỈ ĐỌC** | mượn đăng nhập cổng cựu SV qua **mã đổi phiên** | như khách + điền sẵn form + xem lịch sử **lời khai của chính mình** |
| **Quản trị** | `TT_TaiKhoan` — cổng này **đọc + ghi** | đăng nhập tại chỗ, email + mật khẩu | duyệt, nhập số tiền, quản lý chương trình |

Cổng này **không bao giờ** ghi vào `CSV_TaiKhoan`, và không có bảng tài khoản cựu SV riêng.

### Luồng đăng nhập cựu SV — mã đổi phiên một lần

```
Cổng Tài trợ  "Bạn là Cựu sinh viên? → Đăng nhập ngay"
   → cổng cựu SV /login?quay_lai=<url>          (đã đăng nhập sẵn thì bỏ qua bước gõ)
   → cổng cựu SV SINH MÃ, INSERT băm vào TT_MaDoiPhien
   → chuyển về cổng Tài trợ /doi-phien?ma=<mã>
   → cổng Tài trợ DELETE…OUTPUT theo băm (tra + xoá trong MỘT lệnh) → id_tai_khoan_csv
   → KIỂM LẠI CSV_TaiKhoan → cấp JWT RIÊNG của cổng Tài trợ (7 ngày) → về đúng trang đang xem
```

- **Mã:** sống 2 phút (theo đồng hồ DB), dùng một lần, lưu **băm SHA-256** chứ không lưu mã. Chụp được
  link cũng vô dụng. Hợp đồng kỹ thuật đầy đủ cho hai phía: đầu `DB_Setup/Tables/TT_MaDoiPhien.sql`.
- **🔴 Ranh giới sở hữu `TT_MaDoiPhien`:** schema ở repo NÀY, nhưng bên **GHI là cổng cựu SV**. Cổng Tài
  trợ chỉ đổi mã và bị **DENY INSERT** — ai tạo được mã là đăng nhập được thành bất kỳ cựu SV nào.
- **JWT riêng** (secret + Issuer khác — §5): token hai cổng không mở cửa lẫn nhau.
- **Mỗi request kiểm lại `CSV_TaiKhoan`** (DB chung nên rẻ) — đó là cơ chế THU HỒI: tài khoản bị xoá /
  từ chối ở cổng kia thì phiên ở cổng này chết theo ở request kế tiếp, không đợi hết 7 ngày.
  ⚠️ `CSV_TaiKhoan.trang_thai` là **0 chờ · 1 duyệt · 2 từ chối** — **KHÔNG có trạng thái "khoá"**.
  "Khoá bên kia" thực chất là bị xoá mềm hoặc trạng thái rời khỏi 1.
- Hết hạn 7 ngày → hiện nút "Đăng nhập lại", **không** tự chuyển trang.
- **`quay_lai` phải chặn open redirect CỨNG** — việc của lô đăng nhập, chi tiết ở
  [`03-no-ky-thuat.md`](03-no-ky-thuat.md), mục **N13**. Ở luồng này open redirect **không chỉ là lừa đảo**:
  URL chuyển về mang theo **mã đổi phiên**, nên chuyển nhầm host là **trao mã đăng nhập cho người khác**.

### 🔴 Điều kiện "phiên cựu SV còn sống" — ĐÃ CHỐT

```sql
is_deleted = 0 AND trang_thai = 1 AND vai_tro IN (2, 3)
```

Kiểm ở **cả hai** chỗ: lúc đổi mã, và **mỗi request** sau đó (cơ chế thu hồi ở trên).

> **Trạng thái cũ (P1b):** câu hỏi mở — "chỉ `vai_tro = 3`, hay cả Lớp trưởng?".
> **Lead chốt:** cả **3 (Cựu SV)** VÀ **2 (Lớp trưởng)**; **KHÔNG** 1 (Quản lý).

| `vai_tro` | Vai ở cổng cựu SV | Đăng nhập cổng Tài trợ? | Vì sao |
|---|---|---|---|
| 3 | Cựu SV | ✅ | đối tượng chính |
| 2 | Lớp trưởng | ✅ | lớp trưởng **cũng là cựu SV**, chỉ có thêm quyền ở cổng kia. Chặn họ là chặn một người thật vì lý do kỹ thuật của hệ thống khác |
| 1 | Quản lý | ❌ | nhân viên Khoa, không phải người tài trợ. Muốn tài trợ thì dùng **luồng khách** |

⚠️ Viết `IN (2, 3)` — danh sách những vai **được vào**, KHÔNG viết `<> 1`. Ngày cổng cựu SV thêm vai
thứ tư, `<> 1` sẽ lặng lẽ cho vai đó vào; `IN (2, 3)` thì chặn cho tới khi có người quyết.

### 🔴 Lời khai bị TỪ CHỐI: người khai thấy TRẠNG THÁI, không thấy LÝ DO — ĐÃ CHỐT

"Lịch sử tài trợ của tôi" hiện dòng bị từ chối với nhãn **"Từ chối"** kèm **đúng một câu chung**:
**"Vui lòng liên hệ Khoa nếu cần biết thêm."** — **không** hiện `ly_do_tu_choi`.

> **Trạng thái cũ (P1b):** SP lịch sử không trả `ly_do_tu_choi`, ghi là "chờ lead quyết".
> **Lead chốt:** giữ nguyên — **không bao giờ** cho người khai xem.

- **Vì sao:** lý do từ chối viết cho **quản trị đọc** — có thể là "ảnh không khớp sao kê" hay "nghi
  khai khống". Hiện nó ra là giải thích với người ngoài bằng câu chữ nội bộ, và với câu thứ hai là
  buộc tội thẳng người đang đọc.
- **Kênh báo lại là NGƯỜI, không phải màn hình** — đó là lý do `email_lien_he` / `sdt_lien_he` tồn tại
  trong `TT_NhaTaiTro`. Quản trị chọn câu chữ khi liên hệ.
- ⚠️ Vẫn hiện dòng "Từ chối", **không giấu dòng**: giấu là lời khai biến mất khỏi lịch sử của chính
  người đã chuyển tiền, không ai nói gì.
- ⚠️ Chặn ở **SP** (không trả cột), không chặn ở FE — cột đã rời máy chủ thì DevTools đọc được.

### 🔴 "Lịch sử của tôi" = những lần TÔI KHAI, không phải những lần tên tôi xuất hiện

`TT_NhaTaiTro.id_tai_khoan_csv` ghi tài khoản **đang đăng nhập lúc gửi lời khai**. Khai hộ tên người
khác ⇒ dòng vẫn mang id của người khai.

### 🔴 Lời khai lúc còn là KHÁCH KHÔNG BAO GIỜ được nối vào tài khoản về sau

Câu này sẽ có người hỏi ("tôi khai hôm qua chưa đăng nhập, sao lịch sử không có?"). Trả lời: **không
có dữ liệu nào chứng minh lời khai đó là của bạn.** Lời khai khách chỉ có họ tên + khoá/lớp — là CHỮ
TỰ GÕ, ai cũng gõ được tên người khác. Nối theo tên nghĩa là cho người đăng nhập sau XEM lời khai của
một người trùng tên — kèm trạng thái duyệt, và ở các lô sau có thể cả liên hệ và ảnh chuyển khoản
(số tài khoản, số dư). Người tài trợ thật thì chịu thiệt một dòng lịch sử; nối sai thì một người khác
bị lộ dữ liệu tài chính. Không đổi được cái sau lấy cái trước.
⇒ Muốn thấy trong lịch sử: **đăng nhập trước khi khai.** FE nên nói câu đó ngay trên modal.

## 3. Luồng request (giữ nguyên convention của repo gốc)

```
Controller → Service (logic + kiểm quyền) → Repository → Stored Procedure → SQL Server
```

Controller không chứa logic · Service không chứa SQL · Repository không chứa nghiệp vụ.

Ba pattern **không được thay thế** (đã chép sang nguyên vẹn):
1. **Wrapper + Service Locator** — `IServiceWrapper` / `IRepositoryWrapper`, không inject từng
   service lẻ. Khuôn thêm mục mới ghi ngay trong file. 🔄 Tới P1 cả hai **rỗng có chủ đích**; từ P2a
   mỗi wrapper có mục đầu tiên `TaiTro` (đọc công khai).
2. **Lazy loading `??=`** trong wrapper.
3. **Truyền `IServiceProvider`** xuống service (`BaseService`).

**Dapper + Stored Procedure**, KHÔNG EF Core, KHÔNG migration. Liên kết mềm, **không khoá ngoại**.
Response theo `ResponseBase<T> { is_success, code, message, data }`; `code` lấy từ `ResponseCode.cs`,
**không bịa mã mới**. Service dựng response, Controller gọi `response.ToActionResult()`.

`PropertyNamingPolicy = null` (Program.cs) — JSON giữ `snake_case` khớp tên cột. **Đừng đổi.**

## 4. 🔴 TÀI KHOẢN SQL RIÊNG — script cho lead chạy

**Vì sao không dùng chung connection string với cổng Cựu sinh viên:** cổng này **CÔNG KHAI** (ai
cũng mở được trang chương trình tài trợ), mà cùng DB đó chứa CMND, ảnh giấy tờ và số tài khoản
ngân hàng của cựu sinh viên. Một lỗi SQL injection hay một SP viết ẩu ở cổng công khai mà chạy
bằng tài khoản toàn quyền là rò toàn bộ dữ liệu đó.

Script: [`DB_Setup/00_TaoLogin_TaiTro.sql`](../DB_Setup/00_TaoLogin_TaiTro.sql) (login + user, chạy đầu) ·
[`DB_Setup/90_CapQuyen_TaiTro.sql`](../DB_Setup/90_CapQuyen_TaiTro.sql) (quyền, chạy SAU bảng/view/SP).
🔄 Tới 2026-09-17 là một file `01_CreateLogin_TaiTro.sql` — tách vì tên `01_` khiến phần quyền bị chạy trước khi có SP (docs/03 N20).
Tóm tắt quyền:

| Đối tượng | Quyền |
|---|---|
| `TT_*` (bảng + SP) | toàn quyền — **trừ** `TT_MaDoiPhien` |
| `TT_v_*` (view công khai) | **KHÔNG quyền nào** — SP đọc view qua ownership chaining (mọi đối tượng chủ `dbo`), `EXECUTE` là đủ. Chỉ cấp `SELECT` khi view do chủ KHÁC `dbo` (chuỗi đứt). **Không bao giờ** quyền ghi trên view |
| `TT_MaDoiPhien` | `SELECT` + `DELETE` (đổi mã). **DENY `INSERT`, `UPDATE`**; DENY `EXECUTE` trên SP tạo mã |
| `CSV_TaiKhoan` | `SELECT` **theo cột**: `id`, `email_dang_nhap`, `id_sv`, `vai_tro`, `id_lop`, `trang_thai`, `is_deleted`. **Không** `mat_khau`, `provider_key`, `ly_do_tu_choi` (🔄 tới 2026-09-17 cấp cả bảng) |
| `CSV_ThongTin` | `SELECT` **theo cột**: `id_tai_khoan`, `sdt_hien_tai`, `email_hien_tai`, `is_deleted`. **Không** `dia_chi_hien_tai`, `ghi_chu`, `id_tinh_thanh`, `id_xa_phuong` — `TT_NhaTaiTro` không có cột địa chỉ để điền (🔄 tới 2026-09-17 cấp cả bảng) |
| `STU_Lop`, `dmHe`, `dmKhoa`, `dmChuyenNganh` | `SELECT` (không cần cho SP tĩnh — giữ làm lưới an toàn cho SQL động, lead chốt 2026-09-17; đã rà tên cột, không có cột nhạy cảm) |
| `STU_HoSoSinhVien` | `SELECT` **chỉ hai cột** `Ho_ten`, `Ngay_sinh` |
| `STU_DanhSach` (nối SV ↔ lớp) | **KHÔNG quyền nào** — SP `TT_*` đọc qua ownership chaining (đã thử 2026-09-17). Bảng có `Mat_khau`, `No_hoc_phi`: cấp cả bảng là lộ mật khẩu SV. Chỉ cấp **theo cột** nếu SP dùng SQL động |
| mọi thứ khác | không có gì |

> ⚠️ **GIỚI HẠN THẬT CỦA QUYỀN THEO CỘT — đọc trước khi tin là đã an toàn.**
> `GRANT SELECT ON STU_HoSoSinhVien (Ho_ten, Ngay_sinh)` chỉ chặn **truy vấn trực tiếp**. Nếu một
> Stored Procedure do `dbo` sở hữu đọc thêm cột CMND, **ownership chaining của SQL Server bỏ qua
> kiểm tra quyền trên bảng** — tài khoản này vẫn đọc được cột đó qua SP.
> ⇒ Quyền theo cột là **lớp chặn thứ hai**, không phải lớp duy nhất. Lớp thứ nhất là: **không
> viết SP nào của cổng Tài trợ đọc quá hai cột đó**. Ai review SP phải kiểm đúng điểm này.

### Quyền của CỔNG CỰU SV trên `TT_MaDoiPhien` — chỉ qua MỘT SP

Cổng cựu SV cần tạo mã. **Đề xuất (lead duyệt):** `GRANT EXECUTE` trên **đúng SP `TT_MaDoiPhien_Tao`**
cho principal của cổng cựu SV — **không** quyền nào trên bảng.

- **Vì sao không GRANT INSERT trên bảng:** SP khoá được hình dạng dòng mã — `created_time` lấy
  `GETDATE()` của DB (không phải đồng hồ web server bên kia), không có tham số hạn dùng để bên gọi đặt
  bừa. Quyền INSERT trần cho phép ghi mọi cột, kể cả `created_time` tương lai = mã sống lâu hơn.
- **Vì sao không bắt cổng cựu SV dùng tài khoản SQL riêng NGAY BÂY GIỜ:** cổng đó đang nối bằng
  `Trusted_Connection` (Windows auth, nhiều khả năng quyền rộng). Chuyển sang tài khoản hẹp là cấp lại
  quyền cho **toàn bộ** SP `CSV_*` — một lô bảo mật riêng của repo kia (nợ N12), không phải việc kéo
  theo của tính năng đăng nhập.
- ⚠️ **Giới hạn thật:** chừng nào cổng cựu SV còn chạy bằng principal quyền rộng, `GRANT EXECUTE` ở
  trên chỉ là **hợp đồng**, không phải **rào chắn** — principal đó vẫn INSERT thẳng được. Rào chắn
  THẬT hôm nay nằm ở chiều ngược lại: **cổng Tài trợ (cổng công khai) KHÔNG tạo được mã** (DENY).

## 5. Cấu hình

| Thứ | Cổng Cựu SV | **Cổng Tài trợ** |
|---|---|---|
| API http / https | 5042 / 7111 | **5052 / 7121** |
| FE (CRA) | 8081 | **8082** |
| JWT Issuer / Audience | `QuanLyCuuSinhVienApi` / `...Client` | **`QuanLyTaiTroApi` / `QuanLyTaiTroClient`** |
| JWT Secret | (của cổng kia) | **sinh mới, KHÁC hẳn** |

> 🔴 **Secret phải khác.** Hai cổng dùng chung DB nhưng token của cổng này **không được** mở cửa
> cổng kia và ngược lại. Issuer/Audience khác nhau là lớp chặn thứ hai (`ValidateIssuer` và
> `ValidateAudience` đều bật ở `Program.cs`).
> ⚠️ Secret/Issuer/Audience xuất hiện ở **ba chỗ** phải khớp nhau: `Program.cs`, `Common/AppSettings.cs`,
> `Services/Core/JwtTokenService/JwtTokenService.cs`. Lệch một chỗ là mọi token verify fail.

`appsettings.json` bị **gitignore** (chứa secret). Bản mẫu commit được:
`appsettings.Example.json`.
