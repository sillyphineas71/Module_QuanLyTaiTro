import React from "react";
import styles from "./AppContextBar.module.css";

// Tầng 2 của ngữ pháp Data Management: PAGE HEADER -> CONTEXT BAR -> RESULT REGION.
//
// Cố ý giữ ĐÚNG hai chỗ cắm (ngữ cảnh bên trái, điều khiển bên phải) - đó là toàn bộ phần chung
// giữa ba màn quản trị; mọi thứ khác (gọi API, bộ lọc, trạng thái chọn, logic bảng) vẫn nằm ở
// từng trang. Không biến nó thành toolbar cấu hình 25 prop.
interface IAppContextBarProps {
    /** Mô tả tập dữ liệu đang xem, vd "24 tài khoản chờ duyệt · đã chọn 3". */
    children: React.ReactNode;
    /** Điều khiển bên phải (nút tạo mới, làm mới...). Tùy chọn. */
    actions?: React.ReactNode;
}

const AppContextBar: React.FC<IAppContextBarProps> = ({ children, actions }) => (
    <div className={styles.bar}>
        <div className={styles.context}>{children}</div>
        {actions ? <div className={styles.actions}>{actions}</div> : null}
    </div>
);

/** Phần được nhấn trong ngữ cảnh - thường là con số + tên tập dữ liệu. */
export const AppContextCount: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <span className={styles.count}>{children}</span>
);

export default AppContextBar;
