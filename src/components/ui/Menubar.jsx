import * as React from "react"
import * as MenubarPrimitive from "@radix-ui/react-menubar"
import { Check, ChevronRight, Circle } from "lucide-react"
import { cn } from "@/lib/utils"

// Simple passthrough components
export const MenubarMenu = (props) => <MenubarPrimitive.Menu {...props} />
export const MenubarGroup = (props) => <MenubarPrimitive.Group {...props} />
export const MenubarPortal = (props) => <MenubarPrimitive.Portal {...props} />
export const MenubarRadioGroup = (props) => <MenubarPrimitive.RadioGroup {...props} />
export const MenubarSub = (props) => <MenubarPrimitive.Sub data-slot="menubar-sub" {...props} />

// Root
export const Menubar = React.forwardRef(function Menubar(
  { className, ...props },
  ref
) {
  return (
    <MenubarPrimitive.Root
      ref={ref}
      className={cn(
        "flex h-9 items-center space-x-1 rounded-md border bg-background p-1 shadow-sm",
        className
      )}
      {...props}
    />
  )
})

// Trigger
export const MenubarTrigger = React.forwardRef(function MenubarTrigger(
  { className, ...props },
  ref
) {
  return (
    <MenubarPrimitive.Trigger
      ref={ref}
      className={cn(
        "flex cursor-default select-none items-center rounded-sm px-3 py-1 text-sm font-medium outline-none",
        "focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground",
        className
      )}
      {...props}
    />
  )
})

// Sub Trigger
export const MenubarSubTrigger = React.forwardRef(function MenubarSubTrigger(
  { className, inset, children, ...props },
  ref
) {
  return (
    <MenubarPrimitive.SubTrigger
      ref={ref}
      className={cn(
        "flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none",
        "focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground",
        inset && "pl-8",
        className
      )}
      {...props}
    >
      {children}
      <ChevronRight className="ml-auto h-4 w-4" />
    </MenubarPrimitive.SubTrigger>
  )
})

// Sub Content
export const MenubarSubContent = React.forwardRef(function MenubarSubContent(
  { className, ...props },
  ref
) {
  return (
    <MenubarPrimitive.SubContent
      ref={ref}
      className={cn(
        "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg",
        className
      )}
      {...props}
    />
  )
})

// Content
export const MenubarContent = React.forwardRef(function MenubarContent(
  { className, align = "start", alignOffset = -4, sideOffset = 8, ...props },
  ref
) {
  return (
    <MenubarPrimitive.Portal>
      <MenubarPrimitive.Content
        ref={ref}
        align={align}
        alignOffset={alignOffset}
        sideOffset={sideOffset}
        className={cn(
          "z-50 min-w-[12rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md",
          className
        )}
        {...props}
      />
    </MenubarPrimitive.Portal>
  )
})

// Item
export const MenubarItem = React.forwardRef(function MenubarItem(
  { className, inset, ...props },
  ref
) {
  return (
    <MenubarPrimitive.Item
      ref={ref}
      className={cn(
        "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none",
        "focus:bg-accent focus:text-accent-foreground data-[disabled]:opacity-50",
        inset && "pl-8",
        className
      )}
      {...props}
    />
  )
})

// Checkbox Item
export const MenubarCheckboxItem = React.forwardRef(function MenubarCheckboxItem(
  { className, children, checked, ...props },
  ref
) {
  return (
    <MenubarPrimitive.CheckboxItem
      ref={ref}
      checked={checked}
      className={cn(
        "relative flex items-center rounded-sm py-1.5 pl-8 pr-2 text-sm",
        "focus:bg-accent focus:text-accent-foreground",
        className
      )}
      {...props}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        <MenubarPrimitive.ItemIndicator>
          <Check className="h-4 w-4" />
        </MenubarPrimitive.ItemIndicator>
      </span>
      {children}
    </MenubarPrimitive.CheckboxItem>
  )
})

// Radio Item
export const MenubarRadioItem = React.forwardRef(function MenubarRadioItem(
  { className, children, ...props },
  ref
) {
  return (
    <MenubarPrimitive.RadioItem
      ref={ref}
      className={cn(
        "relative flex items-center rounded-sm py-1.5 pl-8 pr-2 text-sm",
        "focus:bg-accent focus:text-accent-foreground",
        className
      )}
      {...props}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        <MenubarPrimitive.ItemIndicator>
          <Circle className="h-4 w-4 fill-current" />
        </MenubarPrimitive.ItemIndicator>
      </span>
      {children}
    </MenubarPrimitive.RadioItem>
  )
})

// Label / Separator / Shortcut
export const MenubarLabel = React.forwardRef(function MenubarLabel(
  { className, inset, ...props },
  ref
) {
  return (
    <MenubarPrimitive.Label
      ref={ref}
      className={cn("px-2 py-1.5 text-sm font-semibold", inset && "pl-8", className)}
      {...props}
    />
  )
})

export const MenubarSeparator = React.forwardRef(function MenubarSeparator(
  { className, ...props },
  ref
) {
  return (
    <MenubarPrimitive.Separator
      ref={ref}
      className={cn("-mx-1 my-1 h-px bg-muted", className)}
      {...props}
    />
  )
})

export function MenubarShortcut({ className, ...props }) {
  return (
    <span
      className={cn("ml-auto text-xs tracking-widest text-muted-foreground", className)}
      {...props}
    />
  )
}
