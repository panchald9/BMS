import React from "react";
import { cn } from "../../lib/utils";

export const Input = React.forwardRef(function Input(
  { className, type = "text", ...props },
  ref
) {
  return (
    <input
      ref={ref}
      type={type}
      className={cn(
        "flex h-9 w-full rounded-md border border-gray-300 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
});
