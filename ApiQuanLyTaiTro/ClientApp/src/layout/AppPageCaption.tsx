import React from "react";
import { Heading } from "@primer/react";

interface IAppPageCaptionProps {
    children: React.ReactNode;
    /** sx bổ sung - ghi đè mặc định nếu trùng key. */
    sx?: any;
}

// Tiêu đề trang (h1) chuẩn của cổng: `--text-2xl` (25px), weight 700, KHÔNG emoji.
//
// 🔄 ĐỔI 2026-09-14 (lô đồng bộ font): trước đây là `fontSize: 4` + `fontWeight: "bold"`.
//   - `fontSize: 4` là BẬC của thang Primer, mà thang đó bị `customTheme` ghi đè thành 24px -
//     một cỡ KHÔNG ánh xạ được vào bậc nào trong thang của ta. Các h1 công khai (Tin tức) vốn
//     đã dùng `--text-2xl` (25px), nên h1 ứng dụng lệch 1px so với h1 công khai mà không vì lý
//     do gì. Nay cả hai vùng dùng CHUNG `--text-2xl`; token của ta là nguồn sự thật.
//   - `"bold"` = 700, viết bằng số cho khỏi phải nhớ. (`"bolder"` thì còn tệ hơn: nó phụ thuộc
//     weight của phần tử CHA, cha 600 sẽ ra 900 - một weight KHÔNG được nạp.)
//
// ⚠️ WEIGHT vẫn KHÁC NHAU giữa hai vùng, và đó là CỐ Ý, không phải sót: vùng ứng dụng dùng 700,
// vùng công khai (landing/tin tức) dùng 800. Đếm thật: 74% khai báo weight ở vùng ứng dụng là
// 600, còn 71% ở vùng công khai là 700-800. Đó là phân biệt app/marketing, đừng "dọn" cho bằng.
//
// Màu var(--brand-700) (#0B47A8, 8.46:1 trên trắng - vượt AA): đưa màu thương hiệu vào vùng
// nội dung mà KHÔNG đụng tới nền của dữ liệu. Đây là NGOẠI LỆ DUY NHẤT được dùng màu để phân
// cấp tiêu đề - mọi h2 trở xuống dùng fg.default, phân cấp bằng cỡ chữ + weight.
const AppPageCaption: React.FC<IAppPageCaptionProps> = ({ children, sx }) => (
    <Heading as="h1" sx={{ fontSize: "var(--text-2xl)", fontWeight: 700, color: "var(--brand-700)", ...sx }}>
        {children}
    </Heading>
);

export default AppPageCaption;
