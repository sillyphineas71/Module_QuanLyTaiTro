import React from "react";
import { Box } from "@primer/react";

export type AppStatusTone = "success" | "danger" | "attention" | "accent" | "done" | "neutral";

// Màu lấy từ token --*-subtle / --*-fg đã có sẵn trong index.css (KHÔNG hardcode hex/rgb).
const TONE_STYLE: Record<AppStatusTone, { bg: string; fg: string }> = {
    success: { bg: "var(--success-subtle)", fg: "var(--success-fg)" },
    danger: { bg: "var(--danger-subtle)", fg: "var(--danger-fg)" },
    attention: { bg: "var(--attention-subtle)", fg: "var(--attention-fg)" },
    accent: { bg: "var(--accent-subtle)", fg: "var(--accent-fg)" },
    done: { bg: "var(--done-subtle)", fg: "var(--done-fg)" },
    neutral: { bg: "var(--neutral-muted)", fg: "var(--neutral-emphasis)" },
};

interface IAppStatusBadgeProps {
    tone: AppStatusTone;
    children: React.ReactNode;
}

// Pill trạng thái dùng chung - thay cho các pill hardcode màu (vd rgb(220 252 231 / 1)...) ở
// DotThuThapPage và các bảng trạng thái khác của cổng Cựu SV.
const AppStatusBadge: React.FC<IAppStatusBadgeProps> = ({ tone, children }) => {
    const s = TONE_STYLE[tone];
    return (
        <Box
            as="span"
            sx={{
                display: "inline-block",
                borderRadius: "20px",
                px: 2,
                py: 1,
                fontSize: "var(--text-xs)",
                fontWeight: 600,
                lineHeight: 1.4,
                backgroundColor: s.bg,
                color: s.fg,
            }}
        >
            {children}
        </Box>
    );
};

export default AppStatusBadge;
