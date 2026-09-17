import React, { useContext } from 'react';
import { DataTableContainerContext, IDataTableContext } from './DataTable';
import { Box } from '@primer/react';
import { PlaceHolder } from '../place-holder';

const Loading = () => {
    const {  headerGroups, getTableBodyProps } = useContext<IDataTableContext>(DataTableContainerContext);
    return (

        <tbody {...getTableBodyProps()}>
            {headerGroups.map((headerGroup: any, hIdx) => (
                <tr {...headerGroup.getHeaderGroupProps()} key={hIdx}>
                    {headerGroup.headers.map((column: any, idx: number) => {
                        return (
                            <td
                                {...column.getHeaderProps()}
                                style={{
                                    width: column.placeholderOf
                                        ? column.placeholderOf.width ??
                                        column.placeholderOf.minWidth
                                        : column.width ?? column.minWidth,
                                }}
                                key={idx}
                            >
                                <Box sx={{ m: "-1rem", mb: "-1.8rem" }}>
                                    <PlaceHolder line_number={1} />
                                </Box>
                            </td>
                        );
                    })}
                </tr>
            ))}
            {headerGroups.map((headerGroup: any, hIdx) => (
                <tr {...headerGroup.getHeaderGroupProps()} key={hIdx}>
                    {headerGroup.headers.map((column: any, idx: number) => {
                        return (
                            <td

                                {...column.getHeaderProps()}
                                style={{
                                    width: column.placeholderOf
                                        ? column.placeholderOf.width ??
                                        column.placeholderOf.minWidth
                                        : column.width ?? column.minWidth,
                                }}
                                key={idx}
                            >
                                <Box sx={{ m: "-1rem", mb: "-1.8rem" }}>
                                    <PlaceHolder line_number={1} />
                                </Box>
                            </td>
                        );
                    })}
                </tr>
            ))}
            {headerGroups.map((headerGroup: any, hIdx) => (
                <tr {...headerGroup.getHeaderGroupProps()} key={hIdx}>
                    {headerGroup.headers.map((column: any, idx: number) => {
                        return (
                            <td
                                key={idx}
                                {...column.getHeaderProps()}
                                // className={clsx(idx === 0 ? styles.fixed_column_header : "")}
                                style={{
                                    width: column.placeholderOf
                                        ? column.placeholderOf.width ??
                                        column.placeholderOf.minWidth
                                        : column.width ?? column.minWidth,
                                }}
                            >
                                <Box sx={{ m: "-1rem", mb: "-1.8rem" }}>
                                    <PlaceHolder line_number={1} />
                                </Box>
                            </td>
                        );
                    })}
                </tr>
            ))}
        </tbody>

    );
};

export default Loading;