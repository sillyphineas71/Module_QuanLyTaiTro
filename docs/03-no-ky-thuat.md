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

## N2. ~~Module tài trợ chạy trên dữ liệu cứng~~ — ĐÃ TRẢ (P2b, 2026-09-17)

✅ Hai màn gọi API qua `services/taiTroApi.ts`; `taiTroMock.ts` giữ lại, **không còn được import** (bộ 7 ca xấu để
đối chiếu). 🔄 Dự đoán "màn hình không phải sửa" **không đúng hẳn**: hợp đồng `ITaiTro.ts` lệch BE 5 chỗ (tên trường),
màn phải đổi `mo_ta_ngan` → `phu_de`/`loi_keu_goi` và thêm "Chủ tài khoản"; ngoài ra thêm trạng thái lỗi có Thử lại.
Trạng thái cũ, giữ để biết:

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

## N19. API đọc công khai (P2a): năm chỗ tạm (điểm 5 đã dọn)

**1. Chưa có cache.** SP 01 ghi "lớp chống lạm dụng của endpoint công khai là cache ở tầng service (P2)".
P2a cố ý không làm (lead). Hiện mỗi lượt khách mở trang chi tiết = **3 lượt gọi SP** (02 + 03 + 04,
song song), mỗi lượt mở trang danh sách = 1. Không có rate limit ⇒ endpoint công khai hiện **không có
lớp chống lạm dụng nào**. **Ai dọn:** lô cache sau P2c. **Mở lại khi:** trước khi cổng ra Internet.

**2. `/nha-tai-tro` và `/khoan-chi` gọi thêm SP 02 để kiểm tồn tại.** SP 03/04 một mình trả `[]` cho cả
"không tồn tại", "nháp" lẫn "công khai nhưng chưa có ai" ⇒ không phân biệt được 404 với 200 `[]`. Cái
giá: 2 lượt gọi thay vì 1, và SP 02 kéo cả `mo_ta_day` NVARCHAR(MAX) chỉ để biết "có dòng". **Dọn khi:**
làm cache (điểm 1) — kiểm tồn tại đọc từ cache chi tiết; hoặc thêm SP `TT_CongKhai_ChuongTrinhTonTai`.

**3. 404 map ở `TaiTroController.KetQua`, KHÔNG ở `ResponseBase.ToActionResult()`.** `ToActionResult`
trả **400** cho MỌI mã khác SUCCESS, kể cả `DATA_NULL` — di sản repo cũ (tin tức công khai repo cũ trả
400 cho "không tìm thấy"). Sửa ở `ResponseBase` là đổi hợp đồng HTTP cho mọi controller sau này ⇒ phải
hỏi. Controller mới cần 404 thì chép `KetQua`, đừng gọi thẳng `ToActionResult`.
✅ **Lead chốt (2026-09-17): KHÔNG đụng `ToActionResult`** — giữ nợ. Hệ quả còn lại: lỗi hệ thống ra **400**, không
phải 500 (xem điểm 5).

**4. Ngày ra JSON dạng `"2025-09-15T00:00:00"`, không phải `"2025-09-15"`.** Cột DATE map vào `DateTime`
(quy ước repo cũ; Dapper + System.Data.SqlClient không map `DateOnly` sẵn). `ITaiTro.ts` ghi `ngay_sinh`
là ISO `yyyy-MM-dd` ⇒ **lệch hợp đồng**, việc của P2b: FE cắt 10 ký tự đầu, hoặc BE đổi sang `DateOnly`
+ type handler (thêm code hạ tầng — phải hỏi).

**5. ~~Lỗi hệ thống lộ chữ SQL ra ngoài~~ — ✅ ĐÃ CHE (P2a, cùng ngày).**
🔄 Trạng thái cũ: `ErrorSysResponse` ghép `ex.Message` vào `message` ⇒ endpoint CÔNG KHAI trả nguyên văn
"Login failed for user TT_APP_USER"; lỗi đã catch ở service KHÔNG được ghi log ở đâu cả.
Nay: ba cửa biến Exception thành response (`ErrorSysResponse`, middleware `ConfigureExceptionHandler`,
`CheckInsert/Update/Delete`) đều trả "Có lỗi xảy ra, vui lòng thử lại." và ghi chi tiết vào log (Serilog; tắt
`EnableRequestLog` thì stderr). Luật: `docs/02` D5.
**Còn lại:**
- lỗi hệ thống vẫn ra HTTP **400** (không 500) — hệ quả điểm 3;
- client **không có mã tra log** — người dùng báo lỗi thì chỉ tìm được theo giờ. Đề xuất (chưa làm, đổi hợp đồng
  API ⇒ hỏi): trả `HttpContext.TraceIdentifier` trong response lỗi và ghi cùng mã vào log;
- `EmailService` còn ghép `ex.Message` vào `LyDoDungSom` (dòng 199, 240) — chưa endpoint nào trả nó ra; khi
  có màn gửi mail thì phải đi qua cửa chung;
- nhánh middleware **chưa thử thật** (chưa có cách gây exception lọt khỏi service mà không thêm code thử).

## N20. 🔴 File quyền chạy SAU CÙNG — lỗi triển khai đã xảy ra thật, SẼ LẶP Ở SERVER CÔNG TY

**Chuyện gì đã xảy ra (2026-09-17, lead triển khai P1 lên `MSSQLSERVER01`):** API trả lỗi cho mọi endpoint.
Log API lúc 15:07:57: `The EXECUTE permission was denied on the object 'TT_CongKhai_GetDanhSachChuongTrinh'`.
`01_CreateLogin_TaiTro.sql` đã chạy **trước khi có SP**: vòng lặp cấp quyền cấp được 0 quyền, in một dòng
`PRINT` lẫn trong output, sqlcmd trả mã 0 — trông như thành công.

**Chẩn đoán ban đầu "thiếu GRANT SELECT trên view" là SAI** — chứng minh trên DB thật: thu hết SELECT trên 5
view trong một transaction, `TT_APP_USER` vẫn gọi được cả 4 SP `TT_CongKhai_*` (ownership chaining, mọi đối
tượng cùng chủ `dbo`), rồi ROLLBACK. "View 0 dòng" là vì **8 bảng TT_ đều rỗng**, không phải vì quyền.
🔄 Quyền SELECT trên view: thêm vào script → **GỠ cùng ngày** (lead: không cấp thứ không cần). `90_CapQuyen` nay
còn REVOKE quyền view cũ, và ghi rõ khi nào PHẢI cấp: view do chủ sở hữu KHÁC `dbo` (chuỗi đứt — file dừng
bằng lỗi 50021 ở ca đó).

**Vì sao dễ lặp lại:** tên file bắt đầu `01_` (đọc như bước đầu); `README.md` ghi "Lần đầu: … tài khoản SQL
riêng, script tạo ở `01_CreateLogin…`"; header file SQL đưa lệnh chạy không kèm thứ tự. `TRIEN_KHAI_P1.md`
thì xếp ĐÚNG (Bước 4) — nhưng người triển khai không nhất thiết mở nó trước.

**Đã sửa (lô này):**
- Bước 5 của file quyền **kiểm trước, thiếu là `THROW 50020`** (sàn: 8 bảng · 5 view · 5 SP) — chạy nhầm thứ tự
  thì dừng bằng lỗi đọc được, login + user vẫn đã tạo, chỉ việc chạy lại ở cuối.
- Header file SQL, `TRIEN_KHAI_P1.md`, `README.md`: ghi "chạy SAU CÙNG" + lý do + lỗi thật.

**✅ ĐÃ TÁCH (lead duyệt, cùng ngày):** `01_CreateLogin_TaiTro.sql` → `00_TaoLogin_TaiTro.sql` (login + user,
chạy đầu; tự nối lại user mồ côi) + `90_CapQuyen_TaiTro.sql` (mọi GRANT/DENY/REVOKE, chạy cuối, chạy lại sau mỗi
lô thêm đối tượng). Tên file nói luôn thứ tự. Sửa đủ 6 chỗ tham chiếu (README, docs/01, TRIEN_KHAI, 99_KiemTra,
TT_NhaTaiTro.sql, TT_MaDoiPhien.sql) — `grep 01_CreateLogin` chỉ còn ra các dòng LỊCH SỬ.
Kèm `97_ChayThu_CapQuyen.sql`: chạy chính `90_` trong transaction rồi ROLLBACK, tự kiểm 8 ca (N21).

**Luật cho mọi lô sau:** thêm bảng/view/SP `TT_*` ⇒ **chạy lại file quyền ở cuối lô**. `CREATE OR ALTER` giữ
quyền của SP đã có; SP MỚI không có quyền nào — API lỗi "EXECUTE permission was denied" đúng như lần này.
**Áp dụng khi triển khai lên server công ty:** làm theo `TRIEN_KHAI_P1.md` từ trên xuống, không chạy file
theo thứ tự tên.

⚠️ **Lỗi phụ tìm thấy cùng lúc:** `99_KiemTra_P1.sql` KIỂM 7 có `p.perm  ission_name` (tên cột bị tách) — lỗi
cú pháp Msg 4145, nên KIỂM 7 **chưa từng chạy được**; báo cáo "KIỂM 7 ra 0 dòng" trước đó không có cơ sở. Đã
sửa; chạy thật: 0 dòng GRANT sai + đúng 2 dòng DENY. Rà toàn bộ: N21.

## N21. Rà toàn bộ `.sql` sau vụ KIỂM 7 — kết quả và chỗ còn hở (2026-09-17)

**Bối cảnh:** "KIỂM 3/6/7 ra 0 dòng" từng được dùng để kết luận P1 xong, trong khi KIỂM 7 có lỗi cú pháp và
**chưa từng chạy**. Luật rút ra: `docs/02` C5.

**Đã kiểm, bằng máy, kèm đối chứng âm cho từng lớp (cài lỗi → phải bắt được):**

| Lớp | Bắt được | Kết quả (23 file) | Đối chứng âm |
|---|---|---|---|
| `SET PARSEONLY ON` | lỗi CÚ PHÁP | 0 lỗi | cài `FROMM` → Msg 102 ✅ |
| `SET NOEXEC ON` (98, 99, 00, 90) | tên CỘT/BẢNG sai (biên dịch, không chạy) | 0 lỗi | cài `permision_name` → Msg 207 ✅ |
| So định nghĩa FILE ↔ DB (5 view + 5 SP) | file sửa sau khi triển khai | 10/10 thân khớp; 1 lệch **chỉ trong chú thích** (xem dưới) | — |
| Chạy thật `99_KiemTra` | KIỂM sai / không chạy | KIỂM 1–7 đúng kỳ vọng; KIỂM 3 **không đạt suông** (4 SP có ghi phụ thuộc, đều trỏ view) | 🔄 bản tự THROW: hỏng KIỂM 1 → 50101 ✅ · hỏng KIỂM 7 → 50107 ✅ |
| Chạy thật `96_SoDDL_Bang` (thêm sau) | DDL bảng DB lệch file | 8 bảng / 102 cột khớp | lệch độ dài + nullable + cột thừa → 50096, đủ 3 ✅ |
| Chạy thử `97_ChayThu_CapQuyen` | **SQL động** trong `90_` | PASS 8 ca, ROLLBACK, quyền DB không đổi | cài GRANT view → FAIL 2 ✅ |

⚠️ `PARSEONLY` **bỏ lọt** đúng loại lỗi `permision_name` (tên cột sai vẫn là cú pháp hợp lệ) — lớp NOEXEC là bắt buộc.

**SQL ĐỘNG — chỉ MỘT chỗ trong cả `DB_Setup/` + `StoredProcedures/`:** `90_CapQuyen_TaiTro.sql` khối 3b
(`sp_executesql @sql` — sinh GRANT bảng/SP + REVOKE view). Tìm bằng `grep -i "sp_executesql\|EXEC *(\|EXEC *@"`.
Kiểm được bằng cách **chạy thật trong transaction rồi ROLLBACK** (GRANT/REVOKE/DENY rollback được) — đó là
`97_ChayThu_CapQuyen.sql`, dùng `:r` chạy CHÍNH file 90 chứ không chép logic. **Không còn là lỗ**, với điều kiện
chạy 97 sau mỗi lần sửa 90. Thêm SQL động ở chỗ khác ⇒ phải có cách chạy thử tương tự, ghi vào bảng này.

**CÒN HỞ — lead xử:**
1. ✅ **ĐÃ DỌN: lead chạy `98_` 2026-09-17 — PASS 19/19, đã ROLLBACK.** Trạng thái cũ (giữ để biết vì sao):
   🔴 **`98_ThuNghiem_ChanLoDuLieu.sql` CHƯA TỪNG CHẠY trên DB này** — bằng chứng: `sys.identity_columns.last_value`
   của mọi bảng TT_ là NULL (insert đã rollback vẫn để lại last_value). "PASS 19/19" chưa được chứng minh ở đây.
   Chỉ mới qua NOEXEC (biên dịch). **Chưa chạy thật vì:** nó tiêu IDENTITY ⇒ dữ liệu mẫu lead sắp nhập sẽ có id
   bắt đầu từ 4 (`TT_ChuongTrinh`), không từ 1. **Đề xuất:** chạy 98 TRƯỚC khi nhập dữ liệu mẫu, chấp nhận id
   nhảy cóc (hoặc `DBCC CHECKIDENT … RESEED` sau đó — thêm một thao tác ghi, lead quyết).
2. ~~**`99_KiemTra` không tự báo sai**~~ — ✅ **ĐÃ DỌN (lead duyệt, cùng ngày).** 🔄 Trước: kiểu "PHẢI RA 0 DÒNG" cần
   người ĐỌC — chính kiểu đã lừa ở KIỂM 7. Nay mỗi KIỂM tự THROW mã riêng **50101…50107** (n = số KIỂM), dừng ở KIỂM
   hỏng đầu tiên, mã thoát ≠ 0, và kiểm cả **tiền đề** (tập dò không rỗng). Chạy thật: PASS 7/7. Đối chứng âm: hỏng
   KIỂM 1 ⇒ 50101 ngay khối đầu; hỏng KIỂM 7 ⇒ KIỂM 1–6 đạt rồi 50107.
   ⚠️ Cái giá của "dừng ở KIỂM hỏng đầu tiên": hai KIỂM cùng hỏng thì phải sửa xong cái đầu mới thấy cái sau.
3. **DB lệch file một chữ chú thích:** `TT_CuuSV_GetLichSuTaiTroCuaToi` trên DB có "quyền **akhác** nhau", file là
   "khác". Thân SP khớp từng từ ⇒ vô hại. Lead: ghi nhận, không làm — đã ghi ở Bước 3 `TRIEN_KHAI_P1.md`.
4. ~~**Bảng không so FILE ↔ DB được như view/SP**~~ — ✅ **ĐÃ DỌN:** `96_SoDDL_Bang.sql` dựng 8 bảng từ CHÍNH file bảng
   trong `tempdb` (transaction → ROLLBACK), so `INFORMATION_SCHEMA.COLUMNS` với DB: có bảng · có cột · kiểu · độ dài ·
   precision/scale · nullable. Lệch ⇒ THROW 50096. **Chạy thật trên `MSSQLSERVER01`: 8 bảng / 102 cột KHỚP file**,
   0 cột khác thứ tự — bốn lần đổi DDL sau lần chạy đầu (ngay_sinh, loi_keu_goi, ten_chu_tai_khoan, bỏ
   ten_chuyen_nganh) **đều đã lên DB**. Đối chứng âm (bản chép TT_DuKienChi: độ dài 500→400, thu_tu NOT NULL→NULL,
   thêm cột) ⇒ bắt đủ 3 lệch.
   **Còn KHÔNG so — NỢ ĐÃ CHỐT (lead 2026-09-17: "đủ rồi", không làm):** default · index · identity · collation ·
   thứ tự cột (in để biết, không tính lệch). Lệch ở những thứ đó vẫn lọt. **Mở lại khi:** có lô đổi index/default,
   hoặc triển khai lên server có collation khác DB dev.
5. ✅ **ĐÃ DỌN:** 5 quyền SELECT trên view cấp tay đã hết — đo lại 2026-09-17: 0 quyền trên view TT_ (lead đã chạy
   `90_CapQuyen` thật).
6. ✅ **ĐÃ DỌN — `96_`/`97_` báo PASS GIẢ khi `:r` không nạp được.** Lead chạy `97_` ba lần: SSMS thường, sqlcmd sai
   thư mục — **cả hai in PASS** (kiểm trên quyền cũ); chỉ lần từ gốc repo là thật. Tái hiện được ca sqlcmd sai thư mục
   (thiếu `-b`: `:r` in lỗi, script chạy tiếp, in PASS). Sửa: `:on error exit` đầu file + `97_` xoá/kiểm **dấu phiên**
   `SESSION_CONTEXT('TT_90_CapQuyen')` do `90_` đặt ở cuối file (THROW 50031); `96_` có sẵn dấu tự nhiên — không dựng đủ
   8 bảng trong tempdb ⇒ THROW 50095. **Ma trận thử:**

   | Cách chạy | `97_` | `96_` |
   |---|---|---|
   | sqlcmd, gốc repo, `-b` | PASS ✅ | PASS ✅ |
   | sqlcmd, SAI thư mục, KHÔNG `-b` | exit 1, không PASS ✅ | exit 1, không PASS ✅ |
   | giả lập SSMS không SQLCMD Mode (tách GO, lỗi thì chạy tiếp) | 50031, **0 dòng PASS** ✅ | 50095, **0 dòng PASS** ✅ |

   Đối chứng cho bộ giả lập: chạy `99_` (không dùng `:r`) qua đó ⇒ thấy PASS — bộ giả lập không "mù" PASS.
   ⚠️ SSMS thật chưa bấm thử — dùng bộ giả lập (SqlClient, cùng phiên, lỗi đi tiếp).

## N22. GRANT đọc bảng ngoài `TT_*` — không cần cho SP tĩnh; `STU_DanhSach` cố ý KHÔNG cấp (2026-09-17)

**Yêu cầu:** thêm `STU_DanhSach` vào `90_CapQuyen` (P3 điền sẵn khoá/lớp; lead từng cấp tay một lần — đo lại DB lúc
lô này: **không có** quyền nào trên `STU_DanhSach`).
**Không làm, vì đã thử trên DB thật** (transaction → ROLLBACK, không để lại gì):
- SP chủ `dbo` đọc `STU_DanhSach` JOIN `STU_Lop` JOIN `STU_HoSoSinhVien` ON `ID_sv`, gọi bằng `TT_APP_USER` ⇒ **chạy
  được**, dù `TT_APP_USER` không có quyền trên `STU_DanhSach` và không có quyền cột `ID_sv`. Đọc thẳng ⇒ lỗi 229.
- SP chủ `dbo` chạy **SQL động** đọc `STU_DanhSach` ⇒ **lỗi 229** — chuỗi sở hữu đứt ở `sp_executesql`.
⇒ Cùng cơ chế đã gỡ quyền view: SP tĩnh không cần GRANT trên bảng nào. Và `STU_DanhSach` chứa **`Mat_khau`,
`Mat_khau_phu_huynh`, `No_hoc_phi`** — GRANT cả bảng cho cổng công khai là lộ mật khẩu SV.
**Nếu P3 hỏng ở điền sẵn khoá/lớp:** nguyên nhân không phải thiếu GRANT — đọc nguyên văn lỗi. Chỉ khi SP P3 dùng SQL
động mới cấp, **theo cột** (`ID_sv`, `ID_lop`, `IsDeleted`).
**Bảng P3/P4 sẽ đọc** (qua SP, không cần GRANT): `CSV_TaiKhoan` (id_sv, id_lop, vai_tro, trang_thai, is_deleted) ·
`STU_HoSoSinhVien` (ID_sv, Ho_ten, Ngay_sinh) · `STU_DanhSach` (ID_sv, ID_lop, IsDeleted) · `STU_Lop` (Ten_lop, ID_he,
ID_khoa, ID_chuyen_nganh, Nien_khoa) · `dmHe` · `dmKhoa` · `dmChuyenNganh` · `TT_MaDoiPhien`. Khoá = `STU_Lop.Nien_khoa`
(cách cổng cựu SV làm, `CSV_ThongKe_GetDanhMucKhoaHoc`). ⚠️ `CSV_TaiKhoan` có sẵn `id_lop` — có thể không cần đi qua
`STU_DanhSach`; P3 quyết.
~~**CÂU HỎI CHO LEAD:** khối 3 của `90_` còn GRANT SELECT trên 7 bảng ngoài TT_ — không cần cho SP tĩnh, nên gỡ?~~
✅ **Lead chốt 2026-09-17: GIỮ.** Vì: rủi ro thấp hơn hẳn `STU_DanhSach` (không bảng nào chứa mật khẩu sau khi sửa dưới)
· là lưới an toàn nếu sau này có SP dùng SQL động · gỡ tốn thêm một vòng trong khi đã dừng nhánh hạ tầng.
**Kèm một sửa:** `CSV_TaiKhoan` CÓ cột `mat_khau` (và `provider_key`) mà đang cấp CẢ BẢNG ⇒ đổi sang **theo cột**
(`id, email_dang_nhap, id_sv, vai_tro, id_lop, trang_thai, is_deleted`), REVOKE cả bảng trước. Thử trong transaction:
đọc `mat_khau` = 0, `provider_key` = 0, `vai_tro` = 1.
**Và `CSV_ThongTin` theo cột** (lead giao cùng ngày): `id_tai_khoan, sdt_hien_tai, email_hien_tai, is_deleted` — bỏ
`dia_chi_hien_tai`, `ghi_chu` (chữ tự do), `id_tinh_thanh`, `id_xa_phuong`: `TT_NhaTaiTro` chỉ có `sdt_lien_he` /
`email_lien_he`, không có gì để điền địa chỉ vào. Thử trong transaction: `dia_chi_hien_tai` = 0, `ghi_chu` = 0, `sdt_hien_tai` = 1.
Đo DB dev sau lô: **cả hai bảng đã ở dạng theo cột, khớp file** (7 + 4 cột, không còn quyền cả bảng).
**Nợ (ghi, không làm — lead):** `STU_Lop`, `dmHe`, `dmKhoa`, `dmChuyenNganh` vẫn cấp cả bảng; chỉ rà theo TÊN cột, không
thấy cột nhạy cảm. Mở lại khi: bảng danh mục nào thêm cột ngoài tên/mã, hoặc có ai đề xuất thêm bảng ngoài TT_ vào khối 3.

## N23. ~~P2b: ô định danh bị CHE (ẩn danh mức 2) vẫn vẽ "—" như ô không có dữ liệu~~ — ĐÃ TRẢ (2026-09-17)

✅ Cột Lớp: `an_dinh_danh` ⇒ "Ẩn" (nghiêng, mờ); mức 1 giữ lớp thật; doanh nghiệp vẫn "—". Kiểm trên trang thật (8082):
CT1 dòng ẩn danh mức 1 → "K39A" · CT4 dòng mức 2 → "Ẩn" · "Công ty TNHH ABC" → "—". Rà cả bảng: không còn cột nào
lẫn hai nghĩa (Họ tên / Ngày sinh đã tách; Số tiền, Thời gian không bao giờ null). Trạng thái cũ, giữ để biết:

**Cái gì:** API có `an_dinh_danh` (P2a); P2b thêm vào `ITaiTro.ts` nhưng **màn chưa dùng**. Nhà tài trợ ẩn danh mức 2
(giấu tất cả) có `ten_lop = null` VÌ BỊ CHE — cột Lớp vẽ "—", trùng ký hiệu với doanh nghiệp (không có lớp). Luật A7
muốn hai nghĩa tách nhau (cột Ngày sinh đã tách: "Ẩn" vs "—"). Hiện bảng chỉ còn cột Lớp mang định danh nên lệch
đúng một ô. **Dọn:** cột Lớp `n.an_dinh_danh ? <span className={styles.anDanh}>Ẩn</span> : oHoacGach(n.ten_lop)` —
cùng khuôn cột Ngày sinh. Chưa làm vì ngoài phạm vi P2b (lead: bỏ mock, không đổi hiển thị). **Ai:** lô FE kế.

## N24. Loại nhà tài trợ (`loai`) KHÔNG được che, kể cả ẩn danh mức 2 — cố ý, lead chốt 2026-09-17

**Cái gì:** view `TT_v_NhaTaiTroCongKhai` che tên, ngày sinh, hệ/khoa/khoá/lớp theo `muc_an_danh`, nhưng trả `loai`
nguyên vẹn. Trang chi tiết lọc bảng theo tab Cá nhân / Tập thể / Doanh nghiệp ⇒ một dòng ẩn danh mức 2 ("giấu tất
cả") vẫn lộ ra là cá nhân, tập thể hay doanh nghiệp.

**Vì sao KHÔNG che** (lead, khi agent nêu ở lô N23 — ai nêu lại thì đây là câu trả lời):
1. **Không định danh được ai:** "một doanh nghiệp ẩn danh tài trợ" không cho biết doanh nghiệp nào.
2. **Che thì tab lọc hỏng:** dòng ẩn danh không thuộc tab nào, hoặc phải thêm tab "Không rõ".
3. **Người chọn ẩn danh muốn giấu DANH TÍNH**, không giấu việc mình là doanh nghiệp.

**Mở lại khi:** có chương trình mà chỉ **MỘT** doanh nghiệp (hoặc một tập thể) tài trợ — khi đó "doanh nghiệp ẩn danh"
cộng thông tin bên ngoài (tin tức, lễ trao, biển ghi danh…) có thể đủ để đoán ra là ai. Lúc đó mới xem lại; hướng
xử (chưa chọn): che `loai` ở view khi mức 2 và nhóm dòng đó vào một tab/nhãn riêng, hoặc chỉ che khi nhóm loại đó
của chương trình có đúng một dòng.
**Nơi đổi nếu mở lại:** view 03 (`DB_Setup/Views/03. TT_v_NhaTaiTroCongKhai.sql`) + tab lọc `theoLoai` ở
`TaiTroChiTietPage.tsx` — hai chỗ đổi cùng nhau.

## N25. 🔴 Endpoint khai tài trợ CÔNG KHAI không có chống lạm dụng (P3a) — lead: ghi nợ, CHƯA làm

**Cái gì:** `POST api/tai-tro/chuong-trinh/{id}/tai-tro` không cần đăng nhập, không rate limit, không captcha. Mỗi lượt
hợp lệ tạo 1 dòng `TT_NhaTaiTro` chờ duyệt + tối đa 5 file (≤ 7,5 MB) trên đĩa. Một script lặp là đủ để:
làm đầy đĩa (1.000 lượt × 7,5 MB ≈ 7,5 GB) · ngập hàng đợi duyệt bằng lời khai rác (quản trị không phân biệt nổi).

**Rủi ro thật hiện nay: THẤP.** Cổng nội bộ Khoa, chưa phát hành, ít người biết URL; lời khai không bao giờ tự hiện ra
ngoài (phải được duyệt). Hậu quả tệ nhất là phiền (đĩa, hàng đợi), không lộ dữ liệu.
**Tăng lên khi:** URL chương trình được chia sẻ công khai — tức ngay lúc P3b phát hành modal.

**Cách xử khi cần** (rẻ → đắt):
1. **Rate limit theo IP — có sẵn trong .NET 8, không thêm gói** (`Microsoft.AspNetCore.RateLimiting`), ~8 dòng:
   `AddRateLimiter` với policy `FixedWindowLimiter` phân vùng theo `RemoteIpAddress` (vd. 5 lượt / 10 phút) +
   `app.UseRateLimiter()` + `[EnableRateLimiting("khai-tai-tro")]` trên action.
   ⚠️ Sau reverse proxy thì IP là của proxy — `UseForwardedHeaders` (đã có) phải chạy trước, và `KnownProxies.Clear()`
   hiện tin MỌI proxy ⇒ `X-Forwarded-For` giả được. Cấu hình proxy thật khi deploy.
2. **Trần theo chương trình:** `TT_NhaTaiTro_Tao` từ chối khi số lời khai chờ duyệt của chương trình vượt N (vd. 200) —
   chặn ngập hàng đợi mà không phụ thuộc IP. Một điều kiện trong SP.
3. **Captcha** (Turnstile / reCAPTCHA) ở modal P3b — dịch vụ ngoài + khoá bí mật: phải hỏi.
4. **Hạn mức đĩa:** kiểm dung lượng trống trước khi ghi, dưới ngưỡng thì từ chối — không để đầy ổ chung với DB.
**Ai / khi nào:** trước khi P3b phát hành modal ra ngoài. Lead chọn cách.

## N26. Ảnh chuyển khoản lưu trên ĐĨA máy chủ API (P3a) — tạm

**Cái gì:** file ở `<content root>/Assets/RiengTu/AnhChuyenKhoan/{guid}.{ext}`; DB chỉ lưu tên file.
✅ **Lead duyệt giữ `Assets/RiengTu` (2026-09-17)** — luật `docs/02` E1. 🔄 Ban đầu lệnh lô chốt "Assets/Upload": `Program.cs` phục vụ `Assets/Upload` **công khai** tại `/Assets/Upload`, mà ảnh CK
chứa họ tên chủ tài khoản, số tài khoản, số dư — kể cả của người chọn ẩn danh; DDL `TT_AnhChuyenKhoan` đã ghi "không được
phục vụ ở đường tĩnh công khai". `Assets/RiengTu` không có `UseStaticFiles` nào trỏ tới (đo P3a: GET trả 404).

**Kiểu hỏng đã biết:**
1. **MẤT KHI DEPLOY** nếu quy trình deploy xoá/ghi đè thư mục ứng dụng (publish ra thư mục mới, container không volume).
   Mất ảnh = lời khai chờ duyệt không còn chứng cứ. **Dọn:** đưa thư mục ra ngoài thư mục ứng dụng (đường dẫn cấu hình) hoặc
   lưu trữ đối tượng. Trước lần deploy đầu lên server công ty.
2. **KHÔNG CÓ SAO LƯU** — backup DB không gồm file. Cùng thời điểm với (1).
3. **FILE MỒ CÔI:** thứ tự ghi là FILE trước, DB sau (lý do: khối chú thích trong `KhaiTaiTroService`). DB lỗi/từ chối thì
   `finally` xoá file ngay; chỉ còn mồ côi khi xoá cũng lỗi hoặc tiến trình chết giữa chừng. Vô hại, chỉ tốn đĩa.
   **Dọn:** việc định kỳ so thư mục ↔ `TT_AnhChuyenKhoan.ten_file`, xoá file không có dòng nào VÀ cũ hơn 1 giờ. Chưa viết.
4. **CHƯA CÓ ĐƯỜNG XEM ẢNH:** P5 cần endpoint `[Authorize]` đọc file theo `id` ảnh — tra `ten_file` từ DB, KHÔNG ghép tên
   file từ request vào đường dẫn (path traversal).
