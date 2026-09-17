namespace Models.Base
{
    public class PagingResult<T> : PagingResultSummary
    {
        public PagingResult()
        {

        }
        public PagingResult(PagingResultSummary pagingResultSummary, T data) : base(pagingResultSummary)
        {
            this.data = data;
        }
        public T data { get; set; }
    }
    public class PagingResultSummary
    {
        public long total_count { get; set; }
        public long page_count { get; set; }
        public long page_number { get; set; }
        public long page_size { get; set; }
        public PagingResultSummary()
        {

        }
        public PagingResultSummary(PagingResultSummary pagingResultSummary)
        {
            this.total_count = pagingResultSummary.total_count;
            this.page_count = pagingResultSummary.page_count;
            this.page_number = pagingResultSummary.page_number;
            this.page_size = pagingResultSummary.page_size;
        }
    }

}