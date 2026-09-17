import * as React from "react"
import { Box } from "@primer/react"
import clsx from "clsx"
import styles from "./Tabs.module.css"

// Tab Item interface
export interface TabItem {
  key: string;
  title: React.ReactNode;
  content: React.ReactNode;
  disabled?: boolean;
}

// Tabs Props interface
export interface TabsProps {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children?: React.ReactNode;
  className?: string;
}

// TabsList Props interface
export interface TabsListProps {
  variant?: "line" | "card" | "filled" | "shadcn";
  size?: "small" | "medium" | "large";
  fullWidth?: boolean;
  centered?: boolean;
  gridCols?: 2 | 3 | 4 | 5;
  children?: React.ReactNode;
  className?: string;
}

// TabsTrigger Props interface
export interface TabsTriggerProps {
  value: string;
  disabled?: boolean;
  children?: React.ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}

// TabsContent Props interface
export interface TabsContentProps {
  value: string;
  children?: React.ReactNode;
  className?: string;
}

// TabsContext để quản lý trạng thái active tab
type TabsContextValue = {
  value: string;
  onValueChange: (value: string) => void;
};

const TabsContext = React.createContext<TabsContextValue | undefined>(undefined);

const useTabsContext = () => {
  const context = React.useContext(TabsContext);
  if (!context) {
    throw new Error("Tabs components must be used within a TabsProvider");
  }
  return context;
};

// Main Tabs component
const Tabs = React.forwardRef<
  HTMLDivElement,
  TabsProps
>(({ className, defaultValue, value: controlledValue, onValueChange, children, ...props }, ref) => {
  const [value, setValue] = React.useState<string>(defaultValue || "");
  
  const handleValueChange = React.useCallback((newValue: string) => {
    if (controlledValue === undefined) {
      setValue(newValue);
    }
    onValueChange?.(newValue);
  }, [controlledValue, onValueChange]);

  const actualValue = controlledValue !== undefined ? controlledValue : value;

  const contextValue = React.useMemo(() => ({
    value: actualValue,
    onValueChange: handleValueChange
  }), [actualValue, handleValueChange]);

  return (
    <TabsContext.Provider value={contextValue}>
      <Box
        ref={ref}
        className={clsx(styles.tabsContainer, className)}
        {...props}
      >
        {children}
      </Box>
    </TabsContext.Provider>
  );
});
Tabs.displayName = "Tabs";

// TabsList component
const TabsList = React.forwardRef<
  HTMLDivElement,
  TabsListProps
>(({ 
  className, 
  variant = "line", 
  size = "medium", 
  fullWidth = false, 
  centered = false, 
  gridCols,
  children, 
  ...props 
}, ref) => {
  return (
    <Box
      ref={ref}
      className={clsx(
        styles.tabsList,
        styles[`tabs-${variant}`],
        styles[`size-${size}`],
        {
          [styles.centered]: centered,
          [styles.fullWidth]: fullWidth,
          [styles[`grid-cols-${gridCols}`]]: gridCols,
        },
        className
      )}
      {...props}
    >
      {children}
    </Box>
  );
});
TabsList.displayName = "TabsList";

// TabsTrigger component
const TabsTrigger = React.forwardRef<
  HTMLButtonElement,
  TabsTriggerProps
>(({ className, value, disabled = false, children, onClick, ...props }, ref) => {
  const { value: selectedValue, onValueChange } = useTabsContext();
  const isActive = selectedValue === value;
  
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(e);
    if (!disabled) {
      onValueChange(value);
    }
  };

  return (
    <button
      type="button"
      ref={ref}
      disabled={disabled}
      className={clsx(
        styles.tabItem,
        {
          [styles.active]: isActive,
          [styles.disabled]: disabled,
        },
        className
      )}
      onClick={handleClick}
      data-state={isActive ? "active" : "inactive"}
      {...props}
    >
      {children}
    </button>
  );
});
TabsTrigger.displayName = "TabsTrigger";

// TabsContent component
const TabsContent = React.forwardRef<
  HTMLDivElement,
  TabsContentProps
>(({ className, value, children, ...props }, ref) => {
  const { value: selectedValue } = useTabsContext();
  const isActive = selectedValue === value;
  
  if (!isActive) return null;
  
  return (
    <Box
      ref={ref}
      className={clsx(styles.tabContent, className)}
      data-state={isActive ? "active" : "inactive"}
      {...props}
    >
      {children}
    </Box>
  );
});
TabsContent.displayName = "TabsContent";

// Higher-level API cho Tabs với items
export interface TabsWithItemsProps {
  items: TabItem[];
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  variant?: "line" | "card" | "filled" | "shadcn";
  size?: "small" | "medium" | "large";
  centered?: boolean;
  fullWidth?: boolean;
  gridCols?: 2 | 3 | 4 | 5;
  className?: string;
  tabsListClassName?: string;
  contentClassName?: string;
}

const TabsWithItems: React.FC<TabsWithItemsProps> = ({
  items,
  defaultValue,
  value,
  onValueChange,
  variant = "line",
  size = "medium",
  centered = false,
  fullWidth = false,
  gridCols,
  className,
  tabsListClassName,
  contentClassName,
}) => {
  return (
    <Tabs 
      defaultValue={defaultValue || (items.length > 0 ? items[0].key : undefined)} 
      value={value}
      onValueChange={onValueChange}
      className={className}
    >
      <TabsList 
        variant={variant}
        size={size}
        centered={centered}
        fullWidth={fullWidth}
        gridCols={gridCols}
        className={tabsListClassName}
      >
        {items.map((item) => (
          <TabsTrigger 
            key={item.key}
            value={item.key}
            disabled={item.disabled}
          >
            {item.title}
          </TabsTrigger>
        ))}
      </TabsList>
      
      {items.map((item) => (
        <TabsContent 
          key={item.key}
          value={item.key}
          className={contentClassName}
        >
          {item.content}
        </TabsContent>
      ))}
    </Tabs>
  );
};

// Export các components
export { Tabs, TabsList, TabsTrigger, TabsContent, TabsWithItems };
export default TabsWithItems;