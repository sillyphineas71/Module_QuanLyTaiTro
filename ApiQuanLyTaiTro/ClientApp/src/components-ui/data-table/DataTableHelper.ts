import { eSortMode, IColumn, ICondition, IExpression } from "./DataTable";

export const removeAccents = (str: string) => {
    if (!str) return str;
    return str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D");
}
/**
 * Khoá sắp xếp của MỘT dòng: `chinh` so trước, `phu` chỉ dùng khi `chinh` bằng nhau.
 * Cột thường chỉ có `chinh`; cột `ho_ten` có cả hai (tên trước, rồi họ tên đầy đủ).
 */
interface IKhoaSapXep {
    chinh: any;
    phu?: string;
}

/**
 * 🔑 NGUỒN SỰ THẬT DUY NHẤT của "khoá sắp xếp là gì".
 *
 * Trả về hàm rút khoá cho một cột. `dynamicSort` (comparator) và `sortRows` (sắp cả mảng) đều
 * đi qua hàm này, nên hai đường KHÔNG THỂ lệch thứ tự nhau - lệch được thì phải sửa ở hai chỗ
 * khác nhau, mà chỉ có một chỗ.
 *
 * Luật cột `ho_ten` (giữ NGUYÊN VĂN từ bản đầu, đừng "dọn"): sắp theo TÊN (từ cuối) trước, tên
 * trùng thì mới so họ tên đầy đủ. Cả hai đều bỏ dấu qua `removeAccents` - đó là lý do hàm này
 * tồn tại: trong tiếng Việt "Đạt" phải đứng cạnh "Dat", "Ước" cạnh "Uoc", không bị đẩy xuống
 * cuối bảng theo thứ tự mã Unicode.
 */
const layKhoaSapXep = (property: string): ((row: any) => IKhoaSapXep) => {
    if (property === "ho_ten") {
        return (row: any) => {
            const hoTen = String(row[property] || "");
            // Tách tên (phần tử cuối cùng) và họ đệm (phần còn lại)
            const phan = hoTen.trim().split(" ");
            const ten = phan.length > 0 ? phan[phan.length - 1] : "";
            return {
                chinh: removeAccents(ten.toLowerCase()),
                phu: removeAccents(hoTen.toLowerCase()),
            };
        };
    }
    return (row: any) => ({ chinh: row[property] });
};

/** So hai khoá. KHÔNG nhân chiều ở đây - chiều do người gọi nhân, để chỗ hoà (0) còn hoà. */
const soSanhKhoa = (a: IKhoaSapXep, b: IKhoaSapXep): number => {
    if (a.chinh < b.chinh) return -1;
    if (a.chinh > b.chinh) return 1;
    if (a.phu !== undefined && b.phu !== undefined) {
        if (a.phu < b.phu) return -1;
        if (a.phu > b.phu) return 1;
    }
    return 0;
};

/*
 * 🗑️ `dynamicSort(property, mode)` — ĐÃ XOÁ (2026-09-14, lead chốt). Đừng dựng lại.
 *
 * Nó trả một comparator cho `Array.prototype.sort`, và vì comparator không nhìn thấy cả mảng nên
 * khoá bị tính LẠI ở mỗi phép so sánh: `removeAccents` có `.normalize("NFD")` + 3 regex, 5000
 * dòng ≈ 61.000 phép so sánh ⇒ tới 246.000 lần normalize cho vỏn vẹn 5000 giá trị. Đo được 180ms.
 *
 * Xoá chứ không giữ làm "cửa tương thích": nó KHÔNG còn nơi nào gọi (đã grep cả tham chiếu chuỗi
 * và barrel export - không có), mà để lại một hàm sắp xếp CHẬM HƠN nằm cạnh `sortRows` là để lại
 * cái bẫy - người sau thấy hai hàm sort sẽ bốc nhầm cái chậm.
 *
 * Cần comparator thật (API bên thứ ba chỉ nhận comparator)? Dựng từ chính hai hàm dưới đây, ĐỪNG
 * viết lại luật so sánh:
 *     const layKhoa = layKhoaSapXep(field);
 *     const cmp = (a, b) => soSanhKhoa(layKhoa(a), layKhoa(b)) * (mode === eSortMode.ASC ? 1 : -1);
 * Và nhớ nó sẽ chậm đúng như mô tả trên - có mảng trong tay thì luôn dùng `sortRows`.
 */

/**
 * Sắp cả mảng, TÍNH KHOÁ TRƯỚC rồi mới sắp (decorate-sort-undecorate).
 *
 * Mỗi dòng tính khoá ĐÚNG MỘT LẦN thay vì mỗi lần được đem ra so. Đo trên 5000 dòng cột
 * "Họ tên": 180ms -> 15ms. Cột thường không đổi gì đáng kể (khoá vốn đã rẻ).
 *
 * KHÔNG mutate `data` - trả mảng MỚI. Đó là thứ giữ cho trạng thái NONE quay về đúng thứ tự gốc.
 *
 * `i` làm khoá phụ chót: hoà thì giữ nguyên thứ tự vào. KHÔNG nhân `chieu` vào `a.i - b.i` -
 * nhân vào là đảo ngược các dòng hoà nhau khi sắp giảm dần, tức khác hành vi sort ổn định của
 * bản comparator, tức lệch thứ tự đầu ra.
 */
export const sortRows = <T,>(data: T[], property: string, mode: eSortMode): T[] => {
    if (!property || mode === eSortMode.NONE) return data;
    const chieu = mode === eSortMode.ASC ? 1 : -1;
    const layKhoa = layKhoaSapXep(property);
    const trangTri = data.map((row, i) => ({ row, i, khoa: layKhoa(row) }));
    trangTri.sort((a, b) => {
        const r = soSanhKhoa(a.khoa, b.khoa);
        return r !== 0 ? r * chieu : a.i - b.i;
    });
    return trangTri.map((x) => x.row);
};
function findColumnByDataField(columns: IColumn[], field: string): IColumn | undefined {
    for (const col of columns) {
        if (col.columns?.length) {
            const nested = findColumnByDataField(col.columns, field);
            if (nested) return nested;
        }
        if (col.dataField === field) return col;
    }
    return undefined;
}

export function getFilterableValue(field: string, item: any, columns: IColumn[]): any {
    const col = findColumnByDataField(columns, field);
    if (col?.filterValue) return col.filterValue(item);
    return item[field];
}

export const handleSearch = (columns: IColumn[], data: any[], key: string): any[] => {
    const normalizedKey = removeAccents(key.toLowerCase());
    const searchableColumns = columns.filter(col => col.dataField);
    return data.filter(item =>
        searchableColumns.some(col => {
            const value = getFilterableValue(col.dataField!, item, columns);
            return value != null && value !== "" &&
                removeAccents(String(value).toLowerCase())
                    .includes(normalizedKey);
        })
    );
};
export const handleFilter = (conditions: ICondition[], data: any[], logicOperator: string, columns: IColumn[]): any[] => {
    const filterExpression = conditions.map((cond: any) => [cond.field, cond.operator, cond.value])
        .reduce((acc: any, curr: any, i: any) => (i > 0 ? [...acc, logicOperator, curr] : [curr]), []);
    return data.filter((item) => {
        let result = true;
        let currentOperator = "and";

        for (let i = 0; i < filterExpression.length; i++) {
            const expr = filterExpression[i];
            if (typeof expr === "string") {
                currentOperator = expr;
                continue;
            }
            const [field, operator, value]: IExpression = expr;
            const itemValue = getFilterableValue(field, item, columns);

            let conditionResult;
            switch (operator) {
                case "equals":
                    conditionResult = itemValue === value;
                    break;
                case "contains":
                    conditionResult = String(itemValue).toLowerCase().includes(String(value).toLowerCase());
                    break;
                case "greaterThan":
                    conditionResult = Number(itemValue) > Number(value);
                    break;
                case "lessThan":
                    conditionResult = Number(itemValue) < Number(value);
                    break;
                case "greaterThanOrEqual":
                    conditionResult = Number(itemValue) >= Number(value);
                    break;
                case "lessThanOrEqual":
                    conditionResult = Number(itemValue) <= Number(value);
                    break;
                default:
                    conditionResult = true;
            }
            result = currentOperator === "and" ? result && conditionResult : result || conditionResult;
        }
        return result;
    });
};

export function getStickyLeft(headers: any[], idx: number) {
    let left = 0;
    for (let i = 0; i < idx; i++) {
        if (headers[i].fixed) {
        left += parseInt(headers[i].width) || 0;
        } else {
        left += parseInt(headers[i].width) || 0;
        }
    }
    return left;
}


export function getLeafColumns(columns: IColumn[]): IColumn[] {
    let leafColumns: IColumn[] = [];
    
    columns.forEach(column => {
      if (column.columns && column.columns.length > 0) {
        // Nếu cột có cột con, đệ quy để lấy tất cả cột lá
        leafColumns = [...leafColumns, ...getLeafColumns(column.columns)];
      } else {
        // Nếu không có cột con, đây là cột lá
        leafColumns.push(column);
      }
    });
    
    return leafColumns;
  }