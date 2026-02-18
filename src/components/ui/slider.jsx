import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"
import { cn } from "../../lib/utils"

export const Slider = React.forwardRef(function Slider(
  { className = "", ...props },
  ref
) {
  return (
    <SliderPrimitive.Root
      ref={ref}
      className={cn(
        "relative flex w-full touch-none select-none items-center",
        className
      )}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-zinc-200">
        <SliderPrimitive.Range className="absolute h-full bg-zinc-900" />
      </SliderPrimitive.Track>

      <SliderPrimitive.Thumb className="block h-4 w-4 rounded-full border border-zinc-400 bg-white shadow focus:outline-none disabled:pointer-events-none disabled:opacity-50" />
    </SliderPrimitive.Root>
  )
})
