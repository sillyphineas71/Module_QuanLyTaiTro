import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import clsx from "clsx";
import { CalendarIcon, LocationIcon } from "@primer/octicons-react";
import TrangCongKhai from "../../layout/TrangCongKhai";
import AppResultState from "../../layout/AppResultState";
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
import { layChiTiet } from "./taiTroMock";
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
//  2. LINK "Xem tất cả minh chứng (N)" -> BỎ, thay bằng HIỆN HẾT thumbnail. Link đó cần một
//     trang/hộp thoại thư viện ảnh chưa có ⇒ lại là vỏ. Mỗi khoản chi chỉ vài ảnh nên hiện hết
//     vừa rẻ hơn vừa không hứa gì.
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
// 🔴 KHÔNG CÓ CỘT "NGÀY SINH" — lead đã bỏ khỏi trang công khai (ghép họ tên + lớp đã định danh
//    được một người, thêm ngày sinh là công bố dữ liệu cá nhân ra Internet). Đừng thêm lại "cho
//    giống mẫu": mẫu là của một trường THPT và chính chỗ đó là thiếu sót của mẫu.
//
// SÀN BẢNG = 40 STT + 300 + 155 + 195 + 115 + 70 + 145 + 125 = 1145px (xem .tableRegion trong CSS).
// ⚠️ Đổi width cột nào cũng phải sửa CẢ HAI chỗ: `min-width` của .tableRegion và con số ở đây.
//
// 🔴 WIDTH CỦA BẢNG NÀY ĐƯỢC ĐẶT THEO NỘI DUNG, KHÔNG THEO CHỖ TRỐNG — lead chốt: thà bảng dài ra
// và cuộn ngang còn hơn để "..." trên bảng công khai. Sàn 830 -> 1145px là hệ quả cố ý.
// Cơ sở: bảng chạy ở font 16px (KHÔNG file nào đặt font-size cho body/BaseStyles), chữ số ~9,6px,
// chữ thường có dấu ~8,3-8,6px, cộng padding ô 2x12px. Ngân sách cũ tính nhầm theo 14px nên
// SÁU trong TÁM cột đều thiếu chỗ.
//      cột           cần     cũ      mới
//      Họ tên/Đơn vị ~304    180     300   (cột MỞ — xem ghi chú tại chỗ, vẫn có thể cắt)
//      Hệ            ~149    100     155
//      Khoa          ~187    140     195
//      Khoá          ~106     95     115
//      Lớp            ~64     70      70   (đã dư, giữ nguyên)
//      Số tiền       ~128    105     145
//      Thời gian     ~114    100     125
// ⚠️ Chỉ "Lớp", "Khoá", "Thời gian" và "Số tiền" là ĐÓNG (định dạng cố định ⇒ width đủ vĩnh viễn).
//    Ba cột còn lại là chữ tự do/nửa đóng: dữ liệu thật dài hơn mock thì lại cắt, và khi đó
//    tooltip của renderOVanBan là thứ giữ dữ liệu, KHÔNG phải width.
//
// 🔴 HAI GLYPH KHÁC NHAU CHO HAI Ý NGHĨA KHÁC NHAU — chỗ dễ làm sai nhất của bảng này:
//      "—"                  = hệ thống KHÔNG CÓ dữ liệu này (doanh nghiệp không có khoá/lớp)
//      "Nhà tài trợ ẩn danh"= người tài trợ CHỦ ĐỘNG giấu tên
//    Dùng "—" cho cả hai thì người đọc không phân biệt được "không có" với "cố tình giấu", mà
//    đó là hai câu trả lời rất khác nhau trên một bảng công khai.
const oHoacGach = (giaTri: string | null) => renderOVanBan(giaTri && giaTri.trim() ? giaTri : "—");

const cotNhaTaiTro = (): IColumn[] => [
    {
        // 🔴 CỘT MỞ — width KHÔNG BAO GIỜ "đủ" được, khác hẳn sáu cột kia. Họ tên và tên đơn vị là
        // chữ tự do: 300px vừa đúng chuỗi dài nhất đang có ("Tập thể lớp K39A - Khoá 1994-1998",
        // ~304px kể cả padding), nhưng một tên doanh nghiệp dài hơn là lại cắt.
        // ⇒ Ở ĐÂY ellipsis là trạng thái CHẤP NHẬN, không phải lỗi — và đó là lý do ô này bọc
        //   renderOVanBan (có `title`) ngay từ đầu. Đừng đuổi theo bằng cách nới mãi.
        dataField: "ho_ten_don_vi", caption: "Họ tên / Đơn vị", width: 300, isMainColumn: true,
        // Sắp xếp theo CHỮ ĐANG HIỆN, không theo giá trị thô: `ho_ten_don_vi` của dòng ẩn danh là
        // null, mà null sắp xếp thì trôi về một đầu bảng và lộ ra đúng nhóm vừa xin được giấu.
        filterValue: (n: INhaTaiTro) => (n.an_danh ? "Nhà tài trợ ẩn danh" : n.ho_ten_don_vi ?? ""),
        cellRender: (n: INhaTaiTro) => (n.an_danh
            ? <span className={styles.anDanh}>Nhà tài trợ ẩn danh</span>
            : oHoacGach(n.ho_ten_don_vi)),
    },
    // Hệ / Khoa: NỬA ĐÓNG — lấy từ danh mục đào tạo nên không dài tuỳ ý như họ tên, nhưng danh
    // mục thật sẽ có tên dài hơn mock ("Khoa Kinh tế - Quản trị kinh doanh"). Width dưới đây đủ
    // cho mọi giá trị ĐANG CÓ; gặp tên dài hơn thì vẫn cắt và vẫn còn tooltip.
    { dataField: "ten_he", caption: "Hệ", width: 155, cellRender: (n: INhaTaiTro) => oHoacGach(n.ten_he) },
    { dataField: "ten_khoa", caption: "Khoa", width: 195, cellRender: (n: INhaTaiTro) => oHoacGach(n.ten_khoa) },
    // Khoá: ĐÓNG — luôn là "yyyy-yyyy" (9 ký tự). 95px thiếu đúng ~11px nên cắt mất chữ số cuối,
    // kiểu lỗi khó thấy nhất: "1994-199…" vẫn đọc ra như một khoá có thật.
    { dataField: "nien_khoa", caption: "Khoá", width: 115, cellRender: (n: INhaTaiTro) => oHoacGach(n.nien_khoa) },
    // Lớp: 70px đã dư cho "K39A" (~64px) — cột DUY NHẤT không phải đụng tới.
    { dataField: "ten_lop", caption: "Lớp", width: 70, cellRender: (n: INhaTaiTro) => oHoacGach(n.ten_lop) },
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
    // WIDTH 105 -> 145: 105px KHÔNG ĐỦ và đó là lỗi "..." đã báo.
    //   "250.000.000đ" @16px (không có font-size nào đặt body/BaseStyles ⇒ mặc định 16px, KHÔNG
    //   phải 14px) ≈ 9 chữ số x9,5 + 2 dấu chấm x4,5 + "đ" 9,3 ≈ 104px, cộng padding ô 2x12
    //   = ~128px. Ô tiền lại KHÔNG bọc renderOVanBan như các cột chữ ⇒ bị cắt là MẤT HẲN con số
    //   trên một bảng công khai về tiền quyên góp. 145px phủ tới "1.000.000.000đ" (~142px).
    // ⚠️ Vì sao "..." chỉ thấy ở màn RỘNG: dưới 1400px hàng 3 xếp dọc, bảng nhận trọn ~1318px nên
    //    mọi cột giãn theo tỉ lệ và không cột nào bị cắt. Từ 1400px trở lên bảng nằm trong cột
    //    61% (839-868px) ≈ đúng sàn bảng ⇒ cột nhận gần đúng width thô và mới lộ ra.
    {
        dataField: "so_tien", caption: "Số tiền", width: 145, align: "left",
        // `title` là lưới an toàn, KHÔNG phải thứ thay cho width đủ rộng: 145px đã đủ cho mọi giá
        // trị thực tế, nhưng cột này là cột DUY NHẤT của bảng không đi qua renderOVanBan nên nếu
        // mai có ai hạ width xuống thì vẫn còn đường đọc ra con số.
        cellRender: (n: INhaTaiTro) => {
            const chu = dinhDangTien(n.so_tien);
            return <span className={styles.oTien} title={chu}>{chu}</span>;
        },
    },
    // Thời gian: ĐÓNG — `dinhDangNgay().day` luôn ra "dd/MM/yyyy" (10 ký tự, padStart nên không
    // có bản ngắn hơn). 8 chữ số x9,6 + 2 dấu "/" x6,7 ≈ 90px + padding 24 = ~114px > 100px cũ
    // ⇒ ngày nào cũng cụt đuôi. 125px cho biên 11px.
    {
        dataField: "ngay_tai_tro", caption: "Thời gian", width: 125,
        cellRender: (n: INhaTaiTro) => renderOVanBan(dinhDangNgay(n.ngay_tai_tro).day),
    },
];

const TaiTroChiTietPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [ct, setCt] = useState<IChuongTrinhTaiTro | null>(null);
    const [trangThai, setTrangThai] = useState<TrangThaiTai>("dang-tai");

    useAppDocumentTitle(ct ? ct.ten : "Chương trình tài trợ");

    useEffect(() => {
        let con = true;
        void (async () => {
            const so = Number(id);
            if (!Number.isFinite(so) || so <= 0) { setTrangThai("khong-thay"); return; }
            try {
                const kq = await layChiTiet(so);
                if (!con) return;
                if (kq) { setCt(kq); setTrangThai("xong"); } else { setTrangThai("khong-thay"); }
            } catch {
                if (con) setTrangThai("loi");
            }
        })();
        return () => { con = false; };
    }, [id]);

    const soLieu = useMemo(() => {
        if (!ct) return null;
        const mucTieu = tongDuKienChi(ct);
        const daQuyen = tongDaQuyen(ct);
        return { mucTieu, daQuyen, daChi: tongDaChi(ct), phanTram: phanTramDat(daQuyen, mucTieu) };
    }, [ct]);

    if (trangThai === "dang-tai") {
        return <TrangCongKhai><div className={styles.trang}>
            <p className={styles.dangTai}>Đang tải chương trình…</p>
        </div></TrangCongKhai>;
    }

    // 🔴 404 — trang CÔNG KHAI nên người ta gõ tay URL được, và một id sai phải nói rõ là id sai
    // chứ không để trang trắng. Kèm đường quay lại: ngõ cụt không lối ra là lỗi trợ năng.
    if (trangThai === "khong-thay" || trangThai === "loi" || !ct || !soLieu) {
        const loi = trangThai === "loi";
        return <TrangCongKhai><div className={styles.trang}>
            <AppResultState
                variant="error"
                title={loi ? "Không tải được chương trình" : "Không tìm thấy chương trình này"}
                description={loi
                    ? "Vui lòng tải lại trang. Nếu vẫn lỗi, liên hệ Khoa qua thông tin ở cuối trang."
                    : "Chương trình không tồn tại hoặc đã bị gỡ. Xem các chương trình đang mở ở trang danh sách."}
            />
            <p className={styles.veDanhSach}><Link to={DUONG_DAN_TAI_TRO}>← Về danh sách chương trình</Link></p>
        </div></TrangCongKhai>;
    }

    const dangDienRa = ct.trang_thai === eTrangThaiChuongTrinh.DangDienRa;

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
                            <p className={styles.bannerPhu}>{ct.mo_ta_ngan}</p>
                            <p className={styles.bannerMoTa}>{ct.mo_ta_day}</p>
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
                        <section className={styles.khoiChiPhi} aria-labelledby="tieu-de-chi-phi">
                            <div className={styles.dauKhoi}>
                                <h2 id="tieu-de-chi-phi">Chi phí đã chi</h2>
                                <span className={clsx(styles.huyHieu, dangDienRa ? styles.huyHieuDang : styles.huyHieuDa)}>
                                    {dangDienRa ? "Đang diễn ra" : "Đã diễn ra"}
                                </span>
                            </div>
                            {ct.khoan_chi.length === 0 ? (
                                <p className={styles.tabRong}>Chương trình chưa chi khoản nào.</p>
                            ) : (<>
                                <p className={styles.chiPhiSo}>
                                    <b>{dinhDangTien(soLieu.daChi)}</b>
                                    <span>trên tổng dự kiến {dinhDangTien(soLieu.mucTieu)}</span>
                                </p>
                                {ct.khoan_chi.map((kc: IKhoanChi) => (
                                    <div key={kc.id} className={styles.khoanChi}>
                                        <div className={styles.khoanChiDau}>
                                            <span className={styles.khoanChiNoiDung}>{kc.noi_dung}</span>
                                            <b className={styles.khoanChiTien}>{dinhDangTien(kc.so_tien)}</b>
                                            <span className={styles.khoanChiNgay}>{dinhDangNgay(kc.ngay_chi).day}</span>
                                        </div>
                                        {kc.minh_chung.length > 0 && (
                                            // 🔴 HIỆN HẾT thumbnail, KHÔNG có link "Xem tất cả (N)" - link đó cần một
                                            // thư viện ảnh chưa có. Mỗi thumbnail mở ảnh GỐC ở tab mới: trình duyệt
                                            // lo phóng to/tải về, ta không dựng hộp thoại xem ảnh nào.
                                            <ul className={styles.minhChung}>
                                                {kc.minh_chung.map((mc) => (
                                                    <li key={mc.id}>
                                                        <a href={duongDanAnh(mc.ten_file)} target="_blank" rel="noreferrer"
                                                            title={`Mở ảnh minh chứng: ${kc.noi_dung}`}>
                                                            <AnhCoDuPhong tenFile={mc.ten_file}
                                                                lop={styles.minhChungAnh} lopTrong={styles.minhChungTrong} />
                                                        </a>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                ))}
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
