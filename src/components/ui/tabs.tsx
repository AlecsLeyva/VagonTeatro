import * as React from "react";
import { cn } from "@/lib/utils";

interface TabsContextValue {
  value: string;
  setValue: (value: string) => void;
  baseId: string;
}

const TabsContext = React.createContext<TabsContextValue | null>(null);

function useTabs(component: string): TabsContextValue {
  const ctx = React.useContext(TabsContext);
  if (!ctx) {
    throw new Error(`<${component}> debe usarse dentro de <Tabs>`);
  }
  return ctx;
}

function idSegment(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, "-");
}

interface TabsProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  className?: string;
  children: React.ReactNode;
}

export function Tabs({
  value,
  defaultValue = "",
  onValueChange,
  className,
  children,
}: TabsProps) {
  const [internal, setInternal] = React.useState(defaultValue);
  const isControlled = value !== undefined;
  const current = isControlled ? value : internal;
  const baseId = React.useId();

  const setValue = React.useCallback(
    (next: string) => {
      if (!isControlled) setInternal(next);
      onValueChange?.(next);
    },
    [isControlled, onValueChange],
  );

  return (
    <TabsContext.Provider value={{ value: current, setValue, baseId }}>
      <div className={cn("flex flex-col gap-4", className)}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="tablist"
      aria-orientation="horizontal"
      className={cn(
        "inline-flex w-full flex-wrap items-center gap-1 rounded-xl border border-border/60 bg-muted/70 p-1 text-muted-foreground shadow-warm-sm backdrop-blur",
        className,
      )}
      {...props}
    />
  );
}

interface TabsTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

export function TabsTrigger({
  value,
  className,
  onKeyDown,
  ...props
}: TabsTriggerProps) {
  const { value: current, setValue, baseId } = useTabs("TabsTrigger");
  const active = current === value;
  const segment = idSegment(value);

  function handleKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;

    const keys = ["ArrowLeft", "ArrowRight", "Home", "End"];
    if (!keys.includes(event.key)) return;

    const list = event.currentTarget.closest('[role="tablist"]');
    if (!list) return;
    const tabs = Array.from(
      list.querySelectorAll<HTMLButtonElement>('[role="tab"]'),
    );
    const index = tabs.indexOf(event.currentTarget);
    if (index === -1 || tabs.length === 0) return;

    let nextIndex = index;
    switch (event.key) {
      case "ArrowLeft":
        nextIndex = (index - 1 + tabs.length) % tabs.length;
        break;
      case "ArrowRight":
        nextIndex = (index + 1) % tabs.length;
        break;
      case "Home":
        nextIndex = 0;
        break;
      case "End":
        nextIndex = tabs.length - 1;
        break;
    }

    event.preventDefault();
    const next = tabs[nextIndex];
    next?.focus();
    next?.click();
  }

  return (
    <button
      role="tab"
      type="button"
      id={`${baseId}-tab-${segment}`}
      aria-controls={`${baseId}-panel-${segment}`}
      aria-selected={active}
      tabIndex={active ? 0 : -1}
      onClick={() => setValue(value)}
      onKeyDown={handleKeyDown}
      className={cn(
        "inline-flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stage/40",
        active
          ? "bg-gradient-to-br from-stage to-stage-light text-white shadow-warm shadow-stage/25"
          : "text-muted-foreground hover:bg-background/70 hover:text-foreground",
        className,
      )}
      {...props}
    />
  );
}

interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

export function TabsContent({
  value,
  className,
  ...props
}: TabsContentProps) {
  const { value: current, baseId } = useTabs("TabsContent");
  if (current !== value) return null;
  const segment = idSegment(value);
  return (
    <div
      role="tabpanel"
      id={`${baseId}-panel-${segment}`}
      aria-labelledby={`${baseId}-tab-${segment}`}
      tabIndex={0}
      className={cn("animate-fade-in focus-visible:outline-none", className)}
      {...props}
    />
  );
}
