import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { Button, Input, Label } from '@/components/ui';

interface ScannerModalProps {
  onDetected: (barcode: string) => void;
  onClose: () => void;
}

const ScannerModal = ({ onDetected, onClose }: ScannerModalProps) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const codeReader = useRef(new BrowserMultiFormatReader());
  const handledRef = useRef(false);
  const controlsRef = useRef<{ stop: () => void } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [manualBarcode, setManualBarcode] = useState('');
  const [isManualMode, setIsManualMode] = useState(false);

  const emitBarcode = (raw: string) => {
    const barcode = raw.replace(/\s+/g, '');
    if (!barcode || handledRef.current) return;
    handledRef.current = true;
    navigator.vibrate?.(200);
    new Audio('/assets/beep.wav').play().catch(() => undefined);
    onDetected(barcode);
  };

  const stopScanner = () => {
    controlsRef.current?.stop();
    controlsRef.current = null;
  };

  const startScanner = async () => {
    setError(null);
    setLoading(true);
    handledRef.current = false;

    try {
      const scanControls = await codeReader.current.decodeFromVideoDevice(
        undefined,
        videoRef.current,
        (result) => {
          if (result) emitBarcode(result.getText());
        }
      );
      controlsRef.current = scanControls;
    } catch {
      setError('Camera access denied or unavailable.');
      setIsManualMode(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isManualMode) {
      void startScanner();
    } else {
      stopScanner();
    }
    return () => {
      stopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isManualMode]);

  const handleManualLookup = () => {
    if (!manualBarcode.trim()) {
      setError('Please enter a barcode number.');
      return;
    }
    setError(null);
    emitBarcode(manualBarcode);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-md rounded-lg bg-slate-900 p-4 text-center text-white">
        <h3 className="mb-3 text-lg font-semibold">Scan barcode</h3>

        <div className="mb-4">
          <Button
            onClick={() => {
              setError(null);
              setIsManualMode(current => !current);
            }}
            variant="outline"
            size="sm"
            className="text-xs"
          >
            {isManualMode ? 'Switch to Camera' : 'Enter barcode manually'}
          </Button>
        </div>

        {isManualMode ? (
          <div className="space-y-4 text-left">
            <div className="space-y-2">
              <Label htmlFor="barcode-input">Barcode number</Label>
              <Input
                id="barcode-input"
                type="text"
                inputMode="numeric"
                value={manualBarcode}
                onChange={(event) => setManualBarcode(event.target.value)}
                placeholder="012345678901"
                autoFocus
                onKeyDown={(event) => {
                  if (event.key === 'Enter') handleManualLookup();
                }}
              />
            </div>
            <div className="flex justify-center gap-2">
              <Button onClick={handleManualLookup}>Use barcode</Button>
              <Button variant="secondary" onClick={onClose}>Cancel</Button>
            </div>
          </div>
        ) : (
          <>
            {loading && <p className="text-sm text-slate-300">Initializing camera…</p>}
            <div className="relative w-full">
              <video ref={videoRef} className="w-full rounded-lg border border-gray-300" />
              {!loading && (
                <div className="pointer-events-none absolute left-[10%] top-[40%] h-2/5 w-4/5 rounded border-2 border-dashed border-red-800" />
              )}
            </div>
            {!loading && (
              <div className="mt-3">
                <Button className="mr-2" onClick={() => void startScanner()}>Retry</Button>
                <Button variant="secondary" onClick={() => { stopScanner(); onClose(); }}>Cancel</Button>
              </div>
            )}
          </>
        )}

        {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
      </div>
    </div>
  );
};

export default ScannerModal;
