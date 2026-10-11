import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <div className="relative">
    <select
      ref={ref}
      className={cn(
        "flex h-11 w-full appearance-none rounded-lg border border-input bg-background/70 px-3.5 py-2 pr-9 text-sm shadow-warm-sm ring-offset-background transition-all duration-200 focus-visible:border-stage focus-visible:bg-background focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-stage/15 disabled:cursor-not-allowed disabled:opacity-50 hover:border-stage/30",
        className,
      )}
      {...props}
    >
      {children}
    </select>
    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50" />
  </div>
));
Select.displayName = "Select";
