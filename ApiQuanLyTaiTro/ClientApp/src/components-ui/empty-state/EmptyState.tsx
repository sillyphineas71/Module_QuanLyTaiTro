import { AlertIcon } from "@primer/octicons-react";
import { Box, Flash, Octicon } from "@primer/react";
import React from "react";

type EmptyStateProps = {
    title: string;
    description?: string;
    icon?: React.ComponentType<any>;
    variant?: "default" | "warning" | "danger" | "success";
    className?: string;
    style?: React.CSSProperties;
};

const EmptyState: React.FC<EmptyStateProps> = ({
    title,
    description,
    icon,
    variant = "default",
    className,
    style
}) => {
    const IconComp = icon || AlertIcon;
    return (
        <Flash variant={variant} className={className} style={style}>
            <Box sx={{ display: "flex" }}>
                <Box sx={{ mr: 2 }}>
                    <Octicon icon={IconComp} size={"medium"} />
                </Box>
                <Box sx={{ display: "flex", flexDirection: "column" }}>
                    <Box sx={{ fontSize: "var(--text-lg)", fontWeight: 600 }}>{title}</Box>
                    {description && <span>{description}</span>}
                </Box>
            </Box>
        </Flash>
    );
};

export default EmptyState;


