import { CalendarIcon } from "lucide-react";
import React, { useMemo, useState } from "react";
import { isValid } from "date-fns";

import { Button } from "./Button"; // adjust path
import { Calendar } from "./Calendar";
import { Input } from "./Input";
import { Popover, PopoverContent, PopoverTrigger } from "./Popover";

import {
  dateToISO,
  formatDateDDMMYYYY,
  isoToDate,
  parseDDMMYYYYToISO,
  todayISO,
} from "./date"; // adjust path

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

export function DateInput({
  valueISO,
  onChangeISO,
  placeholder = "DD-MM-YYYY",
  maxISO = todayISO(),
  disabled,
  inputTestId,
  buttonTestId,
  popoverTestId,
}) {
  const dateObj = useMemo(() => isoToDate(valueISO), [valueISO]);
  const maxDate = useMemo(
    () => isoToDate(maxISO) || new Date(),
    [maxISO]
  );

  const [text, setText] = useState(
    valueISO ? formatDateDDMMYYYY(valueISO) : ""
  );

  const shownText = useMemo(() => {
    const fromValue = valueISO
      ? formatDateDDMMYYYY(valueISO)
      : "";
    return text.trim() === fromValue ? fromValue : text;
  }, [text, valueISO]);

  const [open, setOpen] = useState(false);

  const helper = useMemo(() => {
    if (!shownText.trim()) return "";

    const iso = parseDDMMYYYYToISO(shownText);
    if (!iso) return "Invalid date";
    if (iso > maxISO)
      return `Max: ${formatDateDDMMYYYY(maxISO)}`;

    const d = isoToDate(iso);
    if (!d || !isValid(d)) return "Invalid date";

    return "";
  }, [shownText, maxISO]);

  return (
    <div className="relative">
      <Input
        inputMode="numeric"
        placeholder={placeholder}
        maxLength={10}
        value={shownText}
        disabled={disabled}
        onChange={(e) => {
          const next = e.target.value;
          setText(next);

          const iso = parseDDMMYYYYToISO(next);
          if (!iso) return;
          if (iso > maxISO) return;

          onChangeISO(iso);
        }}
        onBlur={() => {
          const iso = parseDDMMYYYYToISO(text);

          if (iso && iso <= maxISO) {
            onChangeISO(iso);
            setText(formatDateDDMMYYYY(iso));
          } else if (!text.trim()) {
            setText(
              valueISO
                ? formatDateDDMMYYYY(valueISO)
                : ""
            );
          }
        }}
        className="pr-11"
        data-testid={inputTestId}
      />

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={disabled}
            className={cn(
              "absolute right-1 top-1/2 h-9 w-9 -translate-y-1/2 rounded-md text-gray-500 hover:text-black"
            )}
            data-testid={buttonTestId}
          >
            <CalendarIcon className="h-4 w-4" />
          </Button>
        </PopoverTrigger>

        <PopoverContent
          className="w-auto p-2"
          align="end"
          data-testid={popoverTestId}
        >
          <Calendar
            mode="single"
            selected={dateObj || undefined}
            onSelect={(d) => {
              if (!d) return;

              const iso = dateToISO(d);
              if (iso > maxISO) return;

              onChangeISO(iso);
              setText(formatDateDDMMYYYY(iso));
              setOpen(false);
            }}
            disabled={(d) => dateToISO(d) > maxISO}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      {helper ? (
        <div
          className={cn(
            "mt-1 text-xs",
            helper.startsWith("Invalid")
              ? "text-red-600"
              : "text-gray-500"
          )}
        >
          {helper}
        </div>
      ) : null}
    </div>
  );
}
