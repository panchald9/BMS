"use client"

import * as React from "react"
import * as SheetPrimitive from "@radix-ui/react-dialog"
import { cva } from "class-variance-authority"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

export const Sheet = SheetPrimitive.Root
export const SheetTrigger = SheetPrimitive.Trigger
export const SheetClose = SheetPrimitive.Close
export const SheetPortal = SheetPrimitive.Portal

// Overlay
export const SheetOverlay = React.forwardRef(function SheetOverlay(
  { className, ...props },
  ref
) {
  return (
    <SheetPrimitive.Overlay
      ref={ref}
      className={cn(
        "fixed inset-0 z-50 bg-black/80",
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        className
      )}
      {...props}
    />
  )
})

// Variants
const sheetVariants = cva(
  "fixed z-50 gap-4 bg-background p-6 shadow-lg transition",
  {
    variants: {
      side: {
        top: "inset-x-0 top-0 border-b",
        bottom: "inset-x-0 bottom-0 border-t",
        left: "inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm",
        right: "inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm",
      },
    },
    defaultVariants: { side: "right" },
  }
)

// Content
export const SheetContent = React.forwardRef(function SheetContent(
  { side = "right", className, children, ...props },
  ref
) {
  return (
    <SheetPortal>
      <SheetOverlay />

      <SheetPrimitive.Content
        ref={ref}
        className={cn(sheetVariants({ side }), className)}
        {...props}
      >
        <SheetPrimitive.Close className="absolute right-4 top-4">
          <X className="h-4 w-4" />
        </SheetPrimitive.Close>

        {children}
      </SheetPrimitive.Content>
    </SheetPortal>
  )
})

// Layout helpers
export function SheetHeader({ className, ...props }) {
  return (
    <div className={cn("flex flex-col space-y-2 text-center sm:text-left", className)} {...props} />
  )
}

export function SheetFooter({ className, ...props }) {
  return (
    <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)} {...props} />
  )
}

export const SheetTitle = React.forwardRef(function SheetTitle(
  { className, ...props },
  ref
) {
  return (
    <SheetPrimitive.Title
      ref={ref}
      className={cn("text-lg font-semibold", className)}
      {...props}
    />
  )
})

export const SheetDescription = React.forwardRef(function SheetDescription(
  { className, ...props },
  ref
) {
  return (
    <SheetPrimitive.Description
      ref={ref}
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
})
