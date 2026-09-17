import React from "react";
import { Link, useLocation } from "react-router-dom";
import clsx from "clsx";
import styles from "./AppBrandHeader.module.css";
import { useMucDangXem } from "../hooks/useMucDangXem";
import { DUONG_DAN_TAI_TRO } from "../model/ITaiTro";
import HeaderLanguageMenu from "./HeaderLanguageMenu";
import { appConst } from "../AppConst";

interface IAppBrandHeaderProps {
    /** Đường dẫn khi bấm vào logo. Layout trỏ về màn chính theo vai trò; Landing trỏ về "/". */
    homeTo: string;
    /** Chỗ cắm TRƯỚC khối nhận diện — hiện chỉ dùng cho nút hamburger ở < 768px của AppLayout. */
    leading?: React.ReactNode;
    /**
     * Nút/menu ở góc PHẢI. Header một tầng: đặt thẳng vào hàng. Header hai tầng: đặt vào TẦNG
     * DƯỚI, sau thanh điều hướng. Landing truyền nút "Đăng nhập", màn trong truyền menu tài khoản.
     */
    actions?: React.ReactNode;
    /**
     * 🔴 Cờ quyết định header là HAI TẦNG hay MỘT TẦNG. Nó bật/tắt HAI thứ đi liền nhau:
     *   · dải gradient tầng trên (ghi công nhà cung cấp + chuyển ngôn ngữ),
     *   · hai dòng cạnh logo đổi từ thương hiệu NHÀ CUNG CẤP sang TÊN ĐƠN VỊ hai cấp.
     * Hai thứ đó vẫn gộp CỐ Ý: dải màu là chỗ ghi công nhà cung cấp, nên khi có dải thì khối chữ
     * cạnh logo mới được nhường cho tên đơn vị. Tách ra là mở đường cho tổ hợp vô nghĩa (ghi công
     * nhà cung cấp HAI LẦN, hoặc không chỗ nào ghi).
     *
     * 🔄 TRƯỚC ĐÂY cờ này gồng thêm việc thứ BA — bật/tắt thanh 4 mục điều hướng. Lead đã tách:
     * xem `hienMucDieuHuong` ngay dưới và khối lý do ở đầu component.
     */
    hienDieuHuongCong?: boolean;
    /**
     * Thanh 4 mục điều hướng ở tầng dưới. MẶC ĐỊNH `true` — tách khỏi `hienDieuHuongCong` để
     * Lớp trưởng/Quản lý giữ ĐÚNG header hai tầng của Trang chủ (dải màu + tên đơn vị + menu
     * ngôn ngữ) mà KHÔNG có mục nào.
     *
     * ⚠️ Chỉ có nghĩa khi `hienDieuHuongCong` bật — thanh này sống ở tầng dưới, không có tầng thì
     * không có chỗ để dựng.
     */
    hienMucDieuHuong?: boolean;
    /**
     * true khi header đang đứng TRÊN CHÍNH trang Landing. Đổi cách dựng 4 mục: neo trong-trang
     * (`<a href="#...">`) thay vì liên kết rời trang, và BẬT theo dõi "mục đang xem" - vạch
     * crimson + aria-current đi theo khối đang trong tầm nhìn (useMucDangXem). Ở màn trong bốn
     * mục là liên kết rời trang nên KHÔNG mục nào đang xem, không vạch nào.
     */
    dangOLanding?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════════════════
// HEADER DÙNG CHUNG của cổng — ĐÓNG NỢ MỤC 51
// ═══════════════════════════════════════════════════════════════════════════════════════════
// Trước R2, AppLayout và AlumniLandingPage mỗi bên giữ MỘT BẢN CHÉP của cùng một header:
// cùng bộ tên class, nhưng 8/11 selector đã trôi khác nhau, và cả hai khối @media cũng bị chép
// đôi kèm comment giải thích dài y hệt.
//
// Nay chỉ còn MỘT nguồn, và hình dạng dựng từ HAI cờ độc lập - vẫn một component:
//
//   nơi dùng                     hienDieuHuongCong  hienMucDieuHuong  hình dạng
//   ─────────────────────────────────────────────────────────────────────────────────────────
//   Landing (khách/đã đăng nhập)        true              true        hai tầng 96px · 4 mục
//   Cựu sinh viên                       true              true        hai tầng 96px · 4 mục
//   Lớp trưởng · Quản lý                true             FALSE        hai tầng 96px · KHÔNG mục
//
// ⚠️ Thêm khác biệt mới thì thêm PROP, ĐỪNG chép lại component.
//
// ═══════════════════════════════════════════════════════════════════════════════════════════
// 🔄 LỚP TRƯỞNG / QUẢN LÝ NAY GIỮ TẦNG THỨ HAI — lead quyết, và cái giá 16px là CÓ THẬT
// ═══════════════════════════════════════════════════════════════════════════════════════════
// 🔴 GIỮ LẠI LẬP LUẬN CŨ VÌ PHÉP ĐO CỦA NÓ VẪN ĐÚNG (chỉ kết luận bị đảo):
//   "BỐN màn chạy `fillAvailableHeight` lấy chiều cao theo chuỗi flex tính từ `.page` cao đúng
//    100vh, nên header cao thêm 16px là TRỪ THẲNG vào vùng làm việc của chúng (cùng lớp vấn đề
//    đã khiến footer bị cấm ở AppLayout - mục 68). Đã tra `fillAvailableHeight` toàn repo:
//        Thống kê · Duyệt tài khoản · Danh mục   -> QUẢN LÝ
//        Xuất danh sách lớp                      -> LỚP TRƯỞNG
//        (Cựu sinh viên: KHÔNG MÀN NÀO)
//    Tức bốn màn nhạy cảm chiều cao nằm TRỌN trong hai vai bị ẩn thanh điều hướng."
//
// R9 dùng phép đo đó để BỎ HẲN tầng hai của hai vai này. Hệ quả không lường trước: cờ gồng ba
// việc, nên bỏ tầng hai kéo theo khối chữ cạnh logo rơi về THƯƠNG HIỆU NHÀ CUNG CẤP - hai màn
// chức năng đọc ra như header scaffold ESSOFT cũ, không còn chỗ nào nói đây là cổng của đơn vị
// nào (tên cổng đã bị R2 đẩy xuống panel trái, mà panel thì thu gọn được).
//
// ⇒ Lead chốt: LẤY NGUYÊN header hai tầng của Trang chủ, chỉ ẩn 4 mục. Không thiết kế khối chữ
//   riêng cho hai vai này.
// ⇒ Cài đặt: `hienDieuHuongCong` giữ nguyên TRUE ở mọi nơi (tầng + tên đơn vị), việc bật/tắt mục
//   chuyển sang cờ RIÊNG `hienMucDieuHuong`.
//
// ⚠️ CÁI GIÁ ĐÃ CHẤP NHẬN, không phải đã biến mất: bốn màn trên nay mất đúng 16px vùng làm việc.
//    Màn nào chật thì xử TRONG MÀN đó (bảng cuộn riêng), ĐỪNG hạ header xuống một tầng lần nữa.
const AppBrandHeader: React.FC<IAppBrandHeaderProps> = ({
    homeTo,
    leading,
    actions,
    hienDieuHuongCong,
    hienMucDieuHuong = true,
    dangOLanding,
}) => (
    <header className={clsx(styles.header, hienDieuHuongCong && styles.headerHaiTang)}>
        {leading}
        <div className={clsx(styles.brand, hienDieuHuongCong && styles.brandHaiTang)}>
            {/* Điều hướng client-side (KHÔNG hard reload). */}
            <Link to={homeTo} className={styles.logo}>
                {/* Logo nối qua IMPORT (xem AppConst.ts), không qua chuỗi URL trong env:
                    webpack băm tên file nên sai đường dẫn là HỎNG LÚC BUILD, không phải vỡ ảnh
                    âm thầm trên trình duyệt. Đây là bài học của lô dọn - xem nợ mục 64. */}
                {/* 🔴 `alt` ĐỔI THEO `hienDieuHuongCong`, và đây là quy tắc trợ năng chứ không
                    phải tuỳ chọn:
                      · KHÔNG hiện tên đơn vị (Lớp trưởng/Quản lý - hai dòng chữ là thương hiệu
                        NHÀ CUNG CẤP) ⇒ logo là đường DUY NHẤT trình đọc màn hình biết cổng của
                        ai, nên alt phải ghi ĐỦ HAI CẤP, thứ tự Khoa -> Trường.
                      · CÓ hiện tên đơn vị ⇒ đúng chuỗi đó đã nằm ngay bên cạnh dưới dạng CHỮ
                        THẬT; để alt nữa là trình đọc màn hình đọc HAI LẦN. Cùng lý do đã ghi ở
                        LandingFooter.tsx, nơi logo cũng đứng cạnh tên đơn vị. */}
                <img
                    src={appConst.appURLLogo}
                    alt={hienDieuHuongCong ? "" : `${appConst.schoolName}, ${appConst.parentOrgName}`}
                    aria-hidden={hienDieuHuongCong || undefined}
                />
            </Link>
            {/* HAI DÒNG CẠNH LOGO — nội dung đổi theo cờ, KIỂU thì không đổi: dòng 1 lớn + màu
                thương hiệu, dòng 2 nhỏ + chìm. Giữ đúng MỘT bộ rule CSS cho cả hai ca là cách
                khối nhận diện không trôi lần nữa (nợ 51). */}
            <div className={styles.nameProduct}>
                <p>{hienDieuHuongCong ? appConst.schoolName : appConst.vendorName}</p>
                <p>{hienDieuHuongCong ? appConst.parentOrgName : appConst.vendorTagline}</p>
            </div>
        </div>

        {hienDieuHuongCong ? (
            <div className={styles.tang}>
                {/* TẦNG TRÊN = DANH TÍNH (ai làm phần mềm) + tiện ích cấp cổng (ngôn ngữ). */}
                <div className={styles.topBar}>
                    <span className={styles.topBarText}>
                        {appConst.vendorName} - {appConst.vendorTagline}
                    </span>
                    <HeaderLanguageMenu />
                </div>
                {/* TẦNG DƯỚI = HÀNH ĐỘNG (đi đâu / đăng nhập). Trộn hai vai làm mờ cả hai.
                    Ẩn thanh mục (Lớp trưởng/Quản lý): `.nav` có `flex: 1` nên khi KHÔNG dựng,
                    `justify-content: flex-end` của `.bottomBar` tự đẩy menu tài khoản về sát
                    phải - không cần rule CSS nào cho ca này, và KHÔNG để lại khoảng trống. */}
                <div className={styles.bottomBar}>
                    {hienMucDieuHuong ? <ThanhDieuHuong dangOLanding={dangOLanding} /> : null}
                    {actions}
                </div>
            </div>
        ) : null}

        {!hienDieuHuongCong && actions ? <div className={styles.actions}>{actions}</div> : null}
    </header>
);

// ═══════════════════════════════════════════════════════════════════════════════════════════
// THANH ĐIỀU HƯỚNG 4 MỤC — MỘT NGUỒN cho cả Landing lẫn màn trong
// ═══════════════════════════════════════════════════════════════════════════════════════════
// Mỗi mục là MỘT trong hai dạng:
//   { neo }   -> đích nằm TRONG Landing:  ""  = chính trang Landing (đỉnh trang)
//                                        "x" = khu vực id="x" của Landing
//   { duong } -> một TRANG riêng của cổng (N5: "Tin tức" là /alumni/tin-tuc)
//
// 🔄 Trạng thái thứ ba `null` ("chưa có đích" - <span> mờ + chip "Sắp có") ĐÃ GỠ cùng với nợ 75.1:
// "Tin tức" là mục duy nhất từng dùng nó, và từ N2 khối tin tức đã có thật trên Landing. Cách xử
// "vỏ trung thực" của R9 chứng minh được đúng điều nó hứa: khi nội dung xuất hiện, việc duy nhất
// phải làm là đổi `null` thành id - JSX không phải dựng lại. Không giữ lại nhánh cho một trạng
// thái không mục nào dùng; cần lại thì A3.30 + nợ 75.1 trong docs ghi đủ cách dựng, và
// HeaderLanguageMenu vẫn đang chạy một bản sống của đúng cái chip đó.
//
// 🔄 N5 trả nợ 101.1: "Tin tức" từng là neo #tin-tuc (N6, tạm) nay là ROUTE /alumni/tin-tuc — một
// trang riêng luôn đúng hơn một khối 4 bài trên trang chủ. Nó rời khỏi DS_NEO; khối Landing giữ
// id="tin-tuc" cho ai muốn cuộn tới, và có "Xem tất cả" trỏ về trang này.
type MucDieuHuong = { nhan: string; neo: string; duong?: undefined } | { nhan: string; duong: string; neo?: undefined };
// 🔴 T1 THÊM MỤC THỨ NĂM — "Vận động tài trợ" là ROUTE thật (DUONG_DAN_TAI_TRO), không phải neo.
//
// ⚠️ THÊM MỤC LÀ ĐỘNG VÀO NGÂN SÁCH BỀ RỘNG CỦA HEADER, và ngân sách đó có HAI mốc phối hợp:
//      1366px (AppBrandHeader.module.css) : gộp hai tầng, ẩn thanh mục — nâng từ 1280 vì mục này
//      1600px (AppLayout.module.css)      : nút tài khoản bỏ email — kéo ca đã-đăng-nhập
//                                              từ 1531px về 1341px
//    Đổi một mốc mà không tính lại mốc kia là mở lại đúng lỗ hổng của bảng R9 (nó chỉ tính ca
//    khách 110px nên chưa bao giờ mô tả ca đã đăng nhập). Bảng đầy đủ nằm trong
//    AppBrandHeader.module.css, ngay trên @media(max-width: 1365.98px).
//
// 🔴 CHỖ CÒN LẠI CHO MỤC THỨ SÁU, ở mốc 1366: **33px** (ca khách) / **25px** (ca đã đăng nhập).
//    Nhãn ngắn nhất cũng tốn ~118px (94 chữ + 24 gap) ⇒ KHÔNG CÒN CHỖ, kể cả nhãn một từ.
//    Thêm mục nữa thì phải nâng mốc lần nữa — tính TRƯỚC ở bảng đó, đừng thêm rồi mới đo.
// 🔴 BỐN MỤC -> BA. Đã gỡ "Tin tức" (cổng này KHÔNG có module tin tức — trỏ tới trang không tồn
// tại là hứa hão ngay trên thanh điều hướng) và "Giới thiệu" (chưa có khối nội dung nào mang neo
// `gioi-thieu`; neo trỏ vào hư không thì bấm xong trang đứng im, đọc ra như hỏng).
// ⚠️ ÍT MỤC HƠN = DƯ CHỖ, không phải thiếu: bảng ngân sách bề rộng trong AppBrandHeader.module.css
//    được tính cho NĂM mục. Ba mục thì mốc gộp tầng 1366px còn dư rất nhiều — an toàn, nhưng nếu
//    sau này thêm mục thì ĐỌC LẠI bảng đó trước, đừng thêm rồi mới đo.
const MUC_DIEU_HUONG: MucDieuHuong[] = [
    { nhan: "Trang chủ", neo: "" },
    { nhan: "Vận động tài trợ", duong: DUONG_DAN_TAI_TRO },
    { nhan: "Liên hệ", neo: "lien-he" },
];

// Các đích neo theo ĐÚNG thứ tự trên trang - luật "mục cuối cùng đã đi qua" của useMucDangXem
// dựa vào thứ tự này. Đổi thứ tự khối trên Landing thì phải đổi ở đây.
const DS_NEO = MUC_DIEU_HUONG.map((m) => m.neo).filter((neo): neo is string => !!neo);

// ═══════════════════════════════════════════════════════════════════════════════════════════
// 🔴 VẠCH CRIMSON ĐI THEO MỤC ĐANG XEM, KHÔNG GẮN CỨNG VÀO "TRANG CHỦ"
// ═══════════════════════════════════════════════════════════════════════════════════════════
// R9 gắn cứng: "Trang chủ" luôn là <button aria-current="page"> + vạch, bấm mục nào cũng vậy - và
// trình đọc màn hình bị nói dối theo. Nay useMucDangXem trả mục đang xem theo vị trí cuộn (luật
// đầy đủ ở đầu hook); JSX chỉ so sánh `neo` với kết quả đó.
//   · Landing, đang ở đỉnh   -> "Trang chủ" sáng, aria-current="page"  (đúng nghĩa: trang này)
//   · Landing, trong khu vực -> mục đó sáng, aria-current="location"   (một chỗ TRONG trang)
//   · trang /alumni/tin-tuc  -> "Tin tức" sáng, aria-current="page"; ở bài con (/tin-tuc/:id)
//                               vẫn sáng nhưng aria-current="location" (một chỗ TRONG mục đó)
//   · màn trong (Cựu SV)     -> hook tắt, trả null, KHÔNG mục nào sáng
// Hai giá trị aria-current khác nhau là CỐ Ý: "page" nói "đây là trang bạn đang ở", "location"
// nói "đây là vị trí hiện tại trong một mạch" - hai câu khác nhau cho hai loại mục.
//
// "Trang chủ" trên chính Landing vẫn là <button>: bấm thì CUỘN LÊN ĐỈNH - một việc có thật trên
// trang dài; và thanh phải có CÙNG 4 mục ở mọi nơi, ẩn một mục làm ba mục kia nhảy chỗ.
const ThanhDieuHuong: React.FC<{ dangOLanding?: boolean }> = ({ dangOLanding }) => {
    const mucDangXem = useMucDangXem(DS_NEO, !!dangOLanding);
    const { pathname } = useLocation();

    return (
        <nav className={styles.nav} aria-label="Điều hướng cổng">
            {MUC_DIEU_HUONG.map((muc) => {
                const { nhan } = muc;

                // Mục là một TRANG: hiện tại khi đường dẫn khớp đúng (page) hoặc là con (location).
                // Không phụ thuộc dangOLanding - trang đó tồn tại từ mọi nơi.
                if (muc.duong !== undefined) {
                    const dungTrang = pathname === muc.duong;
                    const trongMuc = pathname.startsWith(muc.duong + "/");
                    return (
                        <Link
                            className={clsx(styles.navLink, (dungTrang || trongMuc) && styles.navLinkHienTai)}
                            key={nhan}
                            to={muc.duong}
                            aria-current={dungTrang ? "page" : trongMuc ? "location" : undefined}
                        >
                            {nhan}
                        </Link>
                    );
                }

                const neo = muc.neo;
                const dangXem = mucDangXem !== null && mucDangXem === neo;
                const lop = clsx(styles.navLink, dangXem && styles.navLinkHienTai);

                if (neo === "") {
                    return dangOLanding ? (
                        <button
                            type="button"
                            key={nhan}
                            className={lop}
                            aria-current={dangXem ? "page" : undefined}
                            onClick={() => window.scrollTo({ top: 0 })}
                        >
                            {nhan}
                        </button>
                    ) : (
                        <Link className={lop} key={nhan} to="/">
                            {nhan}
                        </Link>
                    );
                }

                // Ở CHÍNH Landing thì đây là neo trong-trang: <a href="#..."> để TRÌNH DUYỆT tự cuộn
                // (kèm `scroll-behavior: smooth` của html và `scroll-margin-top` của đích).
                // Ở màn trong thì khu vực đó KHÔNG TỒN TẠI, nên phải rời trang về Landing kèm neo.
                // ⚠️ react-router KHÔNG tự cuộn tới neo sau khi điều hướng (nó pushState, mà pushState
                // không kích hoạt cơ chế fragment của trình duyệt). Việc cuộn do AlumniLandingPage tự
                // làm bằng useEffect đọc location.hash - đọc chú thích ở đó trước khi sửa chỗ này.
                return dangOLanding ? (
                    <a
                        className={lop}
                        key={nhan}
                        href={`#${neo}`}
                        aria-current={dangXem ? "location" : undefined}
                    >
                        {nhan}
                    </a>
                ) : (
                    <Link className={lop} key={nhan} to={`/#${neo}`}>
                        {nhan}
                    </Link>
                );
            })}
        </nav>
    );
};

export default AppBrandHeader;
