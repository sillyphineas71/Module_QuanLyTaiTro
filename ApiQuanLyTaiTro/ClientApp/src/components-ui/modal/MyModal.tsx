import { Dialog, DialogProps } from '@primer/react/experimental';
interface IMyModalProps extends DialogProps {
    children?: React.ReactNode,
    titleComponent?: React.ReactNode,
    onClose: () => void,
    width?: "small" | "medium" | "large" | "xlarge",
    isOpen?: boolean,
}


const MyModal = (props: IMyModalProps) => {
return (<>
    {props.isOpen && 
    <Dialog 
        title={props.title ? props.title?.toString() : props.titleComponent}
        subtitle={props.subtitle ? props.subtitle.toString() : undefined}
        width={props.width}
        height={props.height}
        sx={props.sx}
        onClose={props.onClose}
        renderHeader={props.renderHeader}
        >
            {props.children}
        </Dialog>

    }
    </>
);
};

export default MyModal;



