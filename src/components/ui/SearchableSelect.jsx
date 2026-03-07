import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function SearchableSelect({
  value,
  onValueChange,
  options,
  placeholder = "Select...",
  emptyText = "No results",
  disabled = false,
  className,
  inputClassName,
  listClassName,
}) {
  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const selectedOption = useMemo(
    () => options.find((opt) => String(opt.value) === String(value)) || null,
    [options, value]
  );

  const filteredOptions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((opt) => String(opt.label).toLowerCase().includes(q));
  }, [options, query]);

  useEffect(() => {
    setQuery(selectedOption?.label || "");
  }, [selectedOption?.label]);

  useEffect(() => {
    function onPointerDown(event) {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
        setHighlightedIndex(-1);
        setQuery(selectedOption?.label || "");
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [selectedOption?.label]);

  function selectOption(opt) {
    onValueChange(String(opt.value));
    setQuery(opt.label);
    setOpen(false);
    setHighlightedIndex(-1);
  }

  function onKeyDown(event) {
    if (disabled) return;
    if (!open && (event.key === "ArrowDown" || event.key === "Enter")) {
      event.preventDefault();
      setOpen(true);
      setHighlightedIndex(filteredOptions.length > 0 ? 0 : -1);
      return;
    }

    if (!open) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightedIndex((prev) =>
        filteredOptions.length === 0 ? -1 : Math.min(prev + 1, filteredOptions.length - 1)
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex((prev) => (filteredOptions.length === 0 ? -1 : Math.max(prev - 1, 0)));
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
        selectOption(filteredOptions[highlightedIndex]);
      }
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      setHighlightedIndex(-1);
      setQuery(selectedOption?.label || "");
    }
  }

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <div className="relative">
        <input
          type="text"
          value={query}
          placeholder={placeholder}
          disabled={disabled}
          onFocus={() => {
            setOpen(true);
            setHighlightedIndex(filteredOptions.length > 0 ? 0 : -1);
          }}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
            setHighlightedIndex(0);
          }}
          onKeyDown={onKeyDown}
          className={cn(
            "flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 pr-9 text-sm shadow-sm outline-none",
            "focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
            inputClassName
          )}
        />
        <button
          type="button"
          tabIndex={-1}
          disabled={disabled}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => {
            setOpen((prev) => !prev);
            setHighlightedIndex(filteredOptions.length > 0 ? 0 : -1);
          }}
          className="absolute inset-y-0 right-0 flex w-9 items-center justify-center text-muted-foreground"
        >
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>

      {open ? (
        <div
          className={cn(
            "absolute z-50 mt-1 max-h-64 w-full overflow-auto rounded-md border bg-popover p-1 shadow-md",
            listClassName
          )}
        >
          {filteredOptions.length === 0 ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">{emptyText}</div>
          ) : (
            filteredOptions.map((opt, idx) => {
              const selected = String(opt.value) === String(value);
              const highlighted = idx === highlightedIndex;

              return (
                <button
                  key={String(opt.value)}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => selectOption(opt)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-sm px-3 py-2 text-left text-sm",
                    highlighted ? "bg-accent text-accent-foreground" : "hover:bg-accent/60"
                  )}
                >
                  <span className="truncate">{opt.label}</span>
                  {selected ? <Check className="ml-2 h-4 w-4 shrink-0" /> : null}
                </button>
              );
            })
          )}
        </div>
      ) : null}
    </div>
  );
}

