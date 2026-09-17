import {
  Box,
  Checkbox
} from "@primer/react";
import clsx from "clsx";
import React, { createContext, forwardRef, ReactNode, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { Column, useTable } from "react-table";

import styles from "./DataTable.module.css";
import { handleFilter, handleSearch, sortRows } from "./DataTableHelper";
import Header from "./Header";
import Loading from "./Loading";
import Paging from "./Paging";
import Rows from "./Rows";
import Toolbar from "./Toolbar";
import { eSize } from "../utils/types/eSize";
export enum eSortMode {
  ASC = "asc",
  DESC = "desc",
  /**
   * Trạng thái THỨ BA: không sắp xếp - bảng giữ nguyên thứ tự của mảng `data` truyền vào.
   *
   * Vì sao phải là một giá trị enum riêng, thay vì cứ để `field = undefined`: `field` undefined
   * hiện cũng cho ra "không sắp xếp", nhưng nhờ chốt `if (sortByField ...)` trong `filterdData`
   * chứ không phải nhờ một ý định được khai báo. Ai gỡ chốt đó đi thì phép sắp sẽ đem `a[""]` so
   * với `b[""]` - mọi dòng cùng khoá `undefined`. NONE nói thẳng ý định, và `sortRows` tự trả
   * nguyên mảng vào khi gặp nó (xem DataTableHelper.ts).
   */
  NONE = "none",
}

export interface IFocusCell {
  rowData: any;
  dataField: string;
}
export interface ISelectionProps {
  keyExpr?: string;
  mode: "multiple" | "single";
  onSelectionChanged: (keys: number[]) => void;
  selectedRowKeys?: number[];
}
export interface ISortConfig {
  /** Bật sắp xếp cho bảng. Bật xong, MỌI cột có `dataField` đều bấm được trên tiêu đề. */
  enable: boolean;
  /** Cột đang sắp xếp. `undefined` = chưa sắp xếp cột nào (đi kèm `mode: NONE`). */
  field?: string;
  /** Chiều sắp xếp. Vòng bấm tiêu đề: ASC -> DESC -> NONE -> ASC... */
  mode: eSortMode;
  size?: eSize;
  /**
   * Hiện thêm menu sắp xếp CŨ trên thanh công cụ (dropdown chọn cột + chọn chiều).
   * Mặc định TẮT: cách sắp xếp chính là bấm thẳng tiêu đề cột. Menu cũ không diễn tả được trạng
   * thái NONE nên bật lên sẽ lệch với dấu hiệu trên tiêu đề - chỉ bật khi thật sự cần.
   */
  showInToolbar?: boolean;
  /** Gọi mỗi khi người dùng đổi sắp xếp. `field` là "" khi vòng bấm về trạng thái NONE. */
  onValueChanged?: (field: string, mode: eSortMode) => void;
}
export interface IExportConfig {
  enable: boolean;
  fileName?: string;
  showInToolbar?: boolean;
}
interface IPaging {
  enable: boolean;
  pageSize?: number;
  pageSizeItems?: number[];
  hidePageInfo?: boolean
}

export interface IColumn {
  caption?: string;
  dataField?: string;
  /** Khi có cellRender, dùng để lọc/tìm theo text hiển thị thay vì giá trị raw của dataField */
  filterValue?: (row: any) => string | number | undefined | null;
  isMainColumn?: boolean;
  fixed?: boolean;
  id?: string;
  cellRender?: (data: any,rowIndex?: number) => JSX.Element;
  headerRender?: (data: any) => ReactNode;
  columns?: IColumn[];
  width?: number | string | undefined;
  minWidth?: number | string | undefined;
  maxWidth?: number | string | undefined;
  align?: "left" | "center" | "right";
  isAllowFocus?: boolean;
  isHideZeroValue?: boolean
  /**
   * Cho phép bấm tiêu đề cột này để sắp xếp. Mặc định: CÓ, với mọi cột có `dataField`.
   *
   * Đặt `false` cho cột mà sắp xếp là VÔ NGHĨA, chứ không phải chỉ "không cần". Ca đã biết: cột
   * STT do tầng page tự đánh số SAU KHI lọc (ThongKePage) - con số đó mô tả vị trí dòng trong
   * danh sách đang hiển thị, nên sắp theo nó vừa vô nghĩa vừa làm số nhảy cóc 1, 47, 12.
   * Cột chỉ có `id` (STT do DataTable sinh, ô chọn, cột hành động) tự động không sắp xếp được,
   * không phải khai gì thêm.
   */
  allowSorting?: boolean;
}
export interface ICheckDontSaveChange {
  fields: string[];
  rootDataSource: any[];
}
export interface IRangeSelectionKeyDownData {
  keyCode: string,
  rowKeys: any,
  dataFields: string[]
}
export interface IRangeSelectionProps {
  onKeyDown: (data: IRangeSelectionKeyDownData) => void
}
interface IFilterRowConfig {
  enable: boolean,
  onConditionChanged?: (cond: any) => void
}
export interface IFoucsedRow {
  keyExpr?: string;
  onFocusedRowChanged: (id: number) => void;
  focuseddRowKey?: number;
}

type IComparisonOperator =
  | "equals"
  | "contains"
  | "greaterThan"
  | "lessThan"
  | "greaterThanOrEqual"
  | "lessThanOrEqual";
// type ILogicOperator = "and" | "or";
export type IExpression = [string, IComparisonOperator, any];

export interface ICondition {
  field: string,
  operator: IComparisonOperator,
  value: any
}
interface IDataTableProps {
  width?: string;
  columns: IColumn[];
  data: any[];
  height?: string;
  title?: string;
  titleComponent?: React.ReactNode;
  subTitle?: string;
  subTitleComponent?: React.ReactNode;
  actionComponent?: React.ReactNode;
  isLoading?: boolean;
  paging?: IPaging;
  searchEnable?: boolean;
  sortConfig?: ISortConfig;
  exportConfig?: IExportConfig;
  selection?: ISelectionProps;
  onFocuseCellChanged?: (data: IFocusCell) => void;
  focusedCell?: IFocusCell;
  checkDontSaveChange?: ICheckDontSaveChange;
  emptyComponent?: React.ReactNode;
  rangeSelection?: IRangeSelectionProps,
  isNoPaddingCell?: boolean;
  filterRow?: IFilterRowConfig;
  focusedRow?: IFoucsedRow;
  groups?: IGrouping;
  showRowNumber?: boolean;
}
export interface IDataTableContext {
  props: IDataTableProps,
  searchKey?: string,
  setSearchKey?: (searchKey: string) => void,
  sortConfig?: ISortConfig,
  setSortConfig?: (sortConfig: ISortConfig) => void,
  sortByField: string,
  sortMode: eSortMode,
  /** Bấm tiêu đề cột: chạy một bước trong vòng ba trạng thái ASC -> DESC -> NONE. */
  toggleSortByField?: (field: string) => void,
  headerGroups: any[],
  allColumns: any[],
  conditions: ICondition[],
  setConditions: (conditions: ICondition[]) => void,
  getTableBodyProps: any,
  pagedData: any[],
  filterdData: any[],
  rows: any[],
  prepareRow: any,
  selectedCells: any,
  setSelectedCells: any,
  isSelecting: boolean,
  setIsSelecting: (isSelecting: boolean) => void,
  startCell: any,
  setStartCell: (startCell: any) => void,
  pageIndex: number,
  setPageIndex: (pageIndex: number) => void,
  pageSize: number,
  setPageSize: (pageSize: number) => void,
  pageCount: number,
  focusedRow?: IFoucsedRow,
  exportConfig?: IExportConfig;
  expandedGroupValue?: any[]
  setExpandedGroupValue?: (data: any[]) => void,
  wrapperRef?: React.MutableRefObject<any>,
  exportFunctionRef?: React.MutableRefObject<(() => Promise<void>) | null>

}
export const DataTableContainerContext = createContext<IDataTableContext>({
  props: {} as any,
  sortByField: "",
  sortMode: eSortMode.NONE,
  headerGroups: [],
  allColumns: [],
  conditions: [],
  setConditions: {} as any,
  getTableBodyProps: {} as any,
  pagedData: [],
  filterdData: [],
  rows: [],
  prepareRow: {} as any,
  selectedCells: {},
  setSelectedCells: {},
  isSelecting: false,
  setIsSelecting: {} as any,
  startCell: {},
  setStartCell: {} as any,
  pageIndex: 0,
  setPageIndex: {} as any,
  pageSize: 0,
  setPageSize: {} as any,
  pageCount: 0,
  exportConfig: undefined

});
export interface IGroupRenderContext {
  groupValue: unknown;
  groupValueField: string;
  groupDatas: any[];
  caption?: string;
}

export interface IGrouping {
  defaultExpandedValues?: Array<string | number | null>
  columns: IGroupingColumn[]
}

export interface IGroupingColumn {
  dataField: string,
  groupRender?: (ctx: IGroupRenderContext) => ReactNode;
}

export interface IDataTableRef {
  exportToExcel: () => Promise<void>;
}

const DataTable = forwardRef<IDataTableRef, IDataTableProps>((props, ref) => {
  const { data, isLoading, paging, groups } = props;
  const _wrapperRef = useRef<any>();
  const logicOperator = "and";
  const [_expandedGroupValue, _setExpandedGroupValue] = useState<any[]>(props.groups?.defaultExpandedValues ?? []);
  const _exportFunctionRef = useRef<(() => Promise<void>) | null>(null);

  const [_searchKeyDelayed, _setSearchKeyDelayed] = useState("");
  const [_pageIndex, _setPageIndex] = useState(0);
  const [_pageSize, _setPageSize] = useState(props.paging?.pageSize ?? 20);

  const [_sortConfig, _setSortConfig] = useState(props.sortConfig);
  // Trạng thái vùng được chọn
  const [_selectedCells, _setSelectedCells] = useState(new Set());
  const [_isSelecting, _setIsSelecting] = useState(false);
  const [_startCell, _setStartCell] = useState<any>(null);
  const [_conditions, _setConditions] = useState<ICondition[]>([]);

  const _selectedRowKeys = useMemo(() => {
    return new Set(props.selection?.selectedRowKeys ?? []);
  }, [props.selection?.selectedRowKeys])
  const sortByField = useMemo(() => {
    return _sortConfig?.field ?? "";
  }, [_sortConfig]);
  // Mặc định là NONE, không phải DESC. Giá trị cũ DESC không gây hại vì `filterdData` còn phải
  // có `sortByField` mới sắp, nhưng nó nói sai trạng thái cho bất kỳ ai đọc `sortMode` để vẽ
  // dấu hiệu - và giờ Header.tsx làm đúng việc đó.
  const _sortMode = _sortConfig?.mode ?? eSortMode.NONE;

  // 🔴 LỖI CÓ SẴN, sửa ở lô này: `useState(props.sortConfig)` chỉ đọc prop ở lần render ĐẦU
  // TIÊN. Trang nào đổi `sortConfig` về sau (bật/tắt sort theo quyền, đổi cột mặc định) thì
  // bảng không bao giờ biết. Đây KHÔNG phải lý do sort chưa từng chạy trên cổng - lý do đó là
  // chưa màn nào truyền `sortConfig` xuống; nhưng lỗi này sẽ cắn ngay khi có màn làm thế.
  //
  // Đồng bộ theo GIÁ TRỊ chứ không theo danh tính object: các trang khai `sortConfig={{...}}`
  // inline nên mỗi lần render là một object MỚI - để nguyên object vào deps thì effect chạy mỗi
  // render, setState object mới, render lại... vòng lặp render vô hạn.
  // Tách ra biến rời trước khi cho vào deps để không phải viết optional chaining trong mảng deps.
  const _propSortEnable = props.sortConfig?.enable;
  const _propSortField = props.sortConfig?.field;
  const _propSortMode = props.sortConfig?.mode;
  const _propSortSize = props.sortConfig?.size;
  const _propSortInToolbar = props.sortConfig?.showInToolbar;
  useEffect(() => {
    _setSortConfig((prev) => {
      const chuaKhaiGi = _propSortEnable === undefined && _propSortField === undefined
        && _propSortMode === undefined && _propSortSize === undefined && _propSortInToolbar === undefined;
      if (chuaKhaiGi) return prev === undefined ? prev : undefined;
      // Giữ nguyên object cũ khi nội dung không đổi -> không render thừa, và KHÔNG xoá mất sắp
      // xếp mà người dùng vừa bấm trên tiêu đề (thao tác đó chỉ đổi state, không đổi prop).
      if (prev?.enable === _propSortEnable && prev?.field === _propSortField
        && prev?.mode === _propSortMode && prev?.size === _propSortSize
        && prev?.showInToolbar === _propSortInToolbar) return prev;
      return {
        enable: _propSortEnable ?? false,
        field: _propSortField,
        mode: _propSortMode ?? eSortMode.NONE,
        size: _propSortSize,
        showInToolbar: _propSortInToolbar,
      };
    });
  }, [_propSortEnable, _propSortField, _propSortMode, _propSortSize, _propSortInToolbar]);

  // `onValueChanged` giữ trong ref: trang thường khai nó inline nên danh tính hàm đổi mỗi render,
  // cho vào deps hay vào state đều sinh render thừa. Ref luôn trỏ bản mới nhất.
  const _sortChangedRef = useRef(props.sortConfig?.onValueChanged);
  useEffect(() => {
    _sortChangedRef.current = props.sortConfig?.onValueChanged;
  });

  // Vòng BA TRẠNG THÁI của một cột: tăng -> giảm -> tắt (về thứ tự gốc) -> tăng...
  // Bấm sang cột KHÁC thì bắt đầu lại từ "tăng dần", không kế thừa chiều của cột cũ: người dùng
  // vừa đổi TIÊU CHÍ sắp xếp chứ không phải đổi chiều của tiêu chí đang có.
  const toggleSortByField = useCallback((field: string) => {
    const truoc = _sortConfig;
    const nen: ISortConfig = truoc ?? { enable: true, mode: eSortMode.NONE };
    let sau: ISortConfig;
    if (truoc?.field !== field) sau = { ...nen, field, mode: eSortMode.ASC };
    else if (truoc.mode === eSortMode.ASC) sau = { ...nen, field, mode: eSortMode.DESC };
    else if (truoc.mode === eSortMode.DESC) sau = { ...nen, field: undefined, mode: eSortMode.NONE };
    else sau = { ...nen, field, mode: eSortMode.ASC };
    _setSortConfig(sau);
    _sortChangedRef.current?.(sau.field ?? "", sau.mode);
  }, [_sortConfig]);
  useEffect(() => {
    _setExpandedGroupValue(props.groups?.defaultExpandedValues ?? [])
  }, [props.groups?.defaultExpandedValues])

  const filterdData: any[] = useMemo(() => {
    let resultData: any[] = [...data];

    if (_searchKeyDelayed) {
      resultData = handleSearch(props.columns, data, _searchKeyDelayed);
    }
    // NONE = trả bảng về đúng thứ tự mảng `data` truyền vào. `sortRows` KHÔNG mutate mảng vào và
    // trả mảng mới, nên `props.data` không bao giờ bị `.sort()` đụng tới - đó là thứ giữ cho
    // trạng thái thứ ba quay về đúng thứ tự gốc.
    // `sortRows` tính khoá sắp xếp một lần cho mỗi dòng, không phải mỗi phép so sánh:
    // thay vì tính lại ở từng phép so sánh. Trên 5000 dòng cột "Họ tên" đo được 180ms -> 15ms.
    if (sortByField && _sortMode !== eSortMode.NONE) {
      resultData = sortRows(resultData, sortByField, _sortMode);
    }
    if (_conditions.length > 0) {
      resultData = handleFilter(_conditions, resultData, logicOperator, props.columns);
    }
    return resultData;
  }, [_searchKeyDelayed, data, props.columns, sortByField, _sortMode, _conditions]);

  const pageCount = useMemo(() => {
    if (_pageSize <= 0) return filterdData.length;
    const c = Math.floor(filterdData.length / _pageSize);
    if (c * _pageSize < filterdData.length) return c + 1;
    return c;
  }, [filterdData.length, _pageSize]);

  // const pagedData = useMemo(() => {
  //   if (paging?.enable === true) {
  //     const data = filterdData.slice(
  //       _pageSize * _pageIndex,
  //       _pageSize * _pageIndex + _pageSize
  //     );
  //     return data;
  //   }
  //   return filterdData;
  // }, [filterdData, _pageIndex, _pageSize, paging?.enable]);
  const pagedData = useMemo(() => {
    let result: any[] = [];
    if (paging?.enable === true) {
      const data = filterdData.slice(
        _pageSize * _pageIndex,
        _pageSize * _pageIndex + _pageSize
      );
      result = data;
    } else {
      result = filterdData;
    }


    if (groups && groups.columns && groups.columns.length > 0) {
      let resultGrouped: any[] = [];
      groups.columns.forEach(group => {
        const groupValues = Array.from(new Set(result.map(x => x[group.dataField])))
        groupValues.forEach(groupValue => {
          const groupData = result.filter(x => x[group.dataField] === groupValue);
          if (groupData.length > 0) {
            let groupRowData: any = {
              id: groupValue,
              rowDisplayType: "group",
              groupValue: groupValue,
              groupValueField: group.dataField
            };

            groupRowData[group.dataField] = groupData[0][group.dataField]
            resultGrouped.push(groupRowData)
            if (_expandedGroupValue.includes(groupValue)) {
              resultGrouped.push(...groupData);
            }
          }
        })
      })
      return resultGrouped;
    }
    return result;
    //   if (paging?.enable === true) {
    //     const data = filterdData.slice(
    //       _pageSize * _pageIndex,
    //       _pageSize * _pageIndex + _pageSize
    //     );
    //     return data;
    //   }
    //   return filterdData;

  }, [filterdData, _pageIndex, _pageSize, groups, _expandedGroupValue]);



  useEffect(() => {
    if (props.paging?.pageSize) {
      _setPageSize(props.paging.pageSize);
    }
  }, [props.paging?.pageSize]);
  // Đổi sắp xếp thì về trang 1. Trước đây chỉ nghe `sortByField`, nên đảo ASC<->DESC (cùng một
  // cột) giữ nguyên trang: đang ở trang 7, bấm đảo chiều, vẫn thấy trang 7 của thứ tự mới - gần
  // như chắc chắn không phải dòng người dùng đang muốn nhìn.
  useEffect(() => {
    _setPageIndex(0);
  }, [sortByField, _sortMode]);



  // Kết thúc chọn vùng
  const handleMouseUp = () => {
    _setIsSelecting(false);
    _setStartCell(null);
  };


  const settingColum = useCallback((column: IColumn): Column => {
    const col: any = {
      ...column,
      width: column.width,
      minWidth: column.minWidth,
      columns:
        column.columns && column.columns.length > 0
          ? column.columns.map((x) => settingColum(x))
          : undefined,
      Header: column.caption ?? "",
      accessor: column.dataField ?? column.id ?? "",
    };
    return col;
  }, []);
  const columns: any[] = useMemo(() => {
    let col = props.columns.map((x) => {
      return settingColum(x);
    });

    function hasAnyFixedColumn(columns: IColumn[]): boolean {
      return columns.some(col => 
        col.fixed || (col.columns && hasAnyFixedColumn(col.columns))
      );
    }

    const hasAnyFixed = hasAnyFixedColumn(props.columns);
    if (props.showRowNumber) {
            const sttCol: any = {
              id: "stt",
              caption: "STT",
              width: "40px",
              align: "center",
              fixed: hasAnyFixed ? true : undefined,
              cellRender: (_data: any, rowIndex: number) => <span>{rowIndex + 1}</span>,
              headerRender: () => <span>STT</span>,
            };
            col = [sttCol, ...col];
      }

    if (props.selection?.mode === "multiple") {
      const selectionCol: any = {
        id: "selection",
        width: "40px",
        align: "center",
        cellRender: (data: any) => {
          const id = data.id;
          return (
            <Checkbox
              checked={_selectedRowKeys.has(id)}
              disabled={data.disabled}
              onChange={(e) => {
                if (e.target.checked) {
                  props.selection?.onSelectionChanged([
                    ...(props.selection?.selectedRowKeys ?? []),
                    id,
                  ]);
                } else {
                  props.selection?.onSelectionChanged([
                    ...(props.selection?.selectedRowKeys ?? []).filter(
                      (x) => x !== id
                    ),
                  ]);
                }
              }}
            />
          );
        },
        headerRender: () => {
          return (
            <Checkbox
              checked={
                filterdData.filter((g) => !g.disabled).length > 0 &&
                filterdData
                  .filter((g) => !g.disabled)
                  .find(
                    (x) =>
                      !(props.selection?.selectedRowKeys ?? []).includes(x.id)
                  ) === undefined
              }
              onChange={(e) => {
                const ids = filterdData
                  .filter((g) => !g.disabled)
                  ?.map((x) => x.id);
                if (e.target.checked) {
                  props.selection?.onSelectionChanged(
                    Array.from(
                      new Set([
                        ...(props.selection?.selectedRowKeys ?? []),
                        ...ids,
                      ])
                    )
                  );
                } else {
                  props.selection?.onSelectionChanged(
                    Array.from(
                      new Set(
                        (props.selection?.selectedRowKeys ?? []).filter(
                          (x) => !ids.includes(x)
                        )
                      )
                    )
                  );
                }
              }}
            />
          );
        },
      };
      return [selectionCol, ...col];
    }
    return col;
  }, [_selectedRowKeys, filterdData, props.columns, props.selection, settingColum, props.showRowNumber]);
  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow, allColumns } =
    useTable<any>({ columns, data: pagedData });
  const handleKeyDown = useCallback((e: any) => {
    if (_selectedCells.size > 0 && rows.length > 0) {
      let rowIndexs: number[] = [];
      let colIndexs: number[] = [];
      _selectedCells.forEach((cell: any) => {
        const [rowIndx, colIndex] = cell.split('-').map((c: any) => parseInt(c));
        if (!rowIndexs.includes(rowIndx)) rowIndexs.push(rowIndx);
        if (!colIndexs.includes(colIndex)) colIndexs.push(colIndex);

      })
      rowIndexs = Array.from(new Set(rowIndexs));
      colIndexs = Array.from(new Set(colIndexs));
      let rowKeys: number[] = [];
      let dataFields: string[] = [];
      rowIndexs.forEach(rowIndex => {
        const rowData = rows[rowIndex]?.original;
        if (rowData) rowKeys.push(rowData.id)
      })
      colIndexs.forEach(colIndex => {
        const cell = rows[0].cells[colIndex];
        if (cell) {
          const column: any = cell.column;
          dataFields.push(column?.dataField ?? "")
        }
      })


      if (props.rangeSelection && props.rangeSelection.onKeyDown) {
        props.rangeSelection.onKeyDown({
          dataFields,
          rowKeys,
          keyCode: e.key
        })
      }

    }
  }, [_selectedCells, props.rangeSelection, rows])
  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    // Dọn dẹp sự kiện khi component unmount
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [_selectedCells, handleKeyDown]);

  // Expose export function through ref (OPTIMIZED WAY!)
  useImperativeHandle(ref, () => ({
    exportToExcel: async () => {
      if (_exportFunctionRef.current) {
        await _exportFunctionRef.current();
      }
    }
  }), []);

  const contextValue: IDataTableContext = {
    props,
    searchKey: _searchKeyDelayed,
    setSearchKey: _setSearchKeyDelayed,
    sortConfig: _sortConfig,
    //   sortConfig: _sortConfig ?? {
    //   mode: eSortMode.ASC,
    //   enable: true
    // },
    setSortConfig: _setSortConfig,
    sortByField,
    sortMode: _sortMode,
    toggleSortByField,
    headerGroups,
    allColumns,
    conditions: _conditions,
    setConditions: _setConditions,
    getTableBodyProps,
    pagedData,
    rows,
    prepareRow,
    selectedCells: _selectedCells,
    setSelectedCells: _setSelectedCells,
    isSelecting: _isSelecting,
    setIsSelecting: _setIsSelecting,
    setStartCell: _setStartCell,
    startCell: _startCell,
    pageIndex: _pageIndex,
    pageSize: _pageSize,
    setPageIndex: _setPageIndex,
    setPageSize: _setPageSize,
    pageCount,
    focusedRow: props.focusedRow,
    filterdData: filterdData,
    expandedGroupValue: _expandedGroupValue,
    setExpandedGroupValue: _setExpandedGroupValue,
    wrapperRef: _wrapperRef,
    exportFunctionRef: _exportFunctionRef
  };
  return (
    <Box>
      <DataTableContainerContext.Provider value={contextValue}>
        <Toolbar />
        <Box
          id="warpper"
          sx={{
            position: "relative",
              paddingBottom: paging?.enable === true ? "40px" : undefined,
          }}
          ref={_wrapperRef}
        >
          <Box
            className={clsx(styles.container)}
            sx={{
              overflow: "auto",
                //  height: props.height ?? "auto",
                height: paging?.enable === true ? `calc(${props.height} - 40px)` : props.height ?? "auto",
            }}

          >
            <table
              {...getTableProps()}
              className={clsx(
                styles.myTable,
                props.isNoPaddingCell ? styles.noPadding : undefined,
                props.rangeSelection ? styles.rangeSelection : undefined,
                paging?.enable === true ? styles.hasPaging : ""
              )}
              onMouseUp={props.rangeSelection ? handleMouseUp : undefined}

            >
              <Header />
              {isLoading &&
                <Loading />
              }
              {!isLoading && (
                <>
                  <Rows />
                </>
              )}
            </table>
          </Box>
          {paging?.enable === true && pageCount > 0 && (
            <Paging />
          )}
        </Box>
      </DataTableContainerContext.Provider>
    </Box>
  );
});

DataTable.displayName = 'DataTable';

// Attach static components properly
const DataTableWithStatics = DataTable as typeof DataTable & {
  Toolbar: typeof Toolbar;
  Header: typeof Header;
  Loading: typeof Loading;
  Rows: typeof Rows;
  Paging: typeof Paging;
};

DataTableWithStatics.Toolbar = Toolbar;
DataTableWithStatics.Header = Header;
DataTableWithStatics.Loading = Loading;
DataTableWithStatics.Rows = Rows;
DataTableWithStatics.Paging = Paging;

export default DataTableWithStatics;
