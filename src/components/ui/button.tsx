import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";
import { Spinner } from "./spinner";

const variants = {
  primary:
    "bg-primary text-background hover:shadow-ecto hover:brightness-110 active:brightness-95 disabled:hover:shadow-none disabled:hover:brightness-100",
  ghost:
    "border border-border bg-surface/40 text-foreground hover:border-primary/60 hover:text-primary active:bg-surface disabled:hover:border-border disabled:hover:text-foreground",
} as const;

const sizes = {
  md: "min-h-11 px-4 text-sm",
  lg: "min-h-12 px-6 text-base",
} as const;

export type ButtonVariant = keyof typeof variants;
export type ButtonSize = keyof typeof sizes;

/** Shared button styling, also used for links that look like buttons. */
export function buttonClasses(variant: ButtonVariant = "primary", size: ButtonSize = "md", className?: string) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition select-none",
    "disabled:cursor-not-allowed disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50",
    variants[variant],
    sizes[size],
    className,
  );
}

export interface ButtonProps extends ComponentProps<"button"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  type = "button",
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClasses(variant, size, className)}
      {...props}
    >
      {loading && <Spinner className="size-4" label="Working" />}
      {children}
    </button>
  );
}
