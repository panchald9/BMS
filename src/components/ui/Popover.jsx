import * as React from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"
import { cn } from "@/lib/utils"

// Root + Trigger + Anchor
export const Popover = PopoverPrimitive.Root
export const PopoverTrigger = PopoverPrimitive.Trigger
export const PopoverAnchor = PopoverPrimitive.Anchor

// Content
export const PopoverContent = React.forwardRef(function PopoverContent(
  { className, align = "center", sideOffset = 4, ...props },
  ref
) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        ref={ref}
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "z-50 w-72 rounded-xl border bg-popover p-3 text-popover-foreground shadow-lg outline-none",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          "origin-[--radix-popover-content-transform-origin]",
          className
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  )
})
