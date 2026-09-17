using System;

namespace ApiQuanLyTaiTro.Filters
{
    /// <summary>
    /// Van ghi log nhung AN payload (request body) de tranh luu thong tin nhay cam
    /// nhu access_token, refresh_token, password...
    /// Dat len Action hoac Controller.
    /// </summary>
    [AttributeUsage(AttributeTargets.Method | AttributeTargets.Class, AllowMultiple = false)]
    public class SensitivePayload : Attribute
    {
    }
}
