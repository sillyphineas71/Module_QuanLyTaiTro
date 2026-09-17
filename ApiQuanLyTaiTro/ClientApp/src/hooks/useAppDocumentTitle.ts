import { useEffect } from "react";

// UI-015: tiêu đề tài liệu (thẻ <title>) cho các route của cổng.
//
// Trước đây mọi màn alumni đều dùng chung đúng một tiêu đề mặc định của index.html, nên tab trình
// duyệt, lịch sử và bookmark không phân biệt được màn nào.
//
// Vì sao KHÔNG dùng react-helmet: nó có trong dependency và components-ui/page/Page.tsx (hệ học vụ
// cũ) đang dùng, nhưng Page.tsx đó không nằm trong luồng alumni. Kéo Helmet vào chỉ để đặt một
// chuỗi là thêm một lớp không cần thiết; đặt document.title trực tiếp là giải pháp nhỏ nhất và
// không cần provider. KHÔNG thêm framework routing/head nào.
const APP_TITLE = "Cổng Vận động tài trợ";

/**
 * Đặt document.title thành "<pageTitle> | Cổng Vận động tài trợ".
 * ⚠️ Chuỗi tên cổng phải KHỚP <title> trong public/index.html — đó là tiêu đề trước khi JS chạy.
 * Bỏ trống pageTitle -> chỉ còn tên cổng (dùng cho trang chủ/điểm vào).
 * Khi unmount thì trả lại tiêu đề trước đó, nên rời khỏi màn không để lại tiêu đề của màn đó.
 */
export const useAppDocumentTitle = (pageTitle?: string) => {
    useEffect(() => {
        const previousTitle = document.title;
        document.title = pageTitle ? `${pageTitle} | ${APP_TITLE}` : APP_TITLE;
        return () => {
            document.title = previousTitle;
        };
    }, [pageTitle]);
};

export default useAppDocumentTitle;
