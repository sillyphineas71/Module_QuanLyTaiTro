namespace Models
{
    /// <summary>
    /// Kiểu TRẢ VỀ CHO CLIENT ở tầng API (gói ngoài cùng của response JSON).
    /// Kế thừa ResponseBase: gồm is_success, code, message, data.
    /// Controller/Extensions (CheckInsert/Update/Delete) dùng kiểu này.
    /// (Khác với Models.Base.FunctionResult — kết quả nội bộ của tầng Service.)
    /// </summary>
    public class Response : ResponseBase<object>
    {
        public Response() { }

        public Response(object dataResult) : base(dataResult) { }
    }
}
