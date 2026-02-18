import { Input } from "./input";

export function DateInput({
  valueISO = "",
  onChangeISO,
  placeholder = "YYYY-MM-DD",
  disabled,
  className,
  ...props
}) {
  return (
    <Input
      type="date"
      value={valueISO}
      onChange={(e) => onChangeISO?.(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className={className}
      {...props}
    />
  );
}
