import React from "react";
import { cva } from "class-variance-authority";

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

const badgeVariants = cva(
  "whitespace-nowrap inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 hover-elevate",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-white shadow-xs",
        secondary:
          "border-transparent bg-gray-200 text-gray-800",
        destructive:
          "border-transparent bg-red-600 text-white shadow-xs",
        outline:
          "text-gray-900 border border-gray-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

function Badge({ className, variant, ...props }) {
  return (
    <div
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
