import { DownloadIcon, SearchIcon, SortAscIcon, SortDescIcon } from '@primer/octicons-react';
import { ActionList, ActionMenu, Box, IconButton } from '@primer/react';
import { useCallback, useContext, useEffect, useMemo } from 'react';
import Text from '../text';
import TextInput from '../text-input';
import { DataTableContainerContext, eSortMode, IColumn, IDataTableContext } from './DataTable';
import PageCaption from '../page-caption';
import ExcelJS from "exceljs";
import { saveAs } from 'file-saver';
import { eSize } from '../utils/types/eSize';
import { formatDate } from '../../utils/convertDate';
import { isDate } from 'util/types';
import moment from 'moment';

// Helper functions moved outside component to avoid re-creation
function getLeafColumns(columns: IColumn[]): IColumn[] {
    let leafColumns: IColumn[] = [];
    
    columns.forEach(column => {
      if (column.columns && column.columns.length > 0) {
        leafColumns = [...leafColumns, ...getLeafColumns(column.columns)];
      } else {
        leafColumns.push(column);
      }
    });
    
    return leafColumns;
}
  
function getHeaderMaxLevel(columns: IColumn[], level = 0): number {
    let maxLevel = level;
    
    columns.forEach(column => {
      if (column.columns && column.columns.length > 0) {
        const childMaxLevel = getHeaderMaxLevel(column.columns, level + 1);
        maxLevel = Math.max(maxLevel, childMaxLevel);
      }
    });
    
    return maxLevel + 1;
}

function fillHeaderCells(
    columns: IColumn[], 
    worksheet: ExcelJS.Worksheet, 
    level: number, 
    startCol: number,
    headerRows: any[][],
    maxLevel: number
): number {
    let colIndex = startCol;
    
    columns.forEach(col => {
      const hasChildColumns = col.columns && col.columns.length > 0;
      const colSpan = hasChildColumns ? getLeafColumns(col.columns!).length : 1;
      const rowSpan = hasChildColumns ? 1 : maxLevel - level;
      
      const cell = worksheet.getCell(level + 1, colIndex + 1);
      cell.value = col.caption ?? '';
      
      if (colSpan > 1) {
        worksheet.mergeCells(level + 1, colIndex + 1, level + 1, colIndex + colSpan);
      }
      
      if (rowSpan > 1) {
        worksheet.mergeCells(level + 1, colIndex + 1, level + rowSpan, colIndex + 1);
      }
      
      if (hasChildColumns) {
        fillHeaderCells(col.columns!, worksheet, level + 1, colIndex, headerRows, maxLevel);
      }
      
      colIndex += colSpan;
    });
    
    return colIndex;
}

const Toolbar = () => {
    const { props, setSearchKey, sortConfig, setSortConfig, sortByField, exportFunctionRef } = useContext<IDataTableContext>(DataTableContainerContext);
    const { title, titleComponent, subTitle, subTitleComponent, actionComponent, searchEnable, columns, exportConfig: pExportConfig, data } = props;

    // Helper function to detect if a field contains date data
    const isDateField = (fieldName: string, data: any[]): boolean => {
        if (!fieldName || !data || data.length === 0) return false;
        
        // Check if field name suggests it's a date field
        const dateFieldPatterns = [
            /ngay_sinh/i,
            /ngay_qd/i,
            /ngay_thi/i,
            /tu_ngay/i,
            /den_ngay/i,
            /ngay_het_han/i,
            /ngay_xet/i,
            /created_time/i,
            /updated_time/i,
            /ngay_tao/i,
            /ngay_cap_nhat/i,
            /ngay_ket_thuc/i,
            /ngay_bat_dau/i,
            /ngay_thi_ket_thuc/i,
            /ngay_thi_bat_dau/i,
            /ngay_hoan_thanh/i,
            /ngay_nop/i,
            /ngay_duyet/i,
            /ngay_ban_hanh/i
        ];
        
        // First check: if field name matches date patterns, return true
        const isDateFieldByName = dateFieldPatterns.some(pattern => pattern.test(fieldName));
        if (isDateFieldByName) return true;
        
      
        return false;
    };

     const exportConfig = pExportConfig;
     
     const handleExportAsync = useCallback(async () => {
        const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Sheet1');
            
            // Tính số dòng header tối đa và lấy cột lá
            const maxLevel = getHeaderMaxLevel(columns);
            const leafColumns = getLeafColumns(columns);
            
            // 1. Tạo các dòng header
            const headerRows: any[][] = [];
            for (let i = 0; i < maxLevel; i++) {
                headerRows.push([]);
            }
            
            // 2. Điền header và thực hiện merge
            fillHeaderCells(columns, worksheet, 0, 0, headerRows, maxLevel);
            
            // 3. Áp dụng style cho header
            for (let rowIndex = 0; rowIndex < headerRows.length; rowIndex++) {
                const headerRow = worksheet.getRow(rowIndex + 1);
                headerRow.font = { bold: true };
                headerRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
                if (rowIndex === 0) {
                headerRow.height = 40;
                }
                else {
                headerRow.height = 25;
                }
                
            }
            
            // 4. Thêm dữ liệu
            const dataStartRow = headerRows.length + 1;
            data.forEach((rowData: any, rowIndex: number) => {
                const excelRow = worksheet.getRow(dataStartRow + rowIndex);
                
                leafColumns.forEach((col, colIndex) => {
                const fieldName = col.dataField ?? "";
                let cellValue = rowData[fieldName] ?? "";
                
                // Kiểm tra và format ngày tháng nếu cần
                if (fieldName && isDateField(fieldName, data) && cellValue) {
                    cellValue = formatDate(cellValue.toString());
                }
                
                const cell = excelRow.getCell(colIndex + 1);
                cell.value = cellValue;
                
                // Căn chỉnh theo cột
                if (col.align === 'center') {
                    cell.alignment = { horizontal: 'center' };
                } else if (col.align === 'right') {
                    cell.alignment = { horizontal: 'right' };
                }
                // Nếu cột là số, định dạng số
                // if (typeof cellValue === 'number') {
                //   cell.numFmt = '0.00';
                // }
                });
            });
            
            // 5. Điều chỉnh độ rộng cột dựa trên width đã được định nghĩa trong columns
            leafColumns.forEach((col, idx) => {
                const widthStr = col.width?.toString() || '';
                let widthValue = 12; // Giá trị mặc định nếu không có width
                
                // Chuyển đổi width từ px sang đơn vị của Excel (khoảng 7 pixel = 1 đơn vị Excel)
                if (widthStr.includes('px')) {
                const pixelWidth = parseInt(widthStr.replace('px', ''));
                widthValue = pixelWidth / 7;
                } else {
                // Nếu là số trực tiếp
                const numWidth = parseFloat(widthStr);
                if (!isNaN(numWidth)) {
                    widthValue = numWidth / 7;
                }
                }
                
            
                // Đảm bảo độ rộng tối thiểu và tối đa
                widthValue = Math.max(6, Math.min(30, widthValue));
                
                worksheet.getColumn(idx + 1).width = widthValue;
            });
            
            
            // 6. Thêm viền cho tất cả các ô
            worksheet.eachRow((row) => {
                row.eachCell((cell) => {
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
                });
            });
            
            // 7. Xuất file Excel
            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            saveAs(blob, `${exportConfig?.fileName ?? "Download"}`);
     }, [columns, data, exportConfig?.fileName])

     // Set export function to ref for parent access (OPTIMIZED WAY!)
     useEffect(() => {
         if (exportFunctionRef) {
             exportFunctionRef.current = handleExportAsync;
         }
         return () => {
             if (exportFunctionRef) {
                 exportFunctionRef.current = null;
             }
         };
     }, [handleExportAsync, exportFunctionRef]);

     const sortByName = useMemo(() => {
        return columns
            .filter((x) => x.dataField === sortByField)
            .map((x) => x.caption)
            .join(",");
    }, [columns, sortByField]);
    return (
        <Box id="toolbar" sx={{ display: "flex", mb: 1 }}>
            <Box
                id="left"
                sx={{
                    flex: 1,
                }}
            >
                {title && (
                    <PageCaption
                        text={title}
                    />
                )}
                {titleComponent && <Box>{titleComponent}</Box>}
                {(subTitle || subTitleComponent) &&
                    <Box>
                        {subTitle && <Text text={subTitle} sx={{
                            color: "fg.muted",
                            fontSize: "0.9rem"
                        }} />
                        }
                        {subTitleComponent && <>{subTitleComponent}</>}
                    </Box>
                }

            </Box>
            <Box
                id="actions"
                sx={{
                    display: "flex",
                    alignItems: "flex-start",
                }}
            >
                {actionComponent}
                {searchEnable && (
                    <Box sx={{ ml: 2 }}>
                        <TextInput
                            leadingVisual={SearchIcon}
                            placeholder={"Search"}
                            onValueDelayChanged={(value) => {
                                setSearchKey?.(value)
                            }}
                        ></TextInput>
                    </Box>
                )}
                {/* Menu sắp xếp CŨ trên thanh công cụ, nay phải khai `showInToolbar` mới hiện.
                    Vì sao đổi: cách sắp xếp chính giờ là bấm thẳng tiêu đề cột (Header.tsx), và
                    menu này KHÔNG diễn tả được trạng thái thứ ba (NONE) - nó chỉ có hai nút
                    tăng/giảm. Để nó tự hiện theo `enable` thì mọi màn vừa bật sort sẽ mọc thêm
                    một dropdown nói nửa sự thật, cạnh tiêu đề cột nói đủ. Không màn nào đang
                    truyền `sortConfig` trước lô này nên đổi mặc định không làm hỏng màn nào. */}
                {sortConfig && sortConfig.enable && sortConfig.showInToolbar === true && (
                    <Box sx={{ ml: 2 }}>
                        <ActionMenu>
                            <ActionMenu.Button
                                leadingVisual={
                                    sortConfig?.mode === eSortMode.DESC
                                        ? SortDescIcon
                                        : SortAscIcon
                                }
                                size={sortConfig?.size ?? eSize.small}
                            >
                                Sắp xếp theo <b>{sortByName}</b>
                            </ActionMenu.Button>
                            <ActionMenu.Overlay>
                                <ActionList
                                    selectionVariant="single"
                                    role="menu"
                                    aria-label=""
                                >
                                    {props.columns
                                        .filter((x) => x.dataField)
                                        .map((x, idx) => {
                                            return (
                                                <ActionList.Item
                                                    key={idx}
                                                    role="menuitemcheckbox"
                                                    selected={x.dataField === sortConfig.field}
                                                    onSelect={() => {
                                                        if (sortConfig && setSortConfig)
                                                            setSortConfig({
                                                                ...sortConfig,
                                                                field: x.dataField ?? "",
                                                            });
                                                    }}
                                                >
                                                    {x.caption}
                                                </ActionList.Item>
                                            );
                                        })}

                                    <ActionList.Divider></ActionList.Divider>
                                    <ActionList.Item
                                        role="menuitemcheckbox"
                                        selected={sortConfig.mode === eSortMode.ASC}
                                        onSelect={() => {
                                            if (sortConfig && setSortConfig)
                                                setSortConfig({
                                                    ...sortConfig,
                                                    mode: eSortMode.ASC,
                                                });
                                        }}
                                    >
                                        <ActionList.LeadingVisual>
                                            <SortAscIcon />
                                        </ActionList.LeadingVisual>
                                        Ascending
                                    </ActionList.Item>
                                    <ActionList.Item
                                        role="menuitemcheckbox"
                                        selected={sortConfig.mode === eSortMode.DESC}
                                        onSelect={() => {
                                            if (sortConfig && setSortConfig)
                                                setSortConfig({
                                                    ...sortConfig,
                                                    mode: eSortMode.DESC,
                                                });
                                        }}
                                    >
                                        <ActionList.LeadingVisual>
                                            <SortDescIcon />
                                        </ActionList.LeadingVisual>
                                        Descending
                                    </ActionList.Item>
                                </ActionList>
                            </ActionMenu.Overlay>
                        </ActionMenu>
                    </Box>
                )}
                 {exportConfig?.enable && (exportConfig?.showInToolbar !== false) && (
                     <Box sx={{ ml: 1 }}>
                         <IconButton
                             icon={DownloadIcon}
                             variant="default"
                             aria-label="Download"
                             size="small"
                             onClick={handleExportAsync}
                         />
                     </Box>
                 )}           
            </Box>
        </Box>
    );
};

export default Toolbar;