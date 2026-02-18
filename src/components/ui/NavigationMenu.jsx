import * as React from "react"
import * as NavigationMenuPrimitive from "@radix-ui/react-navigation-menu"
import { cva } from "class-variance-authority"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

// Root
export const NavigationMenu = React.forwardRef(function NavigationMenu(
  { className, children, ...props },
  ref
) {
  return (
    <NavigationMenuPrimitive.Root
      ref={ref}
      className={cn(
        "relative z-10 flex max-w-max flex-1 items-center justify-center",
        className
      )}
      {...props}
    >
      {children}
      <NavigationMenuViewport />
    </NavigationMenuPrimitive.Root>
  )
})

// List
export const NavigationMenuList = React.forwardRef(function NavigationMenuList(
  { className, ...props },
  ref
) {
  return (
    <NavigationMenuPrimitive.List
      ref={ref}
      className={cn(
        "group flex flex-1 list-none items-center justify-center space-x-1",
        className
      )}
      {...props}
    />
  )
})

export const NavigationMenuItem = NavigationMenuPrimitive.Item

// Trigger style
export const navigationMenuTriggerStyle = cva(
  "group inline-flex h-9 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[state=open]:text-accent-foreground data-[state=open]:bg-accent/50"
)

// Trigger
export const NavigationMenuTrigger = React.forwardRef(function NavigationMenuTrigger(
  { className, children, ...props },
  ref
) {
  return (
    <NavigationMenuPrimitive.Trigger
      ref={ref}
      className={cn(navigationMenuTriggerStyle(), "group", className)}
      {...props}
    >
      {children}
      <ChevronDown className="ml-1 h-3 w-3 transition group-data-[state=open]:rotate-180" />
    </NavigationMenuPrimitive.Trigger>
  )
})

// Content
export const NavigationMenuContent = React.forwardRef(function NavigationMenuContent(
  { className, ...props },
  ref
) {
  return (
    <NavigationMenuPrimitive.Content
      ref={ref}
      className={cn("left-0 top-0 w-full md:absolute md:w-auto", className)}
      {...props}
    />
  )
})

export const NavigationMenuLink = NavigationMenuPrimitive.Link

// Viewport
export const NavigationMenuViewport = React.forwardRef(function NavigationMenuViewport(
  { className, ...props },
  ref
) {
  return (
    <div className="absolute left-0 top-full flex justify-center">
      <NavigationMenuPrimitive.Viewport
        ref={ref}
        className={cn(
          "relative mt-1.5 overflow-hidden rounded-md border bg-popover shadow md:w-[var(--radix-navigation-menu-viewport-width)]",
          className
        )}
        {...props}
      />
    </div>
  )
})

// Indicator
export const NavigationMenuIndicator = React.forwardRef(function NavigationMenuIndicator(
  { className, ...props },
  ref
) {
  return (
    <NavigationMenuPrimitive.Indicator
      ref={ref}
      className={cn("top-full flex h-1.5 items-end justify-center", className)}
      {...props}
    >
      <div className="relative top-[60%] h-2 w-2 rotate-45 rounded-tl-sm bg-border shadow-md" />
    </NavigationMenuPrimitive.Indicator>
  )
})
