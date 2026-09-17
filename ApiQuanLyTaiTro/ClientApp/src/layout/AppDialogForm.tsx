import React from "react";
import styles from "./AppDialogForm.module.css";

// Bố cục form trong hộp thoại của cổng (V1 - Dialog & Form Composition).
//
// VÌ SAO TỰ DỰNG THAY VÌ SỬA components-ui/modal/ModalActions:
// ModalActions.tsx, ModalActions.module.css và MyModal.tsx đều IDENTICAL-BYTE với ClientApp2
// (đã so sánh từng file). Sửa chúng sẽ đổi diện mạo footer của ~40 màn hệ học vụ cũ. Ba component
// dưới đây là bản dùng riêng cho cổng Cựu SV, đặt trong layout/cuu-sinh-vien/ (thư mục chỉ có ở
// ClientApp) nên bán kính ảnh hưởng = đúng các màn alumni tự chọn dùng.

interface IAppDialogFormProps {
    children: React.ReactNode;
}

/**
 * Thân form của hộp thoại: cấp padding 24px tổng (16px sẵn có của Primer + 8px ở đây) và nhịp
 * dọc 32px GIỮA các nhóm. Đặt <AppFormGroup> và <AppDialogFooter> làm con trực tiếp.
 */
export const AppDialogForm: React.FC<IAppDialogFormProps> = ({ children }) => (
    <div className={styles.body}>{children}</div>
);

interface IAppFormGroupProps {
    /** Nhãn nhóm. Bỏ trống khi form quá ít trường - chia nhóm lúc đó chỉ làm rối thêm. */
    label?: string;
    children: React.ReactNode;
}

/**
 * Một nhóm trường: nhãn phụ + các trường cách nhau 16px. Khoảng cách giữa các nhóm (32px) do
 * <AppDialogForm> cấp, nên trong nhóm KHÔNG tự thêm margin-bottom cho từng trường nữa.
 */
export const AppFormGroup: React.FC<IAppFormGroupProps> = ({ label, children }) => (
    <div className={styles.group}>
        {label && <p className={styles.groupLabel}>{label}</p>}
        {children}
    </div>
);

/**
 * Hàng chứa MỘT CẶP trường ngắn cùng loại (Từ năm/Đến năm, Từ ngày/Đến ngày). Tự xuống 1 cột khi
 * hộp thoại hẹp - theo bề rộng CONTAINER, không theo viewport.
 */
export const AppFieldPair: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className={styles.fieldPair}>{children}</div>
);

interface IAppDialogFooterProps {
    /** Thứ tự DOM: hành động phụ (Huỷ) trước, hành động chính (Lưu/Tạo) sau. */
    children: React.ReactNode;
}

/**
 * Vùng hành động của hộp thoại: có đường kẻ phía trên, căn PHẢI trên desktop, xếp dọc chiếm trọn
 * bề rộng dưới 480px. Nút truyền vào nên dùng size="medium".
 */
export const AppDialogFooter: React.FC<IAppDialogFooterProps> = ({ children }) => (
    <div className={styles.footer}>{children}</div>
);

export default AppDialogForm;
