import * as React from "react";
import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "flex min-h-[90px] w-full rounded-lg border border-input bg-background/70 px-3.5 py-2 text-sm shadow-warm-sm ring-offset-background transition-all duration-200 placeholder:text-muted-foreground focus-visible:border-stage focus-visible:bg-background focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-stage/15 disabled:cursor-not-allowed disabled:opacity-50 hover:border-stage/30",
      className,
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";
