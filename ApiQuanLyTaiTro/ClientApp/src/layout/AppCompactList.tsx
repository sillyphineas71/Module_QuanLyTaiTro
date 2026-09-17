import React, { useEffect, useRef, useState } from "react";
import { Box, Spinner } from "@primer/react";
import styles from "./AppCompactList.module.css";

// Danh sách DÒNG GỌN cho mobile - dành cho bản ghi ít thuộc tính.
//
// Vì sao không nhồi thêm vào AppMobileList: component đó dựng card từ IColumn (tiêu đề lớn,
// phụ đề, danh sách chi tiết, nút "Xem thêm"). Với danh mục chỉ có 1 cột, nó tạo ra một card có
// viền + shadow + padding 16px để chứa đúng MỘT dòng chữ và hai nút - nặng nề vô lý trên điện
// thoại. Cho AppMobileList gánh cả hai chế độ sẽ biến nó thành god component; hai primitive
// nhỏ, mỗi cái một việc, ít code hơn và dễ đọc hơn.
//
// Quy tắc chọn: bản ghi có >= 3 thuộc tính đáng hiện -> AppMobileList (card).
//               ít hơn -> AppCompactList (dòng).
export interface IAppCompactListItem {
    key: string | number;
    /** Dòng chính - tên bản ghi. */
    primary: React.ReactNode;
    /** Dòng phụ (tùy chọn) - vd Lĩnh vực của một Công việc. */
    secondary?: React.ReactNode;
    /** Ô hành động cuối dòng - thường là <AppRowActions>. */
    actions?: React.ReactNode;
}

interface IAppCompactListProps {
    items: IAppCompactListItem[];
    isLoading?: boolean;
    /** Giới hạn số dòng dựng ban đầu; người dùng bấm để tải thêm (giống AppMobileList). */
    initialItemCount?: number;
}

const AppCompactList: React.FC<IAppCompactListProps> = ({
    items,
    isLoading = false,
    initialItemCount = 50,
}) => {
    const [visibleCount, setVisibleCount] = useState(initialItemCount);
    const previousDatasetKeysRef = useRef<Array<string | number> | null>(null);
    const previousInitialItemCountRef = useRef(initialItemCount);

    // Nhận diện "tập dữ liệu logic" bằng CHUỖI KEY THEO THỨ TỰ - đúng nguyên tắc đã dùng cho
    // AppMobileList từ Giai đoạn 1.
    //   - cùng chuỗi key, chỉ khác tham chiếu mảng (component cha render lại, items.map tạo mảng
    //     mới mỗi lần) -> GIỮ nguyên số dòng đang hiện, không cuộn về đầu vô cớ;
    //   - đổi tập key hoặc đổi thứ tự -> tập dữ liệu khác, reset về nhóm dòng đầu;
    //   - đổi initialItemCount -> reset.
    // So sánh theo length là KHÔNG đủ: hai danh mục khác nhau cùng có 8 dòng (vd đổi tab Lĩnh vực
    // <-> Chức vụ) sẽ thừa hưởng trạng thái "đã tải thêm" của nhau.
    // Chỉ so key, KHÔNG deep-compare object của từng dòng.
    useEffect(() => {
        const nextDatasetKeys = items.map((item) => item.key);
        const previousDatasetKeys = previousDatasetKeysRef.current;
        const hasDatasetChanged =
            previousDatasetKeys != null &&
            (previousDatasetKeys.length !== nextDatasetKeys.length ||
                previousDatasetKeys.some((key, index) => key !== nextDatasetKeys[index]));
        const hasInitialItemCountChanged = previousInitialItemCountRef.current !== initialItemCount;

        if (hasDatasetChanged || hasInitialItemCountChanged) {
            setVisibleCount(initialItemCount);
        }

        previousDatasetKeysRef.current = nextDatasetKeys;
        previousInitialItemCountRef.current = initialItemCount;
    }, [items, initialItemCount]);

    if (isLoading) {
        return (
            <Box className={styles.loading} aria-live="polite" aria-label="Đang tải danh sách">
                <Spinner size="medium" />
            </Box>
        );
    }

    const visibleItems = items.slice(0, visibleCount);

    return (
        <div className={styles.list}>
            {visibleItems.map((item) => (
                <div className={styles.row} key={item.key}>
                    <div className={styles.rowMain}>
                        <span className={styles.primary}>{item.primary}</span>
                        {item.secondary != null && item.secondary !== "" && (
                            <span className={styles.secondary}>{item.secondary}</span>
                        )}
                    </div>
                    {item.actions && <div className={styles.rowActions}>{item.actions}</div>}
                </div>
            ))}
            {visibleCount < items.length && (
                <button
                    type="button"
                    className={styles.loadMore}
                    onClick={() => setVisibleCount((previous) => previous + initialItemCount)}
                >
                    Hiển thị thêm ({visibleItems.length}/{items.length})
                </button>
            )}
        </div>
    );
};

export default AppCompactList;
