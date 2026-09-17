import React from "react";
import { Route, Routes } from "react-router-dom";
import TrangCongKhaiRoute from "./components-ui/protected-route/TrangCongKhaiRoute";
import TrangChuPage from "./pages/landing/TrangChuPage";
import TaiTroDanhSachPage from "./pages/tai-tro/TaiTroDanhSachPage";
import TaiTroChiTietPage from "./pages/tai-tro/TaiTroChiTietPage";
import AppNotFoundPage from "./pages/AppNotFoundPage";

// ═══════════════════════════════════════════════════════════════════════════════════════════
// BẢNG ĐỊNH TUYẾN CỔNG VẬN ĐỘNG TÀI TRỢ — lô dựng khung (P1)
// ═══════════════════════════════════════════════════════════════════════════════════════════
// 🔴 CHƯA CÓ ROUTE NÀO CẦN ĐĂNG NHẬP, VÀ ĐÓ LÀ ĐÚNG KẾ HOẠCH. Luồng đăng nhập là P4.
// `AppProtectedRoute` và `AppLayout` ĐÃ có sẵn trong repo (chép nguyên từ repo gốc) nhưng
// chưa nơi nào dùng — cố ý giữ để P4 chỉ việc cắm vào, không phải dựng lại vỏ.
// ⚠️ Đừng "dọn" hai file đó vì thấy chưa ai gọi.
//
// 🔴 URL KHÔNG CÓ TIỀN TỐ (trả nợ N1): cổng chỉ có MỘT nghiệp vụ nên không cần không gian tên —
// trang chủ là "/", module tài trợ là `DUONG_DAN_TAI_TRO` (ITaiTro.ts, nguồn DUY NHẤT của chuỗi đó).
// Khu quản trị sau này (P4) thì mở tiền tố RIÊNG của nó, không phải đặt lại tiền tố cho cả cổng.
//
// ⚠️ MỌI TRANG CÔNG KHAI PHẢI BỌC `TrangCongKhaiRoute`. Guard đó đá tài khoản đang đăng nhập với
//    vai LÀM VIỆC về màn làm việc của họ: người đăng nhập để duyệt thanh toán mà đang đứng ở trang
//    giới thiệu dành cho khách là một trạng thái sai nghiệp vụ. Thêm trang công khai mới mà quên
//    bọc thì lỗi đó quay lại ngay.
// ═══════════════════════════════════════════════════════════════════════════════════════════
const AppRoutes: React.FC = () => (
    <Routes>
        <Route path="/" element={<TrangCongKhaiRoute><TrangChuPage /></TrangCongKhaiRoute>} />
        <Route path="tai-tro" element={<TrangCongKhaiRoute><TaiTroDanhSachPage /></TrangCongKhaiRoute>} />
        <Route path="tai-tro/:id" element={<TrangCongKhaiRoute><TaiTroChiTietPage /></TrangCongKhaiRoute>} />

        {/* Bắt mọi URL lạ — trang công khai nên người ta gõ tay URL được, và một
            ngõ cụt không có lối ra là lỗi trợ năng. */}
        <Route path="*" element={<AppNotFoundPage />} />
    </Routes>
);

export default AppRoutes;
