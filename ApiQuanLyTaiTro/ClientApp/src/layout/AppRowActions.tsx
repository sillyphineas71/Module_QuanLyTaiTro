import React from "react";
import { KebabHorizontalIcon } from "@primer/octicons-react";
import { ActionList, ActionMenu, IconButton } from "@primer/react";
import styles from "./AppRowActions.module.css";

// Menu hành động của MỘT DÒNG dữ liệu (V2).
//
// VÌ SAO KHÔNG DÙNG components-ui/dynamic-action-menu (DynamicActionMenu):
// Component đó render <ActionMenu.Button icon={KebabHorizontalIcon}> với children là "&nbsp;" và
// KHÔNG có aria-label -> tên khả truy cập của nút chỉ là một khoảng trắng, trình đọc màn hình
// không đọc được nút này là gì. Yêu cầu của V2 bắt buộc phải có accessible name, mà file đó lại
// identical-byte với ClientApp2 nên không được sửa. Vì vậy dựng một bản App nhỏ dùng đúng
// ActionMenu/ActionList của Primer (giữ nguyên phím tắt, roving focus, Esc... của Primer) nhưng
// nút mở là IconButton CÓ aria-label thật.
//
// Thay cho việc lặp [Sửa][Xoá đỏ] trên từng dòng: hành động phá huỷ không còn là thứ đỏ nhất
// màn hình và không còn lặp N lần.
export interface IAppRowAction {
    id: string;
    label: string;
    icon?: React.ComponentType<any>;
    variant?: "default" | "danger";
    onClick: () => void;
    disabled?: boolean;
}

interface IAppRowActionsProps {
    actions: IAppRowAction[];
    /** Tên khả truy cập của nút mở menu - nên nêu rõ đang thao tác với bản ghi nào. */
    ariaLabel: string;
}

const AppRowActions: React.FC<IAppRowActionsProps> = ({ actions, ariaLabel }) => {
    if (actions.length === 0) return null;
    return (
        <ActionMenu>
            <ActionMenu.Anchor>
                {/* className đặt TRỰC TIẾP lên IconButton, KHÔNG bọc thêm thẻ: ActionMenu.Anchor
                    clone aria-haspopup/aria-expanded/onClick vào ĐÚNG phần tử con của nó, nên bọc
                    một <span> sẽ đẩy trạng thái menu ra khỏi cái nút mang tên khả truy cập.
                    Vùng chạm mở rộng bằng ::after trong suốt (xem module.css). */}
                <IconButton
                    className={styles.trigger}
                    icon={KebabHorizontalIcon}
                    aria-label={ariaLabel}
                    variant="invisible"
                    size="small"
                />
            </ActionMenu.Anchor>
            <ActionMenu.Overlay>
                <ActionList showDividers>
                    {actions.map((action) => (
                        <ActionList.Item
                            key={action.id}
                            variant={action.variant ?? "default"}
                            disabled={action.disabled}
                            onSelect={action.onClick}
                        >
                            {action.icon && (
                                <ActionList.LeadingVisual>
                                    <action.icon />
                                </ActionList.LeadingVisual>
                            )}
                            {action.label}
                        </ActionList.Item>
                    ))}
                </ActionList>
            </ActionMenu.Overlay>
        </ActionMenu>
    );
};

export default AppRowActions;
