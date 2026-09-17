# 02 — Luật chung

> **Vì sao file này là BẢN CHÉP chứ không phải đường dẫn sang repo cũ**
>
> Repo `ApiQuanLyCuuSinhVien` có ~120 mục quyết định trong `ClientApp/docs/ui-no-ky-thuat.md`
> (9.247 dòng). Chép hết sang đây là dựng ngay hai bản sẽ trôi khỏi nhau — đúng bài học đã trả giá
> ba lần trong chính repo đó. Nhưng **trỏ hết sang đó cũng hỏng**: hai repo deploy riêng, ai clone
> repo này về máy không có repo kia, và đường dẫn tuyệt đối `D:\Thực tập\...` chết ngay khi ai đó
> đặt thư mục ở chỗ khác.
>
> ⇒ **Cắt theo bản chất của từng loại nội dung, không cắt theo khối lượng:**
>
> | Loại | Ví dụ | Ở đâu | Vì sao |
> |---|---|---|---|
> | **LUẬT** — ổn định, áp cho mọi màn, mọi cổng | thang màu · z-index 100 · cờ `-I` · A3.30 | **CHÉP vào đây** | Ít thay đổi ⇒ rủi ro trôi thấp. Phải đọc được khi không có repo kia. |
> | **LỊCH SỬ** — nhật ký quyết định từng lô của cổng kia | "mục 59", "R9 đo lại header" | **TRỎ sang repo cũ** | Chỉ-thêm, tra theo số mục, không ai đọc cả. Chép là chép 9.000 dòng nói về màn không tồn tại ở đây. |
>
> Tra lịch sử: `ApiQuanLyCuuSinhVien/ApiQuanLyCuuSinhVien/ClientApp/docs/ui-no-ky-thuat.md`, tìm
> theo **số mục** ghi trong ngoặc ở từng luật dưới đây.
>
> ⚠️ **Luật nào dưới đây bị phát hiện sai thì phải sửa ở CẢ HAI repo.** Không có cơ chế tự đồng bộ.

---

## A. Giao diện

**A1. Màu chỉ lấy từ token trong `index.css`. Không hex rời.** File đó mang nguyên văn từ repo gốc
và **mỗi con số đều có lý do đo được** (tỉ lệ tương phản đã tính cho từng cặp nền/chữ). Đừng "dọn
cho gọn". Thêm màu mới = thêm token + ghi tỉ lệ tương phản ngay tại chỗ.

**A2. Chữ trên ảnh do người dùng tải lên: tính cho CA XẤU NHẤT TUYỆT ĐỐI (#FFFFFF).** Không có bức
ảnh nào để đo trước — ảnh tuần sau có thể trắng tinh. Lớp phủ đen alpha 62%→82% đặt trên **khối
chữ ôm sát nội dung**, KHÔNG phủ lên cả ảnh với mốc % cố định: khối chữ dài 5 dòng sẽ dâng lên
vùng alpha thấp và tương phản tụt dưới ngưỡng mà không ai biết. (mục 80)

**A3. `z-index` của header là 100, và có trần.** (xem `AppBrandHeader.module.css`)
```
nội dung trang        0 – 45      (thead bảng 2–3, skeleton 44–45)
HEADER              100
drawer mobile      1000
#__primerPortalRoot__ 1600        Dialog / Overlay / ActionMenu
```
Header phải **trên mọi thứ của trang** và **dưới drawer + portal**. Sửa chồng lấn thì sửa ở header
— một lần cho mọi trang; hạ z-index từng phần tử của trang là vá mãi mãi.

**A4. Bảng: cắt cụt thì PHẢI có tooltip.** Mọi ô chữ đi qua `renderOVanBan`
(`components-ui/data-table/renderOVanBan.tsx`). Cắt cụt mà không có đường đọc lại giá trị đầy đủ là
**làm mất dữ liệu khỏi giao diện**, không phải vấn đề thẩm mỹ.

**A5. Width cột tính theo font 16px, KHÔNG phải 14px.** Không file nào đặt `font-size` cho `body`
hay `BaseStyles.tsx` ⇒ bảng chạy ở mặc định trình duyệt. Ngân sách cũ tính theo 14px làm **6/8 cột**
của bảng nhà tài trợ thiếu chỗ. Cột **đóng** (định dạng cố định: ngày, tiền, khoá) thì đặt width đủ
vĩnh viễn; cột **mở** (chữ tự do như họ tên) thì chấp nhận cắt + tooltip, đừng nới mãi.

**A6. Thang bề rộng: đo theo CA `actions` RỘNG NHẤT, không theo ca đang nhìn thấy lúc đo.** Header
có ca khách (~110px) và ca đã đăng nhập (~308px). Bảng ngân sách cũ chỉ tính ca 110px nên **chưa
bao giờ mô tả ca đã đăng nhập** — và ca đó đã tràn suốt nhiều lô mà không ai đo ra. (mục 111)

**A7. "Không có dữ liệu" và "cố tình giấu" là HAI câu trả lời khác nhau** ⇒ hai cách hiển thị khác
nhau (`—` vs `Nhà tài trợ ẩn danh`). Dùng chung một ký hiệu là nói dối người đọc.

**A8. Ảnh thiếu và ảnh HỎNG xử như nhau** (ô gradient thay thế), **trừ mã QR**: QR hỏng thì **ẩn
hẳn khối**. Một ô vuông ở đúng chỗ QR *trông như* một mã QR — người ta giơ điện thoại lên quét rồi
kết luận hệ thống hỏng. Ô giữ chỗ cho thứ **phải quét được mới có nghĩa** là một lời hứa sai.

## B. Làm hay không làm

**B1 (A3.30). KHÔNG DỰNG VỎ CHO THỨ THIẾU NĂNG LỰC.** Nút bấm-không-ra-gì trên trang công khai đọc
ra là "cổng hỏng" với đúng nhóm người mình đang mời đóng góp. Thà thiếu một nút còn hơn có một nút
chết. Thiếu năng lực thì ghi vào `03-no-ky-thuat.md`, đừng dựng vỏ rồi tính sau.

**B2. Mock phải XẤU CÓ CHỦ ĐÍCH.** `taiTroMock.ts` cài sẵn 7 ca xấu (tên 66 ký tự · chương trình 0
nhà tài trợ · không ảnh bìa · vượt 100% · kết thúc mà chưa đạt · nhà tài trợ ẩn danh · doanh nghiệp
thiếu cấp). **Mock đẹp là lý do màn hình vỡ đúng lúc có dữ liệu thật.** Muốn bỏ một ca thì phải nói
được nhánh giao diện nó canh giữ đã biến đi đâu.

**B3. Con số tổng LUÔN tính từ mảng con, không đọc cột tổng.** Cột tổng + trigger sẽ lệch, và màn
hình sẽ hứa một số trong khi hệ thống làm theo số khác.

**B4. `npm start` KHÔNG đáng tin để đếm cảnh báo** — nó gộp/ẩn bớt. Đếm bằng `npx eslint src --ext
.ts,.tsx`. Mốc hiện tại của repo này ghi ở `03-no-ky-thuat.md`.

## C. Cơ sở dữ liệu

**C1. Mọi file trong `StoredProcedures/` mở đầu bằng:**
```sql
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
```
**và mọi lệnh `sqlcmd` phải có cờ `-I`** (kể cả khi quay lui một bản cũ). DB có filtered index; SQL
Server **ghi nhớ hai thiết lập đó lúc CREATE**. Tạo SP dưới `QUOTED_IDENTIFIER OFF` thì CREATE vẫn
thành công nhưng **mọi lần GỌI** đều chết **Msg 1934**. Mặc định của `sqlcmd` là OFF (SSMS là ON) —
đó là lý do lỗi này chỉ xuất hiện khi deploy bằng script.

**C2. Năm trường audit BẮT BUỘC ở mọi bảng `TT_*`** (khớp `Models/Base/BaseModel.cs`):
```sql
is_deleted BIT DEFAULT(0), created_time DATETIME DEFAULT(GETDATE()), created_user_id NVARCHAR(36),
last_modified_times DATETIME DEFAULT(GETDATE()), last_modified_user_id NVARCHAR(36)
```
Xoá **mềm** (`is_deleted = 1`). Mọi truy vấn đọc phải lọc `is_deleted = 0`.

**C3 (A6.4). Dữ liệu cá nhân không ra trang công khai.** Bảng nhà tài trợ công khai **cố ý không có
ngày sinh**: ghép họ tên + lớp đã định danh được một người cụ thể, thêm ngày sinh là công bố dữ liệu
cá nhân ra Internet. Thêm cột vào một màn công khai thì phải trả lời được câu "ghép với các cột đang
có thì định danh được ai?" — xem thêm giới hạn quyền theo cột ở [01-kien-truc.md](01-kien-truc.md#4).

**C4. Tên cột viết thường, tiền tố bảng `TT_`, liên kết mềm (không khoá ngoại).**

## D. Cạm bẫy đã verify trong chính mã nguồn này

Hai cái dưới đây **đã chép sang repo này** và vẫn còn nguyên:

1. **`Extentions.RemoveSpace()` treo vô hạn** — `input.Replace(" ", "")` bị vứt kết quả, vòng
   `do…while (input.IndexOf(" ") >= 0)` không bao giờ thoát. `ToInt32()` và `ToDecimal()` đều gọi nó
   ⇒ **dữ liệu có dấu cách sẽ treo thread**. Sửa trước khi dùng ba hàm đó.
2. **`MustLogged` fail-open và đang TẮT** — `catch (Exception)` rồi cho request đi tiếp, và dòng
   `options.Filters.Add<MustLogged>()` đang comment trong `Program.cs`. Bật ở P4 thì phải sửa luôn
   nhánh catch, không thì filter chỉ là trang trí.
3. **`ToInt` trả -1 còn `MapInt` trả 0** khi null. Dễ nhầm.
4. **`ConvertToDataTable<T>` sắp cột theo alphabet** khi không chỉ định `columnNames` — SQL TVP type
   phải khai báo cột **đúng thứ tự alphabet**, nếu không dữ liệu lệch cột âm thầm.
