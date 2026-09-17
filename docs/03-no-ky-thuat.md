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

**Dọn khi nào:** lô bảo mật riêng **của repo cựu SV** — tạo tài khoản SQL hẹp như `TT_APP_USER` ở đây và
cấp lại quyền cho toàn bộ SP `CSV_*`. Không làm kèm tính năng đăng nhập.
