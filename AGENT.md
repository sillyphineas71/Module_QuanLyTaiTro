# AGENT.md — Luật làm việc

> 🔴 **Đọc file này và `CLAUDE.md` trước MỌI công việc, kể cả việc nhỏ nhất.**
> Không có ngoại lệ cho "việc này nhỏ thôi".

---

## 1. Không tự quyết

Agent **đề xuất**, lead **quyết**. Khi gặp một trong những thứ dưới đây thì **dừng, hỏi, chờ**:

| Phải hỏi lead | Ví dụ |
|---|---|
| Đổi **schema** đang có dữ liệu | thêm/xoá cột, đổi kiểu, thêm bảng |
| Đổi **hợp đồng API** | đổi tên trường JSON, đổi kiểu trả về |
| Đổi một **quyết định đã ghi** trong `CLAUDE.md` mục 5 | |
| Thêm **dependency** | kể cả gói nhỏ, kể cả để "tiện" |
| Sửa **repo cổng Cựu sinh viên** | nó đang chạy thật |
| Việc **không đảo ngược được** | gửi mail, xoá dữ liệu, chạy SQL trên DB thật |
| Câu hỏi **nghiệp vụ** | ai được làm gì, hiển thị gì cho ai, bao nhiêu là đủ |
| Phạm vi **rộng hơn đề bài** | "tiện thể sửa luôn…" |

Ngược lại, **không cần hỏi** cho: đặt tên biến, tách hàm, sửa lỗi rõ ràng trong phạm vi lô,
chọn cách thi công khi kết quả nhìn thấy không đổi.

⚠️ Khi không chắc thuộc nhóm nào → **hỏi**. Một câu hỏi rẻ hơn một lô phải làm lại.

---

## 2. Bác lại lead khi có bằng chứng

Đây là **nghĩa vụ**, không phải quyền.

Nếu tiền đề trong prompt sai — tên file không tồn tại, con số không khớp, cơ chế hoạt động
khác với mô tả — thì **nói thẳng và đưa số đo**, đừng làm theo rồi để lỗi lộ ra sau.

Cách bác đúng:
- nêu **cái gì sai**, kèm bằng chứng đọc được (dòng code, kết quả lệnh, số đo)
- nêu **hệ quả nếu làm theo**
- đề xuất cách khác, rồi **chờ lead**

🔴 **Đo trước, đừng đoán.** Gặp lỗi bố cục thì hỏi số đo trước, đọc CSS sau — một con số như
`276 × 1.6px` phân biệt ngay "bị bóp" với "bị tràn", hai nguyên nhân khác hẳn nhau.

🔴 **Chứng minh trên thứ đang chạy**, không phải trên mã nguồn. Đọc bundle đã build, gọi SP
thật, chạy lệnh thật. "Đọc code thấy đúng" đã sai nhiều lần.

---

## 3. Tuân thủ kiến trúc

Đọc `CLAUDE.md` mục 3 trước. Không sáng tạo kiến trúc mới giữa chừng.

1. **Mọi truy vấn qua Stored Procedure.** Không SQL inline, không EF Core.
2. **Không `SELECT *`.** Liệt kê cột tường minh.
3. Mọi bảng đủ **5 trường audit**: `is_deleted` · `created_time` · `created_user_id` ·
   `last_modified_times` · `last_modified_user_id`.
4. Mọi SP mở đầu `SET ANSI_NULLS ON` + `SET QUOTED_IDENTIFIER ON`.
   ⚠️ Deploy bằng `sqlcmd` **phải có cờ `-I`**. Quên là lệnh ghi lên bảng có filtered index
   sẽ lỗi `Msg 1934`.
5. **Tiền tố `TT_`** cho mọi bảng và SP của cổng này.
6. **Không thêm dependency.** Cần gì tìm trong `package.json` trước.
7. **Không sửa `Models/Table/`** theo ý mình. Không chạy migration.
8. **Không perl trên file tiếng Việt.** Sau khi sửa chạy `file <path>` xác nhận UTF-8.

### 🔴 A6.4 — kỷ luật đọc bảng hệ đào tạo

`STU_HoSoSinhVien` chứa **CMND, ảnh CMND, số tài khoản ngân hàng, hộ chiếu, hoàn cảnh gia đình**.

Cổng này **công khai**. Chỉ đọc đúng cột trong danh sách trắng: `Ho_ten`, `Ngay_sinh`.

⚠️ `GRANT SELECT` theo cột **không phải lớp chặn thật**: một SP do `dbo` sở hữu mà đọc thêm
cột thì *ownership chaining* bỏ qua kiểm tra quyền. **Lớp chặn thật là kỷ luật viết SP.**

### 🔴 Chặn lộ dữ liệu chưa duyệt

SP công khai tên `TT_CongKhai_*` và **chỉ đọc view, không đọc bảng nào**.
Điều kiện "đã duyệt", che ẩn danh, chặn chương trình nháp — mỗi thứ viết **đúng một lần**
trong view.

Quên một chỗ là lộ lời khai chưa duyệt, gồm cả tên người chưa chắc đã chuyển tiền.

---

## 4. Ba luật giao diện

### Không dựng vỏ cho thứ chưa có

Nút bấm không ra gì, mục điều hướng dẫn 404, cột luôn rỗng — đều là **lời hứa sai**.

Phân biệt hai loại thiếu:
- **thiếu DỮ LIỆU** → dựng vỏ được, lấp bằng một chuỗi trung thực
- **thiếu NĂNG LỰC** → đừng dựng gì cả

### Màu không được là tín hiệu duy nhất

Mọi cặp chữ/nền phải đạt **WCAG AA 4.5:1** (3:1 cho phi văn bản). **Tự tính và báo bảng.**

Dự án gốc đã **chín lần** phép đo tương phản bác một lựa chọn thiết kế. Đừng chọn màu bằng mắt.

⚠️ `--attention-fg` chỉ an toàn trên **trắng** hoặc `--attention-subtle`. Nó rớt AA trên
`--surface-page` (4.46) và `--brand-050` (4.42).

### Chữ đè lên ảnh do người dùng tải lên

Không đo trước được. Gradient đặt trên **khối chữ**, không trên cả ảnh. Alpha tính cho ca xấu
nhất tuyệt đối (ảnh trắng tinh) — sàn **53,5%**.

---

## 5. Công cụ nào tin được, công cụ nào không

| Lệnh | Bắt được | **KHÔNG** bắt được |
|---|---|---|
| `tsc --noEmit` | lỗi kiểu TypeScript | lỗi trong `.css` · `[object Object]` trong JSX |
| `npm start` | lỗi biên dịch | **số cảnh báo** — chạy eslint trực tiếp |
| `dotnet build` | lỗi C# | lỗi trong SP — chỉ nổ khi gọi SP thật |
| `grep -i` | chữ ASCII | **hoa/thường tiếng Việt** — tìm cả hai dạng |

⚠️ Sửa `.css` xong phải chạy `npm start` — `tsc` không đọc `.css`.
⚠️ Sửa SP xong phải gọi SP thật — build xanh không nói gì về SQL.
⚠️ Máy dev thiếu .NET 8 runtime → `dotnet run --roll-forward LatestMajor`. **Đừng** thêm
`<RollForward>` vào `.csproj`, nó đổi hành vi deploy.

---

## 6. Hai bẫy trong `components-ui`

**`TextAreaAutoHeight` hardcode `rows={1}` sau `{...props}`** ⇒ prop `rows` bị nuốt.
Dùng `sx={{ minHeight }}`. Lỗi này đã cắn hai lần ở repo gốc.
⚠️ Nhưng `onChange` **được** chuyển tiếp — đừng "sửa cho nhất quán" cái không hỏng.

**`renderOVanBan` đi CẶP với rule cắt cụt trong CSS module.**
Bỏ một cái mà giữ cái kia là cắt cụt trần, mất dữ liệu, không lỗi nào báo.

---

## 7. Cách báo cáo

Viết **tiếng Việt**. Mỗi mục tối đa **5 dòng**. Chi tiết ghi vào `docs/`, không vào báo cáo.

Mục cuối **luôn là**: *"Khác mô tả của lead / rủi ro"* — kể cả khi không có gì.

Trong đó nêu rõ:
- chỗ nào làm **khác yêu cầu**, và vì sao
- chỗ nào **chưa kiểm được**, cần lead bấm tay
- chỗ nào **tự tạo ra một lỗi rồi tự sửa** — đừng giấu, nó là dữ kiện

Kết thúc mọi lô: `tsc` sạch · eslint đúng số cảnh báo cũ · `npm start` compile được ·
**KHÔNG commit** · **KHÔNG chạy SQL**.

---

## 8. Cập nhật tài liệu

Sau mỗi lô, tự hỏi: *có gì vừa làm cho một dòng trong `CLAUDE.md` hoặc `docs/` thành sai không?*

- Bài toán đổi · lô xong · quyết định cũ bị đảo → cập nhật `CLAUDE.md`
- Chấp nhận một chỗ tạm → ghi `docs/03-no-ky-thuat.md`, kèm *ai dọn, khi nào, điều kiện mở lại*
- Học được một luật mới → ghi `docs/02-luat-chung.md`

🔴 **Đừng xoá lập luận cũ khi cập nhật.** Ghi cả hai trạng thái và ghi rõ cái nào thắng —
người sau cần biết nó *từng* đúng, và vì sao thôi đúng.

---

## 9. Chép từ repo gốc

`ApiQuanLyCuuSinhVien` là nơi tra **lịch sử quyết định** (~120 mục,
`ClientApp/docs/ui-no-ky-thuat.md`).

Khi chép mã sang đây, đổi theo: `Alumni*` → `App*` · bỏ tầng `cuu-sinh-vien/` ·
bỏ tiền tố URL `/alumni`.

⚠️ `index.css` mang **nguyên văn**. Mỗi con số trong đó có lý do. Đừng "dọn cho gọn".
