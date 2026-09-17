using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Models.Base
{
    public class ErrorResult<T> : FunctionResult<T>
    {
        public ErrorResult(string message = "", T data = default(T)) : base(false, message, data)
        {
        }
    }
}
