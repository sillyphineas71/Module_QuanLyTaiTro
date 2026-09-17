import React, { useLayoutEffect, useRef } from "react";

// ═══════════════════════════════════════════════════════════════════════════════════════════
// HIỆN DẦN KHI CUỘN TỚI — IntersectionObserver + CSS thuần, KHÔNG thêm thư viện
// ═══════════════════════════════════════════════════════════════════════════════════════════
// Ràng buộc: không cài AOS/WOW.js. Cả hai chỉ làm đúng việc dưới đây, mà ta vừa gỡ 23 gói ở D4.
//
// ═══════════════════════════════════════════════════════════════════════════════════════════
// 🔴 TRẠNG THÁI MẶC ĐỊNH LÀ *HIỆN*. LỚP ẨN DO JS THÊM VÀO. ĐỪNG ĐẢO LẠI.
// ═══════════════════════════════════════════════════════════════════════════════════════════
// Cách làm phổ biến (và SAI) là để CSS đặt sẵn `opacity: 0` rồi chờ JS thêm class để hiện ra.
// Khi đó mọi trục trặc của JS đều biến thành NỘI DUNG TÀNG HÌNH VĨNH VIỄN - không lỗi, không
// cảnh báo, và người bị ảnh hưởng không có cách nào biết trang có chữ.
// Nguyên tắc: thứ hỏng phải hỏng về phía AN TOÀN.
//
// Ở đây, CSS mặc định KHÔNG giấu gì cả. Chỉ khi hook chạy được nó mới gắn lớp `.csv-hien-dan`
// và thuộc tính `data-hien="false"`. Hệ quả:
//   · hook không chạy / lỗi trước khi gắn  -> nội dung HIỆN, chỉ là không có hiệu ứng;
//   · trình duyệt không có IntersectionObserver -> thoát sớm, nội dung HIỆN.
// Không ca nào dẫn tới chữ tàng hình.
// (Ca thứ ba - người bật "giảm chuyển động" - ĐÃ BỎ ở R14 theo chỉ thị lead. Xem mục 86.)
//
// ⚠️ CANH GÁC cho ca cuối cùng còn lại: observer được tạo nhưng callback KHÔNG BAO GIỜ chạy.
// IntersectionObserver luôn bắn một callback đầu tiên cho mọi phần tử được observe ngay sau khi
// gọi observe(), BẤT KỂ nó có trong khung nhìn hay không. Nên "chưa nhận callback nào sau 2 giây"
// là dấu hiệu chắc chắn của hỏng hóc, không phải của "người dùng chưa cuộn tới".
// Vì vậy canh gác này KHÔNG làm hỏng hiệu ứng: nó không bao giờ nổ ở trang chạy bình thường.
const LOP = "csv-hien-dan";
const THUOC_TINH = "data-hien";
const CHO_CALLBACK_MS = 2000;

/**
 * @param treMs Độ trễ cho hiệu ứng xếp lớp (ba thẻ nối nhau hiện ra). 0 = không trễ.
 * @returns ref để gắn vào phần tử muốn hiện dần.
 */
export const useHienDanKhiCuonToi = <T extends HTMLElement>(treMs = 0): React.RefObject<T> => {
    const ref = useRef<T>(null);

    // useLayoutEffect chứ KHÔNG useEffect: lớp ẩn phải được gắn TRƯỚC lần vẽ đầu tiên. Với
    // useEffect thì trình duyệt kịp vẽ một khung hình đầy đủ rồi nội dung mới biến mất để hiện
    // lại - thành ra một cú NHÁY, đúng thứ hiệu ứng này định tránh.
    useLayoutEffect(() => {
        const el = ref.current;
        if (!el) return;

        // 🔴 CỬA THOÁT `prefers-reduced-motion` ĐÃ BỎ THEO CHỈ THỊ CỦA LEAD (R14) — KHÔNG PHẢI
        // SÓT. Bản trước có thêm điều kiện `window.matchMedia("(prefers-reduced-motion: reduce)")
        // .matches` ở đây; người bật giảm chuyển động sẽ thoát sớm và thấy nội dung hiện ngay,
        // không trượt. Nay họ thấy hiệu ứng như mọi người.
        // ⚠️ ĐỪNG thêm lại mà không hỏi lead. Lý do + cách khôi phục: docs/ui-no-ky-thuat.md
        // mục 86. Phải khôi phục CÙNG LÚC với khối @media trong src/index.css.
        //
        // Cửa thoát còn lại chống JS/trình duyệt hỏng, KHÔNG liên quan trợ năng: giữ nguyên.
        if (typeof IntersectionObserver === "undefined") return;

        el.classList.add(LOP);
        el.setAttribute(THUOC_TINH, "false");
        if (treMs > 0) el.style.transitionDelay = `${treMs}ms`;

        const hien = () => el.setAttribute(THUOC_TINH, "true");

        let daNhanCallback = false;
        const observer = new IntersectionObserver(
            (entries) => {
                daNhanCallback = true;
                if (entries.some((e) => e.isIntersecting)) {
                    hien();
                    // CHẠY MỘT LẦN RỒI THÔI. Không quan sát lại nữa.
                    // Lặp lại mỗi lần cuộn qua nghe hay nhưng dùng thì mệt: cuộn lên xem lại một
                    // đoạn vừa đọc mà nó biến mất rồi hiện lại là mất chỗ đang đọc. Hiệu ứng này
                    // để CHÀO nội dung lần đầu, không phải để trang trí liên tục.
                    observer.disconnect();
                }
            },
            {
                // threshold 0 + rootMargin âm: bắn ngay khi mép trên phần tử vào sâu 80px trong
                // khung nhìn. KHÔNG dùng threshold theo tỉ lệ (vd 0.15): phần tử cao hơn khung
                // nhìn sẽ không bao giờ đạt tỉ lệ đó và sẽ nằm ẩn vĩnh viễn.
                threshold: 0,
                rootMargin: "0px 0px -80px 0px",
            }
        );
        observer.observe(el);

        const canhGac = window.setTimeout(() => {
            if (!daNhanCallback) {
                hien();
                observer.disconnect();
            }
        }, CHO_CALLBACK_MS);

        // ═══════════════════════════════════════════════════════════════════════════════════
        // 🔴 HIỆN NGAY KHI CÓ TIÊU ĐIỂM BÀN PHÍM - lỗ hổng trợ năng, không phải tinh chỉnh
        // ═══════════════════════════════════════════════════════════════════════════════════
        // `opacity: 0` KHÔNG gỡ phần tử khỏi thứ tự Tab: liên kết bên trong khối chưa hiện vẫn
        // nhận được tiêu điểm. Người dùng bàn phím bấm Tab tới đó sẽ có tiêu điểm nằm trên một
        // thứ HỌ KHÔNG NHÌN THẤY (khối "Chưa có tài khoản?" có một liên kết mailto).
        // Trình duyệt tự cuộn phần tử được focus vào khung nhìn nên observer rồi cũng bắn, nhưng
        // vẫn còn một quãng 520ms tiêu điểm vô hình. `focusin` nổi bọt từ con lên nên một
        // listener ở khối cha là đủ cho mọi phần tử bên trong.
        // ⚠️ ĐỪNG thay bằng `pointer-events: none` khi ẩn: nếu vì lý do nào đó khối kẹt ở trạng
        // thái ẩn thì nội dung sẽ vừa vô hình VỪA không bấm được - thêm một kiểu hỏng mới, đúng
        // thứ cả file này đang tránh.
        const khiCoTieuDiem = () => {
            hien();
            observer.disconnect();
        };
        el.addEventListener("focusin", khiCoTieuDiem);

        return () => {
            window.clearTimeout(canhGac);
            el.removeEventListener("focusin", khiCoTieuDiem);
            observer.disconnect();
        };
    }, [treMs]);

    return ref;
};
