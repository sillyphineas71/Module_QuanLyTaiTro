import { memo } from 'react';
import Cell from './Cell';
import styles from "./DataTable.module.css";

import { ICheckDontSaveChange, IFocusCell, IFoucsedRow, IRangeSelectionProps, ISelectionProps } from './DataTable';
import GroupRow from './GroupRow';
interface IRowProps {
    selection?: ISelectionProps,
    row: any,
    focusedCell?: IFocusCell,
    rowIndex: number,
    checkDontSaveChange?: ICheckDontSaveChange,
    onFocuseCellChanged?: (data: IFocusCell) => void,
    selectedCells: any,
    rangeSelection?: IRangeSelectionProps,
    handleMouseDown: (rowIndex: number, colIndex: number) => void,
    handleMouseMove: (rowIndex: number, colIndex: number) => void,
    focusedRow?: IFoucsedRow
}

const checkIfRowSelectedSingle = (rowId: any, selection?: ISelectionProps): boolean => {
    if (!selection || selection.mode !== "single") return false;
    if (selection.selectedRowKeys && selection.selectedRowKeys.length > 0 && selection.selectedRowKeys[0] === rowId) {
        return true;
    }
    return false;
};
const Row = memo((props: IRowProps) => {

    const { selection, row, rowIndex, selectedCells, handleMouseDown, handleMouseMove, onFocuseCellChanged } = props;
    const isRowSelectedSingle = checkIfRowSelectedSingle(row.original.id, selection);
    const isHaveFocusedCell = props.focusedCell && props.focusedCell.rowData.id === row.original.id;
    // const handleRowClick = selection?.mode === "single"
    //     ? () => selection.onSelectionChanged?.([row.original.id])
    //     : undefined;
    const handleRowClick = () => {
        if (selection?.mode === "single") {
            selection?.onSelectionChanged?.([row.original.id])
        }
        if (props.focusedRow) {
            props.focusedRow?.onFocusedRowChanged?.(row.original.id);
        }
    }

    return (
        <tr
            {...row.getRowProps()}
            onClick={handleRowClick}
            key={rowIndex}
            className={(props.focusedRow?.focuseddRowKey && props.focusedRow?.focuseddRowKey === row.original.id) ? styles.focusedRow : ""}
        >
            {row.original.rowDisplayType === "group" &&
                <GroupRow
                    row={row}
                    selection={selection}

                />
            }
            {row.original.rowDisplayType !== "group" && row.cells.map((cell: any, colIndex: number) => {

                return (
                    <Cell
                        cell={cell}
                        colIndex={colIndex}
                        handleMouseDown={handleMouseDown}
                        handleMouseMove={handleMouseMove}
                        isRowSelectedSingle={isRowSelectedSingle}
                        rowData={row.original}
                        rowId={row.original.id}
                        rowIndex={rowIndex}
                        row={row.cells}
                        selectedCells={selectedCells}
                        checkDontSaveChange={props.checkDontSaveChange}
                        focusedCell={props.focusedCell}
                        isHaveFocusedCell={isHaveFocusedCell}
                        key={`${row.original.id}-${colIndex}`}
                        onFocuseCellChanged={onFocuseCellChanged}
                        rangeSelection={props.rangeSelection}
                    />
                );
            })}
        </tr>

    );
}, (prev, next) => {
    // if (prev.row.original.id === 50888) {
    //     if (prev.row.original !== next.row.original) {
    //         return false;
    //     }
    //     return true;
    // }
    // if (prev.row.original !== next.row.original) {
    //     return false;
    // }
    return false;
});
Row.displayName = 'Row';
export default Row;