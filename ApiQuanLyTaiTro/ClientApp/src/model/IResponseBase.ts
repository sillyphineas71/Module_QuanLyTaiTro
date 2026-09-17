// Khớp Models/Responses/ResponseBase.cs bên BE: {is_success, code, message, data}.
// code là STRING ("0000","0001",...) theo Models/Responses/ResponseCode.cs, không phải number.
export interface IResponseBase<T = any> {
    is_success: boolean;
    code?: string;
    message?: string;
    data?: T;
}
