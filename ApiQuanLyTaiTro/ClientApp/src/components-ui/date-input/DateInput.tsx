import { AlertIcon, ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from "@primer/octicons-react";
import { ActionList, ActionMenu, AnchoredOverlay, Box, IconButton, Octicon, TextInput, useFormControlForwardedProps } from "@primer/react";
import moment from "moment";
import { useEffect, useMemo, useState } from "react";
import Button from "../button";
import { IMyTextInputProps } from "../text-input/TextInput";
interface IDateInputProps extends Omit<IMyTextInputProps, 'value' | 'onValueChanged'> {
    value?: string
    onValueChanged: (ddMMyyyy: string, date: Date) => void;
    width?: any;
    isOpenSelection?: boolean
}

const days = [
    { id: 2, name: "Th 2", name_en: "Mon" },
    { id: 3, name: "Th 3", name_en: "Mon" },
    { id: 4, name: "Th 4", name_en: "Mon" },
    { id: 5, name: "Th 5", name_en: "Mon" },
    { id: 6, name: "Th 6", name_en: "Mon" },
    { id: 7, name: "Th 7", name_en: "Mon" },
    { id: 8, name: "CN", name_en: "Mon" },
]
// Hàm kiểm tra ngày tháng hợp lệ
const isValidDate = (day: string, month: string, year: string) => {
    const d = parseInt(day, 10);
    const m = parseInt(month, 10);
    const y = parseInt(year, 10);

    if (m < 1 || m > 12) return false;
    const maxDays = new Date(y, m, 0).getDate();
    if (d < 1 || d > maxDays) return false;
    if (y < 1900 || y > 9999) return false;
    return true;
};

const DateInput = (props: IDateInputProps) => {
    // Giống MyTextInput: component này là wrapper nên Primer FormControl KHÔNG tự gắn được
    // id/required/disabled/aria-describedby cho ô nhập bên trong -> <FormControl.Label> sẽ có
    // htmlFor trỏ tới id không tồn tại. Đọc lại các thuộc tính đó từ context bằng API công khai
    // của Primer; ngoài FormControl hook trả về {} nên các màn cũ không đổi hành vi.
    const formControlProps = useFormControlForwardedProps();
    const inputId = props.id ?? formControlProps.id;
    const [isOpenOverlay, setIsOpenOverlay] = useState(props.isOpenSelection ?? false);
    const [_year, setYear] = useState(new Date().getFullYear());
    const [_monthIdx, setMonth] = useState(new Date().getMonth());
    // const [_date, setDate] = useState(new Date().getDate());
    const [tempValue, setTempValue] = useState<string>();
    useEffect(() => {
        if (props.value) {
            const digitsOnly = (props.value ?? "").replace(/\D/g, "");

            if (digitsOnly.length === 8) {
                setYear(parseInt(digitsOnly.slice(4, 8)));
                setMonth(parseInt(digitsOnly.slice(2, 4)) - 1);
                // setDate(parseInt(digitsOnly.slice(0, 2)));
            }
        }
        setTempValue(props.value)
    }, [props.value])
    const isShowWarning = useMemo(() => {
        if (tempValue) {
            const digitsOnly = (tempValue ?? "").replace(/\D/g, "");
            if (digitsOnly.length === 8) {
                const day = digitsOnly.slice(0, 2);
                const month = digitsOnly.slice(2, 4);
                const year = digitsOnly.slice(4, 8);

                if (isValidDate(day, month, year)) {
                    return false;
                } else {
                    return true;
                }
            } else {
                return true;
            }
        }
        return false;
    }, [tempValue])
    // Hàm định dạng chuỗi thành dd/MM/yyyy khi nhập
    const formatDate = (input: string) => {

        if (!input) return "";
        const digitsOnly = input.replace(/\D/g, ""); // Chỉ lấy số

        // if (digitsOnly.length <= 2) return digitsOnly; // Chỉ ngày
        // if (digitsOnly.length <= 4) {
        //     return `${digitsOnly.slice(0, 2)}/${digitsOnly.slice(2)}`; // Ngày/tháng
        // }
        if (digitsOnly.length < 2) return digitsOnly;
        if (digitsOnly.length === 2) return `${digitsOnly.slice(0, 2)}/`;
        // if (digitsOnly.length < 4) return digitsOnly;
        if (digitsOnly.length === 4) {
            return `${digitsOnly.slice(0, 2)}/${digitsOnly.slice(2)}/`; // Ngày/tháng
        }
        return `${digitsOnly.slice(0, 2)}/${digitsOnly.slice(2, 4)}/${digitsOnly.slice(4, 8)}`; // Ngày/tháng/năm
    };


    // Xử lý khi blur để kiểm tra hợp lệ
    const handleBlur = () => {
        const digitsOnly = (tempValue ?? "").replace(/\D/g, "");
        if (digitsOnly.length === 8) {
            const day = digitsOnly.slice(0, 2);
            const month = digitsOnly.slice(2, 4);
            const year = digitsOnly.slice(4, 8);

            if (isValidDate(day, month, year)) {
                const formatted = `${day}/${month}/${year}`;
                setTempValue(formatted);
                props.onValueChanged(formatted, new Date(parseInt(year), parseInt(month) - 1, parseInt(day))); // Gửi giá trị hợp lệ về parent
            } else {
                setTempValue(""); // Nếu không hợp lệ, xóa giá trị (tương tự input date)
            }
        } else if (digitsOnly.length > 0) {
            setTempValue(""); // Nếu chưa đủ 8 số nhưng có dữ liệu, xóa
        }
    };
    // Xử lý khi người dùng nhập
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rInput = e.target.value;
        const input = e.target.value.replace(/\D/g, ""); // Chỉ lấy số
        if (input.length <= 8) { // Giới hạn 8 chữ số

            if (rInput.length >= (tempValue ?? "").length) {
                const formatted = formatDate(input);
                setTempValue(formatted);
            } else {
                setTempValue(rInput);
            }
        }
    };

    const getWeeksInMonth = (year: number, month: number) => {
        // month: 0-11 (0 là tháng 1, 11 là tháng 12)
        const weeks = [];
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0); // Ngày cuối tháng

        let currentDay = new Date(firstDay);
        // Bắt đầu từ thứ 2 của tuần đầu tiên
        while (currentDay.getDay() !== 1) {
            currentDay.setDate(currentDay.getDate() - 1);
        }

        while (currentDay <= lastDay) {
            const weekStart = new Date(currentDay);
            const weekEnd = new Date(currentDay);
            weekEnd.setDate(weekEnd.getDate() + 6);

            // Chỉ thêm tuần nếu có ngày thuộc tháng yêu cầu
            if (weekStart <= lastDay && weekEnd >= firstDay) {
                weeks.push({
                    start: new Date(weekStart),
                    end: new Date(weekEnd > lastDay ? lastDay : weekEnd)
                });
            }

            currentDay.setDate(currentDay.getDate() + 7);
        }

        return weeks;
    }

    const weeks = getWeeksInMonth(_year, _monthIdx);
    return (
        <>

            <AnchoredOverlay
                open={isOpenOverlay}
                onClose={() => {
                    setIsOpenOverlay(false)
                }}
                overlayProps={{
                    role: 'dialog',
                    'aria-modal': true,
                    'aria-label': 'User Card Overlay',

                }}
                focusZoneSettings={{
                    disabled: true
                }}
                renderAnchor={(anchorProps) => {
                    return (
                        <Box
                            {...anchorProps}
                            sx={{
                                position: "relative", display: "flex", alignItems: "center",
                                width: props.width
                            }}
                        >
                            <TextInput
                                id={inputId}
                                required={props.required ?? formControlProps.required}
                                aria-describedby={formControlProps['aria-describedby']}
                                validationStatus={props.validationStatus ?? formControlProps.validationStatus}
                                disabled={props.disabled ?? formControlProps.disabled}
                                value={tempValue}
                                size={props.size}
                                placeholder="dd/MM/yyyy"
                                onBlur={handleBlur}
                                onChange={handleChange}
                                block
                                sx={{
                                    height: "32px",
                                    ...props.sx
                                }}
                            />
                            <IconButton icon={ChevronDownIcon} aria-label="Mở lịch chọn ngày" onClick={() => {
                               if (!props.disabled) setIsOpenOverlay(true)
                            }}
                                size="small"
                                variant="invisible"
                                sx={{
                                    right: "2px",
                                    position: "absolute"
                                }}
                            />
                            {(isShowWarning) &&
                                <Octicon icon={AlertIcon}
                                    size={"small"}
                                    sx={{
                                        right: "28px",
                                        position: "absolute",
                                        color: "danger.emphasis",
                                        width: "1rem",
                                        height: "1rem"
                                    }}
                                />
                            }
                        </Box>
                    );
                }}

            >
                <Box sx={{ p: 3, display: "grid", gap: 2 }}>


                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0,
                            ml: -2, mr: -2
                        }}
                    >
                        <IconButton icon={ChevronLeftIcon} aria-label="prev"
                            size="small"
                            variant="invisible"
                            onClick={() => {
                                setMonth(_monthIdx === 0 ? 11 : _monthIdx - 1)
                                setYear(_monthIdx === 0 ? _year - 1 : _year)
                            }}
                        />
                        <Box sx={{ flex: 1, display: "flex", gap: 1, justifyContent: "center" }}>
                            <TextInput type="number" value={_year}
                                onChange={(e) => {
                                    if (parseInt(e.target.value) > 1900) {
                                        setYear(parseInt(e.target.value))
                                    }
                                }}
                                width={110}
                                leadingVisual={<Box sx={{ ml: -1 }}>
                                    Năm
                                </Box>}
                            />
                            <ActionMenu>
                                <ActionMenu.Button
                                    size="medium"
                                // variant="invisible"
                                >
                                    Tháng {_monthIdx + 1}
                                </ActionMenu.Button>
                                <ActionMenu.Overlay width="auto">
                                    <ActionList selectionVariant="single">
                                        {[
                                            "Tháng 1",
                                            "Tháng 2",
                                            "Tháng 3",
                                            "Tháng 4",
                                            "Tháng 5",
                                            "Tháng 6",
                                            "Tháng 7",
                                            "Tháng 8",
                                            "Tháng 9",
                                            "Tháng 10",
                                            "Tháng 11",
                                            "Tháng 12",
                                        ].map((month, index) => (
                                            <ActionList.Item key={index} value={index} onSelect={() => {
                                                setMonth(index)
                                            }}
                                                selected={_monthIdx === index}
                                            >
                                                {month}
                                            </ActionList.Item>
                                        ))}
                                    </ActionList>
                                </ActionMenu.Overlay>
                            </ActionMenu>

                        </Box>

                        <IconButton icon={ChevronRightIcon} aria-label="next"
                            size="small"
                            variant="invisible"
                            onClick={() => {
                                setMonth(_monthIdx === 11 ? 0 : _monthIdx + 1)
                                setYear(_monthIdx === 11 ? _year + 1 : _year)
                            }}
                        />
                    </Box>
                    <Box id="calendar"
                        sx={{ mt: -2 }}
                    >
                        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 40px)" }} >
                            {days.map(day => {
                                return (<Box sx={{
                                    color: "fg.muted",
                                    fontWeight: 600,
                                    fontSize: "11px",
                                    display: "flex",
                                    height: "32px",
                                    alignItems: "center",
                                    justifyContent: "center"
                                }}>
                                    {day.name}
                                </Box>);
                            })}
                        </Box>
                        {weeks.map(week => {

                            return (
                                <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 40px)" }} >
                                    {days.map(day => {
                                        const date = moment(week.start).add("days", day.id - 2);
                                        const isCurrentMonth = date.month() === _monthIdx;
                                        const isSelected = date.format("DD/MM/YYYY") === props.value
                                        return (
                                            <Button sx={{
                                                color: isSelected ? "#fff" : (!isCurrentMonth ? "fg.muted" : "fg.default"),
                                                fontWeight: isCurrentMonth ? 600 : undefined,
                                                fontSize: "12px",
                                                display: "flex",
                                                justifyContent: "center",
                                                height: "32px",
                                                backgroundColor: isSelected ? "accent.emphasis" : undefined,
                                            }}
                                                // size="medium"
                                                variant="invisible"
                                                text={`${moment(week.start).add("days", day.id - 2).date()}`}
                                                onClick={() => {
                                                    props.onValueChanged(date.format("DD/MM/YYYY"), date.toDate())
                                                }}
                                            />

                                        );
                                    })}
                                </Box>
                            );
                        })}
                    </Box>
                    <Box sx={{
                        display: "flex",
                        flexDirection: "row-reverse"
                    }}>
                        <Button text={`Hôm nay ${moment().format("DD/MM/YYYY")}`}
                            variant="invisible"
                            size="small"
                            // trailingVisual={CalendarIcon}
                            onClick={() => {
                                props.onValueChanged(moment().format("DD/MM/YYYY"), moment().toDate())
                            }}
                        />
                    </Box>
                </Box>

            </AnchoredOverlay >
        </>
    );
};

export default DateInput;