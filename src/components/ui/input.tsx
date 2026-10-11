import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  leadingIcon?: React.ReactNode;
  trailing?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, leadingIcon, trailing, ...props }, ref) => {
    const field = (
      <input
        type={type}
        ref={ref}
        className={cn(
          "flex h-11 w-full rounded-lg border border-input bg-background/70 px-3.5 py-2 text-sm shadow-warm-sm ring-offset-background transition-all duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:border-stage focus-visible:bg-background focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-stage/15 disabled:cursor-not-allowed disabled:opacity-50 hover:border-stage/30",
          leadingIcon && "pl-10",
          trailing && "pr-10",
          className,
        )}
        {...props}
      />
    );

    if (!leadingIcon && !trailing) return field;

    return (
      <div className="relative">
        {leadingIcon && (
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground [&_svg]:h-4 [&_svg]:w-4">
            {leadingIcon}
          </span>
        )}
        {field}
        {trailing && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2">
            {trailing}
          </span>
        )}
      </div>
    );
  },
);
Input.displayName = "Input";
