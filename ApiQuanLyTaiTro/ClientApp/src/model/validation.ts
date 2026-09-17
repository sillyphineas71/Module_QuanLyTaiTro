// Hằng số validate dùng chung cho các form của cổng.
//
// NGUYÊN TẮC: chỉ đưa vào đây những rule CÓ NGUỒN, không tự nghĩ ra business rule mới.
//   - Giới hạn độ dài: lấy từ khai báo tham số của Stored Procedure (StoredProcedures/*.sql) -
//     đây là ràng buộc THẬT, vượt quá là SQL Server cắt cụt/báo lỗi. Backend (Models/Request/*,
//     Services/*) hiện KHÔNG có attribute validate nào ([Required]/[StringLength]/[EmailAddress]
//     đều không tồn tại - đã grep toàn bộ), nên độ dài SP là nguồn ràng buộc duy nhất.
//   - Định dạng email: backend cũng KHÔNG kiểm định dạng (ExcelService chỉ kiểm rỗng + trùng).
//     Dùng lại ĐÚNG biểu thức đã có sẵn trong ClientApp ở màn đăng nhập thay vì bịa regex mới,
//     để "email hợp lệ" là một khái niệm duy nhất trong toàn cổng. Cố tình lỏng: chỉ chặn các
//     chuỗi rõ ràng không phải email, không loại nhầm email hợp lệ.
//   - SỐ ĐIỆN THOẠI: KHÔNG có quy tắc định dạng nào ở DTO/Service/SP -> KHÔNG khai regex ở đây.
//     Chỉ giới hạn độ dài theo SP. Xem PHONE_MAX_LENGTH.

/** Biểu thức email dùng chung (chuyển từ LoginPage.tsx - giữ nguyên, không siết chặt thêm). */
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const EMAIL_INVALID_MESSAGE = "Email không đúng định dạng.";

// ===== Độ dài tối đa - đọc từ tham số Stored Procedure =====
// CSV_ThongTin_UpdateMe: @sdt_hien_tai NVARCHAR(20), @email_hien_tai NVARCHAR(200),
//                        @dia_chi_hien_tai NVARCHAR(500), @ghi_chu NVARCHAR(1000)
/** Không có quy tắc ĐỊNH DẠNG nào cho số điện thoại ở BE - chỉ giới hạn độ dài này. */
export const PHONE_MAX_LENGTH = 20;
export const CONTACT_EMAIL_MAX_LENGTH = 200;
export const ADDRESS_MAX_LENGTH = 500;
export const NOTE_MAX_LENGTH = 1000;

// CSV_DotThuThap_Insert: @ten_dot NVARCHAR(255), @ghi_chu NVARCHAR(500)
export const TEN_DOT_MAX_LENGTH = 255;
export const DOT_GHI_CHU_MAX_LENGTH = 500;

// CSV_DanhMuc*_Insert/Update: @ten_linh_vuc / @ten_cong_viec / @ten_chuc_vu NVARCHAR(255)
export const TEN_DANH_MUC_MAX_LENGTH = 255;

// CSV_QuaTrinhCongTac_Insert/Update: @ten_doanh_nghiep NVARCHAR(255), @ghi_chu NVARCHAR(500)
export const TEN_DOANH_NGHIEP_MAX_LENGTH = 255;
export const QUA_TRINH_GHI_CHU_MAX_LENGTH = 500;

/** Thông báo chung khi vượt giới hạn độ dài của cột trong DB. */
export const maxLengthMessage = (max: number) => `Không được vượt quá ${max} ký tự.`;
