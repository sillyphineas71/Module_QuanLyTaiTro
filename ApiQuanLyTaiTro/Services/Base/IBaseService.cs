using Models.Base;

namespace ApiQuanLyTaiTro.Services.Base
{
    public interface IBaseService
    {
        void SetModifyUser(ModifyInfo info);
        string GetUserName();
        string GetUserID();
        string GetIP();
    }
}