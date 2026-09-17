import React, { createContext, useCallback, useContext, useState } from "react";
import { IAppUser } from "../model/IAppUser";
import { authStorage } from "../model/authStorage";

// Auth session riêng cho cổng - tách biệt hoàn toàn khỏi Redux state.auth (gắn với
// SSO/VNPT của hệ học vụ, không tương thích với luồng JWT email/password của cổng này).
interface IAppAuthContext {
    token: string | null;
    user: IAppUser | null;
    isAuthenticated: boolean;
    login: (token: string, user: IAppUser) => void;
    logout: () => void;
}

const AppAuthContext = createContext<IAppAuthContext | undefined>(undefined);

export const AppAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [token, setToken] = useState<string | null>(() => authStorage.getToken());
    const [user, setUser] = useState<IAppUser | null>(() => authStorage.getUser());

    const login = useCallback((newToken: string, newUser: IAppUser) => {
        authStorage.save(newToken, newUser);
        setToken(newToken);
        setUser(newUser);
    }, []);

    const logout = useCallback(() => {
        authStorage.clear();
        setToken(null);
        setUser(null);
    }, []);

    const value: IAppAuthContext = {
        token,
        user,
        isAuthenticated: !!(token && user),
        login,
        logout,
    };

    return <AppAuthContext.Provider value={value}>{children}</AppAuthContext.Provider>;
};

export const useAppAuth = (): IAppAuthContext => {
    const ctx = useContext(AppAuthContext);
    if (!ctx) {
        throw new Error("useAppAuth phải được dùng bên trong AppAuthProvider");
    }
    return ctx;
};
