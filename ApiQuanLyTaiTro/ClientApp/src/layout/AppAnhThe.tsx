import React, { useEffect, useState } from "react";
import { PersonIcon } from "@primer/octicons-react";
import styles from "./AppAnhThe.module.css";

// ═══════════════════════════════════════════════════════════════════════════════════════════
// Ô ẢNH THẺ SINH VIÊN — dùng chung cho MÀN HỒ SƠ CÁ NHÂN và MODAL CHI TIẾT CỰU SV (N9).
// ═══════════════════════════════════════════════════════════════════════════════════════════
// TÁCH RA từ ProfilePage.tsx ở N9: đây là nơi dùng THỨ HAI, đủ điều kiện trích xuất (quy tắc
// "hai lần lặp thì tách" của cổng). Nguyên bản ở ProfilePage giữ NGUYÊN 5 lớp xử lý, không lớp
// nào bị bỏ khi trích xuất:
//   1. XẾP CHỒNG (không render-hoặc): ô chữ cái đầu và <img> LUÔN cùng có mặt trong DOM, ảnh chỉ
//      đổi opacity khi tải xong - xử luôn ca "ảnh tải chậm" mà không cần thêm state loading rẽ
//      nhánh JSX. Trong lúc chờ mạng, người dùng thấy ô chữ cái đã thiết kế sẵn, không phải ô
//      trắng nhấp nháy.
//   2. Ô CHỮ CÁI ĐẦU (từ CUỐI trong họ tên tiếng Việt) - trạng thái CHÍNH, không phải chỗ trám
//      tạm: khảo sát ước tính chỉ ~2% hồ sơ có ảnh (ui-no-ky-thuat.md A6.5), nên rỗng mới là ca
//      thường gặp.
//   3. `onError` gỡ <img> khi URL 404/bị chặn/chứng chỉ hỏng, chỉ còn lại ô chữ cái - ca ảnh
//      HỎNG được xử NHƯ ca không có ảnh, không phải một kiểu hỏng riêng.
//   4. `opacity` từ 0 tới khi `onLoad` chạy - ảnh không bao giờ lộ khung đang tải dở.
//   5. `PersonIcon` dự phòng khi `ho_ten` rỗng - ô rỗng vẫn có chủ đích kể cả khi không suy ra
//      được chữ cái nào, không phải một ô trắng vô nghĩa.
//
// 🔴 KHÔNG PHẢI CHỖ QUYẾT ĐỊNH "CÓ NÊN HIỂN THỊ ẢNH KHÔNG". Component này chỉ vẽ ô ảnh theo dữ
// liệu được truyền vào - câu hỏi "ai được xem ảnh của ai" (đặc biệt ở màn Quản lý, xem mục 96.9
// trong ui-no-ky-thuat.md) được trả lời ở NƠI GỌI, không phải ở đây.
interface IAppAnhTheProps {
    url?: string | null;
    hoTen?: string;
    /**
     * Kích thước ô, đơn vị px. Mặc định 96×128 (màn Hồ sơ cá nhân - ảnh là điểm neo thị giác của
     * TRANG). Màn khác dùng ảnh này như một CHI TIẾT PHỤ trong một khối nhiều thông tin hơn thì
     * nên truyền cỡ nhỏ hơn - xem TSDoc ở chỗ gọi để biết lý do cụ thể.
     * ⚠️ TỰ GIỮ đúng tỉ lệ 3:4 khi đổi (width/height, không phải aspect-ratio - lý do ở CSS
     * module: browserslist của dự án rộng hơn mức bảo đảm của thuộc tính đó).
     */
    width?: number;
    height?: number;
}

// Chữ cái đầu của TÊN, tức TỪ CUỐI trong họ tên tiếng Việt ("Trần Đức Hải" -> "H").
// Vì sao MỘT chữ chứ không phải hai kiểu "TH": ghép chữ đầu họ + chữ đầu tên là quy ước
// first-name/last-name của tiếng Anh, áp vào tên tiếng Việt thì đọc ra một cặp chữ không ai
// dùng để gọi nhau. Người Việt được gọi bằng TỪ CUỐI, nên một chữ cái đó là chữ đúng.
export const layChuCaiDauTen = (hoTen?: string): string => {
    const cacTu = (hoTen ?? "").trim().split(/\s+/).filter(Boolean);
    if (cacTu.length === 0) {
        return "";
    }
    return cacTu[cacTu.length - 1].charAt(0).toLocaleUpperCase("vi-VN");
};

// ===== BA CA HỎNG, XỬ LÝ RIÊNG TỪNG CA (nguyên văn từ bản gốc ProfilePage) =====
//   1. Cột NULL/rỗng  -> không render <img> nào cả. Không phát sinh request, không nhấp nháy.
//   2. Có URL, ảnh 404 / bị chặn / chứng chỉ hỏng -> onError gỡ <img>, còn lại ô chữ cái.
//   3. Ảnh tải chậm   -> <img> nằm ĐÈ LÊN ô chữ cái nhưng opacity: 0 cho tới khi onLoad chạy.
//                        Người dùng thấy ô chữ cái suốt lúc chờ, không thấy ô trắng nhấp nháy.
const AppAnhThe: React.FC<IAppAnhTheProps> = ({ url, hoTen, width = 96, height = 128 }) => {
    const [loi, setLoi] = useState(false);
    const [daTai, setDaTai] = useState(false);

    // Đổi người/đổi URL thì trạng thái tải phải quay về đầu, nếu không một URL mới sẽ kế thừa cờ
    // lỗi của URL cũ và không bao giờ được thử tải.
    useEffect(() => {
        setLoi(false);
        setDaTai(false);
    }, [url]);

    const chuCai = layChuCaiDauTen(hoTen);
    // Tỉ lệ 40px/128px của bản gốc (màn Hồ sơ) - giữ NGUYÊN tỉ lệ đó khi đổi kích thước, không
    // phải một hằng số 40px cứng: ô nhỏ hơn (vd trong modal) mà giữ chữ 40px sẽ tràn khung.
    const coChu = Math.round(height * (40 / 128));

    return (
        <div className={styles.khung} style={{ width, height }}>
            {/* aria-hidden: trang trí thuần. Họ tên đã hiện ở nơi khác trong cùng khối (dl định
                danh, hoặc tiêu đề hộp thoại), đọc thêm một chữ cái rời là nhiễu. Khi không có cả
                họ tên thì dùng icon người - vẫn là ô rỗng có chủ đích, không phải khoảng trắng. */}
            <span className={styles.chuCai} style={{ fontSize: coChu }} aria-hidden="true">
                {chuCai !== "" ? chuCai : <PersonIcon size={coChu} />}
            </span>
            {url && !loi && (
                <img
                    src={url}
                    /* alt NGẮN, KHÔNG nhắc lại họ tên: tên đã có ngay bên cạnh/bên trên. Câu này
                       chỉ cần cho biết "chỗ này là một tấm ảnh thẻ". */
                    alt="Ảnh thẻ sinh viên"
                    className={`${styles.anh} ${daTai ? styles.anhHien : ""}`}
                    /* Không gửi địa chỉ trang cổng sang máy chủ ảnh của hệ đào tạo. Kiểm chứng
                       trước khi đặt: máy chủ đó trả 200 cho curl - vốn không gửi referer - nên
                       nó KHÔNG chặn theo referer, bỏ referer là an toàn. */
                    referrerPolicy="no-referrer"
                    onLoad={() => setDaTai(true)}
                    onError={() => setLoi(true)}
                />
            )}
        </div>
    );
};

export default AppAnhThe;
