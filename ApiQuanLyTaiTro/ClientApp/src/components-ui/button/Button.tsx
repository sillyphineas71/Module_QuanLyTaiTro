import { Button, ButtonProps, Spinner, Tooltip } from '@primer/react';
import styles from "./Button.module.css";
export interface IMyButtonProps extends ButtonProps {
    text?: string,
    isLoading?: boolean,
    tooltip?: string,
    tooltipdDirection?: 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw',
}
const Loading = () => {
    return <Spinner size='small' />
}
const MyButton = (props: IMyButtonProps) => {

    return (
        <>
            {!props.tooltip &&
                <Button
                    {...props}
                    size={props.size ?? "small"}
                    leadingVisual= {(props.isLoading) ? Loading : props.leadingVisual}
                    disabled={props.isLoading || props.disabled}
                    className={styles[props.variant ?? "default"]} // Use the variant prop to determine the class
                >
                    {props.text}
                    {props.children}
                </Button>
            }
            {props.tooltip &&
                <Tooltip text={props.tooltip!} direction={props.tooltipdDirection ?? 'n'}>

                    {/* R3: BỔ SUNG className. Nhánh CÓ tooltip trước đây QUÊN nó, nên cùng một
                        <MyButton variant="primary">, chỉ thêm prop tooltip là nút rơi sang một
                        đường tạo kiểu khác. Lỗi "một nút hai màu" ghi ở App.tsx từng do đúng chỗ
                        này; nó tạm lặng vì theme Primer đã được trỏ về cùng màu, nhưng phản hồi
                        :active thêm ở R3 thì KHÔNG có đường thứ hai nào bù - thiếu className là
                        nút có tooltip mất hẳn phản hồi bấm. */}
                    <Button
                        {...props}
                        size={props.size ?? "small"}
                        leadingVisual={(props.isLoading) ? Loading : props.leadingVisual}
                        disabled={props.isLoading || props.disabled}
                        className={styles[props.variant ?? "default"]}
                    >
                        {props.text}
                        {props.children}
                    </Button>
                </Tooltip>

            }
        </>

    );
};

export default MyButton;