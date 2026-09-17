import React, { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import AppBrandHeader from "./AppBrandHeader";
import LandingFooter from "../pages/landing/LandingFooter";
import MyButton from "../components-ui/button";
import { useAppAuth } from "../contexts/AppAuthContext";
import { getDefaultRouteForRole } from "../model/appMenuConfig";
import styles from "./TrangCongKhai.module.css";

// ═══════════════════════════════════════════════════════════════════════════════════════════
// KHUNG TRANG CÔNG KHAI (N5) — header hai tầng + <main> + footer, cho các trang KHÔNG cần đăng
// nhập ngoài Landing: danh sách tin tức, chi tiết bài.
// ═══════════════════════════════════════════════════════════════════════════════════════════
// Landing KHÔNG dùng khung này (và không nên ép): <main> của nó là hai dải (hero tràn viền + nội
// dung) với cấu trúc riêng từ R5/R12. Khung này chỉ gom phần hai trang mới có chung với Landing:
//   · header cùng hình dạng (hai tầng, 4 mục, `dangOLanding` = false ⇒ mục là liên kết rời trang);
//   · nút góc phải đổi theo trạng thái đăng nhập, y hệt Landing — "Đăng nhập" / "Vào hệ thống";
//   · footer Landing (id="lien-he" — mục "Liên hệ" trên header trỏ /#lien-he, tức về Landing,
//     không cuộn trong trang này; đúng vì hai trang này không phải nơi "Liên hệ" sống).
// ⚠️ Không có `fillAvailableHeight` ở đây: trang cuộn theo nội dung, footer nằm cuối tài liệu.
interface ITrangCongKhaiProps {
    children: React.ReactNode;
}

const TrangCongKhai: React.FC<ITrangCongKhaiProps> = ({ children }) => {
    const navigate = useNavigate();
    const { isAuthenticated, user } = useAppAuth();
    const dangDangNhap = isAuthenticated && !!user;
    const goToLogin = useCallback(() => navigate("/login"), [navigate]);
    const goToHeThong = useCallback(
        () => navigate(user ? getDefaultRouteForRole(user.vai_tro) : "/login"),
        [navigate, user]
    );

    return (
        <div className={styles.page}>
            <AppBrandHeader
                homeTo="/"
                hienDieuHuongCong
                actions={
                    dangDangNhap ? (
                        <MyButton text="Vào hệ thống" variant="primary" onClick={goToHeThong} />
                    ) : (
                        <MyButton text="Đăng nhập" variant="primary" onClick={goToLogin} />
                    )
                }
            />
            <main className={styles.content}>{children}</main>
            <LandingFooter />
        </div>
    );
};

export default TrangCongKhai;
