namespace ApiQuanLyTaiTro.Repositories.Base
{
    public class BaseRepository : IBaseRepository
    {
        protected IDbConnectionQuerry _dbConnection;
        public BaseRepository(IDbConnectionQuerry dbConnection)
        {
            this._dbConnection = dbConnection;
        }
    }
}