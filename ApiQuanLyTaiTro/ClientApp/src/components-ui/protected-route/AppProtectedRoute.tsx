import React from "react";
import { Navigate } from "react-router-dom";
import { useAppAuth } from "../../contexts/AppAuthContext";
import { eVaiTro } from "../../model/eVaiTro";
import EmptyState from "../empty-state";

// Guard route riêng cho cổng, dựa trên AppAuthContext (không phải ProtectedRoute.tsx
// gốc - file đó là no-op stub gắn với luồng menus/redux của hệ học vụ).
interface IAppProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: eVaiTro[];
}

const AppProtectedRoute: React.FC<IAppProtectedRouteProps> = ({ children, allowedRoles }) => {
    const { isAuthenticated, user } = useAppAuth();

    // ⚠️ Guard này chạy ở MÀN ĐANG ĐỨNG, nên nó nhạy với thứ tự commit khi đăng xuất: nếu auth bị
    // xoá TRƯỚC khi URL kịp đổi, nó sẽ thấy "chưa đăng nhập" và bắn /login, cướp mất chuyến
    // điều hướng về trang chủ. Đó là lỗi thật đã xảy ra - cách chữa nằm ở `handleLogout`
    // (AppLayout, bọc `startTransition`). ĐỌC chỗ đó trước khi đổi gì ở đây.
    if (!isAuthenticated || !user) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.vai_tro)) {
        return (
            <div style={{ padding: 24 }}>
                <EmptyState
                    variant="danger"
                    title="Không có quyền truy cập"
                    description="Tài khoản của bạn không có quyền xem trang này."
                />
            </div>
        );
    }

    return <>{children}</>;
};

export default AppProtectedRoute;
