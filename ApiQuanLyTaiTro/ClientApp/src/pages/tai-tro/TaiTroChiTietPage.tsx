import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import clsx from "clsx";
import { CalendarIcon, FileIcon, LocationIcon } from "@primer/octicons-react";
import TrangCongKhai from "../../layout/TrangCongKhai";
import AppResultState from "../../layout/AppResultState";
import MyButton from "../../components-ui/button";
import { TabsWithItems } from "../../components-ui/tab/Tabs";
import DataTable, { eSortMode, IColumn } from "../../components-ui/data-table/DataTable";
import { renderOVanBan } from "../../components-ui/data-table/renderOVanBan";
import { useAppDocumentTitle } from "../../hooks/useAppDocumentTitle";
import {
    DUONG_DAN_TAI_TRO,
    IChuongTrinhTaiTro,
    IKhoanChi,
    INhaTaiTro,
    dinhDangTien,
    duongDanAnh,
    eLoaiNhaTaiTro,
    eTrangThaiChuongTrinh,
    phanTramDat,
    tongDaChi,
    tongDaQuyen,
    tongDuKienChi,
} from "../../model/ITaiTro";
// 🔄 P2b: nguồn là API thật. `./taiTroMock` KHÔNG còn được import — giữ file làm bộ 7 ca xấu để đối chiếu.
import { layChiTietChuongTrinh } from "../../services/taiTroApi";
import { dinhDangNgay } from "../../utils/dinhDangNgay";
import styles from "./TaiTroChiTietPage.module.css";

// ═══════════════════════════════════════════════════════════════════════════════════════════
// CHI TIẾT MỘT CHƯƠNG TRÌNH TÀI TRỢ (T2) — /tai-tro/:id, CÔNG KHAI
// ═══════════════════════════════════════════════════════════════════════════════════════════
// Ngoài TrangCongKhaiRoute y như T1 — lý do đầy đủ ở AppRoutes.tsx.
//
// 🔴 BA THỨ CỦA MẪU CỐ Ý KHÔNG DỰNG Ở LÔ NÀY, và cả ba đều theo A3.30 ("không dựng vỏ cho thứ
//    thiếu NĂNG LỰC"). Ghi ra đây để lô sau không tưởng là bỏ sót:
//
//  1. NÚT "Quét QR tài trợ"  -> ẨN. Modal là T3, và lead còn CHƯA CHỐT nút "Xác nhận" có tồn
//     tại hay không (ba đường ở khảo sát mục B). Một nút bấm-không-ra-gì trên trang CÔNG KHAI
//     đọc ra là "cổng hỏng" với đúng nhóm người ta muốn mời đóng góp — nặng hơn hẳn ca footer
//     9/11 liên kết mờ, vì đây là hành động CHÍNH của cả trang.
//     ⚠️ Thẻ "Bạn tham gia tài trợ" VẪN LÀM ĐƯỢC VIỆC CỦA NÓ mà không cần nút: số tài khoản,
//        ngân hàng và nội dung chuyển khoản là THẬT và đủ để chuyển tiền ngay hôm nay.
//
//  2. ~~LINK "Xem tất cả minh chứng (N)" -> BỎ, thay bằng HIỆN HẾT thumbnail.~~ 🔄 ĐÃ ĐẢO
//     (2026-09-17, lead: "thiết kế giống mẫu"): nay CÓ, như mẫu — dải 3 ảnh + nút đó. Nút làm việc
//     thật mà không cần thư viện ảnh: mở hết dải ảnh tại chỗ. Lý do cũ ("link cần thư viện ảnh
//     chưa có ⇒ vỏ") chỉ đúng nếu link dẫn sang trang khác.
//
//  3. HỘP THOẠI XEM ẢNH LỚN -> KHÔNG dựng. Thay bằng: mỗi thumbnail là một <a target="_blank">
//     mở thẳng ảnh gốc. Trình duyệt lo phóng to/xoay/tải về, ta không phải dựng bẫy focus,
//     phím tắt, nút trước/sau, trạng thái tải. Xem báo cáo mục D để biết chi phí đã cân.
// ═══════════════════════════════════════════════════════════════════════════════════════════

type TrangThaiTai = "dang-tai" | "xong" | "khong-thay" | "loi";

// `duongDanAnh` ĐÃ CHUYỂN sang model/ITaiTro.ts để dùng chung với màn danh sách
// (trước đó mỗi màn một bản). Nó cho URL tuyệt đối đi thẳng — đồ TẠM của giai đoạn mock, lý do
// đầy đủ ghi ở chính hàm đó và ở đầu taiTroMock.ts.

// ═══════════════════════════════════════════════════════════════════════════════════════════
// ẢNH QR — 🔴 XỬ LÝ ẢNH HỎNG NGƯỢC HẲN với ảnh bìa / ảnh minh chứng
// ═══════════════════════════════════════════════════════════════════════════════════════════
// Ảnh bìa hỏng  -> vẽ ô gradient thay thế. Đúng, vì ô đó chỉ giữ chỗ trang trí.
// Ảnh QR  hỏng  -> KHÔNG vẽ gì cả, biến mất hẳn khỏi thẻ.
//
// Vì sao ngược: một ô gradient vuông ở đúng chỗ mã QR TRÔNG NHƯ một mã QR. Người dùng giơ điện
// thoại lên quét, không ra gì, rồi kết luận hệ thống hỏng — hoặc tệ hơn, nghĩ mình quét sai và
// thử lại nhiều lần. Ô giữ chỗ cho một thứ PHẢI QUÉT ĐƯỢC mới có nghĩa thì là một lời hứa sai.
// Không có QR thì thẻ rơi về ba dòng chuyển khoản — vẫn đủ để đóng góp.
//
// ⚠️ Đây cũng là ca ĐANG XẢY RA ngay bây giờ: /anh-tai-tro/ chưa tồn tại tới T4 nên MỌI chương
//    trình đều rơi vào nhánh này. Nhánh hiện QR thật chưa từng chạy — chỉ T4 mới kiểm được.
// ⚠️ QR và dòng nhãn "Hoặc chuyển khoản…" phải nằm CÙNG MỘT component, vì dòng nhãn đổi theo
// việc QR có hiện được hay không. Tách hai chỗ thì khi ảnh hỏng, nhãn vẫn nói "Hoặc chuyển
// khoản" trong khi phía trên chẳng có gì để "hoặc" — và đó là trạng thái ĐANG XẢY RA hôm nay.
const TheThamGia: React.FC<{ ct: IChuongTrinhTaiTro }> = ({ ct }) => {
    const [qrHong, setQrHong] = useState(false);
    // Đổi chương trình thì thử lại ảnh của chương trình mới, đừng mang cờ hỏng của cái cũ sang.
    useEffect(() => { setQrHong(false); }, [ct.anh_qr]);
    const coQR = !!ct.anh_qr && !qrHong;

    return (
        <aside className={styles.theThamGia}>
            <h2>Bạn tham gia tài trợ</h2>
            <p className={styles.theThamGiaPhu}>Cùng chung tay, lan toả yêu thương</p>

            {coQR && (
                <div className={styles.khoiQR}>
                    <p className={styles.qrNhan}>Quét QR để tài trợ</p>
                    <img className={styles.qrAnh} src={duongDanAnh(ct.anh_qr as string)}
                        alt="Mã QR chuyển khoản tài trợ cho chương trình"
                        loading="lazy" decoding="async" onError={() => setQrHong(true)} />
                    <p className={styles.qrChuThich}>Quét mã để chuyển khoản nhanh</p>
                </div>
            )}

            <p className={styles.chuyenKhoanNhan}>
                {coQR ? "Hoặc chuyển khoản theo thông tin:" : "Chuyển khoản theo thông tin:"}
            </p>
            <dl className={styles.chuyenKhoan}>
                <dt>Số tài khoản</dt><dd>{ct.stk}</dd>
                <dt>Ngân hàng</dt><dd>{ct.ngan_hang}</dd>
                {/* P2b: API có `ten_chu_tai_khoan` (thêm ở lô đối chiếu ảnh mẫu) — ứng dụng ngân hàng hiện tên chủ
                    tài khoản sau khi nhập số; người chuyển đối chiếu với dòng này trước khi bấm chuyển. */}
                <dt>Chủ tài khoản</dt><dd>{ct.ten_chu_tai_khoan}</dd>
                <dt>Nội dung</dt><dd>{ct.noi_dung_ck}</dd>
            </dl>
        </aside>
    );
};

// ── Ảnh có ô gradient thay thế, dùng cho CẢ ảnh thiếu LẪN ảnh hỏng (khuôn KhungAnh của Tin tức) ──
const AnhCoDuPhong: React.FC<{ tenFile?: string | null; lop: string; lopTrong: string }> = ({
    tenFile, lop, lopTrong,
}) => {
    const [hong, setHong] = useState(false);
    return tenFile && !hong
        ? <img className={lop} src={duongDanAnh(tenFile)} alt="" loading="lazy" decoding="async"
            onError={() => setHong(true)} />
        : <span className={clsx(lop, lopTrong)} aria-hidden="true" />;
};

// ── Vòng tròn tiến độ ──
// SVG thuần, KHÔNG thư viện: một vòng tròn với `stroke-dasharray` là toàn bộ bài toán. Thêm một
// dependency biểu đồ cho đúng một hình tròn là cái giá không có lý do.
// `aria-hidden` vì con số nằm ngay giữa vòng dưới dạng chữ thật, và cả cụm đã có role/aria ở
// thanh ngang bên dưới — để trình đọc màn hình đọc ba lần cùng một con số là đọc thừa.
const VongTienDo: React.FC<{ phanTram: number; dangDienRa: boolean }> = ({ phanTram, dangDienRa }) => {
    const R_VONG = 26;
    const chuVi = 2 * Math.PI * R_VONG;
    // Kẹp ở 100% cho HÌNH (vòng không vẽ quá một vòng), con số thì không kẹp.
    const day = (Math.min(phanTram, 100) / 100) * chuVi;
    return (
        <div className={styles.oVong}>
            <svg width="64" height="64" viewBox="0 0 64 64" aria-hidden="true">
                <circle cx="32" cy="32" r={R_VONG} className={styles.vongRay} />
                <circle
                    cx="32" cy="32" r={R_VONG}
                    className={clsx(styles.vongFill, !dangDienRa && styles.vongFillDa)}
                    strokeDasharray={`${day} ${chuVi - day}`}
                    transform="rotate(-90 32 32)"
                />
            </svg>
            <span className={styles.vongSo}>{phanTram}%</span>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════════════════
// BẢNG NHÀ TÀI TRỢ
// ═══════════════════════════════════════════════════════════════════════════════════════════
// 🔄 CỘT "NGÀY SINH" — ĐÃ ĐẢO (2026-09-17). Trạng thái cũ: KHÔNG có cột này — lead bỏ ở T2 vì ghép
//    họ tên + lớp + ngày sinh định danh được một người, và ghi "đừng thêm lại cho giống mẫu".
//    Nay CÓ, theo quyết định của sếp (mẫu có cột này). Lập luận cũ không sai, bị vượt qua; giảm thiểu
//    nằm ở SERVER: ngày sinh chỉ ra ngoài khi không ẩn danh (view 03). Ba lớp: CLAUDE.md mục 5.
//
// 🔴 6 CỘT: STT · Họ tên · Ngày sinh · Lớp · Số tiền · Thời gian (2026-09-17, lead duyệt "C2").
//    RÀNG BUỘC: bố cục hàng 3 THEO MẪU SẾP (hai cột 61/39) — cột là thứ điều chỉnh, bố cục thì không.
//    Khung cột trái đo thật 736–769px ⇒ bảng phải ≤ 736px.
//    · ĐÃ BỎ "Khoa": cổng của CHÍNH Khoa Toán - Cơ - Tin học, cột luôn cùng một tên (N15).
//    · ĐÃ BỎ "Hệ" + "Khoá": MÃ LỚP THẬT TỰ MANG CẢ HAI — "CQ56/11.01" = chính quy + khoá 56,
//      "K66A1" = khoá 66. Hai cột kia lặp lại thông tin đã có trong một cột hẹp hơn.
//    Dữ liệu `ten_khoa` · `ten_he` · `nien_khoa` VẪN lưu, vẫn trả qua API, vẫn trong hợp đồng — chỉ không hiện.
//    ⚠️ Mẫu có đủ 9 cột (STT · Họ tên · Ngày sinh · Hệ · Khoa · Khoá · Lớp · Số tiền · Thời gian) vì giá
//       trị THPT RẤT NGẮN ("12" · "Toán" · "1994" · "A2") — không phải vì mẫu ít cột (luật A9, docs/02).
//       Muốn đủ cột như mẫu mà giữ bố cục ⇒ phải nâng trần trang 1440 — quyết định bố cục, nợ N18.
//
// SÀN BẢNG = 52 STT + 200 + 108 + 96 + 134 + 108 = 698px (xem .tableRegion trong CSS).
//            Lịch sử: 830 → 1145 (nới cho hết "...", tính theo 16px) → 1270 (thêm Ngày sinh) → 1058
//            (tính lại theo 13px, bỏ Khoa, bảng trọn bề rộng) → 698 (trả bố cục mẫu, bỏ Hệ + Khoá, Họ tên
//            260 → 200). ⚠️ STT KHÔNG khai ở đây — xem .tableRegion col:first-child.
// ⚠️ Đổi width cột nào cũng phải sửa CẢ HAI chỗ: `min-width` của .tableRegion và con số ở đây.
//
// 🔴 WIDTH TÍNH THEO FONT 13px — ĐO TRONG DOM THẬT, không theo 16px (luật A5, docs/02).
//    `public/index.html` dòng 2 đặt `<html style="font-size: 13px">` ⇒ ô bảng 13px, padding mỗi bên
//    0.75rem = 9,75px. Bộ số cũ (tính theo 16px, padding 12px) cấp thừa ~20% cho MỌI cột.
//    Ngân sách mỗi cột chịu được GIÁ TRỊ DÀI NHẤT CÓ THỂ, không phải dài nhất trong mock. "Cần" dưới
//    đây là bề rộng TỰ NHIÊN đo trên Edge (table-layout:auto) với đúng chuỗi ca xấu nhất đặt vào ô thật:
//      cột           loại       ca xấu nhất đã đo              cần    width   cắt cụt + tooltip?
//      STT           đóng       "999" + tiêu đề "STT"            47      52    không
//      Họ tên/Đơn vị MỞ         (chữ tự do, không có trần)      258*    200    CÓ — chấp nhận (xem cột)
//      Ngày sinh     đóng       "44/44/4444" (4 = số rộng nhất)  106     108    không
//      Lớp           nửa đóng   "CQ56/11.01" (dạng lớp thật)      93      96    chỉ mã DÀI HƠN chuỗi này
//      Số tiền       đóng       "9.999.999.999đ" (dưới 10 tỷ)    132     134    từ 10 tỷ — có `title` riêng
//      Thời gian     đóng       "44/44/4444"                     105     108    không
//      (* 258 = chuỗi dài nhất của mock "Tập thể lớp K39A - Khoá 1994-1998"; cột mở không có trần.)
//      Đã bỏ (số đo giữ lại để thêm lại không phải đo): Hệ nửa đóng "Liên thông vừa làm vừa học" cần 195 ·
//      Khoá đóng "4444-4444" cần 103.
//    ⚠️ Ca xấu nhất lấy từ đâu: Lớp theo mã THẬT gặp trong repo cổng cựu SV (STU_Lop có "CQ56/11.01",
//       "K66A1") — KHÔNG chạy SQL để lấy MAX(LEN). Khi có DB thật: đo lại với mã dài nhất rồi sửa bảng này.
//    ⚠️ Mọi ô chữ đi qua renderOVanBan (có `title`) VÀ bảng có rule cắt cụt trong CSS module — HAI thứ
//       đi CẶP. Bỏ rule thì chữ tràn chồng cột; bỏ renderOVanBan thì "..." mất đường đọc lại.
//
// 🔴 HAI GLYPH KHÁC NHAU CHO HAI Ý NGHĨA KHÁC NHAU — chỗ dễ làm sai nhất của bảng này:
//      "—"                  = hệ thống KHÔNG CÓ dữ liệu này (doanh nghiệp không có khoá/lớp)
//      "Nhà tài trợ ẩn danh"= người tài trợ CHỦ ĐỘNG giấu tên
//      "Ẩn"                 = ô định danh bị server CHE (Ngày sinh: mọi mức ẩn danh · Lớp: chỉ mức 2)
//    Dùng "—" cho cả hai thì người đọc không phân biệt được "không có" với "cố tình giấu", mà
//    đó là hai câu trả lời rất khác nhau trên một bảng công khai.
// Khối "Chi phí đã chi" khi thu gọn — đúng số mẫu sếp vẽ: bảng 3 dòng, dải 3 ảnh ("Xem tất cả minh
// chứng (5)"). Nhiều hơn thì có nút mở hết (xem chú thích tại hai nút).
const SO_DONG_CHI_THU_GON = 3;
const SO_ANH_THU_GON = 3;

const oHoacGach = (giaTri: string | null) => renderOVanBan(giaTri && giaTri.trim() ? giaTri : "—");

const cotNhaTaiTro = (): IColumn[] => [
    {
        // 🔴 CỘT MỞ — width KHÔNG BAO GIỜ "đủ" được, khác hẳn các cột kia. Họ tên và tên đơn vị là
        // chữ tự do không có trần. 200px (sàn) đủ cho họ tên người thường; tên doanh nghiệp / tập thể dài
        // thì CẮT — chuỗi dài nhất mock "Tập thể lớp K39A - Khoá 1994-1998" (258px) bị cắt.
        // ⇒ Ở ĐÂY ellipsis là trạng thái CHẤP NHẬN, không phải lỗi — và đó là lý do ô này bọc
        //   renderOVanBan (có `title`) ngay từ đầu. Đừng đuổi theo bằng cách nới mãi: nới cột này là
        //   bảng vượt khung cột trái 736px và cuộn ngang lại.
        // ⚠️ Khung > sàn thì mọi cột GIÃN THEO TỈ LỆ, nên cột này thực tế được hơn 200px — số đo và phần
        //    chữ còn thấy được khi bị cắt: khối .hang3 trong CSS.
        dataField: "ho_ten_don_vi", caption: "Họ tên / Đơn vị", width: 200, isMainColumn: true,
        // Sắp xếp theo CHỮ ĐANG HIỆN, không theo giá trị thô: `ho_ten_don_vi` của dòng ẩn danh là
        // null, mà null sắp xếp thì trôi về một đầu bảng và lộ ra đúng nhóm vừa xin được giấu.
        filterValue: (n: INhaTaiTro) => (n.an_danh ? "Nhà tài trợ ẩn danh" : n.ho_ten_don_vi ?? ""),
        cellRender: (n: INhaTaiTro) => (n.an_danh
            ? <span className={styles.anDanh}>Nhà tài trợ ẩn danh</span>
            : oHoacGach(n.ho_ten_don_vi)),
    },
    // Ngày sinh: ĐÓNG — "dd/MM/yyyy" y hệt cột Thời gian (dinhDangNgay padStart, 10 ký tự) ⇒ cùng
    // 108px. Ca xấu nhất "44/44/4444" đo 106px ở 13px; tiêu đề "Ngày sinh" lọt.
    // 🔴 `null` CÓ HAI NGHĨA — xem INhaTaiTro.ngay_sinh:
    //      an_danh  ⇒ "Ẩn" (nghiêng, mờ — cùng kiểu "Nhà tài trợ ẩn danh"): server ĐÃ CHE
    //      còn lại  ⇒ "—": doanh nghiệp / tập thể KHÔNG CÓ ngày sinh
    //    Vẽ "—" cho người ẩn danh là nói "không có dữ liệu" với một người CỐ TÌNH GIẤU — trái A7.
    // ⚠️ Che là việc của SERVER (view công khai), không phải của cột này: nhánh `an_danh` ở đây chỉ
    //    chọn CHỮ để hiện cho ô rỗng, nó không giấu được gì — dữ liệu đã không rời máy chủ.
    {
        dataField: "ngay_sinh", caption: "Ngày sinh", width: 108,
        cellRender: (n: INhaTaiTro) => (n.an_danh
            ? <span className={styles.anDanh}>Ẩn</span>
            : oHoacGach(n.ngay_sinh ? dinhDangNgay(n.ngay_sinh).day : null)),
    },
    // (Ba cột "Hệ" · "Khoa" · "Khoá" từng đứng ngay đây — đã bỏ, xem khối đầu bảng. Nếu thêm lại "Khoá":
    //  cột ĐÓNG "yyyy-yyyy", thiếu vài px là cắt mất chữ số cuối — "1994-199…" vẫn đọc ra như một khoá
    //  có thật — nên width phải đủ cho "4444-4444" (đo 103px), đừng để cắt cụt.)
    // Lớp: NỬA ĐÓNG. 🔄 Từng là 70px "đã dư cho K39A" — nhưng "K39A" là dạng của MOCK. Lớp THẬT trong
    // STU_Lop có dạng "CQ56/11.01" (đo 93px) — 70px sẽ cắt mọi lớp thật. 96px; mã dài hơn thì cắt + tooltip.
    // 🔴 `null` CÓ HAI NGHĨA, như Ngày sinh — nhưng điều kiện KHÁC: xét `an_dinh_danh`, KHÔNG xét `an_danh`.
    //      an_dinh_danh (ẩn danh MỨC 2, giấu tất cả) ⇒ "Ẩn": server ĐÃ CHE lớp
    //      còn lại                                   ⇒ lớp thật, hoặc "—" nếu KHÔNG CÓ (doanh nghiệp)
    //    Mức 1 (`an_danh && !an_dinh_danh`) giấu tên nhưng GIỮ lớp ⇒ phải hiện lớp thật. Xét `an_danh` ở đây
    //    là vẽ "Ẩn" đè lên một lớp server đã cho hiện. 🔄 Tới N23 (2026-09-17) cột này vẽ "—" cho mức 2.
    {
        dataField: "ten_lop", caption: "Lớp", width: 96,
        cellRender: (n: INhaTaiTro) => (n.an_dinh_danh
            ? <span className={styles.anDanh}>Ẩn</span>
            : oHoacGach(n.ten_lop)),
    },
    // ═══════════════════════════════════════════════════════════════════════════════════════
    // 🔴 CỘT TIỀN: `align: "left"` — CANH THEO CHỮ SỐ ĐẦU, lead chốt. ĐỪNG "sửa lại cho đúng
    //    quy ước" nếu không hỏi lại.
    // ═══════════════════════════════════════════════════════════════════════════════════════
    // Trước đó là `align: "right"`. Đổi sang trái là một ĐÁNH ĐỔI ĐÃ BIẾT, không phải sơ suất:
    //      canh phải                canh trái (đang dùng)
    //        5.000.000đ             5.000.000đ
    //      120.000.000đ             120.000.000đ
    //      250.000.000đ             250.000.000đ
    //          750.000đ             750.000đ
    // Canh phải xếp thẳng hàng đơn vị/chục/trăm nên so lớn-nhỏ bằng mắt được; canh trái cho mọi
    // số bắt đầu cùng một mốc, đọc thành danh sách đều nhau. Lead chọn vế sau.
    // ⚠️ `font-variant-numeric: tabular-nums` ở .oTien PHẢI GIỮ: nó là thứ làm mọi chữ số cùng bề
    //    rộng, tức là thứ duy nhất còn giữ được cảm giác thẳng cột sau khi bỏ canh phải.
    // ⚠️ Phải khai "left" TƯỜNG MINH, đừng bỏ trống `align`: Header.tsx đặt `textAlign:
    //    column.align`, bỏ trống thì <th> rơi về mặc định của trình duyệt là CENTER, còn <td> là
    //    left ⇒ tiêu đề lệch khỏi cột số.
    //
    // WIDTH: 105 → 145 → 134. Ô tiền KHÔNG bọc renderOVanBan như các cột chữ ⇒ bị cắt là MẤT HẲN con
    //   số trên một bảng công khai về tiền quyên góp, nên cột này phải đủ cho mọi số thực tế.
    //   🔄 Lần nới 105 → 145 tính theo 16px ("250.000.000đ ≈ 128px") — SAI font. Đo thật ở 13px, đậm
    //   600, tabular-nums: "9.999.999.999đ" (sát 10 tỷ) = 132px ⇒ 134. Từ 10 tỷ trở lên mới cắt,
    //   và khi đó còn `title` bên dưới.
    // ⚠️ Bảng nằm trong cột trái 61% của hàng 3 (bố cục mẫu) — số đo cuộn ngang ở khối .hang3 CSS.
    {
        dataField: "so_tien", caption: "Số tiền", width: 134, align: "left",
        // `title` là lưới an toàn, KHÔNG phải thứ thay cho width đủ rộng: 134px đủ cho mọi số dưới
        // 10 tỷ, nhưng cột này là cột DUY NHẤT của bảng không đi qua renderOVanBan nên nếu mai có
        // ai hạ width xuống (hoặc có khoản từ 10 tỷ) thì vẫn còn đường đọc ra con số.
        cellRender: (n: INhaTaiTro) => {
            const chu = dinhDangTien(n.so_tien);
            return <span className={styles.oTien} title={chu}>{chu}</span>;
        },
    },
    // Thời gian: ĐÓNG — `dinhDangNgay().day` luôn ra "dd/MM/yyyy" (10 ký tự, padStart nên không
    // có bản ngắn hơn). 🔄 Phép tính cũ "8 chữ số x9,6 + padding 24 = ~114px" là theo 16px — sai font.
    // Đo thật ở 13px: ca xấu nhất "44/44/4444" = 105px ⇒ 108 (cùng Ngày sinh).
    {
        dataField: "ngay_tai_tro", caption: "Thời gian", width: 108,
        cellRender: (n: INhaTaiTro) => renderOVanBan(dinhDangNgay(n.ngay_tai_tro).day),
    },
];

const TaiTroChiTietPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [ct, setCt] = useState<IChuongTrinhTaiTro | null>(null);
    const [trangThai, setTrangThai] = useState<TrangThaiTai>("dang-tai");
    // Khối chi phí: bảng mở hết hay thu gọn về SO_DONG_CHI_THU_GON dòng; dải ảnh mở hết hay SO_ANH_THU_GON ảnh.
    const [moRongChi, setMoRongChi] = useState(false);
    const [moRongAnh, setMoRongAnh] = useState(false);
    // Tăng lên = tải lại (nút "Thử lại" khi lỗi mạng).
    const [lanTai, setLanTai] = useState(0);

    useAppDocumentTitle(ct ? ct.ten : "Chương trình tài trợ");

    useEffect(() => {
        let con = true;
        setTrangThai("dang-tai");
        void (async () => {
            // id không phải số nguyên dương ⇒ KHÔNG gọi API (router nhận cả "/tai-tro/abc"): trả thẳng
            // "không tìm thấy", CÙNG câu với 404 của BE — hai đường một câu trả lời.
            const so = Number(id);
            if (!Number.isInteger(so) || so <= 0) { setTrangThai("khong-thay"); return; }
            const kq = await layChiTietChuongTrinh(so);
            if (!con) return;
            if (kq.loai === "xong") { setCt(kq.data); setTrangThai("xong"); } else { setTrangThai(kq.loai); }
        })();
        return () => { con = false; };
    }, [id, lanTai]);

    const soLieu = useMemo(() => {
        if (!ct) return null;
        const mucTieu = tongDuKienChi(ct);
        const daQuyen = tongDaQuyen(ct);
        return { mucTieu, daQuyen, daChi: tongDaChi(ct), phanTram: phanTramDat(daQuyen, mucTieu) };
    }, [ct]);

    if (trangThai === "dang-tai") {
        // Chữ, KHÔNG khung xương (lead chốt P2b).
        return <TrangCongKhai><div className={styles.trang} aria-busy="true">
            <p className={styles.dangTai} role="status">Đang tải chương trình…</p>
        </div></TrangCongKhai>;
    }

    // 🔴 404 — trang CÔNG KHAI nên người ta gõ tay URL được, và một id sai phải nói rõ là id sai
    // chứ không để trang trắng. Kèm đường quay lại: ngõ cụt không lối ra là lỗi trợ năng.
    // ⚠️ "Không tìm thấy" KHÔNG có nút Thử lại: thử lại không đổi được kết quả (id sai / đã gỡ / còn nháp —
    //    BE cố ý không phân biệt). CHỈ lỗi mạng mới có — đó là thứ thử lại có thể sửa được.
    if (trangThai === "khong-thay" || trangThai === "loi" || !ct || !soLieu) {
        const loi = trangThai === "loi";
        return <TrangCongKhai><div className={styles.trang}>
            <AppResultState
                variant="error"
                title={loi ? "Không tải được chương trình" : "Không tìm thấy chương trình này"}
                description={loi
                    ? "Có thể do kết nối mạng hoặc máy chủ đang bận. Nếu thử lại vẫn lỗi, liên hệ Khoa qua thông tin ở cuối trang."
                    : "Chương trình không tồn tại hoặc đã bị gỡ. Xem các chương trình đang mở ở trang danh sách."}
                action={loi
                    ? <MyButton text="Thử lại" variant="primary" onClick={() => setLanTai((n) => n + 1)} />
                    : undefined}
            />
            <p className={styles.veDanhSach}><Link to={DUONG_DAN_TAI_TRO}>← Về danh sách chương trình</Link></p>
        </div></TrangCongKhai>;
    }

    const dangDienRa = ct.trang_thai === eTrangThaiChuongTrinh.DangDienRa;

    // ── Khối "Chi phí đã chi": thu gọn như mẫu (3 dòng bảng, 3 ảnh) ──
    const tatCaAnh = ct.khoan_chi.flatMap((kc) => kc.minh_chung.map((mc) => ({ mc, kc })));
    const coDongAn = ct.khoan_chi.length > SO_DONG_CHI_THU_GON;
    const coAnhAn = tatCaAnh.length > SO_ANH_THU_GON;
    // "Mở hết" = không còn phần nào bị giấu; nút "Xem chi tiết" đổi nhãn theo đây.
    const daMoHet = (!coDongAn || moRongChi) && (!coAnhAn || moRongAnh);

    // ── Bảng nhà tài trợ, dùng chung cho cả 4 tab ──
    const renderBangNhaTaiTro = (ds: INhaTaiTro[], nhanLoai: string) => {
        if (ds.length === 0) {
            // 🔴 TAB RỖNG VẪN GIỮ TAB, chỉ đổi nội dung. Ẩn tab đi thì các tab còn lại nhảy chỗ
            // mỗi khi có người thuộc loại đó tài trợ, và người dùng không bao giờ biết loại đó
            // tồn tại. Câu chữ nói rõ ĐANG LỌC GÌ, không phải "không có dữ liệu" chung chung.
            return <p className={styles.tabRong}>Chưa có {nhanLoai} nào tài trợ cho chương trình này.</p>;
        }
        return (
            <div className={styles.tableRegion}>
                <DataTable
                    columns={cotNhaTaiTro()}
                    data={ds}
                    height="100%"
                    showRowNumber
                    sortConfig={{ enable: true, mode: eSortMode.NONE }}
                    paging={{ enable: true, pageSize: 8 }}
                />
            </div>
        );
    };

    const theoLoai = (loai: eLoaiNhaTaiTro) => ct.nha_tai_tro.filter((x) => x.loai === loai);

    return (
        <TrangCongKhai>
            <div className={styles.trang}>
                {/* 0. Dòng tiêu đề */}
                <p className={styles.veDanhSach}>
                    <Link to={DUONG_DAN_TAI_TRO}>← Chương trình tài trợ</Link>
                </p>

                {/* ══ HÀNG 1: banner 74% + thẻ tham gia 24% ══ */}
                <div className={styles.hang1}>
                    <section className={styles.banner}>
                        <AnhCoDuPhong tenFile={ct.anh_bia} lop={styles.bannerAnh} lopTrong={styles.bannerAnhTrong} />
                        {/* 🔴 GRADIENT NẰM TRÊN KHỐI CHỮ, KHÔNG TRÊN CẢ ẢNH — xem CSS .bannerChu.
                            Đây là lần thứ CHÍN của bài toán "chữ đè lên ảnh do người khác tải lên". */}
                        <div className={styles.bannerChu}>
                            <span className={clsx(styles.huyHieu, dangDienRa ? styles.huyHieuDang : styles.huyHieuDa)}>
                                {dangDienRa ? "Đang diễn ra" : "Đã diễn ra"}
                            </span>
                            <h1 className={styles.bannerTen}>{ct.ten}</h1>
                            {/* Ba tầng văn bản (ITaiTro.ts): phu_de + loi_keu_goi ở banner, mo_ta_day ở khối
                                "Thông tin chương trình". 🔄 Tới P2b banner in mo_ta_day — trùng khối thông tin. */}
                            <p className={styles.bannerPhu}>{ct.phu_de}</p>
                            <p className={styles.bannerMoTa}>{ct.loi_keu_goi}</p>
                            <p className={styles.bannerChan}>
                                <span><CalendarIcon size={14} /> Thời gian: <b>{dinhDangNgay(ct.tu_ngay).day} – {dinhDangNgay(ct.den_ngay).day}</b></span>
                                <span><LocationIcon size={14} /> Đơn vị tổ chức: <b>{ct.don_vi_to_chuc}</b></span>
                            </p>
                        </div>
                    </section>

                    {/* 🔴 ẢNH QR HIỆN THẲNG, KHÔNG qua nút mở hộp thoại.
                        `anh_qr` là DỮ LIỆU THẬT (quản trị tải lên — lead chốt không sinh VietQR),
                        nên hiện nó KHÔNG phải dựng vỏ: trang có đủ năng lực ngay hôm nay — quét
                        mã, hoặc chuyển khoản theo ba dòng dưới. Lý do từng cân nhắc ẩn ("chưa có
                        modal") chỉ áp cho NÚT, không áp cho một ảnh tĩnh.

                        🟠 NỢ CHO T3 — chốt trước khi dựng modal, đừng để cả hai tồn tại âm thầm:
                          · BỎ khối QR ở thẻ, QR chỉ sống trong modal → thẻ gọn, nhưng mất đường
                            quét nhanh cho người không muốn khai thông tin;
                          · GIỮ CẢ HAI → khối này = "quét nhanh, không khai gì"; modal = "khai
                            thông tin để được ghi tên vào danh sách nhà tài trợ".
                        Đề xuất hiện tại: GIỮ CẢ HAI, vì chúng phục vụ hai ý định khác nhau và
                        người chỉ muốn chuyển tiền không nên bị bắt qua một biểu mẫu. Quyết định
                        cuối thuộc về lead ở T3. */}
                    <TheThamGia ct={ct} />
                </div>

                {/* ══ HÀNG 2: bốn thẻ số liệu ══ */}
                <div className={styles.hang2}>
                    <div className={clsx(styles.the, styles.theDaQuyen)}>
                        <span className={styles.theNhan}>Tổng đã tài trợ</span>
                        <span className={clsx(styles.theSo, styles.theSoDaQuyen)}>{dinhDangTien(soLieu.daQuyen)}</span>
                        <span className={styles.thePhu}>{ct.nha_tai_tro.length} nhà tài trợ</span>
                    </div>

                    <div className={clsx(styles.the, styles.theMucTieu)}>
                        <span className={styles.theNhan}>Số tiền dự kiến chi</span>
                        <span className={clsx(styles.theSo, styles.theSoMucTieu)}>{dinhDangTien(soLieu.mucTieu)}</span>
                        <span className={styles.thePhu}>cũng là mục tiêu vận động</span>
                    </div>

                    <div className={clsx(styles.the, styles.theChiTiet)}>
                        <span className={styles.theNhan}>Chi tiết dự kiến chi</span>
                        {ct.du_kien_chi.length > 0 ? (
                            <ul className={styles.theDanhSach}>
                                {ct.du_kien_chi.map((d) => (
                                    <li key={d.id}><span>{d.noi_dung}</span><b>{dinhDangTien(d.so_tien)}</b></li>
                                ))}
                            </ul>
                        ) : <span className={styles.thePhu}>Chưa khai dự kiến chi</span>}
                    </div>

                    <div className={clsx(styles.the, styles.theTienDo)}>
                        <VongTienDo phanTram={soLieu.phanTram} dangDienRa={dangDienRa} />
                        <div className={styles.tienDoChu}>
                            <span className={styles.theNhan}>Đã đạt</span>
                            <span className={styles.tienDoSo}>
                                <b className={clsx(dangDienRa ? styles.soDang : styles.soDa)}>{dinhDangTien(soLieu.daQuyen)}</b>
                                {" / "}{dinhDangTien(soLieu.mucTieu)}
                            </span>
                            <div className={styles.ray} role="progressbar" aria-valuemin={0} aria-valuemax={100}
                                aria-valuenow={Math.min(soLieu.phanTram, 100)}
                                aria-label={`Đã đạt ${soLieu.phanTram}% mục tiêu`}>
                                <div className={clsx(styles.fill, !dangDienRa && styles.fillDa)}
                                    style={{ width: `${Math.min(soLieu.phanTram, 100)}%` }} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* ══ HÀNG 3: nhà tài trợ 61% + (chi phí / thông tin) 39% ══ */}
                <div className={styles.hang3}>
                    <section className={styles.khoiNhaTaiTro} aria-labelledby="tieu-de-nha-tai-tro">
                        <h2 id="tieu-de-nha-tai-tro">Danh sách nhà tài trợ</h2>
                        {ct.nha_tai_tro.length === 0 ? (
                            // Trạng thái 2 (CT2): chương trình chưa ai tài trợ. KHÔNG dựng thanh 4 tab
                            // cho một danh sách rỗng - bốn tab cùng rỗng là bốn lần nói "không có gì".
                            <AppResultState variant="empty" title="Chưa có nhà tài trợ nào"
                                description="Chương trình vừa mở. Thông tin nhà tài trợ sẽ hiện tại đây ngay khi khoản đóng góp đầu tiên được đối chiếu." />
                        ) : (
                            <TabsWithItems
                                className={styles.tabRoot}
                                tabsListClassName={styles.tabsList}
                                contentClassName={styles.tabContent}
                                items={[
                                    { key: "tat-ca", title: "Tất cả", content: renderBangNhaTaiTro(ct.nha_tai_tro, "nhà tài trợ") },
                                    { key: "ca-nhan", title: "Cá nhân", content: renderBangNhaTaiTro(theoLoai(eLoaiNhaTaiTro.CaNhan), "cá nhân") },
                                    { key: "tap-the", title: "Tập thể / Lớp", content: renderBangNhaTaiTro(theoLoai(eLoaiNhaTaiTro.TapThe), "tập thể") },
                                    { key: "doanh-nghiep", title: "Doanh nghiệp", content: renderBangNhaTaiTro(theoLoai(eLoaiNhaTaiTro.DoanhNghiep), "doanh nghiệp") },
                                ]}
                            />
                        )}
                    </section>

                    <div className={styles.cotPhai}>
                        {/* ═══ CHI PHÍ ĐÃ CHI — dựng THEO MẪU SẾP (2026-09-17) ═══
                            Mẫu: icon tròn "$" + tiêu đề + nhãn trạng thái · số lớn, dưới là "(trên tổng dự kiến …)",
                            bên phải nút viền "Xem chi tiết" · BẢNG 4 cột Nội dung chi | Số tiền | Ngày chi | Minh chứng
                            · dải 3 ảnh + "Xem tất cả minh chứng (N)". 🔴 Lead: "thiết kế giống mẫu, đừng tự ý". */}
                        <section className={styles.khoiChiPhi} aria-labelledby="tieu-de-chi-phi">
                            <div className={styles.dauKhoi}>
                                <div className={styles.tieuDeCoIcon}>
                                    <span className={styles.iconTron} aria-hidden="true">$</span>
                                    <h2 id="tieu-de-chi-phi">Chi phí đã chi cho chương trình</h2>
                                </div>
                                {/* Chữ nhãn theo TRẠNG THÁI THẬT của chương trình, không chép cứng "Đã diễn ra"
                                    của mẫu — lead đã xác nhận nhãn đó là mẫu vẽ nhầm (nợ N10). */}
                                <span className={clsx(styles.huyHieuNhe, dangDienRa ? styles.huyHieuNheDang : styles.huyHieuNheDa)}>
                                    {dangDienRa ? "Đang diễn ra" : "Đã diễn ra"}
                                </span>
                            </div>
                            {ct.khoan_chi.length === 0 ? (
                                <p className={styles.tabRong}>Chương trình chưa chi khoản nào.</p>
                            ) : (<>
                                <div className={styles.chiPhiTong}>
                                    {/* Như mẫu: số lớn ở trên, "(trên tổng dự kiến …)" xuống dòng ngay dưới. */}
                                    <p className={styles.chiPhiSo}>
                                        <b>{dinhDangTien(soLieu.daChi)}</b>
                                        <span>(trên tổng dự kiến {dinhDangTien(soLieu.mucTieu)})</span>
                                    </p>
                                    {/* 🔴 "Xem chi tiết" = MỞ HẾT cả khối: mọi dòng bảng + mọi ảnh minh chứng.
                                        Chưa có trang chi tiết khoản chi nào ⇒ đó là việc thật duy nhất nút làm được.
                                        Không còn gì bị giấu (≤ SO_DONG_CHI_THU_GON dòng VÀ ≤ SO_ANH_THU_GON ảnh) thì
                                        KHÔNG hiện nút — bấm vào không đổi gì là nút chết (luật B1).
                                        Có trang chi tiết thật thì đổi nút thành liên kết tới đó. */}
                                    {(coDongAn || coAnhAn) && (
                                        <button type="button" className={styles.nutVien}
                                            aria-expanded={daMoHet} aria-controls="bang-khoan-chi dai-minh-chung"
                                            onClick={() => { setMoRongChi(!daMoHet); setMoRongAnh(!daMoHet); }}>
                                            {daMoHet ? "Thu gọn" : "Xem chi tiết"}
                                        </button>
                                    )}
                                </div>
                                <div className={styles.bangChiKhung}>
                                    <table id="bang-khoan-chi" className={styles.bangChi}>
                                        <colgroup>
                                            <col />
                                            <col className={styles.cotChiTien} />
                                            <col className={styles.cotChiNgay} />
                                            <col className={styles.cotChiMinhChung} />
                                        </colgroup>
                                        <thead>
                                            <tr>
                                                <th scope="col">Nội dung chi</th>
                                                <th scope="col">Số tiền</th>
                                                <th scope="col">Ngày chi</th>
                                                <th scope="col" className={styles.oGiua}>Minh chứng</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(moRongChi ? ct.khoan_chi : ct.khoan_chi.slice(0, SO_DONG_CHI_THU_GON))
                                                .map((kc: IKhoanChi) => {
                                                    const dau = kc.minh_chung[0];
                                                    const soAnh = kc.minh_chung.length;
                                                    return (
                                                        <tr key={kc.id}>
                                                            {/* Cắt cụt + `title` đi CẶP: cột phải 39% hẹp, nội dung chi dài
                                                                sẽ bị cắt — title là đường đọc lại đủ chữ. */}
                                                            <td title={kc.noi_dung}>{kc.noi_dung}</td>
                                                            <td className={styles.oTienChi} title={dinhDangTien(kc.so_tien)}>
                                                                {dinhDangTien(kc.so_tien)}
                                                            </td>
                                                            <td>{dinhDangNgay(kc.ngay_chi).day}</td>
                                                            <td className={styles.oGiua}>
                                                                {dau ? (
                                                                    // Mở ảnh minh chứng ĐẦU TIÊN ở tab mới — cùng cách thumbnail
                                                                    // bên dưới. Nhiều ảnh thì `title` nói rõ còn ảnh ở dải dưới.
                                                                    <a className={styles.nutMinhChung} href={duongDanAnh(dau.ten_file)}
                                                                        target="_blank" rel="noreferrer"
                                                                        title={soAnh > 1
                                                                            ? `Mở minh chứng 1/${soAnh}: ${kc.noi_dung} — các ảnh còn lại ở phần minh chứng bên dưới`
                                                                            : `Mở minh chứng: ${kc.noi_dung}`}
                                                                        aria-label={`Mở minh chứng: ${kc.noi_dung}`}>
                                                                        <FileIcon size={16} />
                                                                    </a>
                                                                ) : (
                                                                    // "—" = KHÔNG CÓ dữ liệu (luật A7): khoản chi chưa có ảnh nào.
                                                                    <span className={styles.oTrong} title="Chưa có minh chứng">—</span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                        </tbody>
                                    </table>
                                </div>
                                {tatCaAnh.length > 0 && (<div className={styles.minhChungKhoi}>
                                    {/* Như mẫu: dải SO_ANH_THU_GON ảnh + "Xem tất cả minh chứng (N)".
                                        🔄 Trước đây (đã thay theo yêu cầu lead): hiện HẾT ảnh, bỏ link vì "cần thư viện
                                        ảnh chưa có". Nay link làm việc thật mà KHÔNG cần thư viện: mở hết dải ảnh tại chỗ.
                                        Mỗi thumbnail vẫn mở ảnh GỐC ở tab mới — không dựng hộp thoại xem ảnh. */}
                                    <ul id="dai-minh-chung" className={styles.minhChung}>
                                        {(moRongAnh ? tatCaAnh : tatCaAnh.slice(0, SO_ANH_THU_GON)).map(({ mc, kc }) => (
                                            <li key={mc.id}>
                                                <a href={duongDanAnh(mc.ten_file)} target="_blank" rel="noreferrer"
                                                    title={`Mở ảnh minh chứng: ${kc.noi_dung}`}>
                                                    <AnhCoDuPhong tenFile={mc.ten_file}
                                                        lop={styles.minhChungAnh} lopTrong={styles.minhChungTrong} />
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                    {/* Chỉ hiện khi CÓ ảnh bị giấu (luật B1). */}
                                    {coAnhAn && (
                                        <button type="button" className={styles.nutXemTatCa}
                                            aria-expanded={moRongAnh} aria-controls="dai-minh-chung"
                                            onClick={() => setMoRongAnh((v) => !v)}>
                                            {moRongAnh ? "Thu gọn minh chứng" : `Xem tất cả minh chứng (${tatCaAnh.length})`}
                                        </button>
                                    )}
                                </div>)}
                            </>)}
                        </section>

                        <section className={styles.khoiThongTin} aria-labelledby="tieu-de-thong-tin">
                            <h2 id="tieu-de-thong-tin">Thông tin chương trình</h2>
                            <p>{ct.mo_ta_day}</p>
                            <p>Mọi sự đóng góp, dù lớn hay nhỏ, đều là nguồn động viên quý báu. Toàn bộ số tiền
                                nhận được và nội dung đã chi đều được công khai tại trang này.</p>
                        </section>
                    </div>
                </div>
            </div>
        </TrangCongKhai>
    );
};

export default TaiTroChiTietPage;
