import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useResolvedPath, useMatch } from "react-router-dom";
import { ActionList, ActionMenu, NavList, Octicon, Text } from "@primer/react";
import { SignOutIcon, ThreeBarsIcon, TriangleDownIcon, XIcon } from "@primer/octicons-react";
import clsx from "clsx";
import styles from "./AppLayout.module.css";
import { useAppAuth } from "../contexts/AppAuthContext";
import AppBrandHeader from "./AppBrandHeader";
import { appConst } from "../AppConst";
import { getVaiTroLabel } from "../model/eVaiTro";
import { getMenuCategoriesForRole, getDefaultRouteForRole } from "../model/appMenuConfig";
import { useWindowSize } from "../hooks/useWindowSize";

// GĐ2 responsive: mốc "đổi vỏ layout" đã chốt. < 768px = mobile (hamburger + drawer toàn màn hình);
// >= 768px = giữ nguyên vỏ 3 cột desktop (rail + panel + content, panel-collapse theo FIX #2).
const MOBILE_MAX_WIDTH = 768;

// R2 ĐÃ BỎ hai hằng BANNER_RIGHT_BG / BANNER_LEFT_BG và cả hai ảnh nền. Header nay là nền phẳng
// (trắng) do AppBrandHeader dựng - lý do đo được ghi ở đầu AppBrandHeader.module.css.
// Thư mục public/imageStyle/aof/ và src/assets/imageStyle/aof/ đã xoá theo (0 tham chiếu).
//     const BANNER_RIGHT_BG = `${process.env.PUBLIC_URL}/imageStyle/aof/banner.png`;
//     const BANNER_LEFT_BG  = `${process.env.PUBLIC_URL}/imageStyle/aof/bannerLeft.png`;
// Đây đúng là kiểu tham chiếu-lúc-chạy đã làm vỡ ảnh âm thầm ở lô dọn (nợ 64): không cạnh import,
// nên xoá file mà không lỗi build nào báo.

// FIX #2: nhớ lựa chọn thu gọn panel giữa. Key RIÊNG cho cổng - KHÔNG đụng Redux
// common.layout của ESS (đã thống nhất: local state + localStorage).
// GĐ2 responsive: key có hậu tố "_desktop" - lựa chọn thu gọn panel CHỈ có nghĩa ở desktop
// (>= 768px). Ở mobile panel bị ẩn hẳn bằng CSS và điều hướng đi qua drawer riêng (state
// open/closed, KHÔNG persist). Sửa bug cross-viewport cũ: khi dùng chung 1 key, mở panel ở
// desktop rồi thu cửa sổ xuống < 768px khiến panel bung ra chiếm chỗ nội dung.
// Đổi từ "alumni_panel_collapsed_desktop" ở lô N1 — không mất lựa chọn của ai: AppLayout chưa route
// nào dựng (N5), và localStorage tách theo origin nên key của cổng Cựu SV không sang được đây.
const PANEL_COLLAPSED_KEY = "app_panel_collapsed_desktop";
const readInitialPanelCollapsed = (): boolean => {
    try {
        const raw = localStorage.getItem(PANEL_COLLAPSED_KEY);
        if (raw === "1") return true;
        if (raw === "0") return false;
    } catch {
        /* localStorage có thể bị chặn (private mode...) - bỏ qua, dùng mặc định theo width */
    }
    return window.innerWidth < 1200; // chưa có lựa chọn -> ẩn sẵn nếu màn hẹp
};

// onClick tùy chọn: dùng ở drawer mobile để đóng drawer ngay khi bấm 1 mục (panel desktop không
// truyền -> hành vi cũ giữ nguyên).
const NavItem: React.FC<{ to: string; children: React.ReactNode; onClick?: () => void }> = ({
    to,
    children,
    onClick,
}) => {
    const resolved = useResolvedPath(to);
    const isCurrent = useMatch({ path: resolved.pathname, end: true });
    return (
        <NavList.Item as={Link} to={to} onClick={onClick} aria-current={isCurrent ? "page" : undefined}>
            {children}
        </NavList.Item>
    );
};

interface IAppLayoutProps {
    children: React.ReactNode;
}

// Layout riêng cho cổng - banner + rail 2 ngăn (copy hình dạng từ layout/Layout.tsx +
// Header/AppList/AppButton/Menu của hệ học vụ), viết lại bằng AppAuthContext + appMenuConfig,
// KHÔNG dùng Redux.
// FIX #3: rail hiện N icon (N = số category của vai trò - QuanLy có 4, LopTruong/CuuSV có 1).
// Click 1 rail icon -> điều hướng tới màn đầu của category đó; vòng cam "active" bám theo
// category có URL hiện tại đang thuộc về.
// FIX #2: nút ThreeBarsIcon ở đỉnh rail thu gọn/mở panel giữa (nhớ localStorage).
const AppLayout: React.FC<IAppLayoutProps> = ({ children }) => {
    const { user, logout } = useAppAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const menuCategories = useMemo(() => getMenuCategoriesForRole(user?.vai_tro), [user]);

    // Category đang chọn = category có child KHỚP URL hiện tại; không khớp -> category đầu.
    const activeCategoryIndex = useMemo(() => {
        const idx = menuCategories.findIndex((c) =>
            c.children.some(
                (ch) => location.pathname === ch.path || location.pathname.startsWith(ch.path + "/"),
            ),
        );
        return idx >= 0 ? idx : 0;
    }, [menuCategories, location.pathname]);

    const [isPanelCollapsed, setIsPanelCollapsed] = useState(readInitialPanelCollapsed);
    const togglePanel = () =>
        setIsPanelCollapsed((prev) => {
            const next = !prev;
            try {
                localStorage.setItem(PANEL_COLLAPSED_KEY, next ? "1" : "0");
            } catch {
                /* localStorage bị chặn - vẫn toggle trong phiên, chỉ không nhớ được */
            }
            return next;
        });

    // ═══════════════════════════════════════════════════════════════════════════════════════
    // 🔴 BẤM ICON RAIL — ĐIỀU HƯỚNG, PANEL GIỮ NGUYÊN; BẤM ICON ĐANG Ở — ĐÓNG/MỞ PANEL
    // ═══════════════════════════════════════════════════════════════════════════════════════
    // Lô bỏ nhãn chữ đặt ra ca: panel đóng, đang ở Thống kê, muốn sang Danh mục. Ba cách đã cân:
    //   (a) icon CHỈ đóng/mở panel      -> mọi lần chuyển màn thành HAI bấm. Bác.
    //   (b) chuyển nhóm + LUÔN mở panel -> ép bung panel với người cố ý thu gọn để lấy chỗ.
    //   (c) ĐANG DÙNG: chuyển nhóm thì ĐIỀU HƯỚNG, panel giữ nguyên trạng thái; bấm icon của
    //       nhóm ĐANG Ở thì đóng/mở panel.
    //
    // Vì sao (c): 4/5 nhóm của Quản lý chỉ có ĐÚNG MỘT màn con (Đợt thu thập · Danh mục · Thống
    // kê · Tin tức), nên với chúng panel chỉ lặp lại tên nhóm - (a) bắt trả một cú bấm để xem
    // thứ đã biết, còn (b) bung panel ra đúng lúc nó không có gì thêm để nói. (c) là mô hình
    // Activity Bar của VS Code TRỪ phần ép mở, và nó KHÔNG hồi quy tốc độ: rail vẫn điều hướng
    // một cú bấm y như trước lô này, chỉ THÊM toggle trên icon đang chọn.
    //
    // ⚠️ `e.preventDefault()` CHỈ ở nhánh isActive. Nhánh còn lại phải để <Link> chạy bình
    //    thường, nếu không mất luôn điều hướng client-side.
    // ⚠️ Bỏ qua khi có phím bổ trợ / không phải chuột trái: Ctrl+click, ⌘+click, Shift+click là
    //    "mở tab/cửa sổ mới" của TRÌNH DUYỆT. Chặn chúng để toggle panel là cướp mất đúng ba
    //    hành vi mà việc dùng <Link> (thay cho <button>) đã cố ý giữ lại.
    const onRailClick = (e: React.MouseEvent<HTMLAnchorElement>, isActive: boolean) => {
        if (!isActive) return;
        if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey || e.button !== 0) return;
        e.preventDefault();
        togglePanel();
    };

    // ═══════════════════════════════════════════════════════════════════════════════════════
    // 🔴 ĐĂNG XUẤT VỀ TRANG CHỦ, KHÔNG VỀ MÀN ĐĂNG NHẬP
    // ═══════════════════════════════════════════════════════════════════════════════════════
    // Bản cũ đẩy sang "/alumni/login". Đó là mời người vừa CHỦ ĐỘNG rời hệ thống đăng nhập lại
    // ngay - và với người chỉ muốn đóng phiên trên máy dùng chung thì màn đăng nhập là ngõ cụt:
    // không có gì để đọc, không có đường ra ngoài.
    // Trang chủ là nơi đúng: nó công khai, có nút "Đăng nhập" sẵn cho ai muốn vào lại.
    //
    // ⚠️ ĐIỀU KIỆN ĐỂ CHỖ NÀY ĐÚNG (R9): Landing đã GỠ guard "đang đăng nhập thì đá khỏi trang".
    // Còn guard kiểu đó thì `logout()` chưa kịp có tác dụng ở lần vẽ này và Landing sẽ bật ngược
    // người dùng về màn theo vai trò -> rồi AppProtectedRoute đá tiếp sang /alumni/login.
    //
    // 🔄 CẬP NHẬT: /alumni NAY CÓ guard trở lại - `TrangCongKhaiRoute` (Lớp trưởng/Quản lý không
    // được vào trang giới thiệu). Guard đó KHÔNG phải thủ phạm của lỗi "đăng xuất về màn đăng
    // nhập" (đã dò bằng log: nó không hề chạy trong ca đó) - thủ phạm là `AppProtectedRoute`
    // của chính màn đang đứng, và cách chữa nằm ở `handleLogout` ngay dưới.
    //
    // ═══════════════════════════════════════════════════════════════════════════════════════
    // 🔴 `startTransition` Ở ĐÂY LÀ BẮT BUỘC — KHÔNG PHẢI TỐI ƯU HIỆU NĂNG
    // ═══════════════════════════════════════════════════════════════════════════════════════
    // Bỏ nó ra là lỗi "bấm Đăng xuất thì rơi vào MÀN ĐĂNG NHẬP" quay lại ngay. Đã dò bằng log,
    // đây là chuỗi THẬT của bản `logout(); navigate("/alumni");` trần:
    //
    //     handleLogout: SAU logout(), token = null
    //     handleLogout: gọi navigate('/alumni')
    //     AppProtectedRoute render: isAuthenticated=false      <-- VẪN Ở /alumni/admin/duyet
    //     >>> AppProtectedRoute BẮN /alumni/login
    //     RENDER tại: /alumni/login
    //
    // Tức là KHÔNG BAO GIỜ tới được /alumni. Nguyên nhân: react-router v7 chạy `navigate()` bên
    // trong `React.startTransition`, nên đổi route là việc KHÔNG GẤP; còn `setUser(null)` của
    // `logout()` là việc GẤP. React commit việc gấp TRƯỚC, ở URL CŨ - lúc đó `AppProtectedRoute`
    // của màn admin vẫn đang mounted, thấy "chưa đăng nhập" và tự bắn `/alumni/login`, thắng luôn
    // chuyến điều hướng đang chờ.
    //
    // ⇒ Bọc CẢ HAI trong MỘT `startTransition` để chúng vào cùng một lane và commit CÙNG một lần
    //   vẽ: khi auth thành null thì URL đã là /alumni, màn admin đã tháo, không ai bắn login nữa.
    //   Chuỗi log sau khi sửa: "RENDER tại: /alumni" -> DOM = Landing.
    //
    // ⚠️ ĐỔI THỨ TỰ HAI DÒNG BÊN TRONG KHÔNG CỨU ĐƯỢC. `navigate()` trước rồi `logout()` sau thì
    //    `logout()` vẫn là việc gấp và vẫn commit ở URL cũ - đúng lỗi cũ. Thứ chữa là CÙNG LANE,
    //    không phải thứ tự.
    // ⚠️ Và đây cũng là lý do Landing hiện đúng nhãn "Đăng nhập" (không phải "Vào hệ thống"):
    //    auth và URL đổi trong cùng một commit nên không có khung hình nào vẽ bằng phiên cũ.
    const handleLogout = () => {
        React.startTransition(() => {
            logout();
            navigate("/", { replace: true });
        });
    };

    // GĐ2 responsive: < 768px -> rail + panel bị ẩn hẳn (CSS), điều hướng qua drawer toàn màn hình.
    // Tái dùng useWindowSize có sẵn (src/hooks/useWindowSize.ts) - KHÔNG tự viết listener resize mới.
    // (useWindowSize.isMobile hardcode <= 576 nên không dùng trực tiếp; đọc width + so với mốc chốt.)
    const { width: viewportWidth } = useWindowSize();
    const isMobile = viewportWidth < MOBILE_MAX_WIDTH;
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const drawerRef = useRef<HTMLDivElement>(null);
    const mobileNavToggleRef = useRef<HTMLButtonElement>(null);
    const previousFocusedElementRef = useRef<HTMLElement | null>(null);

    const openDrawer = () => {
        previousFocusedElementRef.current =
            document.activeElement instanceof HTMLElement ? document.activeElement : mobileNavToggleRef.current;
        setIsDrawerOpen(true);
    };

    // Đóng drawer sau khi điều hướng sang trang khác (bấm 1 mục trong drawer -> URL đổi).
    useEffect(() => {
        setIsDrawerOpen(false);
    }, [location.pathname]);

    // Cửa sổ giãn lại >= 768px trong lúc drawer đang mở -> đóng, tránh drawer "kẹt" ở desktop.
    useEffect(() => {
        if (!isMobile) setIsDrawerOpen(false);
    }, [isMobile]);

    // Drawer đang mở: focus nút đóng, bẫy Tab trong drawer, Esc để đóng và khóa cuộn nền.
    // Khi đóng, trả focus về phần tử đã mở drawer (thường là nút hamburger).
    useEffect(() => {
        if (!isDrawerOpen) {
            const previousFocusedElement = previousFocusedElementRef.current;
            if (isMobile && previousFocusedElement && document.contains(previousFocusedElement)) {
                previousFocusedElement.focus();
            }
            previousFocusedElementRef.current = null;
            return;
        }

        if (!isMobile || !drawerRef.current) return;

        const focusableSelector = [
            "a[href]",
            "button:not([disabled])",
            "input:not([disabled]):not([type=\"hidden\"])",
            "select:not([disabled])",
            "textarea:not([disabled])",
            "[tabindex]:not([tabindex=\"-1\"])",
        ].join(",");
        const getFocusableElements = () =>
            Array.from(drawerRef.current?.querySelectorAll<HTMLElement>(focusableSelector) ?? []).filter(
                (element) => element.getClientRects().length > 0 && element.getAttribute("aria-hidden") !== "true",
            );

        getFocusableElements()[0]?.focus();

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                e.preventDefault();
                setIsDrawerOpen(false);
                return;
            }

            if (e.key !== "Tab") return;

            const focusableElements = getFocusableElements();
            if (focusableElements.length === 0) {
                e.preventDefault();
                return;
            }

            const firstFocusableElement = focusableElements[0];
            const lastFocusableElement = focusableElements[focusableElements.length - 1];
            if (e.shiftKey && document.activeElement === firstFocusableElement) {
                e.preventDefault();
                lastFocusableElement.focus();
            } else if (!e.shiftKey && document.activeElement === lastFocusableElement) {
                e.preventDefault();
                firstFocusableElement.focus();
            }
        };
        const prevBodyOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        document.addEventListener("keydown", onKeyDown);
        return () => {
            document.body.style.overflow = prevBodyOverflow;
            document.removeEventListener("keydown", onKeyDown);
        };
    }, [isDrawerOpen, isMobile]);

    const activeCategory = menuCategories[activeCategoryIndex];
    const menuItems = activeCategory?.children ?? [];
    const groupLabel = activeCategory?.category.label ?? "";

    return (
        <div className={styles.page}>
            {/* Header DÙNG CHUNG với Landing - đóng nợ 51. Khác biệt của màn này nằm ở hai prop:
                `leading` = nút hamburger (chỉ hiện < 768px), `actions` = menu tài khoản. */}
            {/* ═══════════════════════════════════════════════════════════════════════════════
                🔴 THANH ĐIỀU HƯỚNG CỔNG CHỈ BẬT CHO VAI CỰU SINH VIÊN
                ═══════════════════════════════════════════════════════════════════════════════
                Lead chốt: Cựu SV giữ đủ 4 mục (họ là "khách" của cổng, vẫn cần đường về trang
                giới thiệu); Lớp trưởng/Quản lý ẩn hết, chỉ còn menu tài khoản - họ đang LÀM VIỆC,
                điều hướng của họ do rail + panel lo, thêm một hàng liên kết nữa là BA nơi điều
                hướng cạnh nhau.

                🔄 NHƯNG CHỈ ẨN MỤC, KHÔNG BỎ TẦNG. Bản trước dùng `hienDieuHuongCong=false` cho
                hai vai này, mà cờ đó gồng BA việc - nên nó kéo theo khối chữ cạnh logo rơi về
                thương hiệu nhà cung cấp ("PHẦN MỀM ESSOFT"), tức hai màn chức năng đọc ra như
                header scaffold cũ và mất luôn danh tính cổng. Lead chốt: giữ NGUYÊN header hai
                tầng của Trang chủ, chỉ ẩn 4 mục -> `hienDieuHuongCong` luôn bật, cờ RIÊNG
                `hienMucDieuHuong` lo phần mục.

                ⚠️ CÁI GIÁ ĐÃ CHẤP NHẬN (không phải đã hết): header nay 96px cho MỌI vai, nên BỐN
                màn chạy `fillAvailableHeight` (Thống kê · Duyệt · Danh mục -> Quản lý; Xuất danh
                sách lớp -> Lớp trưởng) mất đúng 16px vùng làm việc. Màn nào chật thì xử TRONG màn
                đó, ĐỪNG hạ header xuống một tầng lần nữa - xem docs mục 103. */}
            <AppBrandHeader
                hienDieuHuongCong
                /* 🔴 LUÔN `false` ở cổng Tài trợ, KHÁC repo gốc (ở đó vai Cựu SV được xem trang công
                   khai nên cờ này bật theo vai). Cổng này chỉ có vai Quản trị, mà TrangCongKhaiRoute
                   đá thẳng vai đó khỏi mọi trang công khai ⇒ hiện mục điều hướng là hiện lối đi
                   dẫn tới cú đá. Xem eVaiTro.ts. */
                hienMucDieuHuong={false}
                homeTo={user ? getDefaultRouteForRole(user.vai_tro) : "/"}
                leading={
                    /* GĐ2: nút mở drawer điều hướng - CHỈ hiện < 768px (desktop: CSS display:none
                       nên KHÔNG chiếm chỗ, layout >= 768px không đổi). */
                    <button
                        type="button"
                        ref={mobileNavToggleRef}
                        className={styles.mobileNavToggle}
                        onClick={openDrawer}
                        aria-label="Mở menu điều hướng"
                        aria-expanded={isDrawerOpen}
                    >
                        <ThreeBarsIcon />
                    </button>
                }
                actions={
                    <ActionMenu>
                        <ActionMenu.Anchor>
                            <button type="button" className={styles.userMenuAnchor}>
                                <span className={clsx(styles.userInfo)}>
                                    <span className={clsx(styles.userEmail)}>{user?.email}</span>
                                    <span className={clsx(styles.userRole)}>{getVaiTroLabel(user?.vai_tro)}</span>
                                </span>
                                <TriangleDownIcon />
                            </button>
                        </ActionMenu.Anchor>
                        <ActionMenu.Overlay>
                            <ActionList>
                                <ActionList.Item>
                                    <Text sx={{ fontWeight: 700 }}>{user?.email}</Text>
                                    <br />
                                    <Text>{getVaiTroLabel(user?.vai_tro)}</Text>
                                </ActionList.Item>
                                <ActionList.Divider />
                                <ActionList.Item variant="danger" onClick={handleLogout}>
                                    <ActionList.LeadingVisual>
                                        <SignOutIcon />
                                    </ActionList.LeadingVisual>
                                    Đăng xuất
                                </ActionList.Item>
                            </ActionList>
                        </ActionMenu.Overlay>
                    </ActionMenu>
                }
            />
            <div className={clsx(styles.body)}>
                <div className={clsx(styles.rail)}>
                    <button
                        type="button"
                        className={styles.railToggle}
                        onClick={togglePanel}
                        aria-label={isPanelCollapsed ? "Hiện bảng menu" : "Thu gọn bảng menu"}
                        aria-pressed={isPanelCollapsed}
                    >
                        <ThreeBarsIcon />
                    </button>

                    {menuCategories.map((cat, i) => {
                        const isActive = i === activeCategoryIndex;
                        return (
                            // <Link> chứ KHÔNG phải <button>: rail là ĐIỀU HƯỚNG, nên phải mở được
                            // tab mới bằng Ctrl+click / chuột giữa, hiện URL khi rê chuột và copy
                            // link được. Bản <button onClick={navigate}> trước đây mất cả ba.
                            // (NavItem của panel bên cạnh đã dùng as={Link} từ trước - nay rail khớp.)
                            // aria-current="page" (không phải "true"): với link trỏ tới trang hiện
                            // tại, "page" mới là giá trị đúng ngữ nghĩa.
                            //
                            // 🔴 NHÃN CHỮ ĐÃ BỎ -> `aria-label` LÀ BẮT BUỘC, không phải trang trí.
                            // Bỏ nhãn NHÌN THẤY được không được phép bỏ nhãn NGHE được: thiếu nó,
                            // trình đọc màn hình chỉ còn một <a> rỗng (icon đã aria-hidden) và cả
                            // rail thành N liên kết không tên. Tooltip phục vụ chuột, aria-label
                            // phục vụ trình đọc màn hình - CẦN CẢ HAI, không cái nào thay cái nào.
                            // 🔴 KHÔNG dùng <Tooltip> của Primer ở đây. CSS của nó bật `::after` ở
                            // `:hover, :active, :focus, :focus-within` - mà BẤM CHUỘT vào một <a>
                            // là trình duyệt GIỮ FOCUS trên đó, nên tooltip ở lại lì sau khi chuột
                            // đã đi chỗ khác (đúng lỗi đã gặp: bấm "Thống kê" xong nhãn treo mãi).
                            // Tooltip của rail nay dựng trong AppLayout.module.css bằng
                            // `.railItem::after` + `content: attr(aria-label)`, chỉ hiện ở
                            // `:hover` và `:focus-visible` - `:focus-visible` KHÔNG khớp với focus
                            // đến từ cú bấm chuột, nên vừa hết treo vừa giữ nguyên đường bàn phím.
                            <Link
                                key={cat.category.label}
                                to={cat.children[0].path}
                                className={clsx(styles.railItem)}
                                aria-current={isActive ? "page" : undefined}
                                aria-label={cat.category.label}
                                onClick={(e) => onRailClick(e, isActive)}
                            >
                                    <div className={styles.railIcon}>
                                        <div className={styles.railIconState}>
                                            {isActive && <div className={styles.railActiveState}>&nbsp;</div>}
                                        </div>
                                        <div className={styles.railIconImage}>
                                            <div
                                                className={clsx(
                                                    styles.railIconApp,
                                                    isActive && styles.railIconAppActive,
                                                )}
                                            >
                                                {/* N3 (trả nợ 64): octicon thay cho <img> nạp theo
                                                    tên file lúc chạy. Sai tên icon nay là lỗi `tsc`,
                                                    không còn là ảnh vỡ âm thầm - xem chú thích ở
                                                    `icon` trong appMenuConfig.ts.
                                                    aria-hidden GIỮ NGUYÊN dù nhãn chữ đã bỏ: tên
                                                    nhóm nay nằm ở `aria-label` của chính <Link>,
                                                    để icon phát ra tên nữa là đọc HAI LẦN. */}
                                                <Octicon
                                                    icon={cat.category.icon}
                                                    size={32}
                                                    aria-hidden="true"
                                                />
                                            </div>
                                        </div>
                                        <div className={styles.railIconState} />
                                    </div>
                            </Link>
                        );
                    })}
                </div>

                {!isPanelCollapsed && menuItems.length > 0 && (
                    <div className={styles.panel}>
                        {/* TÊN CỔNG. Nó bị đẩy khỏi header ở R2 (header nay mang thương hiệu
                            nhà cung cấp), mà đây là chỗ DUY NHẤT trong vùng làm việc luôn hiện
                            và không đổi theo màn - đúng vai "mình đang ở hệ thống nào".
                            CỐ Ý là <div> chứ không phải thẻ tiêu đề: <h1> của mỗi trang đã do
                            AppPageCaption giữ, thêm một <h1> nữa ở panel là hai <h1> trên
                            cùng một tài liệu - trình đọc màn hình sẽ báo cấu trúc sai. */}
                        <div className={styles.panelAppName}>{appConst.appicationName}</div>
                        <div className={clsx(styles.panelTitle)}>{groupLabel}</div>
                        <NavList>
                            {menuItems.map((item) => (
                                <NavItem key={item.path} to={item.path}>
                                    {item.label}
                                </NavItem>
                            ))}
                        </NavList>
                    </div>
                )}

                <main className={clsx(styles.content)}>{children}</main>
            </div>

            {/* GĐ2: Drawer điều hướng mobile - render CÓ ĐIỀU KIỆN (chỉ < 768px và khi mở) nên
               desktop hoàn toàn không dựng phần này. Danh sách PHẲNG: mọi category + children,
               mọi nhóm hiện sẵn (không có rail-icon / panel-collapse bên trong). Tự dựng overlay
               full màn hình (Primer không có Drawer). Đóng khi: bấm X, bấm 1 mục, Esc, hoặc URL
               đổi (useEffect trên location.pathname). */}
            {isMobile && isDrawerOpen && (
                <div
                    ref={drawerRef}
                    className={styles.drawerOverlay}
                    role="dialog"
                    aria-modal="true"
                    aria-label="Menu điều hướng"
                >
                    <div className={styles.drawerHeader}>
                        <span className={styles.drawerTitle}>{appConst.appicationName}</span>
                        <button
                            type="button"
                            className={styles.drawerClose}
                            onClick={() => setIsDrawerOpen(false)}
                            aria-label="Đóng menu"
                        >
                            <XIcon />
                        </button>
                    </div>
                    <div className={styles.drawerNav}>
                        <NavList aria-label="Điều hướng cổng vận động tài trợ">
                            {menuCategories.map((cat) => (
                                <NavList.Group key={cat.category.label} title={cat.category.label}>
                                    {cat.children.map((item) => (
                                        <NavItem
                                            key={item.path}
                                            to={item.path}
                                            onClick={() => setIsDrawerOpen(false)}
                                        >
                                            {item.label}
                                        </NavItem>
                                    ))}
                                </NavList.Group>
                            ))}
                        </NavList>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AppLayout;
