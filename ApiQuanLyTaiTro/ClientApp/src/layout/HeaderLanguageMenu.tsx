import React from "react";
import { ActionList, ActionMenu } from "@primer/react";
// `CheckIcon` đã bỏ ở R17: dấu tích do chính ActionList dựng - xem chú thích tại chỗ render.
import { TriangleDownIcon } from "@primer/octicons-react";
import styles from "./HeaderLanguageMenu.module.css";

// ═══════════════════════════════════════════════════════════════════════════════════════════
// 🔴 NÚT NÀY KHÔNG ĐỔI ĐƯỢC NGÔN NGỮ, VÀ NÓ PHẢI NÓI RA ĐIỀU ĐÓ
// ═══════════════════════════════════════════════════════════════════════════════════════════
// Cổng KHÔNG có hạ tầng đa ngôn ngữ: 0 thư viện i18n, 0 file dịch, mọi chuỗi đều viết cứng
// tiếng Việt trong JSX. Lead vẫn muốn dựng nút theo mẫu, nên ràng buộc là: dựng vỏ THÌ ĐƯỢC,
// nhưng vỏ đó KHÔNG ĐƯỢC hứa một năng lực không tồn tại (tiêu chí đầy đủ ở A3.30).
//
// Vì vậy:
//   · "Tiếng Việt" có DẤU TÍCH và trạng thái đang chọn -> đúng sự thật, đây là ngôn ngữ duy nhất;
//   · "Tiếng Anh" `disabled` + nhãn "Sắp có" -> người dùng biết NGAY vì sao bấm không được,
//     thay vì bấm rồi không có gì xảy ra.
// Bấm được mà không đổi gì là kiểu hỏng TỆ NHẤT: người dùng không phân biệt được "chưa làm"
// với "hỏng".
//
// ═══════════════════════════════════════════════════════════════════════════════════════════
// 🔴 KHÔNG DÙNG EMOJI CỜ - đây là quyết định đo được, đừng "dọn cho gọn"
// ═══════════════════════════════════════════════════════════════════════════════════════════
// Emoji cờ là CẶP KÝ TỰ regional-indicator (U+1F1FB U+1F1F3 cho VN). Windows KHÔNG kèm glyph cờ
// trong Segoe UI Emoji - nó dựng cặp đó thành HAI Ô CHỮ "VN" viền tròn, không phải lá cờ. Đây là
// nền tảng chính của người dùng cổng này, tức mẫu thiết kế sẽ hỏng ở đa số máy.
// => Cờ Việt Nam vẽ bằng SVG NỘI TUYẾN ngay dưới: 2 hình + 1 path, không thêm file, không thêm
//    lượt tải, không phụ thuộc font hệ thống.
//
// ⚠️ CỜ CHỈ NẰM Ở NÚT, KHÔNG NẰM TRONG DANH SÁCH. Cờ là biểu tượng của QUỐC GIA, không phải của
// NGÔN NGỮ - "Tiếng Anh" không có lá cờ nào đúng (Anh? Mỹ? Úc?). Ở nút thì cờ VN không mơ hồ vì
// nó đang nói "bản tiếng Việt"; trong danh sách thì phải là CHỮ.
const CoVietNam: React.FC = () => (
    // aria-hidden: chữ "VN" nằm ngay bên cạnh đã mang đủ nghĩa; đọc thêm lá cờ là đọc thừa.
    <svg className={styles.co} viewBox="0 0 30 20" aria-hidden="true" focusable="false">
        <rect width="30" height="20" fill="#DA251D" />
        <path
            d="M15 4 L16.35 8.15 L20.71 8.15 L17.18 10.71 L18.53 14.85 L15 12.29 L11.47 14.85 L12.82 10.71 L9.29 8.15 L13.65 8.15 Z"
            fill="#FFFF00"
        />
    </svg>
);

// ═══════════════════════════════════════════════════════════════════════════════════════════
// 🔌 CHỖ NỐI KHI CÓ i18n THẬT - ĐỌC TRƯỚC KHI LÀM LÔ ĐÓ
// ═══════════════════════════════════════════════════════════════════════════════════════════
// Toàn bộ phần "giả" của cổng nằm gọn trong ĐÚNG BA thứ ở file này:
//   1. hằng `NGON_NGU` dưới đây      -> thay bằng danh sách ngôn ngữ thật của thư viện i18n;
//   2. `dungDuoc: false` của tiếng Anh -> bỏ cờ này đi khi bản dịch tồn tại;
//   3. `onSelect` chưa có             -> nối vào hàm đổi ngôn ngữ của thư viện.
// KHÔNG có state ngôn ngữ nào rải rác nơi khác, KHÔNG có localStorage, KHÔNG có context.
// Nút này là một VỎ THUẦN TUÝ, xoá đi cũng không hỏng gì khác.
const NGON_NGU = [
    { ma: "vi", ten: "Tiếng Việt", dungDuoc: true },
    { ma: "en", ten: "Tiếng Anh", dungDuoc: false },
];

const HeaderLanguageMenu: React.FC = () => (
    <ActionMenu>
        <ActionMenu.Anchor>
            <button type="button" className={styles.nut} aria-label="Ngôn ngữ: Tiếng Việt">
                <CoVietNam />
                <span>VN</span>
                <TriangleDownIcon />
            </button>
        </ActionMenu.Anchor>
        <ActionMenu.Overlay>
            <ActionList selectionVariant="single">
                {NGON_NGU.map((n) => (
                    <ActionList.Item
                        key={n.ma}
                        selected={n.dungDuoc}
                        /* `disabled` đặt aria-disabled và chặn kích hoạt, nhưng mục VẪN nằm trong
                           danh sách và vẫn được trình đọc màn hình đọc - nhờ đó nhãn "Sắp có" tới
                           được người dùng khiếm thị. Ẩn hẳn mục này đi thì họ không bao giờ biết
                           bản tiếng Anh đang được chuẩn bị. */
                        disabled={!n.dungDuoc}
                    >
                        {/* 🔴 KHÔNG tự vẽ dấu tích ở đây. R9 từng thêm một
                            <ActionList.LeadingVisual><CheckIcon/></ActionList.LeadingVisual> và
                            kết quả là HAI dấu tích cạnh "Tiếng Việt".
                            `selectionVariant="single"` của ActionList đã tự dựng dấu tích: Primer
                            luôn render một ô LeadingVisualContainer cho MỌI mục (giữ chỗ để nhãn
                            thẳng hàng) và chỉ đặt CheckIcon vào ô đó khi `selected`.
                            Quan trọng hơn cái dấu: cùng `selectionVariant="single"`, Primer gán
                            role="menuitemradio" + aria-checked theo đúng `selected`. Dấu tự vẽ
                            KHÔNG mang theo ngữ nghĩa đó - bỏ dấu của Primer để giữ dấu tự vẽ là
                            đổi một thứ trình đọc màn hình HIỂU lấy một thứ nó KHÔNG THẤY. */}
                        {n.ten}
                        {n.dungDuoc ? null : (
                            <ActionList.TrailingVisual>
                                <span className={styles.chipSapCo}>Sắp có</span>
                            </ActionList.TrailingVisual>
                        )}
                    </ActionList.Item>
                ))}
            </ActionList>
        </ActionMenu.Overlay>
    </ActionMenu>
);

export default HeaderLanguageMenu;
