import * as React from "react";
import { cn } from "@/lib/utils";

type Variant =
  | "default"
  | "secondary"
  | "outline"
  | "ghost"
  | "destructive"
  | "gold";
type Size = "default" | "sm" | "lg" | "icon";

const variants: Record<Variant, string> = {
  default:
    "relative bg-gradient-to-br from-stage via-stage-light to-stage text-white shadow-warm shadow-stage/25 transition-all duration-200 hover:from-stage-light hover:via-stage hover:to-stage-dark hover:shadow-warm-lg hover:shadow-stage/35 hover:-translate-y-0.5 shine",
  secondary:
    "bg-secondary/90 text-secondary-foreground shadow-warm-sm hover:bg-secondary hover:shadow-warm transition-all duration-200",
  outline:
    "border border-input bg-background/80 backdrop-blur-sm shadow-warm-sm hover:bg-accent hover:text-accent-foreground hover:border-stage/40 hover:shadow-warm transition-all duration-200",
  ghost:
    "hover:bg-accent/80 hover:text-accent-foreground transition-all duration-200",
  destructive:
    "bg-gradient-to-br from-red-600 to-red-700 text-white shadow-warm shadow-red-600/25 hover:from-red-500 hover:to-red-600 hover:shadow-warm-lg hover:shadow-red-600/30 hover:-translate-y-0.5 transition-all duration-200",
  gold: "bg-gradient-to-br from-stage-amber via-stage-gold to-stage-gold text-stage-dark shadow-warm shadow-stage-gold/30 ring-1 ring-stage-dark/5 hover:brightness-105 hover:shadow-warm-lg hover:shadow-stage-gold/40 hover:-translate-y-0.5 transition-all duration-200",
};

const sizes: Record<Size, string> = {
  default: "h-10 px-4 py-2",
  sm: "h-9 rounded-md px-3 text-sm",
  lg: "h-11 rounded-md px-6",
  icon: "h-10 w-10",
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = "default", size = "default", type, asChild, children, ...props },
    ref,
  ) => {
    const classes = cn(
      "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stage/40 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
      variants[variant],
      sizes[size],
      className,
    );

    if (asChild && React.isValidElement(children)) {
      const child = children as React.ReactElement<{ className?: string }>;
      return React.cloneElement(child, {
        className: cn(classes, child.props.className),
      });
    }

    return (
      <button
        ref={ref}
        type={type ?? "button"}
        className={classes}
        {...props}
      >
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";
