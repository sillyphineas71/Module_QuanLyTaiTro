// ═══════════════════════════════════════════════════════════════════════════════════════════
// dinhDangNgay — ISO -> ba mảnh ngày dùng chung
// ═══════════════════════════════════════════════════════════════════════════════════════════
// 🔴 TÁCH RA KHI CLONE SANG CỔNG TÀI TRỢ. Ở repo Cựu sinh viên nó nằm trong
// `pages/cuu-sinh-vien/tin-tuc/TinTucChung.tsx` cùng với KhungAnh/ONgay/NhanNgay/DuongDan —
// toàn bộ nguyên tử giao diện của module TIN TỨC, mà cổng này không có module tin tức.
// Module tài trợ chỉ dùng đúng hàm này (`.day` cho cột "Thời gian", `.ngay`/`.thangNam` cho ô
// ngày của thẻ chương trình).
// ⚠️ Nếu mai chép module Tin tức sang thì chép cả TinTucChung.tsx và cho nó import TỪ ĐÂY, đừng
//    để hai bản dinhDangNgay cùng sống — hai bản chép rồi trôi khỏi nhau là lỗi đã gặp nhiều lần.
//
// `padStart` nên `day` LUÔN đúng 10 ký tự "dd/MM/yyyy" — cột bảng dựa vào bất biến đó để tính
// width, đừng đổi sang bản bỏ số 0 đứng đầu.
// ═══════════════════════════════════════════════════════════════════════════════════════════
export const dinhDangNgay = (iso: string) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return { ngay: "", thangNam: "", day: "" };
    const hai = (n: number) => String(n).padStart(2, "0");
    return {
        ngay: hai(d.getDate()),
        thangNam: `${hai(d.getMonth() + 1)}/${d.getFullYear()}`,
        day: `${hai(d.getDate())}/${hai(d.getMonth() + 1)}/${d.getFullYear()}`,
    };
};
