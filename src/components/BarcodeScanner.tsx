// BarcodeScanner.jsx
import React, { useEffect, useRef, useState } from "react";
// import { BrowserMultiFormatReader, NotFoundException } from "@zxing/browser";
import { BrowserMultiFormatReader } from "@zxing/browser";

export default function BarcodeScanner({ onDetected }) {
  const videoRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);
  const [lastScannedCode, setLastScannedCode] = useState(null);
  const [controls, setControls] = useState(null);

  const codeReader = useRef(new BrowserMultiFormatReader());

  const startScanner = async () => {
    setError(null);
    setLastScannedCode(null);
    setLoading(true);
    setScanning(true);

    try {
      const scanControls = await codeReader.current.decodeFromVideoDevice(
        null,
        videoRef.current,
        (result, err) => {
          if (result) {
            const code = result.getText();
            console.log("Scanned:", code);

            // Avoid duplicate scans
            if (code !== lastScannedCode) {
              setLastScannedCode(code);
              onDetected(code);
              stopScanner();
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
      console.error("Camera error:", e);
      setError(
        "Camera access denied or unavailable. Please enable camera permissions."
      );
      setScanning(false);
    } finally {
      setLoading(false);
    }
  };

  const stopScanner = () => {
    if (controls) {
      controls.stop();
    }
    setScanning(false);
  };

  useEffect(() => {
    startScanner();

    return () => {
      stopScanner();
      // codeReader.current.reset();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ textAlign: "center" }}>
      {loading && <p>Initializing camera...</p>}
      {error && (
        <p style={{ color: "red", fontWeight: "bold" }}>{error}</p>
      )}

      <video
        ref={videoRef}
        style={{
          width: "100%",
          maxWidth: "400px",
          border: "1px solid #ccc",
          borderRadius: "8px",
        }}
      />

      {!loading && !error && (
        <>
          {scanning ? (
            <p>Scanning... Point the camera at the barcode.</p>
          ) : (
            <>
              <p>Scan complete.</p>
              <button
                onClick={startScanner}
                style={{
                  marginTop: "0.5rem",
                  padding: "0.5rem 1rem",
                  fontSize: "1rem",
                }}
              >
                Scan Again
              </button>
            </>
          )}
        </>
      )}
    </div>
  );
}
