import { ChevronDownIcon, ChevronRightIcon } from '@primer/octicons-react';
import { Box, Checkbox, IconButton } from '@primer/react';
import { useContext, useRef } from 'react';
import { useElementPosition } from '../../hooks/useElementPosition';
import { DataTableContainerContext, IDataTableContext, ISelectionProps } from './DataTable';
import styles from "./DataTable.module.css";
interface IGroupRowProps {
    selection?: ISelectionProps,
    row: any
}
const GroupRow = (props: IGroupRowProps) => {
    const { row, selection, } = props;
    const { filterdData, expandedGroupValue, setExpandedGroupValue, wrapperRef, props: tableProps
    } = useContext<IDataTableContext>(DataTableContainerContext);
    const groupValueField = row.original.groupValueField;
    const groupValue = row.original[groupValueField];
    const groupDatas = filterdData.filter(x => x[groupValueField] === groupValue);
    const isExpanded = expandedGroupValue && expandedGroupValue.includes(groupValue);

    const wrapPosition = useElementPosition(wrapperRef);

    const groupRef = useRef<any>();
    const groupPosition = useElementPosition(groupRef)
    const caption = row.cells.find((x: any) => x.column.dataField === groupValueField)?.column.caption
    const groupColumn = tableProps.groups?.columns?.find((col) => col.dataField === groupValueField);
    const groupLabel = groupColumn?.groupRender
        ? groupColumn.groupRender({ groupValue, groupValueField, groupDatas, caption })
        : caption
            ? `${caption}: ${groupValue}`
            : String(groupValue ?? "");
    // console.log({
    //     wrapPosition,
    //     groupPosition
    // });
    return (
        <>

            <td
                // colSpan={row.cells.length - (selection && selection.mode === "multiple" ? 1 : 0)}
                colSpan={row.cells.length}
                style={{
                    fontWeight: 700,
                    backgroundColor: "#F5F8FA",
                }}
                className={styles.fixed_column}
            >
                <Box
                    ref={groupRef}
                    sx={{
                        display: "flex",
                        gap: 2,
                        alignItems: "center",
                        mt: -1,
                        mb: -1,
                        paddingLeft: `${wrapPosition.x - groupPosition.x}px`
                        // position: "sticky",
                        // left: 0

                    }}

                >
                    {selection && selection.mode === "multiple" &&
                        <Box style={{
                            fontWeight: 700,
                            backgroundColor: "#F5F8FA",
                            // width: "40px",
                            marginLeft: "40px",
                            // display: "flex",
                            // justifyContent: "center"
                        }}>
                            <Checkbox
                                checked={
                                    groupDatas.filter((g) => !g.disabled).length > 0 &&
                                    groupDatas
                                        .filter((g) => !g.disabled)
                                        .find(
                                            (x) =>
                                                !(props.selection?.selectedRowKeys ?? []).includes(x.id)
                                        ) === undefined
                                }
                                onChange={(e) => {
                                    const ids = groupDatas
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
                        </Box>
                    }
                    <IconButton icon={isExpanded ? ChevronDownIcon : ChevronRightIcon} aria-label='' variant='invisible' size='small'
                        onClick={() => {
                            if (isExpanded) {
                                setExpandedGroupValue?.([...(expandedGroupValue ?? []).filter(x => x !== groupValue)])
                            } else {
                                setExpandedGroupValue?.([...(expandedGroupValue ?? []), groupValue])
                            }
                        }}
                    />
                    <Box sx={{ flex: 1 }}>
                        {groupLabel}
                    </Box>
                </Box>

            </td>
        </>
    );
};

export default GroupRow;