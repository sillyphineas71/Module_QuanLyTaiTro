import React from "react";
import { Box, Text } from "@primer/react";
import AppPageCaption from "./AppPageCaption";
import styles from "./AppPage.module.css";
import { useAppDocumentTitle } from "../hooks/useAppDocumentTitle";

interface IAppPageProps {
    /** Tiêu đề trang (h1) - viết hoa chữ đầu, KHÔNG dùng emoji để đồng bộ toàn cổng. */
    title: string;
    /** Mô tả ngắn dưới tiêu đề (tùy chọn). */
    description?: React.ReactNode;
    /** Nút/hành động căn phải, cùng hàng với tiêu đề (tùy chọn). */
    actions?: React.ReactNode;
    /** Giới hạn bề rộng nội dung (tùy chọn) - vd trang Hồ sơ. */
    maxWidth?: number | string;
    /** Bật riêng cho màn có vùng bảng cần lấp phần chiều cao còn lại. Mặc định tắt để các trang
     *  nội dung dài như Hồ sơ/Nhập danh sách vẫn giữ dòng chảy và thanh cuộn hiện có. */
    fillAvailableHeight?: boolean;
    /** UI-015: tiêu đề tab trình duyệt. Bỏ trống -> dùng chính `title`; truyền chuỗi rỗng
     *  -> chỉ hiện tên cổng (dùng cho màn điểm vào). Cần prop riêng vì vài tiêu đề trang
     *  khá dài, đọc trên tab thì nên ngắn hơn. */
    documentTitle?: string;
    children: React.ReactNode;
}

// Wrapper "đầu trang" dùng chung cho mọi màn trong AppLayout - thay cho cụm
// <Box><Heading sx={{fontSize:24,mb:2}}/><Text sx={{color:"fg.muted",mb:4}}/> vốn bị copy-paste
// ở nhiều trang. KHÔNG tự thêm padding (AppLayout .content đã có padding:24px) - chỉ chuẩn hoá
// tiêu đề + mô tả + khoảng cách dưới. KHÔNG đụng logic/nội dung của trang.
const AppPage: React.FC<IAppPageProps> = ({
    title,
    description,
    actions,
    maxWidth,
    fillAvailableHeight = false,
    documentTitle,
    children,
}) => {
    useAppDocumentTitle(documentTitle ?? title);
    return (
        <Box className={fillAvailableHeight ? styles.fillAvailableHeight : undefined} sx={{ maxWidth }}>
            {/* V2: bố cục đầu trang chuyển sang CSS module để có cách xử lý riêng cho < 768px
                (hành động xuống hàng, chiếm trọn bề rộng) - sx của Primer không đặt được media
                query theo mốc mobile đã chốt của cổng một cách rõ ràng. */}
            <Box className={styles.header} sx={{ mb: description ? 2 : 4 }}>
                <AppPageCaption sx={{ m: 0 }}>{title}</AppPageCaption>
                {actions ? <div className={styles.actions}>{actions}</div> : null}
            </Box>
            {description ? (
                <Text sx={{ color: "fg.muted", mb: 4, display: "block" }}>{description}</Text>
            ) : null}
            {children}
        </Box>
    );
};

export default AppPage;
