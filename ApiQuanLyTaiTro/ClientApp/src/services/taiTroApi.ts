import httpClient from "./httpClient";
import { IChuongTrinhTaiTro, IChuongTrinhTomTat } from "../model/ITaiTro";

// ═══════════════════════════════════════════════════════════════════════════════════════════
// API CÔNG KHAI CỦA CỔNG TÀI TRỢ (P2b) — thay cho `pages/tai-tro/taiTroMock.ts`
// ═══════════════════════════════════════════════════════════════════════════════════════════
// BE: TaiTroController — GET api/tai-tro/chuong-trinh · GET api/tai-tro/chuong-trinh/{id}.
//
// 🔴 VÌ SAO TRẢ `KetQuaTai` CHỨ KHÔNG TRẢ THẲNG DỮ LIỆU / NÉM LỖI:
// `httpClient` KHÔNG ném — mọi lỗi (mạng, 500, 404) đều về `{ is_success: false }`. Màn hình cần tách
// BA câu trả lời khác nhau, và chúng không được gộp:
//   · "khong-thay" — BE trả 404 + code "0702" (DATA_NULL): id sai / đã xoá / còn NHÁP. BE cố ý không
//                    phân biệt ba ca đó (P2a) — FE cũng KHÔNG được đoán thêm.
//   · "loi"        — không biết có dữ liệu hay không (mạng rớt, 5xx, BE che lỗi hệ thống "0001").
//                    PHẢI kèm nút Thử lại. Tuyệt đối không vẽ như "không có".
//   · "xong"       — có dữ liệu (danh sách RỖNG vẫn là "xong": hệ thống chạy bình thường, chưa có đợt nào).
// ⚠️ Không có cache, không có hủy request: trang đọc một lần khi mở. Màn hình tự chặn setState sau unmount.
// ═══════════════════════════════════════════════════════════════════════════════════════════

/** Mã BE `ResponseCode.DATA_NULL` — "không tìm thấy" (xem Models/Responses/ResponseCode.cs). */
const MA_KHONG_TIM_THAY = "0702";

export type KetQuaTai<T> =
    | { loai: "xong"; data: T }
    | { loai: "khong-thay" }
    | { loai: "loi" };

export const layDanhSachChuongTrinh = async (): Promise<KetQuaTai<IChuongTrinhTomTat[]>> => {
    const r = await httpClient.get<IChuongTrinhTomTat[]>("/tai-tro/chuong-trinh");
    // Danh sách KHÔNG có ca "không tìm thấy": BE trả SUCCESS + [] khi chưa có chương trình nào.
    // Mảng thiếu (data null/không phải mảng) mà vẫn is_success ⇒ coi là LỖI, đừng coi là rỗng.
    if (r.is_success && Array.isArray(r.data)) return { loai: "xong", data: r.data };
    return { loai: "loi" };
};

export const layChiTietChuongTrinh = async (id: number): Promise<KetQuaTai<IChuongTrinhTaiTro>> => {
    const r = await httpClient.get<IChuongTrinhTaiTro>(`/tai-tro/chuong-trinh/${id}`);
    if (r.is_success && r.data) return { loai: "xong", data: r.data };
    if (r.code === MA_KHONG_TIM_THAY) return { loai: "khong-thay" };
    return { loai: "loi" };
};
