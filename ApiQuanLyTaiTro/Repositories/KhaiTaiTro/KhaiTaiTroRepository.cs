using ApiQuanLyTaiTro.Repositories.Base;
using Dapper;
using System.Data;

namespace ApiQuanLyTaiTro.Repositories.KhaiTaiTro
{
    /// <summary>
    /// Cài đặt <see cref="IKhaiTaiTroRepository"/>. Dapper + SP, KHÔNG SQL inline.
    /// </summary>
    public class KhaiTaiTroRepository : BaseRepository, IKhaiTaiTroRepository
    {
        public KhaiTaiTroRepository(IDbConnectionQuerry dbConnection) : base(dbConnection)
        { }

        public async Task<int> TaoLoiKhai(LoiKhaiDaKiem k, IReadOnlyList<string> tenFileAnh)
        {
            // 🔴 MỘT transaction cho lời khai + mọi ảnh: lời khai có mà thiếu ảnh là một dòng trong hàng đợi duyệt
            //    không có gì để đối chiếu — quản trị không duyệt được, cũng không biết vì sao.
            return await _dbConnection.ExecuteInTransactionAsync(async (cn, tx) =>
            {
                var p = new DynamicParameters();
                p.Add("@id_chuong_trinh", k.IdChuongTrinh, DbType.Int32);
                p.Add("@loai", k.Loai, DbType.Byte);
                p.Add("@ho_ten_don_vi", k.HoTenDonVi, DbType.String);
                p.Add("@ngay_sinh", k.NgaySinh, DbType.Date);
                p.Add("@ten_he", k.TenHe, DbType.String);
                p.Add("@ten_khoa", k.TenKhoa, DbType.String);
                p.Add("@nien_khoa", k.NienKhoa, DbType.String);
                p.Add("@ten_lop", k.TenLop, DbType.String);
                p.Add("@email_lien_he", k.EmailLienHe, DbType.String);
                p.Add("@sdt_lien_he", k.SdtLienHe, DbType.String);
                p.Add("@muc_an_danh", k.MucAnDanh, DbType.Byte);
                p.Add("@id_tai_khoan_csv", k.IdTaiKhoanCsv, DbType.Int32);
                // ⚠️ KHÔNG có @trang_thai_duyet, @so_tien — SP tự ép (xem SP).
                p.Add("@id", dbType: DbType.Int32, direction: ParameterDirection.ReturnValue);

                await cn.ExecuteAsync("TT_NhaTaiTro_Tao", p, tx, commandType: CommandType.StoredProcedure);
                int idLoiKhai = p.Get<int>("@id");
                if (idLoiKhai <= 0) return 0;   // chương trình không nhận khai — SP chưa ghi gì

                for (int i = 0; i < tenFileAnh.Count; i++)
                {
                    var pa = new DynamicParameters();
                    pa.Add("@id_nha_tai_tro", idLoiKhai, DbType.Int32);
                    pa.Add("@ten_file", tenFileAnh[i], DbType.String);
                    pa.Add("@thu_tu", i + 1, DbType.Int32);
                    pa.Add("@id", dbType: DbType.Int32, direction: ParameterDirection.ReturnValue);

                    await cn.ExecuteAsync("TT_AnhChuyenKhoan_Tao", pa, tx, commandType: CommandType.StoredProcedure);
                    // 0 ở đây chỉ xảy ra nếu lời khai vừa tạo không còn "chờ duyệt" GIỮA hai lệnh trong cùng
                    // transaction — không thể về lý thuyết. Có xảy ra thì là lỗi, ném để ROLLBACK cả lời khai.
                    if (pa.Get<int>("@id") <= 0)
                        throw new InvalidOperationException($"TT_AnhChuyenKhoan_Tao trả 0 cho lời khai {idLoiKhai} (ảnh thứ {i + 1}).");
                }

                return idLoiKhai;
            });
        }
    }
}
