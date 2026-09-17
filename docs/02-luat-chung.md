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

**A5. Width cột tính theo font 13px — ĐO TRONG DOM THẬT, đừng tin comment hay trí nhớ.** (sửa
2026-09-17)

- **Font gốc là 13px**, đặt ở **`public/index.html` dòng 2**: `<html lang="vi" style="font-size: 13px;">`.
  `body` và `BaseStyles.tsx` không khai `font-size`, nên dòng đó là thứ DUY NHẤT đặt cỡ chữ gốc:
  ô bảng 13px, `1rem = 13px`, padding ô `0.75rem` = **9,75px mỗi bên** (không phải 12px).
- **Cách kiểm — mỗi lần định con số width:** mở trang thật, chạy trong DevTools
  `getComputedStyle(document.querySelector('table tbody td')).fontSize` (và `.paddingLeft`). Muốn
  biết một cột CẦN bao nhiêu: đặt chuỗi ca xấu nhất vào ô thật, gỡ width cố định
  (`table-layout:auto; width:max-content`), đọc bề rộng `<th>`. Đo, đừng nhân "số ký tự × px/ký tự".
- **Ngân sách chịu GIÁ TRỊ DÀI NHẤT CÓ THỂ, không phải dài nhất trong mock.** Mock ngắn hơn dữ liệu
  thật một cách có hệ thống (vd lớp mock "K39A", lớp thật "CQ56/11.01"). Chuỗi số/ngày dùng chữ số
  RỘNG NHẤT của font (Be Vietnam Pro 13px: "4").
- Cột **đóng** (ngày, tiền, khoá) thì đặt width đủ vĩnh viễn; cột **mở** (họ tên) và **nửa đóng**
  (hệ, lớp — từ danh mục) thì ghi rõ ngưỡng, quá ngưỡng thì chấp nhận cắt + tooltip, đừng nới mãi.
  ⚠️ Cắt cụt đi CẶP: `renderOVanBan` (có `title`) + rule cắt cụt trong CSS module — bỏ một giữ một
  là hỏng.

> 🔄 **Trạng thái cũ — SAI, giữ lại để biết vì sao lệch:** "Width cột tính theo font **16px**, KHÔNG
> phải 14px. Không file nào đặt `font-size` cho `body` hay `BaseStyles.tsx` ⇒ bảng chạy ở mặc định
> trình duyệt." Vế sau đúng, kết luận sai: **quên thẻ `<html>`**. Hệ quả: mọi width tính theo 16px +
> padding 12px **cấp thừa ~20% cùng một hướng** (bảng nhà tài trợ: sàn 1270px, nội dung thật cần
> ~1047px), và bảng cuộn ngang vì thừa chứ không vì thiếu.
> Trớ trêu: docs repo cổng cựu SV **đã biết 13px từ lâu** (`ui-no-ky-thuat.md` mục 8, "Bỏ
> `font-size: 13px` trên `<html>` — HOÃN") — luật 16px được viết sau, không đối chiếu mục đó, và
> không đo DOM. Đó chính là lý do vế "đo trong DOM thật" đứng ở tiêu đề luật.

**A6. Thang bề rộng: đo theo CA `actions` RỘNG NHẤT, không theo ca đang nhìn thấy lúc đo.** Header
có ca khách (~110px) và ca đã đăng nhập (~308px). Bảng ngân sách cũ chỉ tính ca 110px nên **chưa
bao giờ mô tả ca đã đăng nhập** — và ca đó đã tràn suốt nhiều lô mà không ai đo ra. (mục 111)

**A7. "Không có dữ liệu" và "cố tình giấu" là HAI câu trả lời khác nhau** ⇒ hai cách hiển thị khác
nhau (`—` vs `Nhà tài trợ ẩn danh`). Dùng chung một ký hiệu là nói dối người đọc.

**A8. Ảnh thiếu và ảnh HỎNG xử như nhau** (ô gradient thay thế), **trừ mã QR**: QR hỏng thì **ẩn
hẳn khối**. Một ô vuông ở đúng chỗ QR *trông như* một mã QR — người ta giơ điện thoại lên quét rồi
kết luận hệ thống hỏng. Ô giữ chỗ cho thứ **phải quét được mới có nghĩa** là một lời hứa sai.

**A9. Mẫu THPT có giá trị NGẮN HƠN dữ liệu đại học ở MỌI cột định danh — chép bố cục được, chép
số cột thì không.** (2026-09-17)

Mẫu sếp là màn của một **trường THPT**: bảng nhà tài trợ vừa 9 cột trong khung ~61% **không phải vì
ít cột** mà vì mỗi ô định danh chỉ vài ký tự. Cùng cột, dữ liệu của cổng này dài gấp đôi:

| Cột | Mẫu THPT | px trong ảnh mẫu (thu nhỏ) | Cổng này (đại học) — ca dài nhất | Cần ở 13px (đo DOM) |
|---|---|---|---|---|
| Hệ | "12" (khối lớp) | ~37 | "Liên thông vừa làm vừa học" | 195 |
| Khoa | "Toán" (môn học) | ~51 | tên khoa đầy đủ | ~237 |
| Khoá | "1994" (một năm) | ~47 | "1994-1998" | 103 |
| Lớp | "A2" | ~44 | "CQ56/11.01" | 93 |
| **Hệ + Khoá + Lớp** (so cùng bộ ba) | | | | **~391** |
| **Cả 4 cột định danh** | | **~180** (≈ 250px thật khi quy tỉ lệ ảnh ~0,72) | | **~628** |

⚠️ Cột px ảnh mẫu là **ước lượng theo toạ độ trên ảnh 1219px** (ảnh thu nhỏ từ bản gốc ~1690–1820px);
cột "Cần" là **đo DOM thật**. So để thấy **cỡ chênh**, đừng trừ hai cột cho nhau lấy số chính xác.

- **Hệ quả:** mọi màn chép bố cục từ mẫu đó sẽ gặp lại đúng chuyện này. **Giữ bố cục mẫu (ràng buộc),
  điều chỉnh số cột (biến)** — và quyết định cột theo **độ dài dữ liệu thật**, không theo mẫu.
- **Trước khi thêm một cột "cho giống mẫu":** đo ca dài nhất có thể (luật A5) rồi cộng vào sàn bảng, so
  với khung thật của vùng chứa. Đừng suy ra "mẫu vừa thì ta vừa".
- **Cột lặp thông tin đã có thì bỏ trước:** mã lớp thật tự mang hệ + khoá ("CQ56/11.01" = chính quy,
  khoá 56; "K66A1" = khoá 66) — đó là lý do bảng nhà tài trợ bỏ Hệ, Khoá mà giữ Lớp.

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

**C3 (A6.4). Dữ liệu cá nhân không ra trang công khai.** ~~Bảng nhà tài trợ công khai **cố ý không có
ngày sinh**~~: ghép họ tên + lớp đã định danh được một người cụ thể, thêm ngày sinh là công bố dữ liệu
cá nhân ra Internet. Thêm cột vào một màn công khai thì phải trả lời được câu "ghép với các cột đang
có thì định danh được ai?" — xem thêm giới hạn quyền theo cột ở [01-kien-truc.md](01-kien-truc.md#4).

> 🔄 **Ngoại lệ đã ghi (2026-09-17): ngày sinh NAY CÓ trên bảng công khai** — quyết định của sếp, theo
> mẫu. Luật C3 **vẫn giữ** cho mọi cột khác; ngày sinh là ngoại lệ **có tên**, không phải tiền lệ.
> Giảm thiểu: ngày sinh chỉ hiện khi `muc_an_danh = 0` (đi theo tên, không theo lớp) — view 03.
> Ba lớp quyết định: `CLAUDE.md` mục 5, "Ngày sinh theo mẫu sếp".
> ⚠️ Câu hỏi của C3 cho ngày sinh có câu trả lời là **"được"** — tức người thêm cột tiếp theo **không**
> được viện dẫn ngày sinh làm lý do để thêm.

**C4. Tên cột viết thường, tiền tố bảng `TT_`, liên kết mềm (không khoá ngoại).**

**C5. 🔴 Một script KIỂM không chạy được TỆ HƠN không có script — nó cho cảm giác đã kiểm.**
Cùng họ với B4 ("`npm start` không đáng tin để đếm cảnh báo") và bảng công cụ ở `AGENT.md` §5.
**Chuyện thật (2026-09-17):** `99_KiemTra_P1.sql` KIỂM 7 có `p.perm  ission_name` (tên cột bị tách) — lỗi cú
pháp, khối đó **chưa từng chạy**. Nhưng "KIỂM 3/6/7 ra 0 dòng" vẫn được dùng để kết luận P1 xong: output
lỗi của một khối "PHẢI RA 0 DÒNG" nhìn lướt rất giống 0 dòng. Cùng lúc, `98_ThuNghiem` ("PASS 19/19") hoá ra
**chưa từng chạy** trên DB đó (docs/03 N21).
**Luật:**
1. Một script kiểm chỉ được dùng làm bằng chứng khi **đã thấy nó chạy thật trên đúng DB** — mã thoát 0 VÀ đọc
   output. "Có file kiểm" không phải bằng chứng.
2. Mỗi lớp kiểm phải có **đối chứng âm**: cài một lỗi cố ý, thấy nó bị bắt. Không bắt được lỗi cài sẵn ⇒ lớp
   đó đang pass suông.
3. Kiểm kiểu "PHẢI RA 0 DÒNG" phải chứng minh **tiền đề không rỗng** (KIỂM 3 dò `sql_expression_dependencies` —
   SP không ghi phụ thuộc thì luôn 0 dòng). Tốt hơn: script **tự THROW** khi sai (như `96_`–`99_`), đừng bắt
   người đọc output. Mỗi mục kiểm một **mã lỗi riêng** — đọc mã là biết mục nào hỏng (`99_`: 5010n = KIỂM n).
4. **"Có file" ≠ "DB giống file".** File DDL bọc `IF NOT EXISTS` bỏ qua lặng lẽ khi bảng đã có; view/SP có thể bị
   sửa file sau khi triển khai. So bằng thứ đang chạy: view/SP so `sys.sql_modules`, bảng so `INFORMATION_SCHEMA.COLUMNS`
   với bảng dựng từ chính file trong `tempdb` (`96_SoDDL_Bang`) — không phân tích chữ `CREATE TABLE`.
5. Viết chú thích khối trong SQL: đừng để cặp gạch-chéo-sao xuất hiện bên trong (vd. đường dẫn thư mục + dấu sao) —
   nó mở chú thích **lồng**, cả batch lỗi Msg 113.
6. Công cụ SQL, cái nào bắt gì:

| Cách | Bắt được | KHÔNG bắt được |
|---|---|---|
| `SET PARSEONLY ON` | lỗi cú pháp | tên cột/bảng sai (`permision_name` qua được!) · SQL động |
| `SET NOEXEC ON` | + tên cột/bảng sai (biên dịch, không chạy) | lỗi lúc chạy · SQL động · logic |
| Chạy trong `BEGIN TRAN … ROLLBACK` | + SQL động, quyền, logic | thứ không rollback được (IDENTITY vẫn tăng) |
| `dotnet build` | lỗi C# | mọi thứ trong SQL (`AGENT.md` §5) |

**C6. 🔴 Script kiểm phải CHỨNG MINH NÓ ĐÃ CHẠY trước khi báo kết quả.** Anh em của C5: C5 là "script có chạy
được không", C6 là "script có chạy trên ĐÚNG thứ nó định kiểm không".
**Chuyện thật (2026-09-17), BA lần thất bại từ BA hướng khác nhau:**
1. `99_` KIỂM 7 có lỗi cú pháp ⇒ khối đó không chạy, output lỗi bị đọc thành "0 dòng" (C5).
2. `97_` chạy trong SSMS thường ⇒ dòng `:r` là lỗi cú pháp, SSMS **bỏ qua rồi chạy tiếp** ⇒ kiểm trên quyền CŨ ⇒ PASS.
3. `97_` chạy bằng sqlcmd sai thư mục, thiếu `-b` ⇒ `:r` không thấy file, **in lỗi rồi chạy tiếp** ⇒ PASS.
Ba nguyên nhân (cú pháp · công cụ · thư mục) — cùng một hậu quả: **PASS trên trạng thái không phải thứ cần kiểm.**
**Luật:**
- Phần được kiểm phải **để lại DẤU** mà script kiểm **xoá trước, kiểm sau**. Không thấy dấu ⇒ THROW, không in PASS.
  Dấu tốt nhất là chính kết quả không thể có sẵn (`96_`: bảng trong tempdb đã kiểm rỗng trước). Khi thứ được kiểm
  có thể ĐÃ đúng sẵn trên DB (quyền — `97_`), phải có dấu riêng: `SESSION_CONTEXT` (sống theo phiên, ROLLBACK không xoá).
- Dòng PASS phải kiểm lại dấu **ngay trước khi in** — SSMS không dừng sau lỗi, batch sau vẫn chạy.
- File dùng lệnh sqlcmd (`:r`) mở đầu bằng `:on error exit`: dừng ở lỗi đầu tiên kể cả khi quên `-b`.
- Thử **từng cách chạy sai** cụ thể, không chỉ cách đúng — bảng ma trận ở docs/03 N21 mục 6.

## D. Cạm bẫy đã verify trong chính mã nguồn này

Các mục dưới đây **đã chép sang repo này**; 1–4 vẫn còn nguyên, 5 đã sửa:

1. **`Extentions.RemoveSpace()` treo vô hạn** — `input.Replace(" ", "")` bị vứt kết quả, vòng
   `do…while (input.IndexOf(" ") >= 0)` không bao giờ thoát. `ToInt32()` và `ToDecimal()` đều gọi nó
   ⇒ **dữ liệu có dấu cách sẽ treo thread**. Sửa trước khi dùng ba hàm đó.
2. **`MustLogged` fail-open và đang TẮT** — `catch (Exception)` rồi cho request đi tiếp, và dòng
   `options.Filters.Add<MustLogged>()` đang comment trong `Program.cs`. Bật ở P4 thì phải sửa luôn
   nhánh catch, không thì filter chỉ là trang trí.
3. **`ToInt` trả -1 còn `MapInt` trả 0** khi null. Dễ nhầm.
4. **`ConvertToDataTable<T>` sắp cột theo alphabet** khi không chỉ định `columnNames` — SQL TVP type
   phải khai báo cột **đúng thứ tự alphabet**, nếu không dữ liệu lệch cột âm thầm.
5. **Chữ của một Exception KHÔNG BAO GIỜ rời máy chủ.** 🔄 Repo cũ ghép `ex.Message` vào response ở ba chỗ
   (`ErrorSysResponse`, middleware, `CheckInsert/Update/Delete`) — nằm sau `[Authorize]` nên ít nguy; ở cổng
   công khai này nó trả tên tài khoản SQL cho người lạ (đo thật P2a). Đã sửa cả ba (`docs/03` N19.5).
   **Phân biệt lỗi hệ thống / nghiệp vụ theo ĐƯỜNG ĐI, không theo nội dung:** lỗi nghiệp vụ = service tự dựng
   response với mã cụ thể + câu viết sẵn; mọi thứ tới `catch` = lỗi hệ thống = câu chung.
   ⚠️ Vì vậy **đừng `throw` để báo lỗi cho người dùng** — câu đó sẽ bị che. Che nhầm là hỏng về phía an toàn.

## E. File người dùng tải lên

**E1. 🔴 TRƯỚC KHI CHỌN CHỖ LƯU BẤT KỲ FILE NÀO: kiểm thư mục đó CÓ ĐƯỢC PHỤC VỤ CÔNG KHAI không.**
Mọi `app.UseStaticFiles(...)` trong `Program.cs` biến MỘT thư mục (và mọi thư mục con) thành URL ai cũng tải được, không
cần đăng nhập. Tên file GUID khó đoán nhưng KHÔNG phải rào chắn: URL rò qua log, lịch sử trình duyệt, ảnh chụp màn hình,
header Referer.

Hiện trạng (đọc `Program.cs`, 2026-09-17 — **đọc lại mỗi lần**, danh sách này không tự cập nhật):

| Thư mục trên đĩa | Phục vụ công khai? | Dùng cho |
|---|---|---|
| `Assets/Template` | ✅ CÓ — `/Assets/Template` | mẫu Word/Excel tải về |
| `Assets/Upload` | ✅ CÓ — `/Assets/Upload` | CHỈ file vốn công khai (sẽ là ảnh bìa, minh chứng chi) |
| `Assets/RiengTu/*` | ❌ KHÔNG | file riêng tư — ảnh chuyển khoản (`Assets/RiengTu/AnhChuyenKhoan`) |

**Cách kiểm trước khi chọn chỗ lưu:** `grep -n "UseStaticFiles" -A 6 ApiQuanLyTaiTro/Program.cs` — so đường dẫn định lưu với
mọi `PhysicalFileProvider`. Sau khi lưu thử một file: `GET` đúng đường đó phải ra **404**.
**File riêng tư chỉ ra ngoài qua endpoint `[Authorize]`**, tra tên file từ DB theo id — không ghép tên từ request vào đường dẫn.
⚠️ **Đừng thêm `UseStaticFiles` trỏ vào `Assets` hay `Assets/RiengTu`** "cho tiện xem ảnh" — là mở cả ảnh ngân hàng ra ngoài.

**Chuyện thật (P3a, 2026-09-17):** lệnh lô chốt lưu ảnh chuyển khoản ở `Assets/Upload`. Thư mục đó phục vụ công khai; ảnh CK
chứa tên chủ tài khoản, số tài khoản, số dư — **kể cả của người chọn ẩn danh**. Làm theo lệnh là phá chính tính năng ẩn
danh vừa dựng. Agent đọc `Program.cs`, đối chiếu với chú thích DDL `TT_AnhChuyenKhoan`, lưu vào `Assets/RiengTu`; lead
duyệt. Bài học: vị trí lưu file là quyết định BẢO MẬT, không phải quyết định sắp xếp thư mục.
