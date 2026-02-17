import React from "react";
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";
import {
  DayButton,
  DayPicker,
  getDefaultClassNames,
} from "react-day-picker";

import { Button } from "./Button"; // adjust path
import { buttonVariants } from "./Button";

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  buttonVariant = "ghost",
  formatters,
  components,
  ...props
}) {
  const defaultClassNames = getDefaultClassNames();

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      captionLayout={captionLayout}
      formatters={{
        formatMonthDropdown: (date) =>
          date.toLocaleString("default", { month: "short" }),
        ...formatters,
      }}
      className={cn(
        "bg-white rounded-2xl border shadow-sm p-3",
        className
      )}
      classNames={{
        root: cn("w-fit", defaultClassNames.root),
        months: cn("relative flex flex-col gap-2"),
        month: cn("flex w-full flex-col gap-2"),

        nav: cn(
          "absolute left-2 right-2 top-2 flex items-center justify-between"
        ),
        button_previous: cn(
          buttonVariants({ variant: buttonVariant }),
          "h-8 w-8 rounded-md p-0 text-gray-500 hover:bg-gray-100"
        ),
        button_next: cn(
          buttonVariants({ variant: buttonVariant }),
          "h-8 w-8 rounded-md p-0 text-gray-500 hover:bg-gray-100"
        ),

        month_caption:
          "flex h-9 w-full items-center justify-center px-10",
        caption_label:
          "select-none text-sm font-medium text-black",

        table: "w-full border-separate border-spacing-[3px]",
        weekdays: "flex",
        weekday:
          "flex-1 text-center text-[11px] font-medium text-gray-500",

        week: "mt-1 flex w-full",

        day:
          "group/day relative aspect-square h-full w-full text-center",
        today: "text-blue-600",
        outside: "text-gray-400",
        disabled: "opacity-40",
        hidden: "invisible",

        ...classNames,
      }}
      components={{
        Chevron: ({ className, orientation, ...props }) => {
          if (orientation === "left") {
            return (
              <ChevronLeftIcon
                className={cn("size-4", className)}
                {...props}
              />
            );
          }

          if (orientation === "right") {
            return (
              <ChevronRightIcon
                className={cn("size-4", className)}
                {...props}
              />
            );
          }

          return (
            <ChevronDownIcon
              className={cn("size-4", className)}
              {...props}
            />
          );
        },
        DayButton: CalendarDayButton,
        ...components,
      }}
      {...props}
    />
  );
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  ...props
}) {
  const ref = React.useRef(null);

  React.useEffect(() => {
    if (modifiers?.focused) {
      ref.current?.focus();
    }
  }, [modifiers?.focused]);

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      className={cn(
        "relative flex aspect-square w-full items-center justify-center rounded-full text-[13px] font-medium transition",
        "hover:bg-gray-100",
        modifiers?.selected && "bg-blue-600 text-white",
        className
      )}
      {...props}
    />
  );
}

export { Calendar, CalendarDayButton };
