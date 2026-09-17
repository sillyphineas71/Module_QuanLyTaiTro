using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Models
{
	public static class ResponseDetail
	{
		public const string SUCCESSDETAIL = "Thành Công";
		public const string SYSTEM_ERRORDETAIL = "Lỗi hệ thống";
		public const string UNKNOWN_ERRORDETAIL = "Lỗi không xác định";
		public const string UPDATE_ERRORDETAIL = "Cập nhật không thành công";
		public const string DATA_NOTDELETEDETAIL = "Dữ liệu không thể xóa";
		public const string INPUTDATA_ERRORDETAIL = "Dữ liệu đầu vào không chính xác";
		public const string OLDPASSWORD_ERRORDETAIL = "Mật khẩu cũ không chính xác";
		public const string USER_DELETEDDETAIL = "Tài khoản đã bị xóa";
		public const string LISTMODEL_NULLDETAIL = "Danh sách rỗng";
		public const string DATA_NULLDETAIL = "Không có dữ liệu";
		public const string DATA_DUPLICATEDETAIL = "Trùng lặp dữ liệu";
		public const string ENOUGH_QUANTITYDETAIL = "Đủ số lượng";
	}
}
