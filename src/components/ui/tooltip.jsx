import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

export function TooltipProvider({
  delayDuration = 0,
  ...props
}) {
  return (
    <TooltipPrimitive.Provider delayDuration={delayDuration} {...props} />
  );
}
