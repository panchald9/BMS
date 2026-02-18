"use client"

import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { Check, ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"

export const Select = SelectPrimitive.Root
export const SelectGroup = SelectPrimitive.Group
export const SelectValue = SelectPrimitive.Value

// Trigger
export const SelectTrigger = React.forwardRef(function SelectTrigger(
  { className, children, ...props },
  ref
) {
  return (
    <SelectPrimitive.Trigger
      ref={ref}
      className={cn(
        "flex h-9 w-full items-center justify-between rounded-md border border-input px-3 py-2 text-sm shadow-sm",
        "focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50",
        className
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDown className="h-4 w-4 opacity-50" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
})

// Scroll buttons
export const SelectScrollUpButton = React.forwardRef(function SelectScrollUpButton(
  { className, ...props },
  ref
) {
  return (
    <SelectPrimitive.ScrollUpButton
      ref={ref}
      className={cn("flex items-center justify-center py-1", className)}
      {...props}
    >
      <ChevronUp className="h-4 w-4" />
    </SelectPrimitive.ScrollUpButton>
  )
})

export const SelectScrollDownButton = React.forwardRef(function SelectScrollDownButton(
  { className, ...props },
  ref
) {
  return (
    <SelectPrimitive.ScrollDownButton
      ref={ref}
      className={cn("flex items-center justify-center py-1", className)}
      {...props}
    >
      <ChevronDown className="h-4 w-4" />
    </SelectPrimitive.ScrollDownButton>
  )
})

// Content
export const SelectContent = React.forwardRef(function SelectContent(
  { className, children, position = "popper", ...props },
  ref
) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        ref={ref}
        position={position}
        className={cn(
          "relative z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover shadow-md",
          className
        )}
        {...props}
      >
        <SelectScrollUpButton />

        <SelectPrimitive.Viewport className="p-1">
          {children}
        </SelectPrimitive.Viewport>

        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
})

// Label
export const SelectLabel = React.forwardRef(function SelectLabel(
  { className, ...props },
  ref
) {
  return (
    <SelectPrimitive.Label
      ref={ref}
      className={cn("px-2 py-1.5 text-sm font-semibold", className)}
      {...props}
    />
  )
})

// Item
export const SelectItem = React.forwardRef(function SelectItem(
  { className, children, ...props },
  ref
) {
  return (
    <SelectPrimitive.Item
      ref={ref}
      className={cn(
        "relative flex w-full items-center rounded-sm py-1.5 pl-2 pr-8 text-sm",
        "focus:bg-accent focus:text-accent-foreground",
        className
      )}
      {...props}
    >
      <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <Check className="h-4 w-4" />
        </SelectPrimitive.ItemIndicator>
      </span>

      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
})

// Separator
export const SelectSeparator = React.forwardRef(function SelectSeparator(
  { className, ...props },
  ref
) {
  return (
    <SelectPrimitive.Separator
      ref={ref}
      className={cn("-mx-1 my-1 h-px bg-muted", className)}
      {...props}
    />
  )
})
