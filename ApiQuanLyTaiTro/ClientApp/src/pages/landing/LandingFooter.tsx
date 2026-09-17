import React from "react";
import { LocationIcon, MailIcon, DeviceMobileIcon } from "@primer/octicons-react";
import { Octicon } from "@primer/react";
import styles from "./LandingFooter.module.css";
import { appConst } from "../../AppConst";

// ═══════════════════════════════════════════════════════════════════════════════════════════
// FOOTER — CHỈ Ở LANDING. Lý do kiến trúc + lý do thể loại ghi ở đầu LandingFooter.module.css.
// ═══════════════════════════════════════════════════════════════════════════════════════════
// Bố cục 4 cột theo site mẫu: nhận diện + liên hệ · ba nhóm liên kết · dòng bản quyền.
// CỐ Ý KHÔNG lấy: băng logo đối tác · nút mạng xã hội nổi · nút cuộn lên đầu.
//
// ═══════════════════════════════════════════════════════════════════════════════════════════
// 🔴 LIÊN KẾT KHÔNG CÓ URL THÌ KHÔNG PHẢI LIÊN KẾT
// ═══════════════════════════════════════════════════════════════════════════════════════════
// Cổng không có trang nào cho 11 mục đó - chúng thuộc site chính của Khoa, mà URL thật thì chưa
// biết. Quy ước: `url` rỗng ⇒ render <span>, KHÔNG render <a>.
//   · Bố cục đầy đủ ngay, xem được ngay;
//   · KHÔNG một liên kết chết nào - bấm không đi đâu vì nó không bấm được;
//   · điền URL vào AppConst là mục đó TỰ thành liên kết, không phải sửa file này.
// Ship footer đầy liên kết 404 tệ hơn hẳn footer có vài mục chưa bấm được.
const LienKet: React.FC<{ nhan: string; url: string }> = ({ nhan, url }) =>
    url ? (
        // rel="noopener noreferrer": chặn trang đích đọc được window.opener của ta, và chặn nó
        // nhận Referer. Bắt buộc với MỌI target="_blank" ra ngoài miền.
        <a className={styles.mucLink} href={url} target="_blank" rel="noopener noreferrer">
            {nhan}
        </a>
    ) : (
        <span className={styles.mucChuaCo}>{nhan}</span>
    );

const LandingFooter: React.FC = () => (
    // `id` là ĐÍCH của mục "Liên hệ" trên thanh neo ở header Landing.
    <footer className={styles.footer} id="lien-he">
        <div className={styles.inner}>
            {/* ── Cột 1: nhận diện + liên hệ ─────────────────────────────────────────────── */}
            <div className={styles.cotNhanDien}>
                <div className={styles.donVi}>
                    {/* 🔴 `alt=""` + aria-hidden CỐ Ý: tên đơn vị nằm ngay bên cạnh dưới dạng chữ
                        thật, nên nếu logo cũng có alt thì trình đọc màn hình đọc HAI LẦN.
                        (Ở header thì ngược lại - không có dòng chữ tên đơn vị nào nên logo PHẢI
                        mang alt. Xem AppBrandHeader.tsx.) */}
                    <img className={styles.logo} src={appConst.appURLLogo} alt="" aria-hidden="true" />
                    {/* HAI CẤP, xếp đúng bộ nhận diện chính thức: cơ quan chủ quản ở TRÊN và nhỏ
                        hơn, đơn vị dùng cổng ở DƯỚI và đậm hơn. */}
                    <p className={styles.khoiTen}>
                        <span className={styles.tenDonVi}>{appConst.schoolName}</span>
                        <span className={styles.capTren}>{appConst.parentOrgName}</span>
                    </p>
                </div>

                <address className={styles.lienHe}>
                    {/* <address> là thẻ đúng ngữ nghĩa cho thông tin liên hệ của chủ tài liệu.
                        Trình duyệt in nghiêng mặc định - đã ghi đè `font-style` ở CSS.
                        Ba icon đều aria-hidden: chúng chỉ là dấu hiệu hình cho loại thông tin,
                        nội dung thật nằm ngay bên cạnh dưới dạng chữ. */}
                    <span className={styles.dong}>
                        <span className={styles.dongIcon} aria-hidden="true">
                            <Octicon icon={LocationIcon} size={16} />
                        </span>
                        <span>{appConst.contactAddress}</span>
                    </span>
                    <span className={styles.dong}>
                        <span className={styles.dongIcon} aria-hidden="true">
                            <Octicon icon={DeviceMobileIcon} size={16} />
                        </span>
                        <a className={styles.lienKet} href={`tel:${appConst.contactPhoneHref}`}>
                            {appConst.contactPhone}
                        </a>
                    </span>
                    <span className={styles.dong}>
                        <span className={styles.dongIcon} aria-hidden="true">
                            <Octicon icon={MailIcon} size={16} />
                        </span>
                        <a className={styles.lienKet} href={`mailto:${appConst.contactEmail}`}>
                            {appConst.contactEmail}
                        </a>
                    </span>
                </address>
            </div>

            {/* ── Cột 2-4: ba nhóm liên kết ──────────────────────────────────────────────── */}
            {appConst.footerLinks.map((nhom) => (
                <nav className={styles.cotLink} key={nhom.tieuDe} aria-label={nhom.tieuDe}>
                    <h2 className={styles.tieuDeCot}>{nhom.tieuDe}</h2>
                    <ul className={styles.danhSach}>
                        {nhom.muc.map((m) => (
                            <li key={m.nhan}>
                                <LienKet nhan={m.nhan} url={m.url} />
                            </li>
                        ))}
                    </ul>
                </nav>
            ))}
        </div>

        <p className={styles.banQuyen}>
            {/* Ghi ĐỦ HAI CẤP theo lối "Đơn vị, Cơ quan chủ quản".
                Về pháp lý, chủ thể quyền là TRƯỜNG (một Khoa không phải pháp nhân độc lập), nên
                bỏ hẳn cấp trên sẽ là một dòng bản quyền không chỉ đúng người. Nhưng bỏ tên Khoa
                thì lại giấu mất đơn vị VẬN HÀNH cổng. Ghi cả hai là cách duy nhất không sai vế
                nào - và cũng là lối viết quen thuộc trên website các khoa ở Việt Nam. */}
            © {new Date().getFullYear()} {appConst.schoolName}, {appConst.parentOrgName}. Bảo lưu
            mọi quyền.
        </p>
    </footer>
);

export default LandingFooter;
