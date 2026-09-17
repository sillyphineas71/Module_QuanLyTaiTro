import { SearchIcon } from '@primer/octicons-react';
import { Box, Octicon } from '@primer/react';
import clsx from 'clsx';
import { useContext, useLayoutEffect, useRef, useState } from 'react';
import TextInput from '../text-input';
import { DataTableContainerContext, eSortMode, IColumn, IDataTableContext } from './DataTable';
import styles from "./DataTable.module.css";
import { getLeafColumns, getStickyLeft } from './DataTableHelper';

/**
 * Dấu hiệu BA TRẠNG THÁI của một cột sắp xếp được.
 *
 * Vẽ tay bằng SVG thay vì dùng octicon vì cần đúng ba hình phân biệt nhau bằng HÌNH DÁNG, không
 * chỉ bằng màu:
 *   - NONE: hai tam giác CÂN NHAU, xám       -> "cột này bấm được, hiện không sắp xếp"
 *   - ASC : tam giác TRÊN đậm, dưới nhạt hẳn -> bất đối xứng, đọc được cả khi không phân biệt màu
 *   - DESC: tam giác DƯỚI đậm, trên nhạt hẳn
 *
 * Tương phản đã ĐO trên nền thead #F5F8FA: xám #6E7781 = 4.26:1 (qua ngưỡng 3:1 của WCAG 1.4.11
 * cho đồ hoạ mang nghĩa - và dấu này MANG NGHĨA, nó là thứ duy nhất cho biết cột bấm được), xanh
 * #0550ae = 7.12:1. Nhưng hai màu đó so với NHAU chỉ 1.67:1, quá thấp để màu đứng một mình - nên
 * HÌNH DÁNG mới là thứ gánh phần phân biệt, đúng luật "không lấy màu làm phương tiện duy nhất".
 * Nửa nhạt #D0D7DE chỉ 1.36:1 và đó là CỐ Ý: ở trạng thái đã sắp xếp, nghĩa nằm ở nửa ĐẬM, nửa
 * còn lại chỉ là phần thân của hình.
 *
 * ⚠️ Đổi mấy mã màu dưới đây thì phải ĐO LẠI, đừng chọn bằng mắt.
 */
const SortGlyph = ({ mode }: { mode: eSortMode }) => {
    const MO = "#6E7781";
    const RO = "#0550ae";
    const NHAT = "#D0D7DE";
    const tren = mode === eSortMode.ASC ? RO : mode === eSortMode.DESC ? NHAT : MO;
    const duoi = mode === eSortMode.DESC ? RO : mode === eSortMode.ASC ? NHAT : MO;
    return (
        <svg
            className={styles.sortGlyph}
            width="10" height="14" viewBox="0 0 10 14"
            aria-hidden="true" focusable="false"
        >
            <path d="M5 1.5 L9 6 L1 6 Z" fill={tren} />
            <path d="M5 12.5 L1 8 L9 8 Z" fill={duoi} />
        </svg>
    );
};

/** Câu mô tả cho tooltip/aria: nói LẦN BẤM KẾ TIẾP sẽ làm gì, chứ không chỉ nói trạng thái hiện tại. */
const moTaSapXep = (mode: eSortMode) => {
    if (mode === eSortMode.ASC) return "đang sắp tăng dần, bấm để chuyển giảm dần";
    if (mode === eSortMode.DESC) return "đang sắp giảm dần, bấm để bỏ sắp xếp";
    return "bấm để sắp xếp tăng dần";
};

const Header = () => {
    const { props, headerGroups, allColumns, setConditions, conditions, sortConfig, sortByField, sortMode, toggleSortByField } = useContext<IDataTableContext>(DataTableContainerContext);
    const batSapXep = sortConfig?.enable === true;
    const onFilterChange = (field: any, operator?: any, value?: any) => {
        const currentValue = conditions.find(x => x.field === field)?.value ?? undefined;
        if ((currentValue ?? "") === (value ?? "")) return;
        if (!value) {
            removeCondition(field);
            return;
        }
        const cond = conditions.find(x => x.field === field);
        if (cond) {
            updateCondition(field, operator, value)
        } else {
            addCondition(field, operator, value)
        }
    }
    // Thêm điều kiện mới
    const addCondition = (field: any, operator?: any, value?: any) => {
        setConditions([...conditions.filter(x => x.field && x.field !== field), { field: field, operator: operator ?? "equals", value: value ?? "" }]);
    };

    // Xóa điều kiện
    const removeCondition = (field: any) => {
        const newConditions = conditions.filter(x => x.field !== field);
        setConditions(newConditions);

    };
    // Cập nhật điều kiện
    const updateCondition = (field: any, operator?: any, value?: any) => {
        setConditions(conditions.map(c => {
            if (c.field === field) {
                return {
                    ...c,
                    operator: operator ?? "equals",
                    value
                }
            }
            return c;
        }));
    };

    // Thêm ref và state để lưu chiều cao từng dòng header
    const headerRowRefs = useRef<(HTMLTableRowElement | null)[]>([]);
    const [headerTops, setHeaderTops] = useState<number[]>([]);

    useLayoutEffect(() => {
        // Tính toán top động cho từng dòng header
        const tops: number[] = [];
        let acc = 0;
        headerRowRefs.current.forEach((row, idx) => {
        tops[idx] = acc;
        if (row) acc += row.offsetHeight + 0.1; // Thêm 0.5px để tránh hiện tượng dính header
        });
        setHeaderTops(tops);
    }, [props.data]);




    return (
        <>
       
         <colgroup>
         {/* Tạo một colgroup để đặt width cho từng cột */}
         {getLeafColumns(allColumns).map((col, idx) => (
           <col key={idx} style={{ width: col.width }} />
         ))}
       </colgroup>
        <thead className={styles.header}>
            {headerGroups.map((headerGroup: any, hIdx) => (
                <tr {...headerGroup.getHeaderGroupProps()} key={hIdx} ref={el => (headerRowRefs.current[hIdx] = el)}>
                    {headerGroup.headers.map((column: any, idx: number) => {
                        const noiDung = column.headerRender
                            ? column.headerRender()
                            : column.render("Header");
                        // Cột sắp xếp được khi: bảng bật sort, cột có `dataField` THẬT, và cột
                        // không tự từ chối bằng `allowSorting: false`. Cột STT do DataTable sinh,
                        // ô chọn và cột hành động chỉ có `id` nên tự rụng ở vế `dataField`.
                        // `placeholderOf` là ô đệm của tiêu đề nhiều tầng - không phải cột thật.
                        const coTheSap = batSapXep
                            && !!column.dataField
                            && column.allowSorting !== false
                            && !column.placeholderOf;
                        const dangSap = coTheSap
                            && sortByField === column.dataField
                            && sortMode !== eSortMode.NONE;
                        const modeCuaCot = dangSap ? sortMode : eSortMode.NONE;
                        const nhanCot = typeof column.caption === "string" && column.caption
                            ? column.caption
                            : String(column.dataField ?? "");
                        return (
                            <th
                                {...column.getHeaderProps()}
                                style={{
                                    textAlign: column.align,
                                    width: column.placeholderOf
                                        ? column.placeholderOf.width
                                        : column.width,
                                    minWidth: column.placeholderOf
                                        ? column.placeholderOf.minWidth
                                        : column.minWidth,
                                        position: "sticky",
                                        top: headerTops[hIdx] ?? 0,
                                        left: column.fixed ? getStickyLeft(headerGroup.headers, idx) : undefined,
                                        zIndex: column.fixed ? 3 : 2,
                                }}
                                // Ba giá trị, đúng spec. Cột KHÔNG sắp xếp được thì bỏ hẳn thuộc
                                // tính: aria-sort="none" trên một ô không bấm được là nói dối
                                // trình đọc màn hình rằng ô đó sắp xếp được.
                                aria-sort={coTheSap
                                    ? (dangSap ? (sortMode === eSortMode.ASC ? "ascending" : "descending") : "none")
                                    : undefined}
                                key={idx}
                            >
                                {coTheSap ? (
                                    <span
                                        className={clsx(styles.sortHeader, dangSap && styles.sortHeaderActive)}
                                        role="button"
                                        tabIndex={0}
                                        title={`${nhanCot}: ${moTaSapXep(modeCuaCot)}`}
                                        aria-label={`${nhanCot}: ${moTaSapXep(modeCuaCot)}`}
                                        onClick={() => toggleSortByField?.(column.dataField)}
                                        onKeyDown={(e) => {
                                            // Enter VÀ Space - đúng hợp đồng của role="button".
                                            // " " là giá trị chuẩn; "Spacebar" là bản cũ của Edge legacy/IE.
                                            if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
                                                // Không chặn thì Space cuộn cả trang xuống.
                                                e.preventDefault();
                                                toggleSortByField?.(column.dataField);
                                            }
                                        }}
                                    >
                                        {noiDung}
                                        <SortGlyph mode={modeCuaCot} />
                                    </span>
                                ) : noiDung}
                            </th>
                        );
                    })}
                </tr>
            ))}
            
            {(props.filterRow && props.filterRow.enable === true) && // {(props.filterRow?.enable === true || !props.filterRow) &&
                <tr role="row">
                    {allColumns.map((colum: any) => {
                        return (
                            <th style={{
                                position: "unset"
                            }}>
                                {colum.dataField &&
                                    <Box sx={{ margin: "-0.5rem -0.75rem" }}>
                                        <TextInput
                                            // className="text-input-noborder"
                                            block
                                            leadingVisual={<Box sx={{ color: "#656d76" }}>
                                                <Octicon icon={SearchIcon} sx={{ width: "12px", height: "12px" }} />
                                            </Box>}
                                            sx={{
                                                backgroundColor: "#F5F8FA",
                                                // outline:"none!important",
                                                boxShadow: "none",
                                                border: "0!important",
                                                mt: "1px"
                                            }}
                                            onValueDelayChanged={(value) => {
                                                onFilterChange(colum.dataField, "contains", value)
                                            }} />
                                    </Box>
                                }
                            </th>
                        );
                    })}
                </tr>
            }
        </thead>
        </>
    );
};

export default Header;