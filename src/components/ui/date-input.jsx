import { Input } from "./input";

export function DateInput({
  valueISO = "",
  onChangeISO,
  placeholder = "YYYY-MM-DD",
  minISO,
  maxISO,
  disabled,
  className,
  inputTestId,
  buttonTestId: _buttonTestId,
  popoverTestId: _popoverTestId,
  ...props
}) {
  return (
    <Input
      type="date"
      value={valueISO}
      onChange={(e) => onChangeISO?.(e.target.value)}
      placeholder={placeholder}
      min={minISO}
      max={maxISO}
      disabled={disabled}
      className={className}
      data-testid={inputTestId}
      {...props}
    />
  );
}
