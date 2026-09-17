import React, { useEffect, useRef, useState } from "react";
import { Box, Spinner } from "@primer/react";
import Card from "../components-ui/card";
import { IColumn } from "../components-ui/data-table/DataTable";
import styles from "./AppMobileList.module.css";

export type AppMobileListKey = string | number;

interface IAppMobileListProps {
    data: any[];
    columns: IColumn[];
    keyField?: string;
    isLoading?: boolean;
    emptyComponent?: React.ReactNode;
    selection?: {
        selectedKeys: Set<AppMobileListKey>;
        onToggle: (key: AppMobileListKey) => void;
    };
    actions?: (row: any) => React.ReactNode;
    /** Số trường chi tiết hiển thị trước khi người dùng mở rộng từng card. */
    collapsedDetailCount?: number;
    /** Giới hạn DOM ban đầu; người dùng có thể tải thêm các card tiếp theo. */
    initialItemCount?: number;
}

const hasColumnValue = (row: any, column: IColumn) => {
    if (!column.dataField) return Boolean(column.cellRender);

    const value = row[column.dataField];
    if (column.isHideZeroValue && value?.toString() === "0") return false;
    return value !== undefined && value !== null && value.toString() !== "";
};

// Phiên bản mobile riêng của DataTable cho cổng. Component nhận lại chính IColumn để
// caption/dataField/cellRender vẫn là nguồn dữ liệu hiển thị duy nhất; DataTable gốc không bị sửa.
const AppMobileList: React.FC<IAppMobileListProps> = ({
    data,
    columns,
    keyField,
    isLoading = false,
    emptyComponent,
    selection,
    actions,
    collapsedDetailCount = 4,
    initialItemCount = 50,
}) => {
    const [expandedKeys, setExpandedKeys] = useState<Set<AppMobileListKey>>(new Set());
    const [visibleCount, setVisibleCount] = useState(initialItemCount);
    const previousDatasetKeysRef = useRef<AppMobileListKey[] | null>(null);
    const previousInitialItemCountRef = useRef(initialItemCount);

    // Kết quả filter mới luôn bắt đầu ở nhóm card đầu để không giữ vị trí/toggle của kết quả cũ.
    useEffect(() => {
        const nextDatasetKeys = data.map((row, rowIndex) => {
            const value = keyField ? row[keyField] : undefined;
            return value !== undefined && value !== null && value !== "" ? value : rowIndex;
        });
        const previousDatasetKeys = previousDatasetKeysRef.current;
        const hasDatasetChanged =
            previousDatasetKeys != null &&
            (previousDatasetKeys.length !== nextDatasetKeys.length ||
                previousDatasetKeys.some((key, index) => key !== nextDatasetKeys[index]));
        const hasInitialItemCountChanged = previousInitialItemCountRef.current !== initialItemCount;

        if (hasDatasetChanged || hasInitialItemCountChanged) {
            setExpandedKeys(new Set());
            setVisibleCount(initialItemCount);
        }

        previousDatasetKeysRef.current = nextDatasetKeys;
        previousInitialItemCountRef.current = initialItemCount;
    }, [data, initialItemCount, keyField]);

    if (isLoading) {
        return (
            <Box className={styles.loading} aria-live="polite" aria-label="Đang tải danh sách">
                <Spinner size="medium" />
            </Box>
        );
    }

    if (data.length === 0) {
        return <>{emptyComponent}</>;
    }

    const mainColumn = columns.find((column) => column.isMainColumn) ?? columns[0];
    const detailColumns = columns.filter(
        (column) => column !== mainColumn && column.caption && (column.dataField || column.cellRender),
    );
    const subtitleColumn = detailColumns[0];
    const displayedRows = data.slice(0, visibleCount);

    const renderValue = (row: any, column: IColumn, rowIndex: number) => {
        if (column.cellRender) return column.cellRender(row, rowIndex);
        if (!column.dataField) return "";

        const value = row[column.dataField];
        return column.isHideZeroValue && value?.toString() === "0" ? "" : value?.toString() ?? "";
    };

    const getRowKey = (row: any, rowIndex: number): AppMobileListKey => {
        const value = keyField ? row[keyField] : undefined;
        return value !== undefined && value !== null && value !== "" ? value : rowIndex;
    };

    return (
        <Box as="div" className={styles.list} aria-live="polite">
            {displayedRows.map((row, rowIndex) => {
                const rowKey = getRowKey(row, rowIndex);
                const isExpanded = expandedKeys.has(rowKey);
                const visibleDetailColumns = detailColumns.filter((column) => hasColumnValue(row, column));
                const visibleSubtitleColumn = subtitleColumn && hasColumnValue(row, subtitleColumn) ? subtitleColumn : undefined;
                const remainingDetailColumns = visibleDetailColumns.filter((column) => column !== visibleSubtitleColumn);
                const collapsedDetails = remainingDetailColumns.slice(0, collapsedDetailCount);
                const expandedDetails = isExpanded ? remainingDetailColumns : collapsedDetails;
                const hiddenDetailCount = remainingDetailColumns.length - collapsedDetails.length;
                const canToggle = hiddenDetailCount > 0;

                return (
                    <Card key={rowKey} className={styles.card}>
                        <Box className={styles.cardContent}>
                            <Box className={styles.cardHeader}>
                                {selection && (
                                    <label className={styles.selectionControl}>
                                        <input
                                            type="checkbox"
                                            checked={selection.selectedKeys.has(rowKey)}
                                            onChange={() => selection.onToggle(rowKey)}
                                            aria-label="Chọn dòng này"
                                        />
                                    </label>
                                )}
                                <Box className={styles.headingContent}>
                                    <h2 className={styles.title}>
                                        {mainColumn && hasColumnValue(row, mainColumn)
                                            ? renderValue(row, mainColumn, rowIndex)
                                            : "—"}
                                    </h2>
                                    {visibleSubtitleColumn && (
                                        <div className={styles.subtitle}>
                                            <span>{visibleSubtitleColumn.caption}</span>
                                            <strong>{renderValue(row, visibleSubtitleColumn, rowIndex)}</strong>
                                        </div>
                                    )}
                                </Box>
                            </Box>

                            {expandedDetails.length > 0 && (
                                <dl className={styles.details}>
                                    {expandedDetails.map((column) => (
                                        <div className={styles.detail} key={column.dataField ?? column.caption}>
                                            <dt>{column.caption}</dt>
                                            <dd>{renderValue(row, column, rowIndex)}</dd>
                                        </div>
                                    ))}
                                </dl>
                            )}

                            {canToggle && (
                                <button
                                    type="button"
                                    className={styles.expandButton}
                                    onClick={() =>
                                        setExpandedKeys((previous) => {
                                            const next = new Set(previous);
                                            if (next.has(rowKey)) next.delete(rowKey);
                                            else next.add(rowKey);
                                            return next;
                                        })
                                    }
                                    aria-expanded={isExpanded}
                                >
                                    {isExpanded ? "Thu gọn" : `Xem thêm ${hiddenDetailCount} thông tin`}
                                </button>
                            )}

                            {actions && <div className={styles.actions}>{actions(row)}</div>}
                        </Box>
                    </Card>
                );
            })}

            {visibleCount < data.length && (
                <button
                    type="button"
                    className={styles.loadMoreButton}
                    onClick={() => setVisibleCount((previous) => previous + initialItemCount)}
                >
                    Hiển thị thêm ({displayedRows.length}/{data.length})
                </button>
            )}
        </Box>
    );
};

export default AppMobileList;
