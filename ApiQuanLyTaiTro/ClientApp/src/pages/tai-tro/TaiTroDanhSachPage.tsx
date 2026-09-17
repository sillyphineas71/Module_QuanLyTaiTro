import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import clsx from "clsx";
import TrangCongKhai from "../../layout/TrangCongKhai";
import AppResultState from "../../layout/AppResultState";
import { useAppDocumentTitle } from "../../hooks/useAppDocumentTitle";
import {
    IChuongTrinhTomTat,
    dinhDangTien,
    duongDanAnh,
    duongDanChuongTrinh,
    eTrangThaiChuongTrinh,
    phanTramDat,
} from "../../model/ITaiTro";
import { layDanhSachTomTat } from "./taiTroMock";
import { dinhDangNgay } from "../../utils/dinhDangNgay";
import styles from "./TaiTroDanhSachPage.module.css";

// ═══════════════════════════════════════════════════════════════════════════════════════════
// TRANG DANH SÁCH CHƯƠNG TRÌNH TÀI TRỢ (T1) — /tai-tro, CÔNG KHAI
// ═══════════════════════════════════════════════════════════════════════════════════════════
// 🔴 VÌ SAO HAI KHU XẾP DỌC, KHÔNG PHẢI HAI TAB (lead chốt, cách 2):
// Chương trình đã kết thúc VẪN đáng xem đầy đủ — quyên được bao nhiêu, ai đã tài trợ, tiền đã
// chi vào đâu. Hai tab giấu chúng sau một cú bấm, và với 1-2 chương trình thì thanh tab là trang
// trí thuần tuý: người dùng bấm sang tab kia để phát hiện nó trống.
// Xếp dọc thì cả hai loại đều được FULL bề rộng và thấy hết trong một lần cuộn.
// ⚠️ NỢ: khi số chương trình ĐÃ KẾT THÚC vượt ~8, khu dưới sẽ dài hơn khu trên và đẩy mọi thứ
//    xuống — lúc đó chuyển sang hai tab (`TabsWithItems` đã có sẵn, không phải dựng mới).
//
// 🔴 VÌ SAO DANH SÁCH DÒNG, KHÔNG PHẢI LƯỚI THẺ:
// Chép đúng lập luận đã được chứng minh ở trang Tin tức công khai (N5): lưới 3-4 cột sẽ RỖNG
// ngay hàng thứ hai khi chỉ có vài mục. Khoa có vài chương trình mỗi năm, không phải vài chục.
// Danh sách dòng lấp kín bề rộng với 2 mục cũng như 20 — không có "hàng" nào để rỗng.
//
// ⚠️ ROUTE NÀY CỐ Ý KHÔNG BỌC `TrangCongKhaiRoute` — xem AppRoutes.tsx để biết lý do đầy đủ.
//    Người sau sẽ thấy "không nhất quán với hai trang công khai kia" và muốn dọn; đừng dọn.
// ═══════════════════════════════════════════════════════════════════════════════════════════

type TrangThaiTai = "dang-tai" | "xong" | "loi";

/** Bề rộng thanh tiến độ KẸP ở 100%, còn CON SỐ thì không — xem `phanTramDat`. */
const beRongThanh = (phanTram: number) => `${Math.min(phanTram, 100)}%`;

// ═══════════════════════════════════════════════════════════════════════════════════════════
// MỘT DÒNG CHƯƠNG TRÌNH
// ═══════════════════════════════════════════════════════════════════════════════════════════
// ≥768px: [ảnh 220×132] [chữ + tiến độ]   ·   <768px: xếp dọc, ảnh trên.
// Ảnh cũng dẫn tới chi tiết nhưng `tabIndex={-1}` + `aria-hidden`: cùng một đích thì chỉ được có
// MỘT điểm dừng Tab, không thì bàn phím đi qua mỗi chương trình hai lần (luật đã dùng ở Tin tức).
const DongChuongTrinh: React.FC<{ ct: IChuongTrinhTomTat }> = ({ ct }) => {
    const den = duongDanChuongTrinh(ct.id);
    const dangDienRa = ct.trang_thai === eTrangThaiChuongTrinh.DangDienRa;
    const phanTram = phanTramDat(ct.tong_da_quyen, ct.tong_du_kien_chi);

    // 🔴 HAI CA "KHÔNG CÓ ẢNH", XỬ GIỐNG HỆT NHAU — chép đúng cách `KhungAnh` của Tin tức làm:
    //   (1) `anh_bia === null`  : chương trình chưa gắn ảnh bìa
    //   (2) ảnh CÓ tên file mà KHÔNG tải được: file mất sau deploy, hoặc — như đúng lúc này —
    //       thư mục /anh-tai-tro/ chưa tồn tại vì API thật chưa dựng (T4).
    // Không có nhánh (2) thì trình duyệt vẽ icon ảnh vỡ ở MỌI dòng, che mất chính thứ cần kiểm
    // trong các ca thị giác. Cả hai rơi về cùng một ô gradient ⇒ trông như một lựa chọn thiết
    // kế, không phải một ô hỏng.
    const [anhHong, setAnhHong] = useState(false);
    const hienAnh = !!ct.anh_bia && !anhHong;

    return (
        <article className={styles.dong}>
            {/* Ô ảnh cũng dẫn tới chi tiết nhưng `tabIndex={-1}` + `aria-hidden`: cùng một đích
                thì chỉ được có MỘT điểm dừng Tab, không thì bàn phím đi qua mỗi chương trình hai
                lần. Ô gradient không mang thông tin nào — tên chương trình nằm ngay cạnh dưới
                dạng chữ thật. */}
            <Link to={den} className={styles.oAnh} tabIndex={-1} aria-hidden="true">
                {hienAnh
                    ? <img className={styles.anh} src={duongDanAnh(ct.anh_bia as string)} alt=""
                        loading="lazy" decoding="async" onError={() => setAnhHong(true)} />
                    : <span className={styles.anhTrong} />}
            </Link>

            <div className={styles.than}>
                <div className={styles.hangNhan}>
                    <span className={clsx(styles.huyHieu, dangDienRa ? styles.huyHieuDang : styles.huyHieuDa)}>
                        {dangDienRa ? "Đang diễn ra" : "Đã diễn ra"}
                    </span>
                    <span className={styles.thoiGian}>
                        {/* `.day` = "dd/mm/yyyy". `dinhDangNgay` trả một OBJECT ba dạng ngày
                            (ngay / thangNam / day) chứ không trả chuỗi — dùng thẳng nó sẽ ra
                            "[object Object]" mà tsc không bắt được vì JSX nhận mọi ReactNode. */}
                        {dinhDangNgay(ct.tu_ngay).day} – {dinhDangNgay(ct.den_ngay).day}
                    </span>
                </div>

                {/* 🔴 CA XẤU 1: tên có thể dài 66 ký tự. KHÔNG cắt ba chấm ở đây — tên chương
                    trình là thứ người ta đọc để quyết định bấm vào; cắt nó là giấu mất phần phân
                    biệt hai chương trình gần giống nhau. Cho xuống dòng thoải mái. */}
                <h3 className={styles.ten}>
                    <Link to={den}>{ct.ten}</Link>
                </h3>

                <p className={styles.moTa}>{ct.mo_ta_ngan}</p>

                <div className={styles.tienDo}>
                    <div className={styles.hangSo}>
                        {/* Con số THẬT, không kẹp: vượt mục tiêu là tin tốt và phải nói ra. */}
                        <span className={clsx(styles.soDaQuyen, !dangDienRa && styles.soDaQuyenDa)}>
                            {dinhDangTien(ct.tong_da_quyen)}
                        </span>
                        <span className={styles.soMucTieu}>
                            {" / "}{dinhDangTien(ct.tong_du_kien_chi)}
                        </span>
                        <span className={styles.phanTram}>{phanTram}%</span>
                    </div>

                    {/* Giá trị cũng nằm ở dạng CHỮ ngay trên thanh (dòng .hangSo), nên thanh này
                        là hình minh hoạ cho một con số đã đọc được — xem chú thích tương phản
                        trong file CSS. `role/aria-*` để trình đọc màn hình không phải suy từ CSS. */}
                    <div
                        className={styles.ray}
                        role="progressbar"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={Math.min(phanTram, 100)}
                        aria-label={`Đã đạt ${phanTram}% mục tiêu`}
                    >
                        <div
                            className={clsx(styles.fill, dangDienRa ? styles.fillDang : styles.fillDa)}
                            style={{ width: beRongThanh(phanTram) }}
                        />
                    </div>

                    {/* 🔴 CA XẤU 3: 0 nhà tài trợ. Nói thẳng "Chưa có nhà tài trợ nào" thay vì
                        "0 nhà tài trợ" — câu thứ hai đọc như một con số thống kê, câu thứ nhất
                        là một lời mời. */}
                    <p className={styles.soNguoi}>
                        {ct.so_nha_tai_tro > 0
                            ? <><b>{ct.so_nha_tai_tro}</b> nhà tài trợ đã chung tay</>
                            : "Chưa có nhà tài trợ nào — hãy là người đầu tiên"}
                    </p>
                </div>
            </div>
        </article>
    );
};

const TaiTroDanhSachPage: React.FC = () => {
    useAppDocumentTitle("Vận động tài trợ");

    const [danhSach, setDanhSach] = useState<IChuongTrinhTomTat[]>([]);
    const [trangThai, setTrangThai] = useState<TrangThaiTai>("dang-tai");

    useEffect(() => {
        let con = true;
        // `await` từ BÂY GIỜ dù nguồn là dữ liệu cứng — xem `layDanhSachTomTat` trong
        // taiTroMock.ts: đó là điều kiện để ngày đổi sang gọi mạng không phải sửa màn hình.
        void (async () => {
            try {
                const ds = await layDanhSachTomTat();
                if (con) { setDanhSach(ds); setTrangThai("xong"); }
            } catch {
                if (con) setTrangThai("loi");
            }
        })();
        return () => { con = false; };
    }, []);

    const { dangDienRa, daDienRa } = useMemo(() => ({
        dangDienRa: danhSach.filter((x) => x.trang_thai === eTrangThaiChuongTrinh.DangDienRa),
        // Mới kết thúc lên trước: chương trình vừa xong là chương trình người ta còn nhớ.
        daDienRa: danhSach
            .filter((x) => x.trang_thai === eTrangThaiChuongTrinh.DaDienRa)
            .sort((a, b) => new Date(b.den_ngay).getTime() - new Date(a.den_ngay).getTime()),
    }), [danhSach]);

    const renderNoiDung = () => {
        if (trangThai === "dang-tai") {
            return <p className={styles.dangTai}>Đang tải danh sách chương trình…</p>;
        }
        if (trangThai === "loi") {
            return <AppResultState variant="error" title="Không tải được danh sách chương trình"
                description="Vui lòng tải lại trang. Nếu vẫn lỗi, liên hệ Khoa qua thông tin ở cuối trang." />;
        }
        // 🔴 TRẠNG THÁI 3 — chưa có chương trình nào. Đây là TRANG CÔNG KHAI: người ngoài chủ
        // động gõ địa chỉ vào, nên câu trả lời phải nói rõ "hệ thống chạy bình thường, hiện chưa
        // có đợt nào", chứ không để một trang trắng cho họ tự đoán là hỏng.
        if (danhSach.length === 0) {
            return <AppResultState variant="empty" title="Chưa có chương trình vận động nào"
                description="Khoa chưa mở đợt vận động tài trợ nào. Thông tin sẽ được đăng tại đây ngay khi có chương trình mới." />;
        }

        return (
            <>
                <section className={styles.khu} aria-labelledby="khu-dang-dien-ra">
                    <div className={styles.dauKhu}>
                        <h2 id="khu-dang-dien-ra">Đang diễn ra</h2>
                        <span className={styles.demKhu}>{dangDienRa.length} chương trình</span>
                    </div>
                    {dangDienRa.length > 0 ? (
                        <div className={styles.danhSach}>
                            {dangDienRa.map((ct) => <DongChuongTrinh key={ct.id} ct={ct} />)}
                        </div>
                    ) : (
                        // Khu trên rỗng mà khu dưới có: nói rõ, đừng bỏ trống.
                        <p className={styles.khuRong}>
                            Hiện không có chương trình nào đang mở. Xem các chương trình đã kết thúc bên dưới.
                        </p>
                    )}
                </section>

                <section className={styles.khu} aria-labelledby="khu-da-dien-ra">
                    <div className={styles.dauKhu}>
                        <h2 id="khu-da-dien-ra">Đã diễn ra</h2>
                        <span className={styles.demKhu}>{daDienRa.length} chương trình</span>
                    </div>
                    {daDienRa.length > 0 ? (
                        <div className={styles.danhSach}>
                            {daDienRa.map((ct) => <DongChuongTrinh key={ct.id} ct={ct} />)}
                        </div>
                    ) : (
                        // 🔴 TRẠNG THÁI 2 — chỉ có chương trình đang diễn ra, chưa cái nào kết thúc.
                        // Vẫn GIỮ tiêu đề khu: ẩn cả khu đi thì lần sau nó xuất hiện, bố cục trang
                        // nhảy một khối lớn mà không ai hiểu vì sao. Một dòng chữ là đủ.
                        <p className={styles.khuRong}>
                            Chưa có chương trình nào kết thúc. Các chương trình đã hoàn thành sẽ được lưu lại tại đây
                            kèm toàn bộ số liệu quyên góp và chi tiêu.
                        </p>
                    )}
                </section>
            </>
        );
    };

    return (
        <TrangCongKhai>
            <div className={styles.trang}>
                <header className={styles.dauTrang}>
                    <h1>Vận động tài trợ</h1>
                    <p>
                        Các chương trình vận động tài trợ của Khoa Toán - Cơ - Tin học. Mọi khoản đóng góp đều
                        được công khai số tiền đã nhận và toàn bộ nội dung đã chi, kèm minh chứng.
                    </p>
                </header>
                {renderNoiDung()}
            </div>
        </TrangCongKhai>
    );
};

export default TaiTroDanhSachPage;
