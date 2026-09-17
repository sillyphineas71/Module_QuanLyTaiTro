import { useEffect, useState } from "react";

// ═══════════════════════════════════════════════════════════════════════════════════════════
// MỤC ĐANG XEM trên thanh điều hướng của Landing — vạch crimson đi theo khối đang trong tầm nhìn
// ═══════════════════════════════════════════════════════════════════════════════════════════
// Trước lô này, "Trang chủ" gắn CỨNG aria-current + vạch crimson: bấm "Giới thiệu" xong vạch vẫn
// nằm ở "Trang chủ", và trình đọc màn hình vẫn nghe "trang hiện tại" ở một mục không phải chỗ
// đang đứng.
//
// ═══════════════════════════════════════════════════════════════════════════════════════════
// LUẬT: mục đang xem = mục CUỐI CÙNG (theo thứ tự trên trang) mà đỉnh của nó ĐÃ ĐI QUA vạch header
// ═══════════════════════════════════════════════════════════════════════════════════════════
// Không phải "mục nào đang có trong khung nhìn". Landing có ~8 khối nhưng thanh chỉ có 4 mục, nên
// lúc nào cũng có những khối KHÔNG là đích của mục nào (ba thẻ vai trò, băng chuyền, "Chưa có tài
// khoản?"). Nếu chỉ sáng khi đích nằm trong tầm nhìn thì đi qua các khối đó vạch tắt hết rồi bật
// lại - nhấp nháy theo từng cú cuộn. Luật "cuối cùng đã đi qua" thì đơn điệu: cuộn xuống vạch
// chỉ tiến, cuộn lên vạch chỉ lùi, không bao giờ có khoảng "không mục nào".
//   · chưa mục nào đi qua      -> "" (Trang chủ - đang ở đỉnh);
//   · đã cuộn tới ĐÁY trang   -> mục cuối cùng, bất kể đỉnh nó ở đâu. Không có luật này thì một
//                                đích thấp hơn khung nhìn (footer "Liên hệ") KHÔNG BAO GIỜ sáng,
//                                vì đỉnh nó không thể chạm vạch header khi trang đã hết chỗ cuộn.
//
// "Vạch header" lấy từ chính `scroll-margin-top` của đích, KHÔNG phải một hằng 98/112 chép sang:
// đó là toạ độ trình duyệt đặt đích khi bấm neo. Dùng số nhỏ hơn (ví dụ 98px = đúng mép header)
// thì bấm "Giới thiệu" xong khối dừng ở 112px, tức CHƯA qua vạch, và "Trang chủ" vẫn sáng - lỗi
// y hệt lỗi đang sửa nhưng khó thấy hơn. Đích không khai scroll-margin-top (footer) thì mốc là 0,
// và luật "đáy trang" lo cho nó.
//
// ═══════════════════════════════════════════════════════════════════════════════════════════
// 🔴 VÌ SAO KHÔNG DÙNG IntersectionObserver — dù useHienDanKhiCuonToi đang dùng nó
// ═══════════════════════════════════════════════════════════════════════════════════════════
// IO trả lời "phần tử X có giao với vùng gốc không". Câu ở đây khác: "trong N đích, đích nào là
// đích cuối cùng có đỉnh nằm TRÊN một vạch" - câu có HƯỚNG. Ép IO trả lời nó phải:
//   · dựng vùng gốc mỏng 1px đúng tại vạch (rootMargin âm cả hai chiều), mà chiều dưới phải tính
//     từ innerHeight ⇒ resize là phải huỷ và dựng lại observer;
//   · vẫn hở ca đáy trang ở trên, phải vá thêm bằng... một listener scroll.
// Tức cuối cùng vẫn cần scroll listener, cộng thêm một IO rắc rối. Ba phần tử, mỗi khung hình
// một lần getBoundingClientRect - trong lúc cuộn layout đã sạch nên không ép tính lại gì. rAF gom
// mọi sự kiện scroll trong một khung hình về MỘT lần đo.
// ⇒ Không có observer nào chồng lên hook hiện dần: hook kia là IO một-lần-rồi-ngắt cho từng khối;
//   hook này là theo dõi liên tục trên nhiều đích. Hai việc khác nhau, ghép chung là ép một cái
//   phải học thói quen của cái kia.
//
// ⚠️ ResizeObserver trên <body> là để bắt LAYOUT ĐỔI MÀ KHÔNG CUỘN: khối tin tức mount sau khi tải
// xong, ảnh nạp xong... đẩy mọi thứ phía dưới đi mà không sinh sự kiện scroll nào. Không có nó thì
// vạch đứng ở mục cũ cho tới lần cuộn kế tiếp.
const DUNG_SAI_PX = 2;

/**
 * @param dsId   id các đích neo theo ĐÚNG thứ tự trên trang. Đích chưa có trong DOM bị bỏ qua.
 * @param bat    false ⇒ không theo dõi, trả null (màn trong: bốn mục là liên kết rời trang, không
 *               mục nào "đang xem").
 * @returns null khi tắt · "" khi chưa qua đích nào (đỉnh trang) · id của đích đang xem.
 */
export const useMucDangXem = (dsId: readonly string[], bat: boolean): string | null => {
    const [mucDangXem, setMucDangXem] = useState<string | null>(null);
    // Mảng thường tạo mới mỗi lần render; nối thành chuỗi để làm mốc so sánh cho useEffect.
    const khoaDsId = dsId.join("|");

    useEffect(() => {
        if (!bat) {
            setMucDangXem(null);
            return;
        }

        const ids = khoaDsId.split("|").filter(Boolean);
        // scroll-margin-top là tĩnh (từ CSS) nên đo một lần cho mỗi phần tử. WeakMap chứ không
        // Map theo id: khối tin tức có thể unmount/mount lại thành phần tử khác.
        const mocTheoPhanTu = new WeakMap<Element, number>();
        const layMoc = (el: Element): number => {
            let moc = mocTheoPhanTu.get(el);
            if (moc === undefined) {
                moc = parseFloat(getComputedStyle(el).scrollMarginTop) || 0;
                mocTheoPhanTu.set(el, moc);
            }
            return moc;
        };

        const tinh = () => {
            let hienTai = "";
            let cuoiCung = "";
            for (const id of ids) {
                const el = document.getElementById(id);
                if (!el) continue;
                cuoiCung = id;
                if (el.getBoundingClientRect().top <= layMoc(el) + DUNG_SAI_PX) hienTai = id;
            }
            const daToiDay =
                window.innerHeight + window.scrollY >=
                document.documentElement.scrollHeight - DUNG_SAI_PX;
            if (daToiDay && cuoiCung) hienTai = cuoiCung;
            // setState với cùng giá trị thì React bỏ qua, không render lại.
            setMucDangXem(hienTai);
        };

        let khungHinh = 0;
        const lenLich = () => {
            if (khungHinh) return;
            khungHinh = window.requestAnimationFrame(() => {
                khungHinh = 0;
                tinh();
            });
        };

        tinh();
        window.addEventListener("scroll", lenLich, { passive: true });
        window.addEventListener("resize", lenLich);
        const theoDoiBody =
            typeof ResizeObserver !== "undefined" ? new ResizeObserver(lenLich) : null;
        theoDoiBody?.observe(document.body);

        return () => {
            if (khungHinh) window.cancelAnimationFrame(khungHinh);
            window.removeEventListener("scroll", lenLich);
            window.removeEventListener("resize", lenLich);
            theoDoiBody?.disconnect();
        };
    }, [khoaDsId, bat]);

    return mucDangXem;
};
