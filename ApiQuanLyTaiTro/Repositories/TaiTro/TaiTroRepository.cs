using ApiQuanLyTaiTro.Repositories.Base;
using Dapper;
using Models.Responses.TaiTro;

namespace ApiQuanLyTaiTro.Repositories.TaiTro
{
    /// <summary>
    /// Cài đặt <see cref="ITaiTroRepository"/>. Cùng khuôn <c>TinTucRepository</c> repo cũ: Dapper + SP qua
    /// <c>IDbConnectionQuerry</c>, KHÔNG viết SQL ở đây.
    /// </summary>
    /// <remarks>
    /// 🔴 TÊN THAM SỐ PHẢI KHỚP SP: SP 02 nhận <c>@id</c>, SP 03 và SP 04 nhận <c>@id_chuong_trinh</c>.
    /// Truyền sai tên thì SQL Server báo lỗi "expects parameter" — cái này NỔ, khác lệch tên cột.
    /// </remarks>
    public class TaiTroRepository : BaseRepository, ITaiTroRepository
    {
        public TaiTroRepository(IDbConnectionQuerry dbConnection) : base(dbConnection)
        { }

        public async Task<IEnumerable<ChuongTrinhTomTatResponse>> GetDanhSachChuongTrinh()
        {
            return await _dbConnection.SelectAsync<ChuongTrinhTomTatResponse>("TT_CongKhai_GetDanhSachChuongTrinh");
        }

        public async Task<ChuongTrinhChiTietResponse?> GetChiTietChuongTrinh(int id)
        {
            var param = new DynamicParameters();
            param.Add("@id", id);

            return await _dbConnection.SelectMultipleAsync("TT_CongKhai_GetChiTietChuongTrinh", param, async grid =>
            {
                // Set 1: 0 hoặc 1 dòng. FirstOrDefault — "không có" là kết quả hợp lệ, không phải ngoại lệ.
                var chuongTrinh = (await grid.ReadAsync<ChuongTrinhChiTietResponse>()).FirstOrDefault();

                // Set 2 vẫn phải đọc (hoặc bỏ qua) theo thứ tự; ở đây đọc luôn. Chương trình nháp thì set 2
                // cũng rỗng TỪ VIEW (chú thích SP 02) — không dựa vào nhánh null dưới đây để chặn.
                var duKienChi = (await grid.ReadAsync<DuKienChiResponse>()).ToList();

                if (chuongTrinh == null) return null;
                chuongTrinh.du_kien_chi = duKienChi;
                return chuongTrinh;
            });
        }

        public async Task<IEnumerable<NhaTaiTroCongKhaiResponse>> GetNhaTaiTroTheoChuongTrinh(int idChuongTrinh)
        {
            var param = new DynamicParameters();
            param.Add("@id_chuong_trinh", idChuongTrinh);

            return await _dbConnection.SelectAsync<NhaTaiTroCongKhaiResponse>("TT_CongKhai_GetNhaTaiTroTheoChuongTrinh", param);
        }

        public async Task<IEnumerable<KhoanChiResponse>> GetKhoanChiTheoChuongTrinh(int idChuongTrinh)
        {
            var param = new DynamicParameters();
            param.Add("@id_chuong_trinh", idChuongTrinh);

            return await _dbConnection.SelectMultipleAsync("TT_CongKhai_GetKhoanChiTheoChuongTrinh", param, async grid =>
            {
                var khoanChi = (await grid.ReadAsync<KhoanChiResponse>()).ToList();
                var minhChung = (await grid.ReadAsync<MinhChungChiResponse>()).ToList();

                // Gắn ảnh vào đúng khoản chi theo id_khoan_chi. SP đã sắp ảnh theo (id_khoan_chi, thu_tu, id);
                // GroupBy/ToLookup giữ thứ tự đó trong mỗi nhóm. Ảnh không tìm thấy cha thì bị bỏ — SP 04 lọc
                // cả hai set qua cùng chuỗi view nên không xảy ra, nhưng có xảy ra thì ảnh mồ côi cũng không
                // được hiện.
                var theoKhoanChi = minhChung.ToLookup(mc => mc.id_khoan_chi);
                foreach (var kc in khoanChi)
                    kc.minh_chung = theoKhoanChi[kc.id].ToList();

                return (IEnumerable<KhoanChiResponse>)khoanChi;
            });
        }
    }
}
