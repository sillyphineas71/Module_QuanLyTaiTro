import axios, { AxiosRequestConfig } from "axios";
import { appConst } from "../AppConst";
import { authStorage } from "../model/authStorage";
import { IResponseBase } from "../model/IResponseBase";

// axios instance riêng cho cổng - KHÔNG dùng chung api/apiClient.ts (đọc token ở key
// "access_token" + có logic refresh-token gọi endpoint SSO không tồn tại ở BE này).
const axiosInstance = axios.create({
    baseURL: appConst.baseApiURL,
    headers: { "Content-Type": "application/json" },
    // status < 500 coi là "thành công" ở tầng axios để lấy được body ResponseBase khi BE trả 400
    // (lỗi nghiệp vụ, CLAUDE.md mục 3: SERVICE set is_success=false + code, CONTROLLER trả 400).
    validateStatus: (status) => status < 500,
    // QUAN TRỌNG: mặc định axios serialize mảng trong params thành "key[]=1&key[]=2" (dấu ngoặc
    // vuông) - ASP.NET Core [FromQuery] KHÔNG hiểu định dạng này, bind ra mảng RỖNG một cách âm
    // thầm (không lỗi, không throw) dù FE gửi đúng giá trị. { indexes: null } ép serialize thành
    // "key=1&key=2" (lặp key thường) - đúng định dạng ASP.NET Core model binding cho int[]/string[]
    // hiểu được. Set Ở ĐÂY (toàn cục) để mọi endpoint dùng mảng trong params sau này không dính lại
    // đúng bug này (đã gặp thật ở GET /thong-ke/cuu-sv - filter luôn ra rỗng dù đã chọn).
    paramsSerializer: { indexes: null },
});

axiosInstance.interceptors.request.use((config) => {
    const token = authStorage.getToken();
    if (token) {
        config.headers = config.headers ?? {};
        (config.headers as any).Authorization = `Bearer ${token}`;
    }
    return config;
});

axiosInstance.interceptors.response.use((response) => {
    if (response.status === 401) {
        const wasLoggedIn = !!authStorage.getToken();
        authStorage.clear();
        if (wasLoggedIn && window.location.pathname !== "/login") {
            window.location.href = "/login";
        }
    }
    return response;
});

const FALLBACK_ERROR_MESSAGE = "Không thể kết nối tới máy chủ. Vui lòng thử lại sau.";
const SESSION_EXPIRED_MESSAGE = "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.";

async function request<T = any>(config: AxiosRequestConfig): Promise<IResponseBase<T>> {
    try {
        const response = await axiosInstance.request<IResponseBase<T>>(config);
        if (response.status === 401) {
            return { is_success: false, message: SESSION_EXPIRED_MESSAGE };
        }
        if (response.data && typeof response.data === "object" && "is_success" in response.data) {
            return response.data;
        }
        return { is_success: true, data: response.data as any };
    } catch {
        return { is_success: false, message: FALLBACK_ERROR_MESSAGE };
    }
}

export const httpClient = {
    get: <T = any>(url: string, config?: AxiosRequestConfig) =>
        request<T>({ ...config, method: "GET", url }),
    post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) =>
        request<T>({ ...config, method: "POST", url, data }),
    put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) =>
        request<T>({ ...config, method: "PUT", url, data }),
    delete: <T = any>(url: string, config?: AxiosRequestConfig) =>
        request<T>({ ...config, method: "DELETE", url }),
    // Dùng cho endpoint trả file nhị phân thô khi thành công (vd GET /excel/export-template) -
    // trả nguyên AxiosResponse để caller tự phân biệt blob file vs JSON lỗi (content-type).
    raw: axiosInstance,
};

export default httpClient;
