import {
    IChuongTrinhTaiTro,
    IChuongTrinhTomTat,
    eLoaiNhaTaiTro,
    eTrangThaiChuongTrinh,
    tomTatTuChiTiet,
} from "../../model/ITaiTro";

// ═══════════════════════════════════════════════════════════════════════════════════════════
// DỮ LIỆU CỨNG TẠM THỜI — MỘT FILE DUY NHẤT, VÀ ĐÂY LÀ ĐIỂM THAY THẾ
// ═══════════════════════════════════════════════════════════════════════════════════════════
// Lead chốt làm GIAO DIỆN TRƯỚC, quản trị làm sau. Chọn dữ liệu cứng thay vì tạo bảng ngay vì
// yếu tố quyết định là: CHƯA CÓ MÀN QUẢN TRỊ. Tạo bảng xong thì mỗi lần muốn đổi một con số để
// xem giao diện, lead phải viết SQL tay — chậm hơn hẳn sửa một file TypeScript, mà giai đoạn
// này đúng là giai đoạn xem giao diện.
//
// 🔴 BA ĐIỀU KIỆN GIỮ CHO LỰA CHỌN NÀY KHÔNG HỎNG — mất một cái là phải làm lại cả màn:
//   1. MỘT file duy nhất. Rải dữ liệu cứng vào từng component là mất điểm thay thế.
//   2. Kiểu là HỢP ĐỒNG API TƯƠNG LAI (`ITaiTro.ts`), không phải hình dạng tiện cho mock.
//   3. Ba con số lớn TÍNH TỪ MẢNG CON (`tomTatTuChiTiet`), không viết cứng. Viết cứng thì mock
//      luôn đẹp, và ngày có API thật con số sẽ lệch — đúng bài học `so_co_tai_khoan` ở M6a:
//      màn hình hứa một số, hệ thống làm theo số khác.
//
// ⚠️ ĐIỂM THAY THẾ KHI CÓ API (T4): đúng HAI hàm ở cuối file này.
//      layDanhSachTomTat()  ->  httpClient.get<IChuongTrinhTomTat[]>("/tai-tro")
//      layChiTiet(id)       ->  httpClient.get<IChuongTrinhTaiTro>(`/tai-tro/${id}`)
//    Màn hình KHÔNG phải sửa. Nếu thấy mình phải sửa màn hình, nghĩa là điều kiện (2) đã vỡ.
//
// ═══════════════════════════════════════════════════════════════════════════════════════════
// 🔴 MOCK CỐ Ý XẤU — ĐỪNG "DỌN CHO ĐẸP"
// ═══════════════════════════════════════════════════════════════════════════════════════════
// Mock đẹp là lý do màn hình vỡ đúng lúc có dữ liệu thật. Bảy ca dưới đây được cài có chủ đích,
// mỗi ca ép một nhánh giao diện khác nhau:
//
//   1. Tên chương trình 40+ ký tự          -> CT2 (66 ký tự) : tên có xuống dòng gãy không
//   2. Doanh nghiệp / tập thể: thiếu cấp   -> CT1 NTT#4, #7  : cột phải hiện "—", không để trống
//   3. Chương trình 0 nhà tài trợ          -> CT2            : tiến độ 0%, "chưa có ai"
//   4. Chương trình chưa có ảnh bìa        -> CT2            : ô thay thế, không vỡ ảnh
//   5. Vượt 100% mục tiêu                  -> CT3 (117%)     : thanh kẹp 100%, chữ nói số thật
//   6. Đã kết thúc mà CHƯA đạt mục tiêu    -> CT4 (43%)      : không được vẽ như thất bại
//   7. Nhà tài trợ ẩn danh                 -> CT1 NTT#5      : `ho_ten_don_vi = null`
//
// ⚠️ Thêm chương trình mới thì giữ nguyên bảy ca này. Muốn bỏ một ca thì phải nói được nhánh
//    giao diện nó canh giữ đã biến đi đâu.
//
// ═══════════════════════════════════════════════════════════════════════════════════════════
// 🔴 ẢNH GIỮ CHỖ — URL NGOÀI, TẠM CỦA GIAI ĐOẠN MOCK. T4 PHẢI THAY HẾT.
// ═══════════════════════════════════════════════════════════════════════════════════════════
// Lead cần nhìn được màn THẬT có ảnh, mà `/anh-tai-tro/` chưa tồn tại tới T4 nên mọi ảnh đang
// rơi vào nhánh onError. Trỏ tạm sang hai dịch vụ ảnh công cộng — trình duyệt của người xem tải,
// không có file nào nằm trong repo.
//
//   ẢNH BÌA      https://picsum.photos/seed/<từ-khoá>/1200/400   (ảnh thật, cố định theo seed)
//   ẢNH MINH CHỨNG  https://placehold.co/220x130/E8EDF5/1F2328?text=<chữ>   (ô có chữ)
//
// Vì sao hai loại khác nhau: ảnh bìa cần ảnh THẬT mới kiểm được thứ đã đo — chữ trắng trên dải
// gradient 62%/82% có đọc nổi trên một bức ảnh bất kỳ không (xem khối đo ở .bannerChu trong
// TaiTroChiTietPage.module.css). Còn chứng từ thì một bức ảnh ngẫu nhiên là vô nghĩa; ô chữ nói
// đúng nó là hoá đơn/phiếu chi nào và khớp nội dung khoản chi.
// ⚠️ 220x130 = gấp đôi thumbnail 110x65 ⇒ nét trên màn 2x và KHÔNG méo tỉ lệ.
// ⚠️ Chữ trong URL placehold phải KHÔNG DẤU — dịch vụ không nhận tiếng Việt có dấu.
//
// 🔴 `anh_bia` CỦA CT2 PHẢI Ở NGUYÊN `null`. Đó là ca xấu số 4 ở bảng trên ("chương trình chưa
//    có ảnh bìa"). Lấp ảnh vào đó là mất luôn ca kiểm ô gradient thay thế.
// 🔴 `anh_qr` KHÔNG ĐỔI — vẫn là tên file. Ảnh ngẫu nhiên ở chỗ mã QR là một LỜI HỨA SAI: người
//    ta giơ điện thoại lên quét rồi không ra gì. Quyết định này đã chốt ở lô trước, xem khối
//    "ẢNH QR — XỬ LÝ ẢNH HỎNG NGƯỢC HẲN" trong TaiTroChiTietPage.tsx.
// ⚠️ Mạng của người xem chặn picsum.photos / placehold.co thì ảnh vẫn hỏng — nhưng nhánh onError
//    đã có sẵn nên màn rơi về ô gradient, KHÔNG vỡ.
//
// 📋 ĐÚNG 11 DÒNG PHẢI ĐỔI Ở T4 (đổi về tên file do server phục vụ, dạng "<tên>.jpg"):
//      anh_bia  CT1 (id 1)  — hiện picsum seed graduation-ceremony
//      anh_bia  CT3 (id 3)  — hiện picsum seed students-classroom
//      anh_bia  CT4 (id 4)  — hiện picsum seed university-library
//      ten_file minh_chung id 1,2,3  (CT1 / khoản chi 1 "Học bổng cho sinh viên")
//      ten_file minh_chung id 4      (CT1 / khoản chi 2 "Tổ chức chương trình")
//      ten_file minh_chung id 5      (CT1 / khoản chi 3 "Chi phí khác")
//      ten_file minh_chung id 6,7    (CT3 / khoản chi 4 và 5)
//      ten_file minh_chung id 8      (CT4 / khoản chi 6 "Máy tính (13 bộ)")
//    KHÔNG có dòng `anh_qr` nào trong danh sách này, và CT2 không có dòng nào.
//    ⚠️ Cùng lúc đó phải XOÁ nhánh "URL tuyệt đối" trong `duongDanAnh()` ở ITaiTro.ts — nó là
//       thứ duy nhất làm mấy URL trên chạy được, và để lại thì một `anh_bia` bẩn từ DB sẽ được
//       nhúng thẳng lên trang công khai.
// ═══════════════════════════════════════════════════════════════════════════════════════════

const CHUONG_TRINH: IChuongTrinhTaiTro[] = [
    // ── CT1: ca "bình thường". Đang diễn ra, có ảnh, đủ ba loại nhà tài trợ, có một ẩn danh ──
    {
        id: 1,
        ten: "Tiếp bước đến trường 2025",
        mo_ta_ngan: "Hỗ trợ sinh viên có hoàn cảnh khó khăn vươn lên trong học tập",
        mo_ta_day:
            "Chương trình kêu gọi sự chung tay của các thế hệ cựu sinh viên, phụ huynh và các nhà "
            + "hảo tâm để trao học bổng cho sinh viên có hoàn cảnh khó khăn của Khoa Toán - Cơ - Tin "
            + "học, giúp các em có thêm động lực vươn lên trong học tập và cuộc sống.",
        anh_bia: "https://picsum.photos/seed/graduation-ceremony/1200/400",
        tu_ngay: "2025-09-01",
        den_ngay: "2025-12-30",
        trang_thai: eTrangThaiChuongTrinh.DangDienRa,
        don_vi_to_chuc: "Khoa Toán - Cơ - Tin học",
        stk: "1234 5678 9999",
        ngan_hang: "Vietcombank",
        noi_dung_ck: "Tai tro Tiep buoc den truong",
        anh_qr: "tai-tro-qr-1.png",
        du_kien_chi: [
            { id: 1, noi_dung: "Học bổng cho sinh viên", so_tien: 200_000_000, thu_tu: 1 },
            { id: 2, noi_dung: "Tổ chức chương trình", so_tien: 60_000_000, thu_tu: 2 },
            { id: 3, noi_dung: "Chi phí khác", so_tien: 40_000_000, thu_tu: 3 },
        ],
        // Tổng = 182.750.000 trên mục tiêu 300.000.000 => 61%, khớp ảnh mẫu.
        nha_tai_tro: [
            {
                id: 1, loai: eLoaiNhaTaiTro.CaNhan, ho_ten_don_vi: "Nguyễn Khánh Tùng", an_danh: false,
                ten_he: "Chính quy", ten_khoa: "Toán - Cơ - Tin học", nien_khoa: "1994-1998",
                ten_chuyen_nganh: "Toán học", ten_lop: "K39A", so_tien: 5_000_000, ngay_tai_tro: "2025-09-02",
            },
            {
                id: 2, loai: eLoaiNhaTaiTro.CaNhan, ho_ten_don_vi: "Trần Văn Nam", an_danh: false,
                ten_he: "Chính quy", ten_khoa: "Toán - Cơ - Tin học", nien_khoa: "1995-1999",
                ten_chuyen_nganh: "Cơ học", ten_lop: "K40B", so_tien: 3_000_000, ngay_tai_tro: "2025-09-05",
            },
            {
                id: 3, loai: eLoaiNhaTaiTro.CaNhan, ho_ten_don_vi: "Lê Thị Hoa", an_danh: false,
                ten_he: "Chính quy", ten_khoa: "Toán - Cơ - Tin học", nien_khoa: "1994-1998",
                ten_chuyen_nganh: "Toán - Tin ứng dụng", ten_lop: "K39A", so_tien: 2_000_000,
                ngay_tai_tro: "2025-09-07",
            },
            // 🔴 CA XẤU 2 — doanh nghiệp: KHÔNG có hệ/khoa/khoá/chuyên ngành/lớp.
            {
                id: 4, loai: eLoaiNhaTaiTro.DoanhNghiep, ho_ten_don_vi: "Công ty TNHH ABC", an_danh: false,
                ten_he: null, ten_khoa: null, nien_khoa: null, ten_chuyen_nganh: null, ten_lop: null,
                so_tien: 120_000_000, ngay_tai_tro: "2025-09-10",
            },
            // 🔴 CA XẤU 7 — ẩn danh. `ho_ten_don_vi = null` VÀ `an_danh = true` đi cùng nhau.
            //    Vẫn giữ khoá/lớp: người này muốn giấu TÊN, không giấu việc mình là cựu SV khoá đó.
            {
                id: 5, loai: eLoaiNhaTaiTro.CaNhan, ho_ten_don_vi: null, an_danh: true,
                ten_he: "Chính quy", ten_khoa: "Toán - Cơ - Tin học", nien_khoa: "1994-1998",
                ten_chuyen_nganh: "Toán học", ten_lop: "K39A", so_tien: 40_000_000, ngay_tai_tro: "2025-09-12",
            },
            {
                id: 6, loai: eLoaiNhaTaiTro.CaNhan, ho_ten_don_vi: "Phạm Thị Lan", an_danh: false,
                ten_he: "Vừa làm vừa học", ten_khoa: "Toán - Cơ - Tin học", nien_khoa: "1996-2000",
                ten_chuyen_nganh: "Toán - Tin ứng dụng", ten_lop: "K41C", so_tien: 750_000,
                ngay_tai_tro: "2025-09-15",
            },
            // 🔴 CA XẤU 2 (bản thứ hai) — tập thể lớp: CÓ lớp/khoá nhưng KHÔNG có chuyên ngành.
            {
                id: 7, loai: eLoaiNhaTaiTro.TapThe, ho_ten_don_vi: "Tập thể lớp K39A - Khoá 1994-1998",
                an_danh: false, ten_he: "Chính quy", ten_khoa: "Toán - Cơ - Tin học",
                nien_khoa: "1994-1998", ten_chuyen_nganh: null, ten_lop: "K39A",
                so_tien: 12_000_000, ngay_tai_tro: "2025-09-18",
            },
        ],
        khoan_chi: [
            {
                id: 1, noi_dung: "Học bổng cho sinh viên", so_tien: 80_000_000, ngay_chi: "2025-09-15",
                minh_chung: [
                    { id: 1, ten_file: "https://placehold.co/220x130/E8EDF5/1F2328?text=Danh+sach+nhan+hoc+bong", thu_tu: 1 },
                    { id: 2, ten_file: "https://placehold.co/220x130/E8EDF5/1F2328?text=Phieu+chi+hoc+bong", thu_tu: 2 },
                    { id: 3, ten_file: "https://placehold.co/220x130/E8EDF5/1F2328?text=Bien+ban+trao+hoc+bong", thu_tu: 3 },
                ],
            },
            {
                id: 2, noi_dung: "Tổ chức chương trình", so_tien: 30_000_000, ngay_chi: "2025-09-20",
                minh_chung: [{ id: 4, ten_file: "https://placehold.co/220x130/E8EDF5/1F2328?text=Hoa+don+to+chuc", thu_tu: 1 }],
            },
            {
                id: 3, noi_dung: "Chi phí khác", so_tien: 10_000_000, ngay_chi: "2025-09-25",
                minh_chung: [{ id: 5, ten_file: "https://placehold.co/220x130/E8EDF5/1F2328?text=Phieu+chi+khac", thu_tu: 1 }],
            },
        ],
    },

    // ── CT2: BA ca xấu cùng lúc — tên dài 66 ký tự · KHÔNG ảnh bìa · KHÔNG nhà tài trợ nào ──
    {
        id: 2,
        ten: "Học bổng khuyến khích tài năng Toán học dành cho sinh viên năm nhất",
        mo_ta_ngan:
            "Tìm kiếm và đồng hành cùng sinh viên năm nhất có năng khiếu đặc biệt về Toán học",
        mo_ta_day:
            "Chương trình dành cho sinh viên năm nhất có thành tích nổi bật trong các kỳ thi học "
            + "sinh giỏi quốc gia và quốc tế, nhằm khuyến khích các em tiếp tục theo đuổi con đường "
            + "nghiên cứu Toán học tại Khoa.",
        anh_bia: null,
        tu_ngay: "2025-10-01",
        den_ngay: "2026-06-30",
        trang_thai: eTrangThaiChuongTrinh.DangDienRa,
        don_vi_to_chuc: "Khoa Toán - Cơ - Tin học",
        stk: "1234 5678 0001",
        ngan_hang: "Vietcombank",
        noi_dung_ck: "Tai tro Hoc bong tai nang Toan hoc",
        anh_qr: null,
        du_kien_chi: [
            { id: 4, noi_dung: "Học bổng toàn phần (5 suất)", so_tien: 150_000_000, thu_tu: 1 },
            { id: 5, noi_dung: "Chi phí tổ chức xét chọn", so_tien: 20_000_000, thu_tu: 2 },
        ],
        nha_tai_tro: [],
        khoan_chi: [],
    },

    // ── CT3: đã diễn ra, VƯỢT mục tiêu (350.000.000 / 300.000.000 = 117%) ──
    {
        id: 3,
        ten: "Quỹ hỗ trợ thực tập sinh viên 2024",
        mo_ta_ngan: "Hỗ trợ chi phí đi lại và sinh hoạt cho sinh viên thực tập xa",
        mo_ta_day:
            "Quỹ hỗ trợ sinh viên năm cuối trong kỳ thực tập tại doanh nghiệp, đặc biệt là các em "
            + "phải di chuyển xa nơi ở. Chương trình đã kết thúc và vượt mục tiêu đề ra.",
        anh_bia: "https://picsum.photos/seed/students-classroom/1200/400",
        tu_ngay: "2024-03-01",
        den_ngay: "2024-08-31",
        trang_thai: eTrangThaiChuongTrinh.DaDienRa,
        don_vi_to_chuc: "Khoa Toán - Cơ - Tin học",
        stk: "1234 5678 0002",
        ngan_hang: "Vietcombank",
        noi_dung_ck: "Tai tro Quy thuc tap 2024",
        anh_qr: "tai-tro-qr-3.png",
        du_kien_chi: [
            { id: 6, noi_dung: "Hỗ trợ đi lại", so_tien: 180_000_000, thu_tu: 1 },
            { id: 7, noi_dung: "Hỗ trợ sinh hoạt phí", so_tien: 120_000_000, thu_tu: 2 },
        ],
        nha_tai_tro: [
            {
                id: 8, loai: eLoaiNhaTaiTro.DoanhNghiep, ho_ten_don_vi: "Tập đoàn Công nghệ XYZ",
                an_danh: false, ten_he: null, ten_khoa: null, nien_khoa: null,
                ten_chuyen_nganh: null, ten_lop: null, so_tien: 250_000_000, ngay_tai_tro: "2024-03-15",
            },
            {
                id: 9, loai: eLoaiNhaTaiTro.TapThe, ho_ten_don_vi: "Ban liên lạc cựu sinh viên Khoa",
                an_danh: false, ten_he: null, ten_khoa: "Toán - Cơ - Tin học", nien_khoa: null,
                ten_chuyen_nganh: null, ten_lop: null, so_tien: 100_000_000, ngay_tai_tro: "2024-05-20",
            },
        ],
        khoan_chi: [
            {
                id: 4, noi_dung: "Hỗ trợ đi lại đợt 1", so_tien: 180_000_000, ngay_chi: "2024-06-10",
                minh_chung: [{ id: 6, ten_file: "https://placehold.co/220x130/E8EDF5/1F2328?text=Phieu+chi+di+lai+dot+1", thu_tu: 1 }],
            },
            {
                id: 5, noi_dung: "Hỗ trợ sinh hoạt phí", so_tien: 120_000_000, ngay_chi: "2024-07-05",
                minh_chung: [{ id: 7, ten_file: "https://placehold.co/220x130/E8EDF5/1F2328?text=Phieu+chi+sinh+hoat+phi", thu_tu: 1 }],
            },
        ],
    },

    // ── CT4: đã kết thúc mà CHƯA đạt mục tiêu (65.000.000 / 150.000.000 = 43%) ──
    // 🔴 Ca này KHÔNG được vẽ như thất bại: 65 triệu đã tới tay sinh viên là việc thật đã làm
    //    được. Huy hiệu "Đã diễn ra" (xám trung tính) đã nói đủ; đừng thêm màu đỏ ở đâu cả.
    {
        id: 4,
        ten: "Trang bị phòng máy tính thực hành",
        mo_ta_ngan: "Nâng cấp phòng máy phục vụ học phần lập trình và mô phỏng số",
        mo_ta_day:
            "Chương trình vận động kinh phí thay mới 30 máy tính cho phòng thực hành của Khoa. "
            + "Chương trình đã kết thúc; số kinh phí vận động được đã dùng để thay mới 13 máy.",
        anh_bia: "https://picsum.photos/seed/university-library/1200/400",
        tu_ngay: "2023-09-01",
        den_ngay: "2023-12-31",
        trang_thai: eTrangThaiChuongTrinh.DaDienRa,
        don_vi_to_chuc: "Khoa Toán - Cơ - Tin học",
        stk: "1234 5678 0003",
        ngan_hang: "Vietcombank",
        noi_dung_ck: "Tai tro Phong may thuc hanh",
        anh_qr: null,
        du_kien_chi: [
            { id: 8, noi_dung: "Máy tính (30 bộ)", so_tien: 135_000_000, thu_tu: 1 },
            { id: 9, noi_dung: "Lắp đặt, cài đặt phần mềm", so_tien: 15_000_000, thu_tu: 2 },
        ],
        nha_tai_tro: [
            {
                id: 10, loai: eLoaiNhaTaiTro.CaNhan, ho_ten_don_vi: "Đỗ Minh Quân", an_danh: false,
                ten_he: "Chính quy", ten_khoa: "Toán - Cơ - Tin học", nien_khoa: "1996-2000",
                ten_chuyen_nganh: "Tin học", ten_lop: "K41A", so_tien: 50_000_000,
                ngay_tai_tro: "2023-09-20",
            },
            {
                id: 11, loai: eLoaiNhaTaiTro.CaNhan, ho_ten_don_vi: null, an_danh: true,
                ten_he: null, ten_khoa: null, nien_khoa: null, ten_chuyen_nganh: null, ten_lop: null,
                so_tien: 15_000_000, ngay_tai_tro: "2023-11-02",
            },
        ],
        khoan_chi: [
            {
                id: 6, noi_dung: "Máy tính (13 bộ)", so_tien: 58_500_000, ngay_chi: "2024-01-15",
                minh_chung: [{ id: 8, ten_file: "https://placehold.co/220x130/E8EDF5/1F2328?text=Hoa+don+13+may+tinh", thu_tu: 1 }],
            },
        ],
    },
];

/**
 * 🔁 ĐIỂM THAY THẾ 1/2 — T4 đổi thân hàm thành:
 *     const r = await httpClient.get<IChuongTrinhTomTat[]>("/tai-tro");
 *     return r.data ?? [];
 * Chữ ký giữ nguyên (`Promise`) CHÍNH VÌ VẬY: màn hình đã `await` sẵn từ bây giờ nên ngày đổi
 * sang gọi mạng không phải sửa một dòng nào ở màn hình.
 */
export const layDanhSachTomTat = async (): Promise<IChuongTrinhTomTat[]> =>
    CHUONG_TRINH.map(tomTatTuChiTiet);

/**
 * 🔁 ĐIỂM THAY THẾ 2/2 — dùng cho trang chi tiết (T2, chưa dựng).
 * Trả `null` khi không có id đó: đó là ca 404 thật, màn chi tiết phải xử.
 */
export const layChiTiet = async (id: number): Promise<IChuongTrinhTaiTro | null> =>
    CHUONG_TRINH.find((x) => x.id === id) ?? null;
