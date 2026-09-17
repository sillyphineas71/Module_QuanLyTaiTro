namespace Models.Enum
{
    public enum eMimeType
    {
        DOCX,
        PDF,
        XLSX
    }

    public static class MimeTypeExtensions
    {
        public static string GetMimeType(this eMimeType mimeType)
        {
            return mimeType switch
            {
                eMimeType.DOCX => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                eMimeType.PDF => "application/pdf",
                eMimeType.XLSX => "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                _ => "application/octet-stream"
            };
        }

    public static string GetMimeType(this string type)
        {
            return type switch
            {
                "docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "pdf" => "application/pdf",
                "excel" => "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                _ => "application/octet-stream"
            };
        }

       }
   }