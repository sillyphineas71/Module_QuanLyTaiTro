import React from "react";

// ═══════════════════════════════════════════════════════════════════════════════════════════
// renderOVanBan — Ô VĂN BẢN CÓ TOOLTIP, dùng chung cho MỌI ô chữ của DataTable
// ═══════════════════════════════════════════════════════════════════════════════════════════
// 🔴 TÁCH RA KHI CLONE SANG CỔNG TÀI TRỢ. Ở repo Cựu sinh viên nó nằm trong
// `pages/admin/thong-ke/thongKeColumns.tsx` — một file 260 dòng định nghĩa cột cho màn Thống kê
// cựu SV. Module tài trợ chỉ cần ĐÚNG 4 dòng dưới đây, nên kéo cả file kia sang là kéo theo
// IThongKe + 15 định nghĩa cột của một nghiệp vụ không tồn tại ở cổng này.
// ⚠️ Nếu sau này chép thêm màn nào từ repo cũ mà nó import `renderOVanBan` từ `thongKeColumns`,
//    trỏ lại về file này, ĐỪNG chép thongKeColumns sang.
//
// Vì sao cần: bảng của cổng CẮT CỤT thay vì xuống dòng (`white-space: nowrap` + `text-overflow:
// ellipsis`). Cắt cụt mà không có cách xem lại giá trị đầy đủ là LÀM MẤT DỮ LIỆU khỏi giao diện.
// `title` cho tooltip gốc của trình duyệt khi rê chuột — không cần thư viện.
//
// ⚠️ LUẬT ĐI CẶP: mỗi khi đặt rule cắt cụt cho một cột, ô của cột đó PHẢI đi qua hàm này (hoặc
//    tự đặt `title`). Cột "Số tiền" của bảng nhà tài trợ là ví dụ đã từng vi phạm: nó tự dựng
//    <span> nên khi width thiếu thì con số bị cắt mà không có đường đọc lại.
//
// `title` chỉ đặt khi có nội dung: `title=""` làm trình duyệt hiện một tooltip rỗng.
// ═══════════════════════════════════════════════════════════════════════════════════════════
export const renderOVanBan = (giaTri: unknown): JSX.Element => {
    const noiDung = giaTri == null ? "" : String(giaTri);
    return <span title={noiDung || undefined}>{noiDung}</span>;
};
