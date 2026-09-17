import { IAppUser } from "./IAppUser";

// Key localStorage dùng chung giữa AppAuthContext và httpClient.
// Giữ nguyên "token"/"user_info" - đúng key mà LoginPage/Header/UserPanel hiện tại đang dùng,
// chỉ đổi shape của user_info (bỏ so_cccd, dùng {id, email, vai_tro}).
const TOKEN_KEY = "token";
const USER_KEY = "user_info";

export const authStorage = {
    getToken: (): string | null => localStorage.getItem(TOKEN_KEY),
    getUser: (): IAppUser | null => {
        const raw = localStorage.getItem(USER_KEY);
        if (!raw) return null;
        try {
            return JSON.parse(raw) as IAppUser;
        } catch {
            return null;
        }
    },
    save: (token: string, user: IAppUser) => {
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(USER_KEY, JSON.stringify(user));
    },
    clear: () => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
    },
};
