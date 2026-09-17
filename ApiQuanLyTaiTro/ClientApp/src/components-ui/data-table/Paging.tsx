import { Box, Pagination } from '@primer/react';
import clsx from 'clsx';
import React, { useContext } from 'react';
import styles from "./DataTable.module.css"
import { DataTableContainerContext, IDataTableContext } from './DataTable';
import Button from '../button';
const Paging = () => {
    const { props, pageIndex, pageSize, setPageIndex, setPageSize, pageCount } = useContext<IDataTableContext>(DataTableContainerContext);
    return (
        <>
            <Box
                id="paging"
                className={clsx(styles.pagingContainer)}
                sx={{
                    display: "flex",
                    alignItems: "center",
                    // minHeight: "30px"
                }}
            >

                {props.paging?.pageSizeItems && (
                    <Box sx={{ flex: 1 }}>
                        <Box
                            sx={{
                                display: "flex",
                                alignItems: "center",
                            }}
                        >
                            <Box
                                sx={{
                                    // 🔴 11px CUỐI CÙNG còn sống trong cổng sau lô đồng bộ font
                                    // (2026-09-14) - CỐ Ý để lại, lead chốt. Mọi 11px khác đã lên
                                    // 12/13px vì 11px là cỡ tệ nhất cho dấu tiếng Việt.
                                    // Vì sao chỗ này được miễn: đây là số trang trong thanh phân
                                    // trang CHIỀU CAO CỐ ĐỊNH (.pagingContainer height: 40px).
                                    // Nới cỡ chữ ở đây có thể xô layout thanh đó, mà nó nằm dưới
                                    // MỌI bảng của cổng ⇒ cần một lô riêng có QA thanh phân trang,
                                    // không gộp vào lô font. Đừng "dọn cho hết" nếu chưa QA.
                                    fontSize: "11px",
                                    color: "fg.muted",
                                }}
                            >
                                Page size&nbsp;&nbsp;
                            </Box>
                            {props.paging?.pageSizeItems.map((x) => {
                                return (
                                    <Button
                                        key={x}
                                        // className={clsx(
                                        //     styles.pageSize,
                                        //     x === pageSize ? styles.selected : ""
                                        // )}
                                        variant="invisible"
                                        sx={{
                                            color: x === pageSize ? "#fff" : "fg.default",
                                            backgroundColor: x === pageSize ? "var(--primary)" : "transparent",
                                            fontWeight: x === pageSize ? 600 : 400,
                                            borderRadius: "6px",
                                        }}
                                        size="small"
                                        onClick={() => {
                                            setPageSize(x);
                                            setPageIndex(0);
                                        }}
                                    >
                                        {x.toString()}
                                    </Button>
                                );
                            })}
                        </Box>
                    </Box>
                )}
                {!(props.paging?.hidePageInfo ?? false) &&
                    <Box id="info" sx={{ width: "100px", textAlign: "center" }}>
                        <Box
                            sx={{
                                color: "fg.muted",
                            }}
                        >
                            {pageIndex * pageSize + 1} -{" "}
                            {(pageIndex + 1) * pageSize > props.data.length
                                ? props.data.length
                                : (pageIndex + 1) * pageSize}{" "}
                            of {props.data.length}
                        </Box>
                    </Box>
                }


                <Box
                    sx={{ flex: 1, display: "flex", flexDirection: "row-reverse" }}
                >
                    {pageCount > 1 && (
                        <Pagination
                            pageCount={pageCount}
                            currentPage={pageIndex + 1}
                            showPages={{
                                narrow: false,
                            }}
                            onPageChange={(e, n) => {
                                setPageIndex(n - 1);
                            }}
                        />
                    )}
                </Box>
            </Box>
        </>
    );
};

export default Paging;