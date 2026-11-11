"use client";

import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export type IconButtonVariant =
  | "ghost"
  | "secondary"
  | "primary"
  | "danger"
  | "warning"
  | "indigo"
  | "emerald";

export type IconButtonSize = "xs" | "sm" | "md" | "lg";

export interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  rounded?: "lg" | "xl" | "2xl" | "full";
  href?: string;
  loading?: boolean;
  icon?: React.ReactNode;
}

export const IconButton = React.forwardRef<
  HTMLButtonElement | HTMLAnchorElement,
  IconButtonProps
>(
  (
    {
      variant = "ghost",
      size = "sm",
      rounded = "xl",
      href,
      loading = false,
      icon,
      children,
      className,
      disabled,
      type = "button",
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center shrink-0 transition-all duration-150 focus:outline-none select-none active:scale-[0.96] disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none";

    const sizeStyles = {
      xs: "w-7 h-7 text-xs",
      sm: "w-8 h-8 text-xs",
      md: "w-9 h-9 text-sm",
      lg: "w-10 h-10 text-base",
    }[size];

    const roundedStyles = {
      lg: "rounded-lg",
      xl: "rounded-xl",
      "2xl": "rounded-2xl",
      full: "rounded-full",
    }[rounded];

    const variantStyles = {
      ghost:
        "text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-100 hover:bg-neutral-500/10",
      secondary:
        "bg-white/70 dark:bg-neutral-800/70 border border-neutral-200/80 dark:border-white/10 text-neutral-700 dark:text-neutral-200 hover:bg-white dark:hover:bg-neutral-800 shadow-xs",
      primary:
        "bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 shadow-sm",
      danger:
        "text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 dark:hover:bg-rose-500/15",
      warning:
        "text-amber-500 hover:text-amber-600 hover:bg-amber-500/10 dark:hover:bg-amber-500/15",
      indigo:
        "text-indigo-600 hover:text-indigo-700 hover:bg-indigo-500/10 dark:text-indigo-400 dark:hover:bg-indigo-500/15",
      emerald:
        "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/15",
    }[variant];

    const combinedClasses = cn(
      baseStyles,
      sizeStyles,
      roundedStyles,
      variantStyles,
      className
    );

    if (href) {
      return (
        <Link
          href={href}
          className={combinedClasses}
          ref={ref as React.Ref<HTMLAnchorElement>}
          {...(props as any)}
        >
          {loading ? (
            <svg
              className="animate-spin w-3.5 h-3.5"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              />
            </svg>
          ) : (
            icon || children
          )}
        </Link>
      );
    }

    return (
      <button
        type={type}
        className={combinedClasses}
        disabled={disabled || loading}
        ref={ref as React.Ref<HTMLButtonElement>}
        {...props}
      >
        {loading ? (
          <svg
            className="animate-spin w-3.5 h-3.5"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            />
          </svg>
        ) : (
          icon || children
        )}
      </button>
    );
  }
);

IconButton.displayName = "IconButton";

