import hotToast from 'react-hot-toast';


export const NotifyHelper = {
    //https://react-hot-toast.com/docs/toast
    // "id" optional - truyền id CỐ ĐỊNH để các lần gọi lặp lại (vd validate lỗi khi user bấm nút
    // nhiều lần liên tiếp) CẬP NHẬT lại đúng 1 toast thay vì chồng nhiều toast giống hệt nhau lên
    // màn hình. Không truyền id thì giữ hành vi cũ (mỗi lần gọi luôn là 1 toast mới).
    Success: (message: string, id?: string) => hotToast.success(message, { id }),
    Error: (message?: string, id?: string) => hotToast.error(message ?? "Error", { id }),
    // Cảnh báo KHÁC lỗi: dùng hotToast() trần (loại "blank") + icon ⚠️, KHÔNG dùng
    // hotToast.error nữa - trước đây cảnh báo hiện icon lỗi và nền đỏ #A30F26 nên người dùng
    // không phân biệt được "chú ý" với "thất bại".
    // Nền/màu chữ khai tập trung ở toastOptions.blank trong App.tsx, đúng chỗ success/error
    // đang khai - KHÔNG dựng cơ chế style thứ hai ở đây.
    // Chữ ký (message, id?) giữ NGUYÊN nên 127 chỗ gọi hiện có không phải sửa gì.
    Warning: (message: string, id?: string) => hotToast(message, { id, icon: '⚠️' })
}