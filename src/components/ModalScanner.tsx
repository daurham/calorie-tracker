import React, { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { Button } from "./ui";
// import { BrowserMultiFormatReader, NotFoundException } from "@zxing/browser";

export default function ModalScanner({ onDetected, onClose }) {
  const videoRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);
  const [controls, setControls] = useState(null);
  const [manualBarcode, setManualBarcode] = useState("");
  const [isManualMode, setIsManualMode] = useState(false);

  const codeReader = useRef(new BrowserMultiFormatReader());

  const lookupBarcode = async (barcode) => {
    try {
      const response = await fetch(
        `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`
      );
      const data = await response.json();

      if (data.status === 1) {
        navigator.vibrate?.(200);
        // play a sound
        const audio = new Audio("/assets/beep.wav");
        audio.play().catch(err => console.error("Error playing audio:", err));

        // Found
        onDetected(data.product);
      } else {
        setError("Barcode not found. Try again.");
      }
    } catch (lookupError) {
      console.error("Lookup error:", lookupError);
      setError("Error looking up barcode. Try again.");
    }
  };

  const handleManualLookup = () => {
    if (!manualBarcode.trim()) {
      setError("Please enter a barcode number.");
      return;
    }
    setError(null);
    lookupBarcode(manualBarcode.trim());
  };

  const startScanner = async () => {
    setError(null);
    setLoading(true);
    setScanning(true);

    try {
      const scanControls = await codeReader.current.decodeFromVideoDevice(
        null,
        videoRef.current,
        async (result, err) => {
          if (result) {
            const code = result.getText();
            console.log("Scanned barcode:", code);

            try {
              // Lookup nutrition data from Open Food Facts
              const response = await fetch(
                `https://world.openfoodfacts.org/api/v0/product/${code}.json`
              );
              const data = await response.json();

              if (data.status === 1) {
                stopScanner();

                navigator.vibrate?.(200);
                // play a sound
                const audio = new Audio("/assets/beep.wav");
                audio.play().catch(err => console.error("Error playing audio:", err));

                // Found
                onDetected(data.product);
              } else {
                setError("Barcode not found. Try again.");
              }
            } catch (lookupError) {
              console.error("Lookup error:", lookupError);
              setError("Error looking up barcode. Try again.");
            }
          }
          // if (err && !(err instanceof NotFoundException)) {
          if (err) {
            console.error("Scan error:", err);
          }
        }
      );
      setControls(scanControls);
    } catch (e) {
      console.error(e);
      setError("Camera access denied or unavailable.");
      setScanning(false);
    } finally {
      setLoading(false);
    }
  };

  const stopScanner = () => {
    if (controls) controls.stop();
    setScanning(false);
    console.log("stopScanner");
  };

  useEffect(() => {
    if (!isManualMode) {
      startScanner();
    }
    return () => {
      console.log("Cleanup: stopping scanner");
      stopScanner();
      // codeReader.current.reset();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isManualMode]);

  const toggleMode = () => {
    if (isManualMode) {
      setIsManualMode(false);
      setManualBarcode("");
      setError(null);
    } else {
      setIsManualMode(true);
      stopScanner();
      setError(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex flex-col items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-lg p-4 max-w-md w-full text-center">
        <h3>Barcode Lookup</h3>
        
        {/* Mode Toggle */}
        <div className="mb-4">
          <Button
            onClick={toggleMode}
            variant="outline"
            size="sm"
            className="text-xs"
          >
            {isManualMode ? "Switch to Camera" : "Switch to Manual Entry"}
          </Button>
        </div>

        {isManualMode ? (
          /* Manual Entry Mode */
          <div className="space-y-4">
            <div>
              <label htmlFor="barcode-input" className="block text-sm font-medium mb-2">
                Enter Barcode Number
              </label>
              <input
                id="barcode-input"
                type="text"
                value={manualBarcode}
                onChange={(e) => setManualBarcode(e.target.value)}
                placeholder="Enter barcode number..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-black"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleManualLookup();
                  }
                }}
              />
            </div>
            
            <div className="flex gap-2 justify-center">
              <Button
                onClick={handleManualLookup}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleManualLookup();
                  }
                }}
                className="px-4 py-2"
                variant="default"
              >
                Lookup
              </Button>
              <Button
              onClick={() => {
                stopScanner();
                onClose();
              }}
              className="px-4 py-2"
              variant="secondary"
            >
              Cancel
              </Button>
            </div>
          </div>
        ) : (
          /* Camera Mode */
          <>
            {loading && <p>Initializing camera...</p>}

            <div className="relative w-full">
              <video
                ref={videoRef}
                className="w-full border border-gray-300 rounded-lg"
              />
              {/* Overlay Box */}
              {!loading && <div className="absolute top-[40%] left-[10%] w-4/5 h-2/5 border-2 border-dashed border-red-800 rounded pointer-events-none" />}
            </div>
          </>
        )}

        {error && (
          <p className="text-red-500 mt-2">{error}</p>
        )}
        
        {!loading && !isManualMode && (
          <div className="mt-3">
            <Button
              onClick={() => {
                setError(null);
                startScanner();
              }}
              className="mr-2 px-4 py-2"
              variant="default"
            >
              Retry
            </Button>
            <Button
              onClick={() => {
                stopScanner();
                onClose();
              }}
              className="px-4 py-2"
              variant="secondary"
            >
              Cancel
            </Button>
          </div>
        )}
        
        {/* {isManualMode && (
          <div className="mt-3">
            <Button
              onClick={() => {
                stopScanner();
                onClose();
              }}
              className="px-4 py-2"
              variant="secondary"
            >
              Cancel
            </Button>
          </div>
        )} */}
      </div>
    </div>
  );
}
