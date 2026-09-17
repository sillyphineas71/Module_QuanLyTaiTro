using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Models
{
	public static class ResponseCode
	{
		public const string SUCCESS = "0000";//Thành Công

		public const string SYSTEM_ERROR = "0001";//Lỗi hệ thống
		public const string UNKNOWN_ERROR = "0999";//Lỗi không xác định
		public const string UPDATE_ERROR = "0666";//Cập nhật không thành công
		public const string DATA_NOTDELETE = "0667";//Dữ liệu không thể xóa
		public const string INPUTDATA_ERROR = "0668";//Dữ liệu đầu vào không chính xác
		public const string OLDPASSWORD_ERROR = "0669";//Mật khẩu cũ không chính xác
		public const string USER_DELETED = "0700";//Tài khoản đã bị xóa
		public const string LISTMODEL_NULL = "0701";//Danh sách rỗng
		public const string DATA_NULL = "0702";//Không có dữ liệu
		public const string DATA_DUPLICATE = "0703";//Trùng lặp dữ liệu
		public const string ENOUGH_QUANTITY = "0704";//Đủ số lượng
        public const string DATA_LOCK = "0801";//Dữ liệu bị khoá
    }
}
