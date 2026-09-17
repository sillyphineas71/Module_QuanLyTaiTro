import clsx from 'clsx';
import Text from '../text';
import { ICheckDontSaveChange, IFocusCell, IRangeSelectionProps } from './DataTable';
import styles from "./DataTable.module.css";
import { memo } from 'react';
import { getStickyLeft } from './DataTableHelper';
interface ICellProps {
    cell: any,
    focusedCell?: IFocusCell,
    rowIndex: number,
    row: any[],
    checkDontSaveChange?: ICheckDontSaveChange,
    onFocuseCellChanged?: (data: IFocusCell) => void,
    selectedCells: any,
    rangeSelection?: IRangeSelectionProps,
    handleMouseDown: (rowIndex: number, colIndex: number) => void,
    handleMouseMove: (rowIndex: number, colIndex: number) => void,
    rowId: any,
    rowData: any,
    isRowSelectedSingle: boolean,
    colIndex: number;  
    isHaveFocusedCell?: boolean
}
const Cell = memo((props: ICellProps) => {
    const { cell, handleMouseDown, handleMouseMove, rowId, rowData, isRowSelectedSingle, onFocuseCellChanged, colIndex, isHaveFocusedCell, selectedCells, rowIndex } = props;
    let isDontSave: boolean = false;
    if (
        props.checkDontSaveChange &&
        cell.column.isAllowFocus
    ) {
        const rootRowData =
            props.checkDontSaveChange.rootDataSource.find(
                (x: any) => x.id === rowId
            );
        if (rootRowData) {
            const rootValue =
                rootRowData[cell.column.dataField];
            const currentValue =
                rowData[cell.column.dataField];
            if (rootValue !== currentValue) {
                isDontSave = true;
            }
        }
    }
    const cellStyle = {
        width: cell.column.width,
        minWidth: cell.column.minWidth,
        fontWeight: cell.column.isMainColumn ? "600" : 400,
        whiteSpace: "break-spaces" as const,
        textAlign: cell.column.align,
        ...(isRowSelectedSingle && { backgroundColor: "rgba(1, 117, 131,0.2)" }),
        ...(rowData && { color: rowData.backgroundColor ,
            position: cell.column.fixed ? "sticky" : undefined,
            left: cell.column.fixed
            ? getStickyLeft(props.row?.map((c: typeof cell) => c.column), colIndex)
            : undefined,
            zIndex: cell.column.fixed ? 1 : undefined,
            background: cell.column.fixed ? "#fff" : undefined,
        }),
    };
    const isFocused = props.focusedCell && isHaveFocusedCell && props.focusedCell.dataField === cell.column.dataField;
    const handleFocus = cell.column.isAllowFocus && onFocuseCellChanged
        ? () => {
            if (!isFocused) {
                onFocuseCellChanged({
                    rowData: rowData,
                    dataField: cell.column.dataField,
                })
            }
        }
        : undefined;
    return (
        <td
            {...cell.getCellProps()}
            key={colIndex}
            style={cellStyle}
            tabIndex={
                cell.column.isAllowFocus ? 0 : undefined
            }
            onFocus={handleFocus}
            className={clsx(
                isFocused
                    ? styles.focused
                    : "",
                isDontSave ? styles.isDoneSave : "",
                selectedCells.has(`${rowIndex}-${colIndex}`) ? styles.rangeSelected : ""
            )}
            onMouseDown={props.rangeSelection ? () => handleMouseDown(rowIndex, colIndex) : undefined}
            onMouseMove={props.rangeSelection ? () => handleMouseMove(rowIndex, colIndex) : undefined}
        >
            {cell.column.cellRender
                ? cell.column.cellRender(rowData,rowIndex)
                : <Text
                    text={
                        (cell.column.isHideZeroValue && rowData[cell.column.dataField]?.toString() === "0")
                            ? ""
                            : (rowData[cell.column.dataField]?.toString() ?? "")
                    }
                />
            }

        </td>
    );
}, (prev, next) => {
    if (prev.rowData !== next.rowData) {
        return false;
    }
    if (prev.isRowSelectedSingle !== next.isRowSelectedSingle) {
        return false;
    }
    if (prev.isHaveFocusedCell !== next.isHaveFocusedCell) {
        return false;
    }
    if (prev.rangeSelection !== next.rangeSelection) {
        return false;
    }
    if (prev.handleMouseDown !== next.handleMouseDown) {
        return false;
    }
    if (prev.handleMouseMove !== next.handleMouseMove) {
        return false;
    }
    if (prev.rowIndex !== next.rowIndex) {
        return false;
    }
    if (prev.colIndex !== next.colIndex) {
        return false;
    }
    return true;
})

export default Cell;