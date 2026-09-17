import React from "react";
import { useNavigate } from "react-router-dom";
import { Box, Heading, Text } from "@primer/react";
import MyButton from "../components-ui/button";
import BrandLogo from "../components-ui/brand-logo";
import { useAppDocumentTitle } from "../hooks/useAppDocumentTitle";
import { DUONG_DAN_TAI_TRO } from "../model/ITaiTro";

// V6: màn "không tìm thấy trang" cho các URL không khớp route nào.
//
// Trước đây route "*" điều hướng thẳng về /alumni/dashboard, nên gõ sai URL sẽ âm thầm đưa người
// dùng sang một màn khác mà không nói gì - họ tưởng link mình có là đúng.
//
// CỐ Ý ĐỂ CÔNG KHAI (không bọc AppProtectedRoute/AppLayout):
//   - KHÔNG đổi hành vi phân quyền của bất kỳ route thật nào - chỉ nhánh "*" (vốn không phải là
//     một màn có thật) mới tới đây;
//   - URL sai vẫn báo "không tồn tại" dù đã đăng nhập hay chưa, thay vì đẩy người chưa đăng nhập
//     sang màn Đăng nhập rồi làm họ tưởng URL đó có thật và chỉ thiếu quyền.
// Không tự điều hướng đi đâu cả: người dùng tự chọn nút.
//
// 🔴 NÚT THỨ NHẤT TỪNG LÀ NÚT CHẾT (sửa ở lô trả nợ N1): "Về trang chính" -> /alumni/dashboard —
// "trang chính theo vai" của repo gốc, cổng này KHÔNG có route đó, nên bấm vào là quay lại đúng
// trang 404 này. Nay trỏ về danh sách chương trình — nơi người gõ sai URL gần như chắc chắn muốn
// tới — và nhãn nói thẳng đích đến (trùng chữ nút ở Trang chủ), thay vì hai nút gần nghĩa
// "trang chính"/"trang chủ" mà người đọc không phân biệt được.
const AppNotFoundPage: React.FC = () => {
    useAppDocumentTitle("Không tìm thấy trang");
    const navigate = useNavigate();

    return (
        <Box
            sx={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bg: "canvas.subtle",
                p: 3,
            }}
        >
            <Box
                sx={{
                    width: "100%",
                    maxWidth: 420,
                    bg: "canvas.default",
                    border: "1px solid",
                    borderColor: "border.default",
                    borderRadius: "12px",
                    boxShadow: "shadow.medium",
                    p: 5,
                    textAlign: "center",
                }}
            >
                <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
                    <BrandLogo height={56} />
                </Box>
                {/* h1 chuẩn của cổng: --text-2xl (25px) + 700, khớp AppPageCaption. Màn này
                    nằm NGOÀI AppLayout nên không dùng được component đó - sửa chuẩn h1 thì
                    phải sửa cả ở đây. (Trước 2026-09-14 là `fontSize: 3` = 20px.) */}
                <Heading as="h1" sx={{ fontSize: "var(--text-2xl)", fontWeight: 700, mb: 2 }}>
                    Không tìm thấy trang
                </Heading>
                <Text sx={{ display: "block", color: "fg.muted", mb: 4 }}>
                    Đường dẫn bạn vừa mở không tồn tại trong cổng Vận động tài trợ. Có thể link đã cũ hoặc bị gõ sai.
                </Text>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <MyButton
                        variant="primary"
                        size="medium"
                        block
                        text="Xem các chương trình"
                        onClick={() => navigate(DUONG_DAN_TAI_TRO, { replace: true })}
                    />
                    <MyButton
                        size="medium"
                        block
                        text="Về trang chủ"
                        onClick={() => navigate("/", { replace: true })}
                    />
                </Box>
            </Box>
        </Box>
    );
};

export default AppNotFoundPage;
