import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"
import { cn } from "../../lib/utils"

export const Switch = React.forwardRef(function Switch(
  { className = "", ...props },
  ref
) {
  return (
    <SwitchPrimitives.Root
      ref={ref}
      className={cn(
        "peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        "data-[state=checked]:bg-zinc-900 data-[state=unchecked]:bg-zinc-300",
        className
      )}
      {...props}
    >
      <SwitchPrimitives.Thumb
        className={cn(
          "pointer-events-none block h-4 w-4 rounded-full bg-white shadow transition-transform",
          "data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0"
        )}
      />
    </SwitchPrimitives.Root>
  )
})
