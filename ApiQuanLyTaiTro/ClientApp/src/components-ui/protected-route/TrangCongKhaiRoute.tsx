import React from "react";
import { Navigate } from "react-router-dom";
import { useAppAuth } from "../../contexts/AppAuthContext";
import { eVaiTro } from "../../model/eVaiTro";
import { getDefaultRouteForRole } from "../../model/appMenuConfig";

// ═══════════════════════════════════════════════════════════════════════════════════════════
// GUARD TRANG CÔNG KHAI — QUYỀN VÀO TRANG THEO VAI (đảo một phần quyết định R9)
// ═══════════════════════════════════════════════════════════════════════════════════════════
// Đây KHÔNG phải AppProtectedRoute lật ngược. Hai guard trả lời hai câu khác nhau:
//   · AppProtectedRoute : "chưa đăng nhập / sai vai thì KHÔNG được vào màn làm việc";
//   · guard này            : "đã đăng nhập bằng vai LÀM VIỆC thì không có việc gì ở trang
//                             giới thiệu" — người ngoài và cựu SV vẫn vào bình thường.
//
// ── VÌ SAO R9 GỠ GUARD, VÀ VÌ SAO NAY SIẾT LẠI (giữ CẢ HAI lập luận) ──────────────────────
// R9 gỡ guard cũ `if (isAuthenticated && user) <Navigate to={getDefaultRouteForRole(...)}/>`
// khỏi Landing. Lý do R9 VẪN ĐÚNG và KHÔNG được xoá khỏi tài liệu: header của Cựu SV có BA mục
// trỏ thẳng về Landing (`/alumni`, `/alumni#gioi-thieu`, `/alumni#lien-he`) — với guard cũ thì
// cả ba bật ngược người dùng về `/alumni/profile` ngay lập tức, tức ba mục CHẾT ÂM THẦM: bấm có
// phản ứng (URL đổi, trang vẽ lại) nhưng không bao giờ tới đích.
//
// 🔴 Chỗ R9 sai là ĐỘ PHỦ, không phải lập luận: nó gỡ guard cho MỌI vai, trong khi lý do trên
// chỉ áp cho CỰU SINH VIÊN — vai duy nhất có mục điều hướng trỏ về Landing. Lớp trưởng/Quản lý
// KHÔNG có mục nào trỏ về đó (header họ một tầng, không thanh điều hướng), nên gỡ guard cho hai
// vai này không mở ra đường đi nào — chỉ mở ra một trạng thái SAI NGHIỆP VỤ: họ đăng nhập để
// LÀM VIỆC, không phải để đọc trang giới thiệu dành cho người ngoài.
//
// ⇒ Guard theo VAI, không theo trạng thái đăng nhập:
//      chưa đăng nhập → xem bình thường
//      Cựu sinh viên  → xem bình thường  (ba mục điều hướng cần nó — lập luận R9)
//      Lớp trưởng     → về màn mặc định của vai
//      Quản lý        → về màn mặc định của vai
//
// ⚠️ KHÔNG có vòng lặp điều hướng — đã tra từng đích:
//      Quản lý    → /alumni/admin/duyet
//      Lớp trưởng → /alumni/lop-truong/xuat-danh-sach
//      (dự phòng khi vai không có category nào → /alumni/dashboard)
//    Cả ba đều bọc `withAppLayout`, KHÔNG đích nào là trang công khai, nên không quay lại
//    guard này. `replace` để nút Quay lại không ném người dùng vào vòng gõ-URL/đá-về.
//
// ⚠️ Thêm trang công khai mới thì phải bọc guard này — xem `ui-no-ky-thuat.md` mục 103.
// 🔴 CỔNG TÀI TRỢ CHỈ CÓ MỘT VAI LÀM VIỆC. Repo gốc có hai (Quản lý + Lớp trưởng) và CỐ Ý cho
// vai "Cựu sinh viên" xem trang công khai. Ở cổng này KHÔNG có vai nào tương đương: người đóng
// góp là KHÁCH, không đăng nhập (xem eVaiTro.ts). Nên mảng này có đúng một phần tử.
const VAI_LAM_VIEC: eVaiTro[] = [eVaiTro.QuanTri];

interface ITrangCongKhaiRouteProps {
    children: React.ReactNode;
}

const TrangCongKhaiRoute: React.FC<ITrangCongKhaiRouteProps> = ({ children }) => {
    const { isAuthenticated, user } = useAppAuth();

    // ⚠️ CHỈ đọc context, KHÔNG đọc thêm authStorage. Một bản vá trước từng thêm
    // `!!authStorage.getToken()` vào điều kiện dưới đây vì tưởng guard này là thủ phạm của lỗi
    // "đăng xuất rơi vào màn đăng nhập". Dò bằng log thì guard này KHÔNG HỀ CHẠY trong ca đó -
    // thủ phạm là `AppProtectedRoute` ở màn cũ, và cách sửa nằm ở `handleLogout`
    // (AppLayout). Bản vá kia đã gỡ; đừng thêm lại, nó chỉ dựng thêm một nguồn sự thật thứ hai.
    if (isAuthenticated && user && VAI_LAM_VIEC.includes(user.vai_tro)) {
        return <Navigate to={getDefaultRouteForRole(user.vai_tro)} replace />;
    }

    return <>{children}</>;
};

export default TrangCongKhaiRoute;
