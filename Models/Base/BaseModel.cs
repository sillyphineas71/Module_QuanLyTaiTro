namespace Models.Base
{
    /// <summary>
    /// Base model chứa các trường Audit dùng chung cho toàn bộ Entity.
    /// Kế thừa class này vào tất cả các Table entity để có đầy đủ thông tin audit.
    /// </summary>
    public class BaseModel
    {
        /// <summary>Đánh dấu bản ghi đã bị xóa mềm (soft delete).</summary>
        public bool is_deleted { get; set; }

        /// <summary>Thời điểm tạo bản ghi.</summary>
        public DateTime created_time { get; set; }

        /// <summary>ID người tạo bản ghi.</summary>
        public string? created_user_id { get; set; }

        /// <summary>Thời điểm cập nhật lần cuối.</summary>
        public DateTime last_modified_times { get; set; }

        /// <summary>ID người cập nhật lần cuối.</summary>
        public string? last_modified_user_id { get; set; }

        /// <summary>
        /// Gọi khi INSERT record mới vào DB.
        /// </summary>
        /// <param name="userId">ID người thực hiện thao tác.</param>
        public void SetInsertInfo(string userId)
        {
            is_deleted = false;
            created_user_id = last_modified_user_id = userId;
            created_time = last_modified_times = DateTime.Now;
        }

        /// <summary>
        /// Gọi khi UPDATE record đã có trong DB.
        /// </summary>
        /// <param name="userId">ID người thực hiện thao tác.</param>
        public void SetUpdateInfo(string userId)
        {
            last_modified_user_id = userId;
            last_modified_times = DateTime.Now;
        }
    }
}
