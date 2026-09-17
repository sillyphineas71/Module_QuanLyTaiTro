import { eVaiTro } from "./eVaiTro";

// Thông tin user lưu lại sau khi login/force-change-password thành công.
// Khớp data trả về từ POST /api/auth/login và /api/auth/force-change-password (AuthService.cs).
export interface IAppUser {
    id: number;
    email: string;
    vai_tro: eVaiTro;
}
