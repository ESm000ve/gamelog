import React, { forwardRef } from "react";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, variant = "primary", size = "md", loading, disabled, style, className, ...props }, ref) => {
    let bg = "var(--apple-fill)";
    let color = "var(--apple-label)";
    let border = "1px solid transparent";

    switch (variant) {
      case "primary":
        bg = "var(--apple-accent)";
        color = "var(--apple-accent-foreground)";
        break;
      case "secondary":
        bg = "var(--apple-fill)";
        color = "var(--apple-label)";
        break;
      case "outline":
        bg = "transparent";
        border = "1px solid var(--apple-separator)";
        color = "var(--apple-label)";
        break;
      case "ghost":
        bg = "transparent";
        color = "var(--apple-label)";
        break;
      case "danger":
        bg = "var(--apple-red)";
        color = "var(--apple-white)";
        break;
    }

    let padding = "var(--space-2) var(--space-4)";
    let minHeight = 32;
    let fontSize = "var(--font-size-base)";
    let borderRadius = "var(--radius-md)";

    switch (size) {
      case "sm":
        padding = "var(--space-1) var(--space-3)";
        minHeight = 28;
        fontSize = "var(--font-size-sm)";
        borderRadius = "var(--radius-sm)";
        break;
      case "lg":
        padding = "var(--space-3) var(--space-6)";
        minHeight = 44;
        fontSize = "var(--font-size-lg)";
        borderRadius = "var(--radius-lg)";
        break;
    }

    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={className}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "var(--space-2)",
          padding,
          minHeight,
          background: bg,
          color,
          border,
          borderRadius,
          fontSize,
          fontWeight: 600,
          cursor: isDisabled ? "not-allowed" : "pointer",
          opacity: isDisabled ? 0.6 : 1,
          transition: "all 120ms ease",
          ...style,
        }}
        onMouseEnter={(e) => {
          if (!isDisabled) {
            e.currentTarget.style.filter = "brightness(1.1)";
          }
        }}
        onMouseLeave={(e) => {
          if (!isDisabled) {
            e.currentTarget.style.filter = "brightness(1)";
          }
        }}
        {...props}
      >
        {loading && <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
