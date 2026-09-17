// Logo nối qua IMPORT, KHÔNG qua chuỗi URL trong env.
// LÝ DO (bài học lô dọn - nợ mục 64): webpack băm tên file và kiểm lúc build, nên sai đường dẫn
// là HỎNG LÚC BUILD chứ không vỡ ảnh âm thầm trên trình duyệt. Bản cũ đọc REACT_APP_URL_LOGO
// với dự phòng `${REACT_APP_OIDC_AUTHORITY}/logo.png` - mà OIDC đã bị gỡ hẳn ở lô dọn D4, tức
// dự phòng đó trỏ vào một host không còn ai kiểm soát.
// ⚠️ Đây là nguồn logo DUY NHẤT: header (AppBrandHeader), BrandLogo, và favicon (useWebIcon).
import logoDonVi from "./assets/logo_vnu_70nam.png";

interface IAppConst {
    headerHeight: number;
    /** Tên ĐƠN VỊ dùng cổng (cấp dưới) - vd "KHOA TOÁN - CƠ - TIN HỌC". */
    schoolName: string;
    /** Tên CƠ QUAN CHỦ QUẢN (cấp trên) - vd "TRƯỜNG ĐẠI HỌC KHOA HỌC TỰ NHIÊN".
     *  ⚠️ KHÔNG rắc trường này khắp nơi - xem khối quyết định ở phần giá trị bên dưới. */
    parentOrgName: string;
    schoolCode?: string;
    appicationName: string;
    /** Thương hiệu NHÀ CUNG CẤP - hiện ở hai dòng chữ của header. KHÔNG phải tên trường. */
    vendorName: string;
    vendorTagline: string;
    /** Thông tin liên hệ của ĐƠN VỊ - hiện ở footer Landing. Xem cảnh báo ở phần giá trị. */
    contactAddress: string;
    contactPhone: string;
    /** Số điện thoại đã bỏ khoảng trắng/dấu ngoặc, dùng cho href="tel:". */
    contactPhoneHref: string;
    contactEmail: string;
    /** Ba nhóm liên kết ở footer. `url` RỖNG = chưa có, sẽ render thành chữ thường, KHÔNG
     *  phải liên kết chết. Xem khối cảnh báo ở phần giá trị. */
    footerLinks: { tieuDe: string; muc: { nhan: string; url: string }[] }[];
    authCompany: string;
    appicationVersion: string;
    appURLLogo: string;
    APP_URL_PAGE_MAIN: string;

    baseApiURL: string;
    /** Gốc URL của ảnh tin tức đã tải lên. Xem khối giải thích ở phần giá trị bên dưới. */
    baseAnhTinTucURL: string;
    OIDC_AUTHORITY: string;
    OIDC_CLIENT_ID: string;
    OIDC_REDIRECT_URI: string;
    OIDC_CLIENT_SECRET: string;
    OIDC_LOGOUT: string;
    OIDC_UNIT: string;
    OIDC_SCOPE: string;
}
export const appConst: IAppConst = {
    headerHeight: 80,
    // 🔴 `schoolName` VẪN CÒN NGƯỜI DÙNG sau khi header đổi sang thương hiệu nhà cung cấp -
    // đã grep, còn ĐÚNG HAI chỗ và cả hai đều hợp lệ:
    //   1. AppBrandHeader: `alt` của thẻ <img> logo — logo là logo của ĐƠN VỊ, nên chữ thay
    //      ảnh phải là tên đơn vị. Đây là đường DUY NHẤT trình đọc màn hình biết cổng của ai.
    //   2. AlumniLandingPage: câu giới thiệu "…là nơi {schoolName} kết nối với cựu sinh viên…".
    // => REACT_APP_SCHOOL_NAME KHÔNG chết. Dự phòng cứng bên dưới cũng KHÔNG thừa: thiếu nó thì
    //    alt rỗng (lỗi trợ năng) và câu trên landing rơi về "nhà trường" chung chung.
    // Dùng `||` chứ không `??` - biến env chưa đặt cho ra chuỗi RỖNG, mà `??` không bắt được.
    schoolName: process.env.REACT_APP_SCHOOL_NAME?.toString() || "KHOA TOÁN - CƠ - TIN HỌC",

    // ═══════════════════════════════════════════════════════════════════════════════════════
    // TÊN ĐƠN VỊ CÓ HAI CẤP — DÙNG CẤP TRÊN Ở ĐÂU, VÀ VÌ SAO KHÔNG DÙNG Ở CHỖ KHÁC
    // ═══════════════════════════════════════════════════════════════════════════════════════
    // Tên chính thức có hai tầng: TRƯỜNG ĐẠI HỌC KHOA HỌC TỰ NHIÊN (trên) / KHOA TOÁN - CƠ -
    // TIN HỌC (dưới). Một biến không chứa được hai tầng, nên thêm biến này.
    //
    // 🔴 ĐÃ QUYẾT TỪNG NƠI, KHÔNG ÁP ĐỒNG LOẠT. Ba nơi đọc schoolName, chỉ HAI nơi thêm cấp trên:
    //
    //   ✅ alt của <img> logo (AppBrandHeader) — CÓ cả hai cấp.
    //      Header KHÔNG còn dòng chữ tên đơn vị nào (nó mang thương hiệu nhà cung cấp), nên alt
    //      này là ĐƯỜNG DUY NHẤT người dùng trình đọc màn hình biết cổng của ai. Đã là đường
    //      duy nhất thì phải đủ, không được rút gọn.
    //
    //   ❌ câu giới thiệu Landing — CHỈ tên Khoa.
    //      Câu đó đã dài; chèn thêm 32 ký tự vào giữa làm nó phải đọc hai lần mới hiểu. Người
    //      đọc câu này đang ở trang có logo + footer đủ hai cấp ngay bên dưới.
    //
    //   ✅ footer — CÓ cả hai cấp, XẾP HAI DÒNG đúng như bộ nhận diện chính thức: cấp trên ở
    //      TRÊN và nhỏ hơn, cấp dưới ở DƯỚI và đậm hơn. Footer là chỗ khai danh tính đầy đủ.
    //
    // Dự phòng cứng vì cùng lý do với schoolName (R2): thiếu env thì alt rỗng = lỗi trợ năng.
    parentOrgName: process.env.REACT_APP_PARENT_ORG_NAME?.toString() || "TRƯỜNG ĐẠI HỌC KHOA HỌC TỰ NHIÊN",
    schoolCode: process.env.REACT_APP_SCHOOL_CODE?.toString() ?? "",
    appicationName: "CỔNG VẬN ĐỘNG TÀI TRỢ",

    // ═══════════════════════════════════════════════════════════════════════════════════════
    // HAI DÒNG CHỮ CỦA HEADER = THƯƠNG HIỆU NHÀ CUNG CẤP
    // ═══════════════════════════════════════════════════════════════════════════════════════
    // 🔴 ĐỪNG NHẦM chúng với `schoolName`. Header KHÔNG còn mang tên đơn vị sử dụng nữa - danh
    // tính đơn vị nay do chính LOGO mang (logo đã chứa dòng "TOÁN · CƠ · TIN HỌC").
    // Hệ quả: `appicationName` bị đẩy khỏi header, nay hiện ở đầu PANEL TRÁI (xem AppLayout).
    vendorName: "PHẦN MỀM ESSOFT",
    vendorTagline: "PHÁT TRIỂN BỞI NAM VIỆT JSC",

    // ═══════════════════════════════════════════════════════════════════════════════════════
    // 🔴 THÔNG TIN LIÊN HỆ - CHƯA ĐƯỢC LEAD XÁC NHẬN, PHẢI KIỂM TRƯỚC KHI PHÁT HÀNH
    // ═══════════════════════════════════════════════════════════════════════════════════════
    // Ba giá trị dưới đây chép từ trang công khai của chính đơn vị (Khoa Toán - Cơ - Tin học,
    // Trường ĐH Khoa học Tự nhiên - ĐHQGHN). "mim" trong địa chỉ email là viết tắt của
    // Mathematics - Informatics - Mechanics, đúng tên Khoa; 334 Nguyễn Trãi là địa chỉ của
    // Trường. Tức đây KHÔNG phải dữ liệu bịa và cũng không phải dữ liệu của một đơn vị khác.
    //
    // ⚠️ NHƯNG nó vẫn là thông tin liên hệ THẬT sẽ hiện công khai trên trang chủ. Trước khi
    // phát hành, lead phải xác nhận: đúng đơn vị chủ quản của cổng chưa, và đây có phải kênh
    // liên hệ mà đơn vị MUỐN nhận thư từ cựu sinh viên không (email chung của Khoa có thể
    // không phải nơi xử lý việc này).
    // Gom vào MỘT chỗ đúng vì lý do đó: sửa ba dòng ở đây là xong, không phải đi tìm trong JSX.
    contactAddress: "334 Nguyễn Trãi, Thanh Xuân, Hà Nội",
    contactPhone: "(+84) 24 38 58 11 35",
    contactPhoneHref: "+842438581135",
    contactEmail: "mim@hus.edu.vn",

    // ═══════════════════════════════════════════════════════════════════════════════════════
    // 🔴 11 LIÊN KẾT FOOTER — PHẦN LỚN CHƯA CÓ URL, VÀ ĐÓ LÀ CÓ CHỦ ĐÍCH
    // ═══════════════════════════════════════════════════════════════════════════════════════
    // Cổng này KHÔNG có trang nào cho 11 mục dưới đây - chúng thuộc site chính của Khoa. Cổng
    // là dịch vụ con, footer trỏ ngược về site chính là đúng chuẩn.
    //
    // ⚠️ NHƯNG TA CHƯA BIẾT URL THẬT. Nên quy ước: `url` RỖNG thì LandingFooter render mục đó
    //    thành CHỮ THƯỜNG, không phải thẻ <a>. Hệ quả:
    //      · bố cục footer đầy đủ ngay (lead xem được ngay lần này),
    //      · KHÔNG có một liên kết chết nào - bấm vào không đi đâu cả vì nó không bấm được,
    //      · điền URL vào đây là mục đó TỰ THÀNH liên kết, không phải sửa JSX.
    //    Ship một footer đầy liên kết 404 tệ hơn hẳn một footer có vài mục chưa bấm được.
    //
    // Hai URL đã điền là trang chủ chính thức, độ chắc chắn cao. Chín mục còn lại CHỜ LEAD.
    footerLinks: [
        {
            tieuDe: "Về Khoa",
            muc: [
                { nhan: "Giới thiệu chung", url: "" },
                { nhan: "Sơ đồ tổ chức", url: "" },
                { nhan: "Cơ sở vật chất", url: "" },
                { nhan: "Đội ngũ cán bộ", url: "" },
            ],
        },
        {
            tieuDe: "Đào tạo & Nghiên cứu",
            muc: [
                { nhan: "Tuyển sinh", url: "" },
                { nhan: "Nghiên cứu", url: "" },
                { nhan: "Hợp tác quốc tế", url: "" },
                { nhan: "Thư viện", url: "" },
            ],
        },
        {
            tieuDe: "Liên kết nhanh",
            muc: [
                { nhan: "Liên hệ", url: "" },
                { nhan: "Trang chủ ĐHQGHN", url: "https://vnu.edu.vn" },
                { nhan: "Trang chủ Trường ĐHKHTN", url: "https://hus.vnu.edu.vn" },
            ],
        },
    ],

    // authName / authDescription ĐÃ XOÁ ở R2: chúng chỉ phục vụ khối `.headerLeft`
    // ("PHẦN MỀM QUẢN LÝ / NHÀ TRƯỜNG SỐ") - khối trang trí đã bỏ hẳn khỏi header.
    // Đó là nơi DUY NHẤT đọc hai trường này (đã grep).
    authCompany: "",
    appicationVersion: "1.0.0",
    appURLLogo: logoDonVi,
    APP_URL_PAGE_MAIN: process.env.REACT_APP_URL_PAGE_MAIN?.toString() ?? "",

    baseApiURL: process.env.REACT_APP_API_BASE_URL?.toString() ?? "",

    // ═══════════════════════════════════════════════════════════════════════════════════════
    // 🔴 GỐC URL CỦA ẢNH TẢI LÊN — MỘT CHỖ DUY NHẤT, ĐỪNG GHÉP ĐƯỜNG DẪN Ở NƠI KHÁC
    // ═══════════════════════════════════════════════════════════════════════════════════════
    // DB lưu TÊN FILE, không lưu URL (quyết định N1). Nhờ vậy đổi chỗ phục vụ ảnh — thư mục con
    // khác, CDN, đổi host — chỉ phải sửa ĐÚNG dòng dưới đây, không phải chạy UPDATE toàn bảng.
    //
    // ⚠️ Ảnh KHÔNG nằm dưới `/api`: `Program.cs` phục vụ chúng bằng `UseStaticFiles` ở
    // `RequestPath = "/Assets/Upload"`, tức ngang hàng với `/api` chứ không nằm trong. Vì vậy
    // phải CẮT hậu tố "/api" khỏi baseApiURL thay vì nối thêm vào.
    // Suy từ `baseApiURL` thay vì thêm một biến .env mới: lead là người giữ .env, và một biến nữa
    // là một chỗ nữa để hai giá trị trỏ về hai máy chủ khác nhau mà không ai phát hiện.
    baseAnhTinTucURL:
        (process.env.REACT_APP_API_BASE_URL?.toString() ?? "").replace(/\/api\/?$/, "") +
        "/Assets/Upload/tin-tuc/",
    OIDC_AUTHORITY: process.env.REACT_APP_OIDC_AUTHORITY?.toString() ?? "",
    OIDC_CLIENT_ID: process.env.REACT_APP_OIDC_CLIENT_ID?.toString() ?? "",
    OIDC_CLIENT_SECRET: process.env.REACT_APP_OIDC_CLIENT_SECRET?.toString() ?? "",
    OIDC_REDIRECT_URI: process.env.REACT_APP_OIDC_REDIRECT_URI?.toString() ?? "",
    OIDC_LOGOUT: process.env.REACT_APP_OIDC_LOGOUT?.toString() ?? "",
    OIDC_UNIT: process.env.REACT_APP_OIDC_UNIT?.toString() ?? "",
    OIDC_SCOPE: process.env.REACT_APP_OIDC_SCOPE?.toString() ?? "",
};
