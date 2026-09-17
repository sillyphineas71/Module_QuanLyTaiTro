import type { Icon } from "@primer/octicons-react";
import { MegaphoneIcon } from "@primer/octicons-react";
import { eVaiTro } from "./eVaiTro";
import { DUONG_DAN_TAI_TRO } from "./ITaiTro";

// ═══════════════════════════════════════════════════════════════════════════════════════════
// CẤU HÌNH RAIL + PANEL cho khu vực ĐÃ ĐĂNG NHẬP (AppLayout dùng chung một chỗ này)
// ═══════════════════════════════════════════════════════════════════════════════════════════
// Cấu trúc CATEGORY + CHILDREN: một "category" = một NHÓM CHỨC NĂNG = một icon ở rail + tiêu đề
// panel. Một vai trò có thể có NHIỀU category ⇒ getMenuCategoriesForRole trả về MẢNG.
//
// 🔴 ĐANG LÀ CHỖ GIỮ CHỖ (P1). Cổng Tài trợ chưa có màn quản trị nào — luồng đăng nhập là P4.
// Sáu category của cổng Cựu sinh viên (Duyệt/Cấp tài khoản · Đợt thu thập · Danh mục · Thống kê ·
// Tin tức · Gửi mail) ĐÃ ĐƯỢC GỠ khi clone, không phải bỏ sót: chúng là nghiệp vụ của cổng kia.
//
// ⚠️ KHÔNG XOÁ MẢNG NÀY CHO RỖNG: `getDefaultRouteForRole` là đích điều hướng sau đăng nhập, và
//    AppLayout dựng rail từ `children[0].path`. Mảng rỗng ⇒ rail trắng + điều hướng rơi về
//    một đường dẫn không tồn tại. Giữ đúng MỘT mục trỏ tới trang đã có thật.
//
// ⚠️ THỨ TỰ CÓ NGHĨA (giữ nguyên luật của repo gốc): rail điều hướng bằng `children[0].path`, và
//    getDefaultRouteForRole lấy categories[0].children[0].path. Đảo thứ tự là đổi cả hai đích.
//
// 🔴 ICON LÀ COMPONENT octicon, KHÔNG phải tên file PNG. Repo gốc từng dùng tên file và mất 4 icon
//    âm thầm khi ai đó xoá ảnh — gõ sai tên component thì `tsc` đỏ ngay, còn gõ sai tên file thì
//    chỉ vỡ ảnh trên trình duyệt. Thêm mục menu KHÔNG cần thêm file ảnh nào.
// ═══════════════════════════════════════════════════════════════════════════════════════════
export interface IAppMenuChild {
    label: string;
    path: string;
}

export interface IAppMenuCategory {
    vaiTro: eVaiTro;
    category: {
        label: string;
        icon: Icon;
    };
    children: IAppMenuChild[];
}

export const APP_MENU_CATEGORIES: IAppMenuCategory[] = [
    {
        vaiTro: eVaiTro.QuanTri,
        category: { label: "Chương trình tài trợ", icon: MegaphoneIcon },
        children: [{ label: "Danh sách chương trình", path: DUONG_DAN_TAI_TRO }],
    },
];

/** Trả TẤT CẢ category của một vai trò. */
export const getMenuCategoriesForRole = (vaiTro?: eVaiTro): IAppMenuCategory[] =>
    vaiTro == null ? [] : APP_MENU_CATEGORIES.filter((x) => x.vaiTro === vaiTro);

/** Đích điều hướng sau đăng nhập: category đầu tiên của vai, child đầu tiên của category đó. */
export const getDefaultRouteForRole = (vaiTro: eVaiTro): string => {
    const categories = getMenuCategoriesForRole(vaiTro);
    return categories[0]?.children[0]?.path ?? DUONG_DAN_TAI_TRO;
};
