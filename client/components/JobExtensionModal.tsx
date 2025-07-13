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
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Job } from "@shared/types";
import { Loader2, Calendar } from "lucide-react";

interface JobExtensionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: Job | null;
  onJobExtended: () => void;
}

export function JobExtensionModal({
  open,
  onOpenChange,
  job,
  onJobExtended,
}: JobExtensionModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extensionData, setExtensionData] = useState({
    newDueDate: "",
    reason: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!job) return;

    setLoading(true);
    setError(null);

    try {
      if (!extensionData.newDueDate) {
        setError("New due date is required");
        setLoading(false);
        return;
      }

      if (!extensionData.reason.trim()) {
        setError("Reason for extension is required");
        setLoading(false);
        return;
      }

      const token = localStorage.getItem("auth_token");
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`/api/jobs/${job.id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({
          dueDate: new Date(extensionData.newDueDate).toISOString(),
          notes: job.notes
            ? `${job.notes}\n\n[Extension Request] ${new Date().toISOString()}: ${extensionData.reason}`
            : `[Extension Request] ${new Date().toISOString()}: ${extensionData.reason}`,
        }),
      });

      if (response.ok) {
        onJobExtended();
        onOpenChange(false);
        setExtensionData({ newDueDate: "", reason: "" });
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to extend job");
      }
    } catch (error) {
      setError("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
    if (!newOpen) {
      setExtensionData({ newDueDate: "", reason: "" });
      setError(null);
    }
  };

  if (!job) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Extend Job Deadline
          </DialogTitle>
          <DialogDescription>
            Request an extension for: {job.title}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentDueDate">Current Due Date</Label>
            <Input
              id="currentDueDate"
              type="text"
              value={
                job.dueDate
                  ? new Date(job.dueDate).toLocaleDateString()
                  : "Not set"
              }
              disabled
              className="bg-gray-50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="newDueDate">New Due Date</Label>
            <Input
              id="newDueDate"
              type="date"
              value={extensionData.newDueDate}
              onChange={(e) =>
                setExtensionData({
                  ...extensionData,
                  newDueDate: e.target.value,
                })
              }
              min={new Date().toISOString().split("T")[0]}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Extension</Label>
            <Textarea
              id="reason"
              value={extensionData.reason}
              onChange={(e) =>
                setExtensionData({ ...extensionData, reason: e.target.value })
              }
              placeholder="Please explain why you need more time..."
              className="min-h-[80px]"
              required
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Calendar className="mr-2 h-4 w-4" />
                  Request Extension
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
