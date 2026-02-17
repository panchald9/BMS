import React from "react";
import { cn } from "../../lib/utils";

/* Main Card */
export const Card = React.forwardRef(function Card(
  { className, ...props },
  ref
) {
  return (
    <div
      ref={ref}
      className={cn(
        "rounded-xl border bg-white text-gray-900 shadow",
        className
      )}
      {...props}
    />
  );
});

/* Header */
export const CardHeader = React.forwardRef(function CardHeader(
  { className, ...props },
  ref
) {
  return (
    <div
      ref={ref}
      className={cn("flex flex-col space-y-1.5 p-6", className)}
      {...props}
    />
  );
});

/* Title */
export const CardTitle = React.forwardRef(function CardTitle(
  { className, ...props },
  ref
) {
  return (
    <div
      ref={ref}
      className={cn("font-semibold leading-none tracking-tight", className)}
      {...props}
    />
  );
});

/* Description */
export const CardDescription = React.forwardRef(function CardDescription(
  { className, ...props },
  ref
) {
  return (
    <div
      ref={ref}
      className={cn("text-sm text-gray-500", className)}
      {...props}
    />
  );
});

/* Content */
export const CardContent = React.forwardRef(function CardContent(
  { className, ...props },
  ref
) {
  return (
    <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
  );
});

/* Footer */
export const CardFooter = React.forwardRef(function CardFooter(
  { className, ...props },
  ref
) {
  return (
    <div
      ref={ref}
      className={cn("flex items-center p-6 pt-0", className)}
      {...props}
    />
  );
});
