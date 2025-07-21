import { useState, useEffect } from "react";
import { Input } from "./input";
import { cn } from "@/lib/utils";

interface NumberInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value: number;
  onValueChange: (value: number) => void;
  onInvalidInput?: () => void;
  step?: number;
  min?: number;
  max?: number;
  allowEmpty?: boolean;
  allowDecimal?: boolean;
}

const NumberInput = ({
  value,
  onValueChange,
  onInvalidInput,
  step = 1,
  min,
  max,
  allowEmpty = false,
  allowDecimal = true,
  className,
  ...props
}: NumberInputProps) => {
  // Local state to track input value for better UX
  const [inputValue, setInputValue] = useState<string>("");

  // Update local state when prop value changes
  useEffect(() => {
    setInputValue(value === 0 && allowEmpty ? "" : value.toString());
  }, [value, allowEmpty]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Handle empty input
    if (value === "" || value === ".") {
      if (allowEmpty) {
        setInputValue(value);
        return;
      }
      return;
    }
    
    // Validate input format
    const decimalRegex = allowDecimal ? /^\d*\.?\d*$/ : /^\d*$/;
    if (!decimalRegex.test(value)) {
      // Don't update input state for invalid characters
      onInvalidInput?.();
      return;
    }
    
    // Update local input state for valid input
    setInputValue(value);
    
    // Parse and validate number
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      // Don't apply min/max constraints during typing - only on blur
      onValueChange(numValue);
    }
  };

  const handleBlur = () => {
    // Clean up local state when input loses focus
    const numValue = parseFloat(inputValue);
    if (isNaN(numValue)) {
      setInputValue(allowEmpty ? "" : "0");
      if (!allowEmpty) {
        onValueChange(0);
      }
    } else {
      // Apply min/max constraints on blur
      let finalValue = numValue;
      if (min !== undefined && finalValue < min) {
        finalValue = min;
        setInputValue(finalValue.toString());
      }
      if (max !== undefined && finalValue > max) {
        finalValue = max;
        setInputValue(finalValue.toString());
      }
      
      if (finalValue === 0 && allowEmpty) {
        setInputValue("");
      } else {
        setInputValue(finalValue.toString());
      }
      
      onValueChange(finalValue);
    }
  };

  return (
    <Input
      type="text"
      inputMode="decimal"
      value={inputValue}
      onChange={handleChange}
      onBlur={handleBlur}
      step={step}
      min={min}
      max={max}
      className={cn("text-right", className)}
      {...props}
    />
  );
};

export { NumberInput }; 