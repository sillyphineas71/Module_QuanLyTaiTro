# 03 — Nợ kỹ thuật

Mở từ lô **P1 (dựng khung)**. Mỗi mục: *cái gì · vì sao chấp nhận · ai/khi nào dọn*.

---

## N1. ~~Tên `Alumni*` và tiền tố URL `/alumni/*`~~ — ĐÃ TRẢ (2026-09-17)

Đã làm trong **một lô**, cả tên lẫn URL:

- **URL bỏ hẳn tiền tố:** `/` · `/tai-tro` · `/tai-tro/:id`. Cổng chỉ có một nghiệp vụ nên không cần
  không gian tên; khu quản trị (P4) mở tiền tố riêng của nó. Nguồn duy nhất của đường dẫn module:
  `DUONG_DAN_TAI_TRO` trong `model/ITaiTro.ts` — menu cũng đọc từ đó, không còn chuỗi rời.
- **URL cũ `/alumni/*` nay ra trang 404**, cố ý không thêm redirect: cổng chưa phát hành (P1, dữ
  liệu cứng). Nếu đã có link `/alumni` gửi ra ngoài thì mới cần thêm.
- **`Alumni*` → `App*`** — 31 file, mọi định danh, và key localStorage của panel. Ngoại lệ DUY
  NHẤT: `AlumniLandingPage` trong chú thích, vì file đó chỉ có ở repo gốc.
- **Bỏ tầng thư mục `cuu-sinh-vien/` / `cuuSinhVien/`**; bảng route lên `src/AppRoutes.tsx`.

⚠️ **Hết đối chiếu tên 1–1 với repo gốc.** Cần chép thêm gì từ bên đó thì khi dán: đổi `Alumni` →
`App`, bỏ tầng `cuu-sinh-vien/`, và bỏ tiền tố `/alumni` khỏi mọi đường dẫn.

## N2. Module tài trợ chạy trên dữ liệu cứng

`taiTroMock.ts` — hai màn T1/T2 chưa gọi API nào.

**Điểm thay thế: ĐÚNG HAI HÀM** cuối `taiTroMock.ts` (`layDanhSachTomTat`, `layChiTiet`) → đổi thân
hàm sang `httpClient.get`. **Màn hình không phải sửa.** Nếu thấy mình phải sửa màn hình thì hợp đồng
kiểu trong `ITaiTro.ts` đã bị vi phạm ở đâu đó.

**Dọn khi nào:** khi có API thật (sau khi dựng bảng `TT_*`).

## N3. Ảnh trong mock trỏ ra dịch vụ ngoài

`picsum.photos` (ảnh bìa) và `placehold.co` (ảnh minh chứng). **11 dòng phải đổi**, liệt kê sẵn
trong khối "ẢNH GIỮ CHỖ" ở đầu `taiTroMock.ts`.

⚠️ Kèm theo: nhánh "URL tuyệt đối" trong `duongDanAnh()` (`ITaiTro.ts`) **phải xoá cùng lúc**. Để
lại thì một `anh_bia` bẩn từ DB (ai đó dán nguyên URL vào ô nhập ở màn quản trị) sẽ được nhúng thẳng
lên trang công khai — mở đường cho ảnh từ miền lạ.

## N4. Trang chủ là bản giữ chỗ

`pages/landing/TrangChuPage.tsx` — một tiêu đề, một đoạn mô tả, một nút.

**Vì sao không chép `AlumniLandingPage` sang:** toàn bộ nội dung trang đó (hero, "Góc cựu sinh viên
tiêu biểu", khối tin tức) nói với **cộng đồng cựu sinh viên**, còn cổng này nói với **người đóng
góp**. Chép một trang chủ sai đối tượng rồi sửa dần tốn hơn viết mới khi đã có nội dung thật.

⚠️ Mục **"Giới thiệu"** đã bị gỡ khỏi thanh điều hướng vì chưa có khối nào mang neo `gioi-thieu`.
Dựng trang chủ thật thì **thêm khối trước, thêm lại mục menu sau** — đúng thứ tự đó (luật B1/A3.30).

## N5. `AppLayout` + `AppProtectedRoute` có mà chưa dùng

Đã chép nguyên (rail, panel, drawer mobile, menu tài khoản) nhưng **chưa route nào bọc chúng**, vì
luồng đăng nhập là P4.

**Đừng "dọn" vì thấy chưa ai gọi.** Giữ để P4 cắm vào, không phải dựng lại vỏ.
⚠️ `appMenuConfig.ts` đang có **đúng một category giữ chỗ** trỏ về `DUONG_DAN_TAI_TRO`. Không được
để mảng rỗng: rail sẽ trắng và `getDefaultRouteForRole` rơi về đường không tồn tại.

## N6. Hai chỗ trong `eVaiTro` chờ P4 xác nhận

`eVaiTro.QuanTri = 1` — giá trị số này **đoán trước** cột `TT_TaiKhoan.vai_tro`, vì bảng đó chưa tồn
tại. Dựng bảng ở P4 thì đối chiếu lại. Nếu cổng cần nhiều hơn một vai (ví dụ tách "kế toán duyệt
chi" khỏi "quản trị nội dung") thì thêm ở đây **và** ở `VAI_LAM_VIEC` trong `TrangCongKhaiRoute.tsx`.

🔄 **P1b:** `TT_TaiKhoan.vai_tro` đã có trong DDL (1 = Quản trị) — khớp. **Nhưng chú thích đầu
`eVaiTro.ts` ("CHỈ CÓ MỘT VAI… Cựu sinh viên KHÔNG có tài khoản ở cổng này") NAY SAI**: cựu SV đăng
nhập được (docs/01-kien-truc.md §2). Phiên cựu SV không nằm trong `TT_TaiKhoan` nên có thể không phải
một giá trị của enum này — lô đăng nhập quyết hình dạng, và sửa chú thích đó cùng lúc.

## N7. Repo gốc chưa dọn

Module tài trợ **T1+T2 vẫn còn nguyên** bên `ApiQuanLyCuuSinhVien` (mã, mock, route, mục menu "Vận
động tài trợ" trên header). Lô này **không đụng gì** bên đó.

**Dọn khi nào:** sau khi cổng này chạy được. Là một lô riêng, và phải kiểm lại **bảng ngân sách bề
rộng header** của repo gốc — bỏ mục "Vận động tài trợ" là bớt ~173px, tức mốc gộp tầng 1366px ở đó
tính lại được.

## N8. Cảnh báo build đang có

| Nơi | Số | Bản chất |
|---|---|---|
| `dotnet build` | **64 warning, 0 error** | Nullable (CS86xx) + analyzer ASP0019, **kế thừa nguyên** từ scaffold repo gốc. Không cái nào do lô này sinh ra. |
| `npx eslint src` | xem lệnh dưới | biến không dùng + `react-hooks/exhaustive-deps` trong `components-ui/data-table` |

```bash
npx eslint src --ext .ts,.tsx     # KHÔNG dùng npm start để đếm — xem luật B4
```

**Vì sao chưa dọn:** đụng vào `components-ui/data-table` (vùng chép nguyên từ repo gốc) là mở ra
khác biệt giữa hai repo ngay lô đầu. Điều kiện dọn **nay đã đủ** (N1 đã trả, hai repo thôi chép qua lại), nhưng lô N1 cố ý **không đụng**:
mốc 6 cảnh báo là thước đo cho chính lô đổi tên đó. Dọn ở một lô riêng.

## N9. Nút "Đăng nhập" trên header công khai dẫn tới trang 404

`TrangCongKhai.tsx` luôn dựng nút **"Đăng nhập"** cho khách → `navigate("/login")`, nhưng chưa có
route `/login` (P4) ⇒ bấm vào ra **"Không tìm thấy trang"**. Nút hiện ở **cả ba** trang công khai —
ở Trang chủ nó đứng ngay trên câu "Mọi người đều xem được, không cần đăng nhập". Vi phạm **B1**.

**Vì sao chưa sửa:** có từ trước (lô N1 chỉ dịch `/alumni/login` → `/login`). Gỡ nút là đổi bố cục
tầng dưới header (ngân sách bề rộng, luật A6) — việc lead quyết, không thuộc lô đổi tên.

Cùng họ: `/login` là chuỗi rời ở **4 chỗ** (`TrangCongKhai.tsx` ×2, `AppProtectedRoute.tsx`,
`httpClient.ts`). P4 dựng route thì gom về **một** hằng số, giống `DUONG_DAN_TAI_TRO`.

## N10. "Đóng nhận tài trợ" chưa tách khỏi "hết hạn"

Trạng thái Đang/Đã diễn ra **tính từ `den_ngay`** (view `TT_v_ChuongTrinhCongKhai`), không lưu cột.
Badge "Đã diễn ra" trên thẻ Chi phí ở ảnh mẫu được lead xác nhận là **mẫu vẽ nhầm** — không thêm cột.

**Dọn khi nào:** nếu Khoa muốn **ngừng nhận tài trợ trước `den_ngay`** (đủ tiền sớm), hoặc **vẫn nhận
sau khi hết hạn**, thì đó là một cột mới trên `TT_ChuongTrinh` — một cờ TAY, tách khỏi trạng thái
dẫn xuất từ ngày. ⚠️ Đừng đè nghĩa lên `den_ngay` (lùi ngày để "đóng") — trang sẽ nói sai thời gian
diễn ra chương trình.

## N11. Không chứa được ẢNH HOẠT ĐỘNG chung của chương trình

`TT_MinhChungChi.id_khoan_chi` là **NOT NULL** — mọi ảnh phải gắn một khoản chi. Dải ảnh ở ảnh mẫu được
lead xác nhận là "3 ảnh đầu trong tổng 5 minh chứng", nên hiện tại đủ.

**Dọn khi nào:** Khoa muốn đăng ảnh sự kiện không thuộc khoản chi nào. Khi đó chọn giữa bảng ảnh hoạt
động riêng (gắn `id_chuong_trinh`) và cho `id_khoan_chi` NULL. ⚠️ Nếu chọn NULL thì view
`TT_v_MinhChungChiCongKhai` đang JOIN view khoản chi sẽ **lặng lẽ loại** mọi ảnh không có khoản chi —
phải viết lại view, không chỉ ALTER cột.

## N12. Cổng cựu SV chưa có tài khoản SQL hẹp

Cổng cựu SV nối DB bằng `Trusted_Connection` (Windows auth, nhiều khả năng quyền rộng). Với tính năng
đăng nhập chéo, nó cần tạo mã ở `TT_MaDoiPhien`; đề xuất là `GRANT EXECUTE` trên đúng SP
`TT_MaDoiPhien_Tao` (docs/01-kien-truc.md §4). Nhưng chừng nào principal bên đó còn quyền rộng, grant
đó là **hợp đồng chứ không phải rào chắn**.

**Giới hạn đó cụ thể là gì** (lead yêu cầu ghi rõ): hai bảo đảm mà SP tạo mã khoá lại —
`created_time` lấy giờ **DB**, và **không có** tham số hạn dùng — chỉ đứng được khi code bên kia
**chọn** gọi SP. Một lệnh `INSERT` thẳng vào `TT_MaDoiPhien` từ code bên đó (một lỗi, không cần ác ý)
ghi được `created_time` ở tương lai ⇒ mã sống lâu hơn 2 phút, và **không lớp nào ở DB chặn**, vì
principal đó có quyền ghi mọi bảng. Rào chắn THẬT hôm nay chỉ có ở chiều ngược lại: cổng Tài trợ
(cổng công khai) bị DENY, không tạo được mã.

**Dọn khi nào:** lô bảo mật riêng **của repo cựu SV** — tạo tài khoản SQL hẹp như `TT_APP_USER` ở đây và
cấp lại quyền cho toàn bộ SP `CSV_*`. Không làm kèm tính năng đăng nhập.

## N13. 🔴 Chặn open redirect ở `quay_lai` — việc của lô đăng nhập (P4), DỄ QUÊN

**Cái gì:** luồng đăng nhập cựu SV đi qua `cổng cựu SV /login?quay_lai=<url>` rồi chuyển về cổng Tài trợ
kèm **mã đổi phiên** trong URL. Nếu `quay_lai` trỏ được ra host lạ thì đây **không chỉ là trang lừa
đảo**: người tấn công gửi link đăng nhập thật, nạn nhân đăng nhập thật, và **mã đổi phiên được chuyển
tới host của người tấn công** ⇒ họ đổi mã trước ⇒ chiếm phiên 7 ngày của nạn nhân.

**Vì sao dễ quên:** việc nằm ở **repo KIA** (cổng cựu SV), trong lô đăng nhập, và không test nào ở repo
này bắt được. Đọc code thấy "có kiểm `quay_lai`" chưa phải là đã chặn — kiểm sai cách trông y như kiểm đúng.

### Luật — lead chốt: DANH SÁCH TRẮNG, không kiểm bằng chuỗi con

1. **Phía cổng cựu SV** — `quay_lai` được chấp nhận khi và chỉ khi:
   - parse được thành URL **tuyệt đối** bằng bộ parse chuẩn (`Uri.TryCreate(…, UriKind.Absolute, …)`), và
   - **origin** (scheme + host + port) **BẰNG** một phần tử trong danh sách trắng đọc từ cấu hình.
   - 🔴 **CẤM** `StartsWith` / `EndsWith` / `Contains` / regex trên chuỗi thô.
2. **URL chuyển về (`…/doi-phien?ma=`) DỰNG TỪ ORIGIN TRONG CẤU HÌNH, không từ `quay_lai`.** `quay_lai`
   chỉ góp **đường dẫn** để cổng Tài trợ đi tiếp sau khi đổi mã. Nhờ vậy mã **không bao giờ** được gửi
   tới một host lấy từ request, kể cả khi bước 1 viết sai.
3. **Phía cổng Tài trợ** — sau khi đổi mã, đường dẫn đi tiếp cũng là một redirect: chỉ nhận đường dẫn
   **tương đối cùng origin** (bắt đầu bằng đúng một `/`, không `//`, không `\`). Sai ⇒ về `/`.
4. Không khớp, không parse được, rỗng ⇒ về **trang chủ cổng Tài trợ** (origin cấu hình). **Không** hiện
   lỗi nói vì sao từ chối.

### Ca thử BẮT BUỘC — chạy thật, không chỉ đọc code (`AGENT.md` §2)

Giả sử origin trong cấu hình là `https://taitro.example.vn`:

| `quay_lai` | Kết quả đúng | Cách kiểm sai nào để lọt |
|---|---|---|
| `https://taitro.example.vn/tai-tro/3` | ✅ nhận | — |
| `https://taitro.example.vn.evil.com/` | ❌ | `StartsWith` |
| `https://evil.com/?r=https://taitro.example.vn` | ❌ | `Contains` |
| `https://evil.com/#taitro.example.vn` | ❌ | `Contains` / `EndsWith` |
| `https://taitro.example.vn@evil.com/` | ❌ | `StartsWith` — host thật là `evil.com` |
| `//evil.com/` | ❌ | kiểm "bắt đầu bằng `/`" |
| `http://taitro.example.vn/` | ❌ | so host mà quên scheme |
| `https://taitro.example.vn:8443/` | ❌ | so host mà quên port |
| `javascript:alert(1)` | ❌ | không parse thành URL tuyệt đối http(s) |
| đường dẫn đi tiếp `/\evil.com` (phía cổng Tài trợ) | ❌ | trình duyệt coi `\` như `/` ⇒ thành `//evil.com` |

**Dọn khi nào:** lô P4. **Điều kiện đóng mục này:** cả bảng trên chạy thật trên hai cổng và ra đúng
cột "Kết quả đúng".

## N14. "Lịch sử tài trợ của tôi" tách mảnh khi một người có nhiều `CSV_TaiKhoan`

**Cái gì:** lịch sử lọc theo `TT_NhaTaiTro.id_tai_khoan_csv` = **một** `CSV_TaiKhoan.id`. Nhưng một người
thật có thể có **nhiều** tài khoản ở cổng cựu SV — repo cũ đã gặp và dựng cờ `co_nhieu_tai_khoan`
(`CSV_ThongTin_GetChiTietByIdSv`), vì dữ liệu lịch sử không có ràng buộc duy nhất trên `id_sv`.

**Hệ quả:** người đó đăng nhập bằng tài khoản A thì chỉ thấy lời khai gửi lúc dùng A; lời khai gửi lúc
dùng B **không hiện**. 🔴 **Họ thấy THIẾU lời khai của chính mình, và KHÔNG CÓ GÌ BÁO** — màn hình trông
hoàn chỉnh. (Tiền và danh sách công khai không bị ảnh hưởng: chỉ màn lịch sử bị thiếu.)

**Vì sao chấp nhận:** gộp theo `id_sv` là nối nhiều tài khoản qua một định danh cổng này không kiểm soát,
để hiện dữ liệu có trạng thái duyệt cho một phiên đăng nhập — nối sai là lộ lời khai của người khác.
Tài khoản trùng là **lỗi dữ liệu của cổng cựu SV**; chỗ sửa đúng là khử trùng bên đó.

**Dọn khi nào:** khi có người phản ánh thiếu lịch sử, hoặc khi cổng cựu SV khử trùng tài khoản. Nếu
chọn gộp theo `id_sv` thì trước hết phải trả lời: `id_sv` có trùng/sai ở chính dữ liệu đó không.

## N15. Bảng nhà tài trợ KHÔNG hiện cột "Khoa"

**Cái gì:** bảng nhà tài trợ công khai (`TaiTroChiTietPage.tsx`) đã bỏ cột "Khoa" (2026-09-17, lead
duyệt). Dữ liệu `ten_khoa` **vẫn lưu** trong `TT_NhaTaiTro`, **vẫn trả** qua view công khai và **vẫn
có** trong hợp đồng `INhaTaiTro` — chỉ không hiện.

**Vì sao chấp nhận:** đây là cổng của **chính Khoa Toán - Cơ - Tin học** — cột luôn ghi cùng một tên
là cột không phân biệt được gì (mock: 8/8 dòng có giá trị đều cùng một khoa). Bỏ nó trả lại 195px
(ngân sách 16px cũ) cho bảng, là một phần của lô làm bảng hết cuộn ngang.

**Hệ quả đã biết:** nếu có nhà tài trợ là **cựu SV khoa khác** (hoặc dữ liệu `STU_Lop` gán khoa khác),
bảng công khai **mất thông tin đó** — người đọc không có cách nào biết họ không thuộc Khoa này.

**Điều kiện thêm lại** (một trong hai):
- Dữ liệu thật có **≥ 2 giá trị `ten_khoa` khác nhau** trong các lượt đã duyệt — kiểm bằng
  `SELECT ten_khoa, COUNT(*) FROM TT_v_NhaTaiTroCongKhai GROUP BY ten_khoa` sau khi có dữ liệu thật; hoặc
- Cổng mở rộng nhận vận động cho **nhiều khoa**.

**Khi thêm lại:** đo lại ngân sách theo luật A5 (13px, giá trị dài nhất có thể — tên khoa thật có thể
tới ~237px), cộng vào sàn bảng, và **đo lại cuộn ngang ở bề rộng sát nhất** (N16). 🔄 Số cũ ở đây
("sàn 1058, @1200 dư 9px") thuộc bố cục "bảng trọn bề rộng" đã trả lại; bố cục mẫu hiện hành: sàn 698,
sát nhất @1400 dư 38px ⇒ cột Khoa ~150–237px **không lọt** nếu không bỏ cột khác hoặc nâng trần (N18).

## N16. 🔴 Bảng nhà tài trợ: biên sát nhất @1400 chỉ 38px

**Cái gì:** bố cục hàng 3 theo mẫu sếp (hai cột 61/39 từ 1400px), bảng 6 cột C2, sàn **698px**. Khung cột
trái đo thật: **736px @1400** (hẹp nhất), 760px @1440, 769px @≥1600 ⇒ biên **38 / 62 / 71px**. Dưới 1400
hàng 3 xếp dọc, khung ≥ 891px @1024 — dư nhiều.

**Vì sao chấp nhận:** bố cục mẫu là ràng buộc; 6 cột là bộ lớn nhất lọt khung với ngân sách chịu giá trị
dài nhất có thể (bảng width ở `TaiTroChiTietPage.tsx`, số đo ở khối `.hang3` trong CSS).

**🔴 CẢNH BÁO — một trong các việc sau là @1400 CUỘN NGANG LẠI:**
- nới các cột **tổng cộng ≥ 38px** (kể cả "chỉ nới cột Họ tên một chút");
- **thêm bất kỳ cột nào** — Hệ (≥195px), Khoá (≥103px), Khoa (≥150px) đều không lọt (N15, N18);
- tăng padding ô, padding/viền thẻ bao bảng, padding trang, hay đổi tỉ lệ 61/39;
- bỏ `font-size: 13px` trên `<html>` (luật A5) — mọi width phải tính lại.

**Trước khi làm:** đo lại @1400 trên trình duyệt thật (khung cuộn = tổ tiên có `overflow-x` của `<table>`,
đọc `scrollWidth − clientWidth`). Chấp nhận cuộn thì ghi rõ ở đây, đừng để nó lặng lẽ xảy ra.

> 🔄 **Trạng thái cũ (cùng ngày, đã trả lại):** "biên @1200 chỉ 9px" — thuộc bố cục "bảng trọn bề rộng"
> (8 cột, sàn 1058). Bố cục đó bị trả lại vì đổi khỏi mẫu sếp; số của nó không còn áp dụng.

## N17. 🔴 Mốc header (gộp tầng 1100 · bỏ email 1600) CHƯA TÍNH CA ĐÃ ĐĂNG NHẬP

**Cái gì:** mốc gộp hai tầng của header đã hạ **1366 → 1100** (2026-09-17). Mốc 1366 chép nguyên từ
repo cổng cựu SV (thanh 5 mục) nên màn 1280 mất thanh điều hướng dù thừa chỗ. Mốc 1100 đặt theo **đo
thật ca khách (A)** trên header 3 mục của cổng này: vừa từ **1026px** (trang có thanh cuộn dọc), biên
74px. Bảng đo đầy đủ: `AppBrandHeader.module.css`, ngay trên `@media (max-width: 1099.98px)`.

**Vì sao chưa đủ:** cổng này **chưa có ca đã đăng nhập** — luồng đăng nhập là P4. Ca đó thêm nút tài
khoản vào tầng dưới header, rộng hơn nút "Đăng nhập" (77px) rất nhiều. Mốc 1100 và mốc 1600 (bỏ email,
`AppLayout.module.css`) **đều chưa tính nó**. Không đoán trước — đo khi có.

**Số đo repo cũ để so** (header thật, thanh **5 mục**, cùng khuôn header):

| Ca | Vừa từ | Nút `actions` |
|---|---|---|
| A — khách | 1271px | 77px |
| B' — đã đăng nhập, **bỏ** email (< 1600) | **1293px** | 116px |
| B — đã đăng nhập, **có** email (≥ 1600) | 1485px | 308px (trần `.userInfo` 260px) |

⚠️ Số repo cũ là thanh 5 mục — **không** trừ tay ra số 3 mục. Đo lại trên header thật của cổng này.

**Dọn khi nào:** ngay khi P4 dựng xong phiên đăng nhập (cựu SV: tên + nút "Đăng xuất"; quản trị: nút
tài khoản). Việc phải làm:
1. Đo bề rộng nhỏ nhất còn vừa cho **mọi** biến thể `actions` có thật (luật A6 — ca rộng nhất), trên
   trang có thanh cuộn dọc, cách đo như khối trong `AppBrandHeader.module.css`.
2. Mốc gộp tầng = ca xấu nhất + biên (đã dùng 74px). Nếu ca đăng nhập đẩy mốc lên quá 1280 thì cân
   lại mốc 1600 (bỏ email) trước khi nâng mốc gộp tầng.
3. Viết lại bảng trong `AppBrandHeader.module.css` và khối ghi chú đầu `@media (max-width: 1599.98px)`
   ở `AppLayout.module.css`.

## N18. Nếu sếp đòi ĐỦ CỘT như mẫu (9 cột) — phải nâng trần trang 1440, và đó là quyết định bố cục

**Cái gì:** mẫu có 9 cột (STT · Họ tên · Ngày sinh · Hệ · Khoa · Khoá · Lớp · Số tiền · Thời gian). Ta hiện 6
(bỏ Hệ, Khoa, Khoá). Mẫu vừa 9 cột vì giá trị THPT rất ngắn (luật A9) — dữ liệu ta dài hơn, nên giữ bố cục
mẫu trong trần 1440 thì **không** vừa đủ cột.

**Hai đường — CẦN HỎI trước khi làm đường 2:**

| | Đường 1 — HIỆN HÀNH | Đường 2 — nâng trần trang |
|---|---|---|
| Bố cục | mẫu, 61/39 | mẫu, 61/39 |
| Cột | 6 (mã lớp mang hệ + khoá) | 8–9 như mẫu |
| Sàn bảng | 698px | ~1058px (8 cột, không Khoa) · ~1208px (9 cột) |
| Trần trang cần | 1440 (đang có) | **~1915px** (8 cột) · **~2160px** (9 cột) |
| Màn không cuộn | mọi màn ≥ 1400 (và < 1400 xếp dọc) | **chỉ màn ≥ ~1930px** (8 cột); 9 cột: gần như không màn nào |
| Cái giá | lệch mẫu về CỘT; Họ tên dài bị cắt | laptop 1400–1920 (phổ biến nhất) **vẫn cuộn ngang**; banner + khối "Thông tin chương trình" có dòng chữ rất dài ở màn rộng |

**Cách tính trần** — từ quy luật đo thật (khớp @1440: 0,61 × (1392 − 16) − 70 = 769px đo được):
`khung cột trái ≈ 0,61 × (trần − 48 − 16) − 70` ⇒ trần ≈ (sàn + 70) / 0,61 + 64. **Đây là tính từ quy luật,
chưa đo** ở trần mới — làm đường 2 thì đo lại.

**Cách thứ ba (ghi để khỏi quên, chưa đề xuất):** rút gọn GIÁ TRỊ thay vì bỏ cột — Khoá hiện năm nhập học
("1994", ~60px), Hệ viết tắt ("CQ", "VLVH"). Cần bảng quy đổi tên hệ → viết tắt mà hiện **không có**, và
khoá một năm đứng một mình dễ đọc nhầm năm tốt nghiệp.
