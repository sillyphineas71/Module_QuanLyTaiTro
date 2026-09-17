using ApiQuanLyTaiTro.Common;
using ApiQuanLyTaiTro.Services.Base;
using Models;

namespace ApiQuanLyTaiTro.Services.TaiTro
{
    /// <summary>
    /// Cài đặt <see cref="ITaiTroService"/>. Cùng khuôn <c>TinTucService</c> repo cũ: dựng <see cref="Response"/>,
    /// lỗi kỹ thuật gói bằng <c>ErrorSysResponse</c>, controller chỉ đổi response thành HTTP.
    /// </summary>
    public class TaiTroService : BaseService, ITaiTroService
    {
        public TaiTroService(IServiceProvider serviceProvider) : base(serviceProvider)
        { }

        public async Task<Response> GetDanhSachChuongTrinh()
        {
            var response = new Response();
            try
            {
                // Danh sách rỗng là kết quả HỢP LỆ (chưa công bố chương trình nào) ⇒ SUCCESS + [], không DATA_NULL.
                response.data = await _repositoryWrapper.TaiTro.GetDanhSachChuongTrinh();
                return response;
            }
            catch (Exception ex)
            {
                ex.ErrorSysResponse(response);
                return response;
            }
        }

        public async Task<Response> GetChiTietChuongTrinh(int id)
        {
            var response = new Response();
            try
            {
                // id ≤ 0 không bao giờ là một chương trình — trả ĐÚNG câu "không tìm thấy" như mọi ca khác,
                // không lỗi "dữ liệu đầu vào" riêng (thêm một nhánh khác nhau là thêm một thứ để dò).
                if (id <= 0) return KhongTimThay(response);

                var chuongTrinh = await _repositoryWrapper.TaiTro.GetChiTietChuongTrinh(id);

                // 🔴 null = KHÔNG TỒN TẠI hoặc ĐÃ XOÁ MỀM hoặc CÒN NHÁP — SP 02 chỉ đọc view công khai nên cả
                // ba ra 0 dòng, giống hệt nhau. Giữ chúng giống hệt nhau tới tận HTTP: cùng mã, cùng câu, cùng
                // hình dạng. Nói "có nhưng chưa công bố" là tiết lộ chương trình nháp tồn tại — id tăng dần,
                // đoán được.
                if (chuongTrinh == null) return KhongTimThay(response);

                // SP 03 và SP 04 độc lập nhau, mỗi lời gọi mở kết nối riêng (DbConnectionQuerry) ⇒ chạy song song.
                // Hai SP cũng tự lọc qua view công khai: chương trình vừa bị gỡ công khai GIỮA hai lượt đọc thì
                // hai danh sách ra rỗng, không lộ gì.
                var nhaTaiTroTask = _repositoryWrapper.TaiTro.GetNhaTaiTroTheoChuongTrinh(id);
                var khoanChiTask = _repositoryWrapper.TaiTro.GetKhoanChiTheoChuongTrinh(id);
                await Task.WhenAll(nhaTaiTroTask, khoanChiTask);

                chuongTrinh.nha_tai_tro = (await nhaTaiTroTask).ToList();
                chuongTrinh.khoan_chi = (await khoanChiTask).ToList();

                response.data = chuongTrinh;
                return response;
            }
            catch (Exception ex)
            {
                ex.ErrorSysResponse(response);
                return response;
            }
        }

        public async Task<Response> GetNhaTaiTroTheoChuongTrinh(int id)
        {
            var response = new Response();
            try
            {
                // 🔴 Kiểm chương trình TỒN TẠI + CÔNG KHAI trước. SP 03 một mình trả [] cho cả "không tồn tại",
                // "nháp" lẫn "công khai nhưng chưa ai tài trợ" — gộp ba ca thành 200 [] thì không lộ nháp, nhưng
                // lệch với endpoint chi tiết (404) và FE không phân biệt được "sai id" với "chưa có ai".
                // Cái giá: thêm một lượt gọi SP 02.
                if (id <= 0 || !await ChuongTrinhCongKhaiTonTai(id)) return KhongTimThay(response);

                response.data = await _repositoryWrapper.TaiTro.GetNhaTaiTroTheoChuongTrinh(id);
                return response;
            }
            catch (Exception ex)
            {
                ex.ErrorSysResponse(response);
                return response;
            }
        }

        public async Task<Response> GetKhoanChiTheoChuongTrinh(int id)
        {
            var response = new Response();
            try
            {
                // Cùng lý do kiểm tồn tại trước như GetNhaTaiTroTheoChuongTrinh.
                if (id <= 0 || !await ChuongTrinhCongKhaiTonTai(id)) return KhongTimThay(response);

                response.data = await _repositoryWrapper.TaiTro.GetKhoanChiTheoChuongTrinh(id);
                return response;
            }
            catch (Exception ex)
            {
                ex.ErrorSysResponse(response);
                return response;
            }
        }

        // ───────────────────────────────────────────────────────────────────────────────────

        /// <summary>
        /// Qua SP 02 — CÙNG cửa với trang chi tiết, để "tồn tại" ở bốn endpoint có đúng một định nghĩa
        /// (view <c>TT_v_ChuongTrinhCongKhai</c>).
        /// </summary>
        private async Task<bool> ChuongTrinhCongKhaiTonTai(int id)
            => await _repositoryWrapper.TaiTro.GetChiTietChuongTrinh(id) != null;

        /// <summary>
        /// 🔴 MỘT chỗ dựng response "không tìm thấy" cho MỌI ca: id ≤ 0 · không tồn tại · xoá mềm · nháp.
        /// Đừng tách câu thông báo theo ca — khác một chữ là người ngoài phân biệt được.
        /// </summary>
        private static Response KhongTimThay(Response response)
        {
            response.is_success = false;
            response.code = ResponseCode.DATA_NULL;
            response.message = "Không tìm thấy chương trình tài trợ.";
            response.data = null;
            return response;
        }
    }
}
