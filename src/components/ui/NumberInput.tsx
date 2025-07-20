import { useState, useEffect } from "react";
import { Input } from "./input";
import { cn } from "@/lib/utils";

interface NumberInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value: number;
  onValueChange: (value: number) => void;
  step?: number;
  min?: number;
  max?: number;
  allowEmpty?: boolean;
  allowDecimal?: boolean;
}

const NumberInput = ({
  value,
  onValueChange,
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
    
    // Update local input state immediately for responsive UX
    setInputValue(value);
    
    // Handle empty input
    if (value === "" || value === ".") {
      if (allowEmpty) {
        onValueChange(0);
      }
      return;
    }
    
    // Validate input format
    const decimalRegex = allowDecimal ? /^\d*\.?\d*$/ : /^\d*$/;
    if (!decimalRegex.test(value)) {
      return;
    }
    
    // Parse and validate number
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      // Apply min/max constraints
      let finalValue = numValue;
      if (min !== undefined && finalValue < min) {
        finalValue = min;
        setInputValue(finalValue.toString());
      }
      if (max !== undefined && finalValue > max) {
        finalValue = max;
        setInputValue(finalValue.toString());
      }
      
      onValueChange(finalValue);
    }
  };

  const handleBlur = () => {
    // Clean up local state when input loses focus
    const numValue = parseFloat(inputValue);
    if (isNaN(numValue) || numValue === 0) {
      setInputValue(allowEmpty ? "" : "0");
      onValueChange(0);
    } else {
      setInputValue(numValue.toString());
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