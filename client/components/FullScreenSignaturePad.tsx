import React, { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { X, RotateCcw, Check } from "lucide-react";

interface FullScreenSignaturePadProps {
  onSignatureComplete: (signature: string) => void;
  onCancel: () => void;
  isOpen: boolean;
  title?: string;
  jobId?: string;
  formType?: "material" | "noncompliance" | "liability" | "signature";
}

export function FullScreenSignaturePad({
  onSignatureComplete,
  onCancel,
  isOpen,
  title = "Client Signature",
  jobId,
  formType = "signature",
}: FullScreenSignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [showPopupConfirmation, setShowPopupConfirmation] = useState(false);
  const [isDoneSelected, setIsDoneSelected] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    // Request landscape orientation
    if (screen.orientation && screen.orientation.lock) {
      screen.orientation.lock("landscape").catch((err) => {
        console.log("Orientation lock not supported:", err);
      });
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas to full screen size
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      setupCanvas();
    };

    const setupCanvas = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Set up drawing context
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    resize();
    window.addEventListener("resize", resize);

    // Drawing functionality
    let drawing = false;
    let lastX = 0;
    let lastY = 0;

    const getEventPos = (e: MouseEvent | TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
      return {
        x: clientX - rect.left,
        y: clientY - rect.top,
      };
    };

    const startDrawing = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      drawing = true;
      const pos = getEventPos(e);
      lastX = pos.x;
      lastY = pos.y;
      setIsDrawing(true);
      setHasSignature(true);
    };

    const draw = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      if (!drawing) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const pos = getEventPos(e);

      ctx.beginPath();
      ctx.moveTo(lastX, lastY);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();

      lastX = pos.x;
      lastY = pos.y;
    };

    const stopDrawing = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      drawing = false;
      setIsDrawing(false);
    };

    // Mouse events
    canvas.addEventListener("mousedown", startDrawing);
    canvas.addEventListener("mousemove", draw);
    canvas.addEventListener("mouseup", stopDrawing);
    canvas.addEventListener("mouseout", stopDrawing);

    // Touch events
    canvas.addEventListener("touchstart", startDrawing);
    canvas.addEventListener("touchmove", draw);
    canvas.addEventListener("touchend", stopDrawing);

    return () => {
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousedown", startDrawing);
      canvas.removeEventListener("mousemove", draw);
      canvas.removeEventListener("mouseup", stopDrawing);
      canvas.removeEventListener("mouseout", stopDrawing);
      canvas.removeEventListener("touchstart", startDrawing);
      canvas.removeEventListener("touchmove", draw);
      canvas.removeEventListener("touchend", stopDrawing);

      // Unlock orientation when closing
      if (screen.orientation && screen.orientation.unlock) {
        screen.orientation.unlock();
      }
    };
  }, [isOpen]);

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleConfirm = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasSignature || !isDoneSelected) return;

    setShowPopupConfirmation(true);

    const signature = canvas.toDataURL();

    // Submit signature to API if jobId is provided
    if (jobId) {
      try {
        const token = localStorage.getItem("auth_token");
        const response = await fetch("/api/signatures", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            jobId,
            formType,
            signature,
            submittedBy: "current-user", // This should be the actual user ID
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to submit signature");
        }

        console.log("Signature submitted successfully");
      } catch (error) {
        console.error("Error submitting signature:", error);
      }
    }

    // Hide popup and complete after 2 seconds
    setTimeout(() => {
      onSignatureComplete(signature);
    }, 2000);
  };

  const handleCancel = () => {
    // Unlock orientation
    if (screen.orientation && screen.orientation.unlock) {
      screen.orientation.unlock();
    }
    onCancel();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 flex items-center justify-between">
        <h2 className="text-xl font-bold">{title}</h2>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleClear}
            className="bg-white text-blue-600 border-white"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Clear
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCancel}
            className="bg-white text-blue-600 border-white"
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        </div>
      </div>

      {/* Confirm Signature Button */}
      <div className="p-4 bg-white border-b">
        <Button
          onClick={handleConfirm}
          disabled={!hasSignature || !isDoneSelected}
          className={`max-w-md mx-auto flex items-center justify-center ${
            hasSignature && isDoneSelected
              ? "bg-green-600 hover:bg-green-700 text-white"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
          style={{ padding: "8px 32px" }}
        >
          <Check className="h-4 w-4 mr-2" />
          Confirm Signature
        </Button>
        {hasSignature && !isDoneSelected && (
          <p className="text-center text-sm text-red-600 mt-2">
            Please check the "Done" box to confirm signature
          </p>
        )}
      </div>

      {/* Signature Area */}
      <div className="flex-1 relative bg-gray-50">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 cursor-crosshair bg-white"
          style={{ touchAction: "none" }}
        />

        {/* Instructions */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 text-white px-4 py-2 rounded-lg text-center">
          <p className="text-lg font-medium">Client Signature Required</p>
          <p className="text-sm opacity-90">
            Use your finger or stylus to sign
          </p>
        </div>

        {/* Done Box */}
        <div className="absolute top-4 right-4">
          <div
            onClick={
              hasSignature
                ? () => setIsDoneSelected(!isDoneSelected)
                : undefined
            }
            className={`border-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
              hasSignature
                ? isDoneSelected
                  ? "bg-green-600 text-white border-green-600 cursor-pointer shadow-lg"
                  : "bg-white text-green-600 border-green-600 cursor-pointer hover:bg-green-50"
                : "bg-gray-200 text-gray-400 border-gray-300 cursor-not-allowed opacity-50"
            }`}
          >
            <div className="flex items-center space-x-2">
              <div
                className={`w-4 h-4 border-2 rounded transition-all ${
                  isDoneSelected && hasSignature
                    ? "bg-white border-white"
                    : "border-current"
                }`}
              >
                {isDoneSelected && hasSignature && (
                  <Check className="w-3 h-3 text-green-600" />
                )}
              </div>
              <span>Done</span>
            </div>
          </div>
        </div>

        {/* Status */}
        {isDrawing && (
          <div className="absolute bottom-4 left-4 bg-blue-600 text-white px-3 py-2 rounded-lg flex items-center">
            <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
            Signing...
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-100 p-4 flex justify-center">
        <Button variant="outline" onClick={handleCancel} className="px-8">
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
      </div>

      {/* Popup Confirmation Overlay */}
      {showPopupConfirmation && (
        <div className="absolute inset-0 bg-green-600 bg-opacity-95 flex items-center justify-center z-50">
          <div className="text-center text-white">
            <div className="mx-auto mb-4">
              <Check className="h-24 w-24 mx-auto animate-bounce" />
            </div>
            <div className="text-3xl font-bold mb-2">Done!</div>
            <div className="text-xl">Signature submitted successfully</div>
          </div>
        </div>
      )}
    </div>
  );
}
