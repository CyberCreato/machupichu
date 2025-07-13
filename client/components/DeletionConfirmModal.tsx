import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Loader2 } from "lucide-react";

interface DeletionConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  itemName: string;
  onConfirm: () => Promise<void>;
  loading?: boolean;
}

export function DeletionConfirmModal({
  open,
  onOpenChange,
  title,
  description,
  itemName,
  onConfirm,
  loading = false,
}: DeletionConfirmModalProps) {
  const [confirmationText, setConfirmationText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const requiredText = "THE END OF A JOURNEY";
  const isConfirmationValid = confirmationText === requiredText;

  const handleConfirm = async () => {
    if (!isConfirmationValid) {
      setError(`Please type "${requiredText}" exactly as shown`);
      return;
    }

    setError(null);
    try {
      await onConfirm();
      setConfirmationText("");
      onOpenChange(false);
    } catch (error) {
      setError("Failed to delete. Please try again.");
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setConfirmationText("");
      setError(null);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center text-red-600">
            <AlertTriangle className="h-5 w-5 mr-2" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Warning:</strong> This action cannot be undone. You are
              about to permanently delete "{itemName}".
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="confirmation">
              To confirm deletion, please type:{" "}
              <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                {requiredText}
              </code>
            </Label>
            <Input
              id="confirmation"
              value={confirmationText}
              onChange={(e) => {
                setConfirmationText(e.target.value);
                setError(null);
              }}
              placeholder={`Type "${requiredText}" to confirm`}
              className={
                confirmationText && !isConfirmationValid
                  ? "border-red-300 focus:border-red-500"
                  : ""
              }
            />
            {confirmationText && !isConfirmationValid && (
              <p className="text-sm text-red-600">
                Text must match exactly: "{requiredText}"
              </p>
            )}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirm}
              disabled={!isConfirmationValid || loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Permanently"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
