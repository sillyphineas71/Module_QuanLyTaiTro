using Dapper;
using System.Data;

namespace ApiQuanLyTaiTro.Repositories.Base
{
    public interface IDbConnectionQuerry
    {
        Task<int> ExecuteAsync(string StoreProcedureName, DynamicParameters param, string ConnectionName = "DefaultConnection");
        Task<bool> ExcuteQuerryAsync(string Querry, string ConnectionName = "DefaultConnection");
        Task<int> ExcuteScalarAsync(string StoreProcedureName, DynamicParameters param, string returnValueParamName, string ConnectionName = "DefaultConnection");
        Task<T> InsertUpdate<T>(string StoreProcedureName, DynamicParameters parms, string ConnectionName = "DefaultConnection");
        Task<IEnumerable<T>> SelectAsync<T>(string StoreProcedueName, string ConnectionName = "DefaultConnection", int? commandTimeout = null);
        Task<IEnumerable<T>> SelectAsync<T>(string StoreProcedueName, DynamicParameters param, string ConnectionName = "DefaultConnection", int? commandTimeout = null);
        Task<IEnumerable<T>> QueryAsync<T>(string QueryAsync, DynamicParameters param, string ConnectionName = "DefaultConnection");
        Task<T> SelectFirstOrDefaultAsync<T>(string StoreProcedueName, string ConnectionName = "DefaultConnection");
        Task<T> SelectFirstOrDefaultAsync<T>(string StoreProcedueName, DynamicParameters param, string ConnectionName = "DefaultConnection");
        Task<T> ExecuteInTransactionAsync<T>(Func<IDbConnection, IDbTransaction, Task<T>> action, string ConnectionName = "DefaultConnection");

        /// <summary>
        /// Gọi SP trả NHIỀU result set trong MỘT round-trip; <paramref name="docKetQua"/> đọc từng set
        /// theo đúng thứ tự SP trả (<c>ReadAsync</c> lần 1 = set 1, lần 2 = set 2…).
        /// <para>
        /// ⚠️ Phải đọc XONG trong <paramref name="docKetQua"/>: kết nối đóng ngay khi hàm trả về, nên đừng
        ///    trả ra ngoài một <c>IEnumerable</c> chưa liệt kê (<c>ReadAsync</c> mặc định đã buffered — an toàn).
        /// </para>
        /// <para>Không mở transaction: chỉ dùng cho SP ĐỌC.</para>
        /// </summary>
        Task<T> SelectMultipleAsync<T>(string StoreProcedueName, DynamicParameters param, Func<SqlMapper.GridReader, Task<T>> docKetQua, string ConnectionName = "DefaultConnection");
    }
}