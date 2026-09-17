using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Models.Base
{
    /// <summary>
    /// Kiểu KẾT QUẢ CỦA TẦNG SERVICE (nội bộ). Service trả về FunctionResult&lt;T&gt; để báo
    /// thành công/thất bại kèm message + data, thay vì ném exception cho lỗi nghiệp vụ.
    /// Dùng kèm SuccessResult&lt;T&gt; / ErrorResult&lt;T&gt; cho gọn.
    /// (Khác với Models.Response — kiểu trả về cho CLIENT ở tầng API/Controller.)
    /// </summary>
    public class FunctionResult<T>
    {
        public bool is_success { get; set; }
        public string message { get; set; }
        public T data { get; set; }
        public FunctionResult()
        {

        }
        public FunctionResult(bool is_success, string message, T data = default(T))
        {
            this.is_success = is_success;
            this.data = data;
            this.message = message;
        }
    }
}
