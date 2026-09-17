import React from "react";
import { Link } from "react-router-dom";
import TrangCongKhai from "../../layout/TrangCongKhai";
import { useAppDocumentTitle } from "../../hooks/useAppDocumentTitle";
import { DUONG_DAN_TAI_TRO } from "../../model/ITaiTro";
import styles from "./TrangChuPage.module.css";

// ═══════════════════════════════════════════════════════════════════════════════════════════
// TRANG CHỦ — BẢN GIỮ CHỖ CỦA LÔ DỰNG KHUNG (P1)
// ═══════════════════════════════════════════════════════════════════════════════════════════
// 🔴 ĐÂY KHÔNG PHẢI TRANG CHỦ THẬT. Việc của nó ở lô này đúng một điều: chứng minh khung
// TrangCongKhai (header hai tầng + <main> + footer) dựng đúng trong repo mới.
//
// Repo gốc có `AlumniLandingPage` — hero tràn viền, "Góc cựu sinh viên tiêu biểu", khối tin tức,
// ba khối neo `gioi-thieu`/`lien-he`. KHÔNG chép sang, và đó là quyết định, không phải bỏ sót:
// toàn bộ nội dung đó nói về cộng đồng cựu sinh viên, còn cổng này nói với NGƯỜI ĐÓNG GÓP.
// Chép một trang chủ nói sai đối tượng rồi sửa dần tốn hơn viết mới khi đã có nội dung thật.
//
// ⚠️ Mục "Trang chủ" trên thanh điều hướng là neo rỗng (về đầu trang) và "Liên hệ" là neo
//    `lien-he` nằm trong LandingFooter — hai mục đó CHẠY ĐƯỢC ngay với trang này. Mục "Giới
//    thiệu" đã được gỡ khỏi thanh vì chưa có khối nội dung nào mang neo đó (xem AppBrandHeader).
// ⚠️ Khi dựng trang chủ thật: thêm khối mang `id="gioi-thieu"` TRƯỚC, rồi mới thêm lại mục menu —
//    đúng thứ tự đó, không ngược lại.
// ═══════════════════════════════════════════════════════════════════════════════════════════
const TrangChuPage: React.FC = () => {
    useAppDocumentTitle("Trang chủ");

    return (
        <TrangCongKhai>
            <div className={styles.trang}>
                <h1 className={styles.tieuDe}>Cổng vận động tài trợ</h1>
                <p className={styles.moTa}>
                    Nơi công khai các chương trình vận động tài trợ: mục tiêu, tiến độ quyên góp,
                    danh sách nhà tài trợ và toàn bộ khoản chi kèm minh chứng. Mọi người đều xem
                    được, không cần đăng nhập.
                </p>
                <Link className={styles.nut} to={DUONG_DAN_TAI_TRO}>
                    Xem các chương trình
                </Link>
            </div>
        </TrangCongKhai>
    );
};

export default TrangChuPage;
