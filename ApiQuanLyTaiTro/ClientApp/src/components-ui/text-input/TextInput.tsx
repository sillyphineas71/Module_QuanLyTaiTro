import { FormControl, TextInput, TextInputProps, useFormControlForwardedProps } from '@primer/react';
import styles from './TextInput.module.css'
import { useEffect, useState } from 'react';
import { useDebounce } from 'use-debounce';
import type { RegisterOptions } from 'react-hook-form';

export interface IMyTextInputProps extends TextInputProps {
    register?: any,
    errors?: any,
    validateMessage?: string,
    name?: string,
    required?: boolean,
    minLength?: number,
    maxLength?: number,
    ref?: any,
    onValueDelayChanged?: (value: any) => void,
    /** Rule react-hook-form bổ sung (pattern RegExp, validate...). Gộp vào register() SAU các rule
     *  dựng sẵn bên dưới nên ghi đè được chúng. Chỉ có tác dụng ở nhánh có register + name.
     *  Cần thiết vì `pattern` của TextInputProps là thuộc tính HTML (string) - react-hook-form chỉ
     *  chạy `pattern` khi giá trị là RegExp nên không thể khai rule regex qua prop đó. */
    rules?: RegisterOptions,
}
const MyTextInput = (props: IMyTextInputProps) => {
    const { register, errors } = props;

    // Các prop "của riêng component này" KHÔNG phải thuộc tính DOM - tách ra để không đẩy xuống
    // thẻ <input> thật (React cảnh báo unknown attribute). Phần còn lại (block/type/placeholder/
    // required/minLength/maxLength/pattern...) vẫn truyền xuống y như trước.
    const {
        register: _registerProp,
        errors: _errorsProp,
        validateMessage: _validateMessageProp,
        rules: _rulesProp,
        onValueDelayChanged: _onValueDelayChangedProp,
        ...domProps
    } = props;

    // Primer FormControl chỉ tự gắn id/required/disabled/aria-describedby cho ĐÚNG danh sách
    // component input của chính nó (TextInput, Select, Checkbox, Textarea...) - nó tìm con theo
    // `child.type === TextInput`. MyTextInput là wrapper nên KHÔNG khớp, hậu quả là
    // <FormControl.Label> render htmlFor trỏ tới một id không tồn tại -> nhãn không gắn được với ô
    // nhập (mọi form dùng FormControl + MyTextInput đều bị).
    // useFormControlForwardedProps là API công khai của Primer dành đúng cho trường hợp wrapper:
    // đọc lại các thuộc tính đó từ context. Ngoài FormControl nó trả về {} nên những chỗ đang dùng
    // MyTextInput không kèm FormControl giữ nguyên hành vi cũ.
    const formControlProps = useFormControlForwardedProps();

    const fieldError = register && props.name ? errors?.[props.name] : undefined;
    const inputId = props.id ?? formControlProps.id;
    // Nối id của dòng báo lỗi vào aria-describedby để trình đọc màn hình đọc được lý do lỗi.
    const validationMessageId = fieldError ? `${inputId ?? props.name}-validation` : undefined;
    const describedBy =
        [formControlProps['aria-describedby'], validationMessageId].filter(Boolean).join(' ') || undefined;
    // Component đã tự render <FormControl.Validation variant="error"> khi có lỗi - set luôn trạng
    // thái invalid cho chính ô nhập để lỗi nhìn thấy được ngay ở ô, không chỉ ở dòng chữ bên dưới.
    const validationStatus = props.validationStatus ?? formControlProps.validationStatus ?? (fieldError ? 'error' : undefined);
    const accessibilityProps = {
        id: inputId,
        required: props.required ?? formControlProps.required,
        disabled: props.disabled ?? formControlProps.disabled,
        'aria-describedby': describedBy,
        validationStatus,
    };

    const [tempValue, setTempValue] = useState<any>(props.value ?? props.defaultValue);
    const tempValueDelayed = useDebounce(tempValue, 300)[0];
    useEffect(() => {
            if (props.onValueDelayChanged && tempValueDelayed !== (props.value ?? props.defaultValue)) {
                props.onValueDelayChanged(tempValueDelayed)
            }
        }, [props, tempValueDelayed])

    return (
        <>
            {register && props.name &&
                <>
                    <TextInput
                    className={styles.input}
                        ref={props.ref}
                        {...register(props.name, {
                            required: {
                                value: props.required,
                                message: props.validateMessage ?? ""
                            },
                            minLength: {
                                value: props.minLength,
                                message: props.validateMessage ?? ""
                            },
                            maxLength: {
                                value: props.maxLength,
                                message: props.validateMessage ?? ""
                            },
                            pattern: {
                                value: props.pattern,
                                message: props.validateMessage ?? ""
                            },
                            ...props.rules

                        })}
                        name={props.name}
                        {...domProps}
                        {...accessibilityProps}
                    />
                    {
                        errors && errors[props.name] &&
                        <FormControl.Validation id={validationMessageId} variant="error">
                            <>{errors[props.name].message ?? ""}</>
                        </FormControl.Validation>
                    }
                </>
            }
            {(!register || !props.name) &&
                <TextInput
                 className={styles.input}
                 onChange={(e) => {
                            setTempValue(e.target.value)
                            if (props.onChange) {
                                props.onChange(e)
                            }
                        }}
                    {...domProps}
                    {...accessibilityProps}
                />
            }
        </>
    );
};

export default MyTextInput;
