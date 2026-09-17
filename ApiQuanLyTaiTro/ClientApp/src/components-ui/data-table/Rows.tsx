import { useContext, useEffect } from 'react';
import { DataTableContainerContext, IDataTableContext } from './DataTable';
import Row from './Row';
const Rows = () => {
    const { pagedData, getTableBodyProps, rows, prepareRow, props, selectedCells, setSelectedCells,
        setIsSelecting, setStartCell, isSelecting, startCell
    } = useContext<IDataTableContext>(DataTableContainerContext);
    const { selection } = props;

    // Bắt đầu chọn vùng
    const handleMouseDown = (rowIndex: number, colIndex: number) => {
        setIsSelecting(true);
        setStartCell({ rowIndex, colIndex });
        setSelectedCells(new Set([`${rowIndex}-${colIndex}`]));
    };
    // Kéo chuột để chọn vùng
    const handleMouseMove = (rowIndex: number, colIndex: number) => {
        if (isSelecting && startCell) {
            const { rowIndex: startRow, colIndex: startCol } = startCell;
            const minRow = Math.min(startRow, rowIndex);
            const maxRow = Math.max(startRow, rowIndex);
            const minCol = Math.min(startCol, colIndex);
            const maxCol = Math.max(startCol, colIndex);

            const newSelectedCells = new Set();
            for (let r = minRow; r <= maxRow; r++) {
                for (let c = minCol; c <= maxCol; c++) {
                    newSelectedCells.add(`${r}-${c}`);
                }
            }
            setSelectedCells(newSelectedCells);
        }
    };
    return (
        <>
            {pagedData.length > 0 && (
                <tbody {...getTableBodyProps()}>
                    {rows.map((row: any, rowIndex: number) => {
                        prepareRow(row);
                        return (
                            <Row
                                focusedRow={props.focusedRow}
                                focusedCell={props.focusedCell}
                                handleMouseDown={handleMouseDown}
                                handleMouseMove={handleMouseMove}
                                row={row}
                                rowIndex={rowIndex}
                                selectedCells={selectedCells}
                                selection={selection}
                                checkDontSaveChange={props.checkDontSaveChange}
                                key={rowIndex}
                                onFocuseCellChanged={props.onFocuseCellChanged}
                                rangeSelection={props.rangeSelection}

                            />
                        );

                        // let isSelectedSigle: boolean = false;
                        // if (selection) {
                        //     if (selection.mode === "single") {
                        //         if (
                        //             selection.selectedRowKeys &&
                        //             selection.selectedRowKeys.length > 0 &&
                        //             selection.selectedRowKeys[0] ===
                        //             row.original.id
                        //         ) {
                        //             isSelectedSigle = true;
                        //         }
                        //     }
                        // }
                        // let isHaveFocusedCell = props.focusedCell && props.focusedCell.rowData.id === row.original.id;
                        // return (
                        //     <tr
                        //         {...row.getRowProps()}
                        //         onClick={() => {
                        //             if (
                        //                 props.selection &&
                        //                 props.selection.mode === "single"
                        //             ) {
                        //                 props.selection.onSelectionChanged([
                        //                     row.original.id,
                        //                 ]);
                        //             }
                        //         }}
                        //         key={rowIndex}
                        //     >
                        //         {row.cells.map((cell: any, colIndex: number) => {
                        //             let isDontSave: boolean = false;
                        //             if (
                        //                 props.checkDontSaveChange &&
                        //                 cell.column.isAllowFocus
                        //             ) {
                        //                 const rootRowData =
                        //                     props.checkDontSaveChange.rootDataSource.find(
                        //                         (x) => x.id === row.original.id
                        //                     );
                        //                 if (rootRowData) {
                        //                     const rootValue =
                        //                         rootRowData[cell.column.dataField];
                        //                     const currentValue =
                        //                         row.original[cell.column.dataField];
                        //                     if (rootValue !== currentValue) {
                        //                         isDontSave = true;
                        //                     }
                        //                 }
                        //             }
                        //             return (
                        //                 <td
                        //                     {...cell.getCellProps()}
                        //                     key={colIndex}
                        //                     style={{
                        //                         width: cell.column.width,
                        //                         minWidth: cell.column.minWidth,
                        //                         fontWeight: cell.column.isMainColumn
                        //                             ? "600"
                        //                             : 400,
                        //                         whiteSpace: "break-spaces",
                        //                         textAlign: cell.column.align,
                        //                         backgroundColor: isSelectedSigle
                        //                             ? "#fff8c5"
                        //                             : undefined,
                        //                         color: row.original.backgroundColor,
                        //                     }}
                        //                     tabIndex={
                        //                         cell.column.isAllowFocus ? 0 : undefined
                        //                     }
                        //                     onFocus={() => {
                        //                         if (props.onFocuseCellChanged) {
                        //                             props.onFocuseCellChanged({
                        //                                 rowData: row.original,
                        //                                 dataField: cell.column.dataField,
                        //                             });
                        //                         }
                        //                     }}
                        //                     className={clsx(
                        //                         props.focusedCell && isHaveFocusedCell && props.focusedCell.dataField === cell.column.dataField
                        //                             ? styles.focused
                        //                             : "",
                        //                         isDontSave ? styles.isDoneSave : "",
                        //                         selectedCells.has(`${rowIndex}-${colIndex}`) ? styles.rangeSelected : ""
                        //                     )}
                        //                     onMouseDown={props.rangeSelection ? () => handleMouseDown(rowIndex, colIndex) : undefined}
                        //                     onMouseMove={props.rangeSelection ? () => handleMouseMove(rowIndex, colIndex) : undefined}
                        //                 >
                        //                     {cell.column.isHideZeroValue ?
                        //                         <>
                        //                             {row.original[cell.column.dataField]?.toString() === "0" ? "" : cell.render("Cell")}
                        //                         </>
                        //                         :
                        //                         <>
                        //                             {cell.column.cellRender
                        //                                 ? cell.column.cellRender(row.original)
                        //                                 : cell.render("Cell")}
                        //                         </>
                        //                     }


                        //                 </td>
                        //             );
                        //         })}
                        //     </tr>
                        // );
                    })}
                </tbody>
            )}
            {pagedData.length <= 0 && (
                <tbody>
                    <tr>
                        <td colSpan={props.columns.length}>
                            {props.emptyComponent}
                        </td>
                    </tr>
                </tbody>
            )}
        </>
    );
};

export default Rows;