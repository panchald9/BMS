import * as React from "react"
import * as ToastPrimitives from "@radix-ui/react-toast"
import { cva } from "class-variance-authority"
import { X } from "lucide-react"
import { cn } from "../../lib/utils"

/* Provider */
export const ToastProvider = ToastPrimitives.Provider

/* Viewport */
export const ToastViewport = React.forwardRef(function ToastViewport(
  { className = "", ...props },
  ref
) {
  return (
    <ToastPrimitives.Viewport
      ref={ref}
      className={cn(
        "fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4",
        "sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]",
        className
      )}
      {...props}
    />
  )
})

/* Variants */
const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-4 shadow-lg transition-all",
  {
    variants: {
      variant: {
        default: "bg-white text-zinc-900 border-zinc-200",
        destructive: "bg-red-600 text-white border-red-600",
      },
    },
    defaultVariants: { variant: "default" },
  }
)

/* Toast root */
export const Toast = React.forwardRef(function Toast(
  { className = "", variant, ...props },
  ref
) {
  return (
    <ToastPrimitives.Root
      ref={ref}
      className={cn(toastVariants({ variant }), className)}
      {...props}
    />
  )
})

/* Action button */
export const ToastAction = React.forwardRef(function ToastAction(
  { className = "", ...props },
  ref
) {
  return (
    <ToastPrimitives.Action
      ref={ref}
      className={cn(
        "inline-flex h-8 items-center justify-center rounded-md border px-3 text-sm hover:bg-zinc-100",
        className
      )}
      {...props}
    />
  )
})

/* Close button */
export const ToastClose = React.forwardRef(function ToastClose(
  { className = "", ...props },
  ref
) {
  return (
    <ToastPrimitives.Close
      ref={ref}
      className={cn(
        "absolute right-2 top-2 rounded-md p-1 opacity-70 hover:opacity-100",
        className
      )}
      {...props}
    >
      <X className="w-4 h-4" />
    </ToastPrimitives.Close>
  )
})

export const ToastTitle = React.forwardRef(function ToastTitle(
  { className = "", ...props },
  ref
) {
  return (
    <ToastPrimitives.Title
      ref={ref}
      className={cn("text-sm font-semibold", className)}
      {...props}
    />
  )
})

export const ToastDescription = React.forwardRef(function ToastDescription(
  { className = "", ...props },
  ref
) {
  return (
    <ToastPrimitives.Description
      ref={ref}
      className={cn("text-sm opacity-90", className)}
      {...props}
    />
  )
})
