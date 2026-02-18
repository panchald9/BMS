import * as React from "react"
import { cn } from "../../lib/utils"

export const Textarea = React.forwardRef(function Textarea(
  { className = "", ...props },
  ref
) {
  return (
    <textarea
      ref={ref}
      className={cn(
        "flex min-h-[60px] w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm shadow-sm",
        "placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
})
