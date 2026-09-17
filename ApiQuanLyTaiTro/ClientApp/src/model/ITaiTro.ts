// ═══════════════════════════════════════════════════════════════════════════════════════════
// CỔNG VẬN ĐỘNG TÀI TRỢ — HỢP ĐỒNG DỮ LIỆU (T1)
// ═══════════════════════════════════════════════════════════════════════════════════════════
// 🔴 ĐÂY LÀ HÌNH DẠNG CỦA API THẬT — GET api/tai-tro/chuong-trinh[/{id}] (P2a, BE Models/Responses/TaiTro).
// 🔄 Tới P2b (2026-09-17) màn hình nạp từ `taiTroMock.ts` và file này là "hình dạng API tương lai". Nay
//    màn gọi API qua `services/taiTroApi.ts`; mock KHÔNG còn được import. Khi nối API, hợp đồng lệch BE
//    năm chỗ — đã sửa ở đây theo BE (đối chiếu JSON thật, không theo DTO): mo_ta_ngan → phu_de (cả hai
//    kiểu), thêm loi_keu_goi + ten_chu_tai_khoan (chi tiết), thêm an_dinh_danh, bỏ ten_chuyen_nganh (nhà tài trợ).
// ⚠️ Sửa kiểu ở đây = đối chiếu JSON thật của API trước. Đừng sửa cho vừa mock.
//
// Tên trường theo `snake_case` — Program.cs đặt `PropertyNamingPolicy = null` nên JSON giữ
// nguyên tên cột DB. Đừng đổi sang camelCase.
//
// 📅 NGÀY: API trả `"yyyy-MM-ddT00:00:00"` — KHÔNG có `Z`, KHÔNG phải `"yyyy-MM-dd"`. Đó là điều TỐT:
//    `new Date("…T00:00:00")` hiểu là giờ ĐỊA PHƯƠNG ⇒ `dinhDangNgay` ra đúng ngày ở mọi múi giờ. Chuỗi
//    ngày-trơn `"yyyy-MM-dd"` (dạng mock dùng) lại bị hiểu là UTC ⇒ ở múi giờ âm LÙI MỘT NGÀY (đo P2b:
//    "1976-03-15" hiện 14/03/1976 ở America/New_York). ⇒ Đừng "chuẩn hoá" về yyyy-MM-dd, và đừng cắt
//    `.slice(0, 10)` rồi mới `new Date` — chính thao tác đó gây lệch.
// ═══════════════════════════════════════════════════════════════════════════════════════════

export const DUONG_DAN_TAI_TRO = "/tai-tro";
export const duongDanChuongTrinh = (id: number): string => `${DUONG_DAN_TAI_TRO}/${id}`;

export enum eTrangThaiChuongTrinh {
    DangDienRa = 1,
    DaDienRa = 2,
}

export enum eLoaiNhaTaiTro {
    CaNhan = 1,
    TapThe = 2,
    DoanhNghiep = 3,
}

export const NHAN_LOAI_NHA_TAI_TRO: Record<eLoaiNhaTaiTro, string> = {
    [eLoaiNhaTaiTro.CaNhan]: "Cá nhân",
    [eLoaiNhaTaiTro.TapThe]: "Tập thể / Lớp",
    [eLoaiNhaTaiTro.DoanhNghiep]: "Doanh nghiệp",
};

/** Một dòng trong bảng "Chi tiết dự kiến chi". */
export interface IDuKienChi {
    id: number;
    noi_dung: string;
    so_tien: number;
    thu_tu: number;
}

/**
 * Một ảnh minh chứng của MỘT khoản chi.
 * ⚠️ Là THỰC THỂ RIÊNG, không phải một cột: mẫu có 3 khoản chi nhưng ghi "Xem tất cả minh chứng
 * (5)" ⇒ một khoản chi có nhiều ảnh.
 */
export interface IMinhChungChi {
    id: number;
    ten_file: string;
    thu_tu: number;
}

export interface IKhoanChi {
    id: number;
    noi_dung: string;
    so_tien: number;
    /** `"yyyy-MM-ddT00:00:00"` — xem ghi chú NGÀY đầu file. */
    ngay_chi: string;
    minh_chung: IMinhChungChi[];
}

export interface INhaTaiTro {
    id: number;
    loai: eLoaiNhaTaiTro;
    /**
     * 🔴 `null` khi người tài trợ chọn ẨN DANH. Màn hình PHẢI xử nhánh này, đừng `?? ""` cho
     * xong — một dòng trống trong bảng công khai đọc ra như dữ liệu hỏng, còn "Nhà tài trợ ẩn
     * danh" là một câu trả lời đúng và tử tế.
     */
    ho_ten_don_vi: string | null;
    an_danh: boolean;
    /**
     * `true` = ẩn danh MỨC 2 (giấu tất cả): hệ/khoa/khoá/lớp đều `null` VÌ BỊ CHE, không phải vì thiếu.
     * `an_danh && !an_dinh_danh` = mức 1 (giấu tên, giữ lớp). Có trong API từ P2a; thêm vào hợp đồng ở P2b.
     * ⚠️ Màn hình CHƯA dùng trường này — bốn cột định danh bị che vẫn vẽ "—" như ô không có dữ liệu (luật A7
     *    muốn hai nghĩa tách nhau). Hiện bảng chỉ còn cột Lớp nên chỉ lệch ở một ô; ghi nợ, chưa sửa.
     */
    an_dinh_danh: boolean;
    /**
     * Ngày sinh, `"yyyy-MM-ddT00:00:00"` (xem ghi chú NGÀY đầu file). `null` có HAI nghĩa, và màn hình PHẢI tách ra:
     *   · `an_danh === true`  ⇒ BỊ CHE — server không trả ngày sinh của người ẩn danh (kể cả mức
     *                           "ẩn tên, giữ lớp": lớp + ngày sinh vẫn chỉ ra đúng một người).
     *   · `an_danh === false` ⇒ KHÔNG CÓ DỮ LIỆU — doanh nghiệp, tập thể lớp không có ngày sinh.
     * Hai nghĩa khác nhau không được vẽ chung một ký hiệu (luật A7).
     *
     * 🔄 ĐÃ ĐẢO HAI LẦN (2026-09-17). T2 cố ý BỎ trường này khỏi trang công khai: ghép họ tên + lớp +
     * ngày sinh là định danh được một người cụ thể. Nay THÊM LẠI theo mẫu sếp — quyết định cấp trên,
     * lập luận cũ không sai mà bị vượt qua. Ba lớp đầy đủ: CLAUDE.md mục 5.
     */
    ngay_sinh: string | null;
    /**
     * Bốn trường định danh theo cấu trúc CỦA CỔNG NÀY (Hệ → Khoa → Khoá → Lớp),
     * KHÔNG dùng khuôn THPT của ảnh mẫu (Hệ 12 / Khoa = tên môn).
     * `null` là hợp lệ và thường gặp: doanh nghiệp và tập thể lớp không có đủ cấp, và nhà
     * tài trợ có thể là bất kỳ ai chứ không bắt buộc là cựu sinh viên.
     * 🔄 Từng có `ten_chuyen_nganh` — đã gỡ khỏi DDL (lô đối chiếu ảnh mẫu), P2b gỡ khỏi hợp đồng.
     */
    ten_he: string | null;
    ten_khoa: string | null;
    nien_khoa: string | null;
    ten_lop: string | null;
    /** BE khai `decimal?` (cột NULL khi chưa duyệt) nhưng view công khai lọc `so_tien IS NOT NULL` ⇒ luôn có số. */
    so_tien: number;
    /** `"yyyy-MM-ddT00:00:00"`. */
    ngay_tai_tro: string;
}

/**
 * Bản ĐẦY ĐỦ của một chương trình — hình dạng của endpoint chi tiết (T2).
 *
 * 🔴 KHÔNG CÓ TRƯỜNG `muc_tieu`, và đó là quyết định thiết kế, không phải thiếu sót.
 * Mục tiêu quyên góp CHÍNH LÀ tổng dự kiến chi (xem `tongDuKienChi`). Để hai con số rời nhau là
 * dựng sẵn hai nguồn sự thật cho cùng một thứ — chúng sẽ lệch, và trang sẽ nói dối đúng chỗ
 * người ta nhìn để quyết định có đóng góp hay không. Cùng bài học `so_co_tai_khoan` ở M6a.
 */
export interface IChuongTrinhTaiTro {
    id: number;
    ten: string;
    /**
     * Ba tầng văn bản, mỗi trường MỘT khối trên trang (khối đầu DDL TT_ChuongTrinh):
     *   phu_de      — dòng dưới tên, trong banner
     *   loi_keu_goi — đoạn văn trong banner
     *   mo_ta_day   — khối "Thông tin chương trình"
     * 🔄 Tới P2b hợp đồng FE chỉ có `mo_ta_ngan` + `mo_ta_day`, banner in `mo_ta_day` HAI lần (banner + khối thông tin).
     */
    phu_de: string;
    loi_keu_goi: string;
    mo_ta_day: string;
    /** `null` = chưa có ảnh bìa. Màn hình phải có ô thay thế, đừng để vỡ ảnh. */
    anh_bia: string | null;
    /** `"yyyy-MM-ddT00:00:00"`. */
    tu_ngay: string;
    /** `"yyyy-MM-ddT00:00:00"`. */
    den_ngay: string;
    trang_thai: eTrangThaiChuongTrinh;
    don_vi_to_chuc: string;
    stk: string;
    ngan_hang: string;
    /** Chủ tài khoản — người chuyển khoản đối chiếu tên trước khi bấm chuyển. */
    ten_chu_tai_khoan: string;
    noi_dung_ck: string;
    /** Ảnh QR do QUẢN TRỊ TẢI LÊN — lead chốt không sinh VietQR ở giai đoạn này. */
    anh_qr: string | null;
    du_kien_chi: IDuKienChi[];
    nha_tai_tro: INhaTaiTro[];
    khoan_chi: IKhoanChi[];
}

/**
 * Bản TÓM TẮT — hình dạng của endpoint danh sách (T1, trang này).
 *
 * Vì sao tách khỏi `IChuongTrinhTaiTro`: endpoint danh sách sẽ KHÔNG trả về toàn bộ nhà tài trợ
 * và khoản chi của mọi chương trình (một chương trình có thể có hàng trăm dòng). Nó trả về các
 * con số đã cộng sẵn bằng SQL. Viết đúng hình dạng đó ngay từ bây giờ để ngày đổi sang API thật
 * màn hình không phải sửa.
 */
export interface IChuongTrinhTomTat {
    id: number;
    ten: string;
    /** 🔄 Tới P2b tên là `mo_ta_ngan`; API trả `phu_de`. */
    phu_de: string;
    anh_bia: string | null;
    tu_ngay: string;
    den_ngay: string;
    trang_thai: eTrangThaiChuongTrinh;
    don_vi_to_chuc: string;
    tong_du_kien_chi: number;
    tong_da_quyen: number;
    so_nha_tai_tro: number;
}

// ── Ba phép cộng: LUÔN tính từ mảng con, không bao giờ đọc một cột tổng ────────────────────
// 🔴 Ba hàm này là lý do `IChuongTrinhTaiTro` không có cột tổng nào. Giữ nguyên nguyên tắc khi
// viết SP: SP cũng phải SUM từ bảng con, không lưu cột tổng rồi cập nhật bằng trigger.
// Quy mô là hàng chục dòng mỗi chương trình — SUM không phải vấn đề hiệu năng. Khi nào ĐO được
// là chậm thì mới bàn tới cache, đừng tối ưu trước khi có số.

export const tongDuKienChi = (ct: IChuongTrinhTaiTro): number =>
    ct.du_kien_chi.reduce((s, x) => s + x.so_tien, 0);

/**
 * ⚠️ Chỉ cộng những khoản ĐÃ ĐỐI CHIẾU. Giai đoạn này mock chỉ chứa khoản đã đối chiếu nên phép
 * cộng là thẳng; khi có bảng thật và có trạng thái chờ đối chiếu thì lọc PHẢI thêm ở đây (và ở
 * SP), nếu không trang sẽ khoe số tiền chưa ai xác nhận là đã nhận được.
 */
export const tongDaQuyen = (ct: IChuongTrinhTaiTro): number =>
    ct.nha_tai_tro.reduce((s, x) => s + x.so_tien, 0);

export const tongDaChi = (ct: IChuongTrinhTaiTro): number =>
    ct.khoan_chi.reduce((s, x) => s + x.so_tien, 0);

/**
 * Phần trăm đạt được. KHÔNG kẹp ở 100: vượt mục tiêu là tin tốt và phải nói ra bằng con số thật.
 * Việc kẹp bề rộng thanh tiến độ là chuyện của CSS, không phải của con số.
 * Mục tiêu = 0 (chương trình chưa khai dự kiến chi) ⇒ trả 0 thay vì chia cho 0.
 */
export const phanTramDat = (daQuyen: number, mucTieu: number): number =>
    mucTieu > 0 ? Math.round((daQuyen / mucTieu) * 100) : 0;

/**
 * Rút gọn một chương trình đầy đủ thành bản tóm tắt — chỉ `taiTroMock.ts` dùng (dựng danh sách từ mock).
 * ⚠️ Màn hình thật KHÔNG dùng hàm này: danh sách lấy số đã cộng sẵn từ API (SP 01).
 */
export const tomTatTuChiTiet = (ct: IChuongTrinhTaiTro): IChuongTrinhTomTat => ({
    id: ct.id,
    ten: ct.ten,
    phu_de: ct.phu_de,
    anh_bia: ct.anh_bia,
    tu_ngay: ct.tu_ngay,
    den_ngay: ct.den_ngay,
    trang_thai: ct.trang_thai,
    don_vi_to_chuc: ct.don_vi_to_chuc,
    tong_du_kien_chi: tongDuKienChi(ct),
    tong_da_quyen: tongDaQuyen(ct),
    so_nha_tai_tro: ct.nha_tai_tro.length,
});

/** "182.750.000đ". Dùng chung để hai màn không định dạng khác nhau. */
export const dinhDangTien = (so: number): string => `${so.toLocaleString("vi-VN")}đ`;

/**
 * Đường dẫn ảnh của cổng tài trợ (ảnh bìa, ảnh minh chứng, ảnh QR).
 * Dạng CHÍNH THỨC từ T4: `/anh-tai-tro/<tên file>` do server phục vụ.
 *
 * 🔴 NHÁNH "URL TUYỆT ĐỐI" LÀ ĐỒ TẠM CỦA GIAI ĐOẠN MOCK — đọc khối "ẢNH GIỮ CHỖ" ở đầu
 * `taiTroMock.ts` trước khi đụng vào. Mock đang chứa URL picsum/placehold để lead xem được màn
 * thật; nối tiền tố `/anh-tai-tro/` vào một chuỗi `https://…` thì ra đường dẫn vô nghĩa và ảnh
 * nào cũng rơi vào nhánh onError — tức là lại không nhìn được gì.
 *
 * ⚠️ XOÁ NHÁNH NÀY cùng lúc với việc thay mock bằng API thật. Khi đó mọi giá trị đều là TÊN
 *    FILE, còn để nhánh này ở lại thì một `anh_bia` bẩn từ DB (ai đó dán nguyên URL vào ô nhập
 *    ở màn quản trị) sẽ được nhúng thẳng lên trang công khai — mở đường cho ảnh từ miền lạ.
 *
 * Đặt ở đây chứ không phải trong từng màn: cả hai màn đều dựng đường dẫn ảnh, mà trước lô này
 * màn danh sách tự nối chuỗi inline còn màn chi tiết có helper riêng — đúng hình dạng "hai bản
 * chép rồi trôi khỏi nhau" mà mục 51 đã phải đi dọn một lần.
 */
export const duongDanAnh = (tenFile: string): string =>
    /^https?:\/\//i.test(tenFile) ? tenFile : `/anh-tai-tro/${tenFile}`;
