using ApiQuanLyTaiTro.Common;
using Dapper;
using System.Data;
using System.Data.SqlClient;

namespace ApiQuanLyTaiTro.Repositories.Base
{
    public class DbConnectionQuerry : IDbConnectionQuerry
    {
        // ĐỔI 1: lấy connection string theo kiểu scaffold (không có AppSettings.DbConnections)
        private static IDbConnection GetConnection(string ConnectionName)
        {
            var ConnectionString = AppSettings.Configuration?.GetConnectionString(ConnectionName);
            return new SqlConnection(ConnectionString);
        }

        private static async Task ExecuteTransactionAsync(IDbConnection connection, Func<IDbTransaction, Task> action)
        {
            using (var transaction = connection.BeginTransaction())
            {
                try { await action(transaction); transaction.Commit(); }
                catch { transaction.Rollback(); throw; }
            }
        }

        public async Task<bool> ExcuteQuerryAsync(string Querry, string ConnectionName = "DefaultConnection")
        {
            using (var connection = GetConnection(ConnectionName))
            {
                connection.Open();
                await ExecuteTransactionAsync(connection, async transaction =>
                {
                    await connection.ExecuteAsync(Querry, null, transaction, commandType: CommandType.Text);
                });
                return true;
            }
        }

        public async Task<int> ExcuteScalarAsync(string StoreProcedureName, DynamicParameters param, string returnValueParamName = "ID", string ConnectionName = "DefaultConnection")
        {
            using (var connection = GetConnection(ConnectionName))
            {
                connection.Open();
                await ExecuteTransactionAsync(connection, async transaction =>
                {
                    await connection.ExecuteScalarAsync(StoreProcedureName, param, transaction, commandType: CommandType.StoredProcedure);
                });
                return param.Get<int>(returnValueParamName);
            }
        }

        public async Task<T> InsertUpdate<T>(string StoreProcedureName, DynamicParameters parms, string ConnectionName = "DefaultConnection")
        {
            // ĐỔI 2: bỏ ex.SaveLog() — chỉ throw
            using (var connection = GetConnection(ConnectionName))
            {
                T result = default;
                connection.Open();
                await ExecuteTransactionAsync(connection, async transaction =>
                {
                    var rs = await connection.QueryAsync<T>(StoreProcedureName, parms, transaction: transaction, commandType: CommandType.StoredProcedure);
                    result = rs.FirstOrDefault();
                });
                return result;
            }
        }

        public async Task<int> ExecuteAsync(string StoreProcedureName, DynamicParameters param, string ConnectionName = "DefaultConnection")
        {
            using (var connection = GetConnection(ConnectionName))
            {
                connection.Open();
                int result = 0;
                await ExecuteTransactionAsync(connection, async transaction =>
                {
                    result = await connection.ExecuteAsync(StoreProcedureName, param, transaction, commandType: CommandType.StoredProcedure);
                });
                return result;
            }
        }

        // commandTimeout (giây): null = giữ mặc định Dapper/SqlCommand = 30s (hành vi cũ, KHÔNG đổi
        // cho mọi lời gọi hiện có). Chỉ ThongKeRepository truyền 120 cho query thống kê nặng.
        public async Task<IEnumerable<T>> SelectAsync<T>(string StoreProcedueName, string ConnectionName = "DefaultConnection", int? commandTimeout = null)
        {
            using (var connection = GetConnection(ConnectionName))
            {
                connection.Open();
                return await SqlMapper.QueryAsync<T>(connection, StoreProcedueName, null, commandTimeout: commandTimeout, commandType: CommandType.StoredProcedure);
            }
        }

        public async Task<IEnumerable<T>> SelectAsync<T>(string StoreProcedueName, DynamicParameters param, string ConnectionName = "DefaultConnection", int? commandTimeout = null)
        {
            using (var connection = GetConnection(ConnectionName))
            {
                connection.Open();
                return await SqlMapper.QueryAsync<T>(connection, StoreProcedueName, param, commandTimeout: commandTimeout, commandType: CommandType.StoredProcedure);
            }
        }

        public async Task<IEnumerable<T>> QueryAsync<T>(string query, DynamicParameters param = null, string ConnectionName = "DefaultConnection")
        {
            using (var connection = GetConnection(ConnectionName))
            {
                connection.Open();
                return await SqlMapper.QueryAsync<T>(connection, query, param, commandType: CommandType.Text);
            }
        }

        public async Task<T> SelectFirstOrDefaultAsync<T>(string StoreProcedueName, string ConnectionName = "DefaultConnection")
        {
            using (var connection = GetConnection(ConnectionName))
            {
                connection.Open();
                return await SqlMapper.QueryFirstOrDefaultAsync<T>(connection, StoreProcedueName, null, commandType: CommandType.StoredProcedure);
            }
        }

        public async Task<T> SelectFirstOrDefaultAsync<T>(string StoreProcedueName, DynamicParameters param, string ConnectionName = "DefaultConnection")
        {
            using (var connection = GetConnection(ConnectionName))
            {
                connection.Open();
                return await SqlMapper.QueryFirstOrDefaultAsync<T>(connection, StoreProcedueName, param, commandType: CommandType.StoredProcedure);
            }
        }

        // Thêm ở P2a (SP 02, SP 04 của cổng Tài trợ trả hai result set). Repo cũ chưa từng cần.
        public async Task<T> SelectMultipleAsync<T>(string StoreProcedueName, DynamicParameters param, Func<SqlMapper.GridReader, Task<T>> docKetQua, string ConnectionName = "DefaultConnection")
        {
            using (var connection = GetConnection(ConnectionName))
            {
                connection.Open();
                using (var grid = await SqlMapper.QueryMultipleAsync(connection, StoreProcedueName, param, commandType: CommandType.StoredProcedure))
                {
                    return await docKetQua(grid);
                }
            }
        }

        public async Task<T> ExecuteInTransactionAsync<T>(Func<IDbConnection, IDbTransaction, Task<T>> action, string ConnectionName = "DefaultConnection")
        {
            // ĐỔI 2: bỏ ex.SaveLog() — chỉ throw
            using (var connection = GetConnection(ConnectionName))
            {
                connection.Open();
                using (var transaction = connection.BeginTransaction())
                {
                    try
                    {
                        var result = await action(connection, transaction);
                        transaction.Commit();
                        return result;
                    }
                    catch { transaction.Rollback(); throw; }
                }
            }
        }
    }
}