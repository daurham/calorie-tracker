import { useState, useEffect } from 'react';
import { Button, Label, NumberInput } from '@/components/ui';

interface PortionSelectorProps {
  portion: number;
  setPortion: (portion: number) => void;
  onValidationChange?: (isValid: boolean) => void;
}

const PortionSelector = ({ portion, setPortion, onValidationChange }: PortionSelectorProps) => {
  const [validationError, setValidationError] = useState<string | null>(null);

  // Initial validation check
  useEffect(() => {
    if (portion < 0.1 || portion > 2.0) {
      setValidationError("Portion must be between 0.1 and 2.0");
      onValidationChange?.(false);
    } else {
      setValidationError(null);
      onValidationChange?.(true);
    }
  }, [portion, onValidationChange]);
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1">
        <Label htmlFor="portion" className="text-xs">Portion:</Label>
        <div className="flex gap-1">
          <Button
            type="button"
            variant={portion === 1 ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setPortion(1);
              setValidationError(null);
              onValidationChange?.(true);
            }}
            className="text-xs h-6 px-2"
          >
            Full
          </Button>
          <Button
            type="button"
            variant={portion === 0.5 ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setPortion(0.5);
              setValidationError(null);
              onValidationChange?.(true);
            }}
            className="text-xs h-6 px-2"
          >
            ½
          </Button>
          <Button
            type="button"
            variant={portion === 0.33 ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setPortion(0.33);
              setValidationError(null);
              onValidationChange?.(true);
            }}
            className="text-xs h-6 px-2"
          >
            ⅓
          </Button>
          <Button
            type="button"
            variant={portion === 0.25 ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setPortion(0.25);
              setValidationError(null);
              onValidationChange?.(true);
            }}
            className="text-xs h-6 px-2"
          >
            ¼
          </Button>
          <NumberInput
            value={portion === 1 ? 0 : portion}
            onValueChange={(value) => {
              // Clear any previous error
              setValidationError(null);
              
              if (value === 0) {
                // Empty value is allowed for editing
                onValidationChange?.(false);
                return;
              }
              
              if (value < 0.1) {
                setValidationError("Portion must be at least 0.1");
                onValidationChange?.(false);
                return;
              }
              
              if (value > 2.0) {
                setValidationError("Portion cannot exceed 2.0");
                onValidationChange?.(false);
                return;
              }
              
              // Valid portion
              setPortion(value);
              onValidationChange?.(true);
            }}
            onInvalidInput={() => {
              setValidationError("Please enter a valid number (0.1 - 2.0)");
              onValidationChange?.(false);
            }}
            placeholder="Custom"
            className="h-6 w-16 text-xs"
            allowEmpty={true}
            allowDecimal={true}
            min={0.1}
            max={2.0}
            step={0.01}
          />
          <span className="text-xs text-muted-foreground self-center">×</span>
        </div>
      </div>
      
      {/* Validation Error */}
      {validationError && (
        <div className="text-xs text-red-500 animate-in fade-in duration-200">
          {validationError}
        </div>
      )}
    </div>
  );
};

export default PortionSelector; 