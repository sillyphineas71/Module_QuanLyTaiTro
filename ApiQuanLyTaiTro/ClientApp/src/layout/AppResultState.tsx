import React from "react";
import { AlertIcon, CheckCircleIcon, InboxIcon, ToolsIcon } from "@primer/octicons-react";
import { Octicon } from "@primer/react";
import clsx from "clsx";
import styles from "./AppResultState.module.css";

// Trạng thái của VÙNG KẾT QUẢ trên các màn quản trị của cổng (V2).
//
// VÌ SAO KHÔNG DÙNG components-ui/empty-state:
//  1. Component đó render một Primer <Flash> - dải màu ngang, hợp với "thông báo trạng thái"
//     (đợt thu thập đang mở / khu vực tải file bị khoá) chứ không hợp với "vùng kết quả rỗng".
//  2. Nó identical-byte với ClientApp2 nên không được sửa.
//  3. Quan trọng nhất: trước đây nó được truyền vào DataTable qua prop emptyComponent, tức là
//     nằm TRONG một <td> của bảng. Mà Rows.tsx đặt colSpan = số cột KHAI BÁO, trong khi bảng còn
//     render thêm cột STT và cột chọn -> dư 1-2 ô trắng có viền bên phải thông báo (đúng hiện
//     tượng "bảng bị lỗi" trong ảnh chụp màn hình màn Duyệt). Rows.tsx cũng identical-byte.
// Cách xử lý ở tầng App: hết dữ liệu thì KHÔNG render DataTable nữa mà render component này
// thay vào chỗ đó. Bug colSpan biến mất khỏi runtime alumni mà không phải đụng file dùng chung.
//
// BỐN biến thể mang BỐN NGHĨA khác nhau - đây là điểm mấu chốt, không phải chỉ đổi màu:
//   empty    = chưa có bản ghi nào được tạo
//   done     = có dữ liệu, nhưng quy trình này đã xử lý xong, không còn gì để làm
//   error    = KHÔNG biết có bao nhiêu bản ghi vì request hỏng (tuyệt đối không được hiển thị
//              như "chưa có dữ liệu")
//   building = màn/tính năng đã dành sẵn chỗ trong hệ thống, CHƯA triển khai. Không có
//              request nào chạy, không có dữ liệu nào để chờ.
// Vì sao "building" phải là biến thể RIÊNG chứ không mượn "empty": icon suy ra từ variant,
// nên "empty" luôn kèm InboxIcon (hộp thư rỗng) -> người dùng đọc ra "không tìm thấy dữ
// liệu" và đi kiểm tra lại bộ lọc. Sai thông điệp, đúng loại nhầm lẫn mà chính khối comment
// này đang cảnh báo.
export type AppResultStateVariant = "empty" | "done" | "error" | "building";

const VARIANT_ICON = {
    empty: InboxIcon,
    done: CheckCircleIcon,
    error: AlertIcon,
    building: ToolsIcon,
} as const;

const VARIANT_ICON_CLASS = {
    empty: styles.iconEmpty,
    done: styles.iconDone,
    error: styles.iconError,
    building: styles.iconBuilding,
} as const;

interface IAppResultStateProps {
    variant: AppResultStateVariant;
    title: string;
    description?: React.ReactNode;
    /** Nút hành động (Tạo mới / Thử lại). Với variant "error" thì gần như luôn phải có. */
    action?: React.ReactNode;
}

const AppResultState: React.FC<IAppResultStateProps> = ({ variant, title, description, action }) => (
    <div className={styles.region} role={variant === "error" ? "alert" : undefined}>
        <span className={clsx(styles.icon, VARIANT_ICON_CLASS[variant])}>
            <Octicon icon={VARIANT_ICON[variant]} size={24} />
        </span>
        <p className={styles.title}>{title}</p>
        {description && <p className={styles.description}>{description}</p>}
        {action && <div className={styles.action}>{action}</div>}
    </div>
);

export default AppResultState;
