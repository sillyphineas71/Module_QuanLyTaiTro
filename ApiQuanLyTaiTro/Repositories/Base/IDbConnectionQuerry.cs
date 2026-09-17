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
    }
}