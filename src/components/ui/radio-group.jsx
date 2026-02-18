import * as React from "react";

const RadioGroupContext = React.createContext({
  name: undefined,
  value: undefined,
  onValueChange: undefined,
});

export function RadioGroup({
  value,
  onValueChange,
  name,
  className,
  children,
  ...props
}) {
  const generatedName = React.useId();

  return (
    <RadioGroupContext.Provider
      value={{ name: name || generatedName, value, onValueChange }}
    >
      <div role="radiogroup" className={className} {...props}>
        {children}
      </div>
    </RadioGroupContext.Provider>
  );
}

export function RadioGroupItem({
  value,
  id,
  className,
  onChange,
  ...props
}) {
  const group = React.useContext(RadioGroupContext);

  return (
    <input
      type="radio"
      id={id}
      name={group.name}
      value={value}
      checked={group.value === value}
      className={className}
      onChange={(event) => {
        group.onValueChange?.(event.target.value);
        onChange?.(event);
      }}
      {...props}
    />
  );
}
