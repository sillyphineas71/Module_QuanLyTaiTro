// ═══════════════════════════════════════════════════════════════════════════════════════════
// VAI TRÒ CỦA CỔNG VẬN ĐỘNG TÀI TRỢ — khớp TT_TaiKhoan.vai_tro bên BE
// ═══════════════════════════════════════════════════════════════════════════════════════════
// 🔴 CHỈ CÓ MỘT VAI, VÀ ĐÓ LÀ ĐIỀU CÓ CHỦ ĐÍCH — đừng thêm "Cựu sinh viên" vào đây.
// Cổng này có HAI LUỒNG TÀI KHOẢN KHÔNG GIAO NHAU (xem docs/01-kien-truc.md):
//     TT_TaiKhoan                 — quản trị cổng tài trợ, ĐĂNG NHẬP để duyệt thanh toán
//     CSV_TaiKhoan + CSV_ThongTin — cựu sinh viên, CHỈ ĐỌC để điền sẵn form, KHÔNG đăng nhập
// Cựu sinh viên KHÔNG có tài khoản ở cổng này. Người đóng góp là KHÁCH — không đăng nhập.
//
// ⚠️ Repo gốc (Cựu sinh viên) có ba vai QuanLy/LopTruong/CuuSV. Chúng đã được gỡ khi clone, KHÔNG
//    phải bỏ sót. Nếu thấy mình sắp thêm lại một vai trong số đó, dừng lại và đọc docs trước.
// ⚠️ Giá trị số phải khớp cột `vai_tro` của TT_TaiKhoan khi P4 dựng bảng đó.
// ═══════════════════════════════════════════════════════════════════════════════════════════
export enum eVaiTro {
    QuanTri = 1,
}

export const getVaiTroLabel = (vaiTro?: eVaiTro): string => {
    switch (vaiTro) {
        case eVaiTro.QuanTri:
            return "Quản trị";
        default:
            return "";
    }
};
