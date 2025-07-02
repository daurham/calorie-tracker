import React, { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
// import { BrowserMultiFormatReader, NotFoundException } from "@zxing/browser";

export default function ModalScanner({ onDetected, onClose }) {
  const videoRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);
  const [controls, setControls] = useState(null);

  const codeReader = useRef(new BrowserMultiFormatReader());

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
                // Found
                onDetected(data.product);
                stopScanner();
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
    startScanner();
    return () => {
      stopScanner();
      // codeReader.current.reset();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.8)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "1rem",
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "8px",
          padding: "1rem",
          maxWidth: "500px",
          width: "100%",
          textAlign: "center",
        }}
      >
        <h3>Scan Barcode</h3>
        {loading && <p>Initializing camera...</p>}
        <video
          ref={videoRef}
          style={{
            width: "100%",
            border: "1px solid #ccc",
            borderRadius: "8px",
          }}
        />
        {error && (
          <p style={{ color: "red", marginTop: "0.5rem" }}>{error}</p>
        )}
        {!loading && (
          <div style={{ marginTop: "0.75rem" }}>
            <button
              onClick={() => {
                setError(null);
                startScanner();
              }}
              style={{
                marginRight: "0.5rem",
                padding: "0.5rem 1rem",
              }}
            >
              Retry
            </button>
            <button
              onClick={() => {
                stopScanner();
                onClose();
              }}
              style={{
                padding: "0.5rem 1rem",
              }}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
