import React from "react";
import { Dialog } from "@primer/react/experimental";

// Ngăn kéo bộ lọc (side sheet) của màn Thống kê.
//
// VÌ SAO KHÔNG DÙNG components-ui/modal (MyModal): nó identical-byte với ClientApp2 và chỉ chuyển
// tiếp `renderHeader`, KHÔNG chuyển `renderFooter` cũng không cho đặt `position` - mà cả hai đều
// bắt buộc ở đây (footer Áp dụng/Xoá phải luôn thấy được, và ngăn kéo phải nằm bên PHẢI).
//
// VÌ SAO KHÔNG DÙNG AppWorkflowDialog (V3): hộp thoại đó là hộp thoại QUY TRÌNH - căn giữa,
// rộng 90vw/1100px, dành cho bảng xem trước import. Bộ lọc có ngữ nghĩa khác hẳn (bảng điều khiển
// phụ, hẹp, dính mép phải), nên tái dùng sẽ phải nhét thêm prop cho hai hành vi không liên quan.
//
// Primer Dialog vốn đã hỗ trợ đúng kiểu này, không phải tự dựng:
//   position.regular = "right"    -> Backdrop justify-content:flex-end, dialog height:100dvh,
//                                    max-height:unset, bo góc phải phẳng, trượt vào từ mép phải
//   position.narrow  = "fullscreen" -> < 768px chiếm trọn màn hình
//   Header / Body(overflow:auto, flex-grow:1) / Footer(flex-shrink:0) -> CHỈ phần thân cuộn
// Backdrop, khoá cuộn nền, bẫy focus, Esc và nút đóng đều là hành vi sẵn có của Primer - KHÔNG tự
// dựng lại focus trap.
interface IFilterDrawerProps {
    isOpen: boolean;
    /** Dòng phụ dưới tiêu đề, vd "3 tiêu chí đang chọn". */
    subtitle?: string;
    onClose: () => void;
    /** Vùng hành động dính đáy ngăn kéo (Xoá bộ lọc / Áp dụng). */
    footer: React.ReactNode;
    children: React.ReactNode;
}

const FilterDrawer: React.FC<IFilterDrawerProps> = ({ isOpen, subtitle, onClose, footer, children }) => {
    if (!isOpen) return null;
    return (
        <Dialog
            title="Bộ lọc"
            subtitle={subtitle}
            onClose={onClose}
            position={{ regular: "right", narrow: "fullscreen" }}
            // Mảng responsive của Primer: mốc thứ 3 = >= 768px, đúng mốc mobile đã chốt của cổng.
            // Dưới 768px để 100% cho khớp với position narrow "fullscreen" (nếu ghim cứng 380px thì
            // sx sẽ ghi đè chiều rộng 100% của fullscreen và để hở mép ở màn 430px).
            sx={{ width: ["100%", "100%", "380px"] }}
            renderBody={() => <Dialog.Body>{children}</Dialog.Body>}
            renderFooter={() => <Dialog.Footer>{footer}</Dialog.Footer>}
        />
    );
};

export default FilterDrawer;
