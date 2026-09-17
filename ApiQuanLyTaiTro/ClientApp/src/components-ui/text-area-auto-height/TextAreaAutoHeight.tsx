import { Textarea, TextareaProps } from '@primer/react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import useAutosizeTextArea from '../../hooks/useAutosizeTextArea';

interface ITextAreaAutoHeightProps extends TextareaProps {
    isAutoFocus?: boolean,
    onValueChanged?: (value: string) => void,
    isNoBorder?: boolean
}
const TextAreaAutoHeight = (props: ITextAreaAutoHeightProps) => {

    const [value, setValue] = useState("");
    const textAreaRef = useRef<HTMLTextAreaElement>(null);
    useAutosizeTextArea(textAreaRef.current, value);
    useLayoutEffect(() => {
        if (props.defaultValue) {
            setValue(props.defaultValue.toString())

        }
        if (props.isAutoFocus) {
            textAreaRef.current?.focus()
        }
    }, [props.defaultValue, props.isAutoFocus])
    useEffect(() => {
        if (textAreaRef.current) {
            textAreaRef.current.value = props.defaultValue?.toString() ?? ""
        }
    }, [props.defaultValue])
    const handleChange = (evt: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = evt.target?.value;
        setValue(val);
        if (props.onChange) {
            props.onChange(evt);
        }
    };
    return (
        <>
            <Textarea
                {
                ...props
                }
                sx={{
                    ...props.sx,
                    outline: props.isNoBorder ? "none!important" : undefined,
                    border: props.isNoBorder ? "none" : undefined,
                    boxShadow: props.isNoBorder ? "none" : undefined,
                }}
                rows={1}

                resize='none'
                defaultValue={props.defaultValue}
                ref={textAreaRef}
                onChange={handleChange}
                onBlur={(e) => {
                    if (props.onValueChanged) {
                        props.onValueChanged(e.target.value)
                    }
                    props.onBlur?.(e)

                }}

            />
        </>
    );
};

export default TextAreaAutoHeight;