import React from "react";
import { Dialog } from "@primer/react/experimental";

// Hộp thoại nội dung DÀI của cổng - dùng cho bước xem trước file import (V3), xem chi
// tiết Cựu SV (B3a) và sửa thông tin liên hệ do Quản lý thực hiện (B3b).
//
// VÌ SAO KHÔNG DÙNG components-ui/modal (MyModal):
// MyModal identical-byte với ClientApp2 nên KHÔNG được sửa, mà nó chỉ chuyển tiếp `renderHeader`
// xuống Primer Dialog - KHÔNG chuyển `renderFooter` và cũng không cho đặt `position`. V1 đã ghi
// nhận hệ quả: footer của hộp thoại alumni phải nằm TRONG phần thân cuộn, nên nó cuộn mất.
//
// Với bảng xem trước hoặc hồ sơ có nhiều nhóm thông tin, footer (nếu có) phải luôn nhìn thấy được.
// Primer Dialog vốn đã dựng đúng như vậy:
//     StyledDialog = flex column
//       Header  flex-shrink: 0
//       Body    flex-grow: 1; overflow: auto     <- CHỈ phần này cuộn
//       Footer  flex-shrink: 0; box-shadow trên  <- footer của chính hộp thoại
// Nên ở đây gọi thẳng Primer Dialog và truyền renderFooter. Không tự chế position:fixed theo
// viewport - footer thuộc về hộp thoại, không phải thuộc về màn hình.
//
// Backdrop, khoá cuộn nền (document.body.style.overflow), bẫy focus, Esc và nút đóng đều là hành
// vi sẵn có của Primer Dialog - KHÔNG tự dựng lại.
interface IAppWorkflowDialogProps {
    isOpen: boolean;
    title: string;
    /** Dòng phụ dưới tiêu đề - ở đây là tên file đang xem trước. */
    subtitle?: string;
    onClose: () => void;
    /** Vùng hành động cuối hộp thoại. Primer Footer đã tự căn phải + wrap + gap. */
    footer?: React.ReactNode;
    /** Lớp CSS đặt lên chính `Dialog.Body`.
     *
     *  TUỲ CHỌN, và mặc định KHÔNG có gì: bỏ trống thì `className` là `undefined` nên
     *  `Dialog.Body` render y hệt như trước - hai chỗ dùng còn lại (ColumnChooserDialog và hộp
     *  thoại chi tiết Cựu SV ở ThongKePage) không truyền prop này và KHÔNG đổi một byte nào.
     *
     *  Có prop này vì hộp thoại xem trước import cần một vùng bảng LẤP ĐẦY thân hộp thoại, mà
     *  chuỗi flex U3 của trang không với tới được: Dialog render qua PORTAL vào document.body
     *  nên nó nằm ngoài `.content` của AppLayout. Chuỗi cho vùng bảng đó phải bắt đầu lại từ
     *  chính `Dialog.Body` - xem ImportDanhSachPage.module.css, mục "U3f".
     *
     *  ⚠️ ĐỪNG biến nó thành style mặc định của mọi hộp thoại: hai chỗ dùng kia là nội dung
     *  chảy tự nhiên, ép flex vào body sẽ làm hỏng chúng. */
    bodyClassName?: string;
    children: React.ReactNode;
}

const AppWorkflowDialog: React.FC<IAppWorkflowDialogProps> = ({
    isOpen,
    title,
    subtitle,
    onClose,
    footer,
    bodyClassName,
    children,
}) => {
    if (!isOpen) return null;
    return (
        <Dialog
            title={title}
            subtitle={subtitle}
            onClose={onClose}
            // 90vw có trần 1100px: đủ rộng cho bảng xem trước nhiều cột, nhưng không kéo thành dải
            // chữ quá dài trên màn 1920. Primer đã tự chặn max-width: calc(100dvw - 64px) và
            // max-height: calc(100dvh - 64px).
            sx={{ width: "90vw", maxWidth: "1100px" }}
            // < 768px: hộp thoại chiếm trọn màn hình thay vì nhét bảng vào một hộp nhỏ.
            // Đây là API sẵn có của Primer, không phải media query tự viết.
            position={{ regular: "center", narrow: "fullscreen" }}
            renderBody={() => <Dialog.Body className={bodyClassName}>{children}</Dialog.Body>}
            renderFooter={footer ? () => <Dialog.Footer>{footer}</Dialog.Footer> : undefined}
        />
    );
};

export default AppWorkflowDialog;
