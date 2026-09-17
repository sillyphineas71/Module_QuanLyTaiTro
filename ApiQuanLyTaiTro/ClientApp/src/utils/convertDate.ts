export const formatDate = (
  dateString?: string,
  format: string = "dd/mm/yyyy"
): string => {
  if (!dateString) return "";
  const date = new Date(dateString);
  // Chuỗi không parse được (vd "", "abc", ngày sai định dạng) cho ra Invalid Date, mà
  // getDate()/getMonth() của nó trả NaN -> trước đây hàm này in ra "NaN/NaN/NaN" ngay trên
  // giao diện. Trả chuỗi rỗng để ô hiển thị TRỐNG, giống nhánh !dateString ở trên.
  if (Number.isNaN(date.getTime())) return "";
  const day: string = String(date.getDate()).padStart(2, "0"); // Ensure two digits
  const month: string = String(date.getMonth() + 1).padStart(2, "0"); // Ensure two digits
  const year: string = String(date.getFullYear());
  return format.replace("dd", day).replace("mm", month).replace("yyyy", year);
};
