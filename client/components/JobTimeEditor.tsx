import React, { useState, useEffect } from "react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  Calendar,
  Plus,
  Minus,
  Save,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Job } from "@shared/types";

interface JobTimeEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: Job | null;
  onJobUpdated: () => void;
}

export function JobTimeEditor({
  open,
  onOpenChange,
  job,
  onJobUpdated,
}: JobTimeEditorProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Time state
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [duration, setDuration] = useState(60); // minutes
  const [endTime, setEndTime] = useState("");

  useEffect(() => {
    if (open && job) {
      if (job.dueDate) {
        const dueDate = new Date(job.dueDate);
        setStartDate(dueDate.toISOString().split("T")[0]);
        setStartTime(
          `${dueDate.getHours().toString().padStart(2, "0")}:${dueDate.getMinutes().toString().padStart(2, "0")}`,
        );
      } else {
        const now = new Date();
        setStartDate(now.toISOString().split("T")[0]);
        setStartTime("09:00");
      }

      // Set duration based on job category or existing duration
      let jobDuration = 60; // Default 1 hour
      if (job.duration) {
        jobDuration = job.duration;
      } else if (job.category) {
        // Set duration based on job category
        switch (job.category) {
          case "Geyser Replacement":
            jobDuration = 180; // 3 hours
            break;
          case "Leak Detection":
            jobDuration = 120; // 2 hours
            break;
          case "Drain Blockage":
            jobDuration = 90; // 1.5 hours
            break;
          case "Geyser Assessment":
            jobDuration = 60; // 1 hour
            break;
          case "Camera Inspection":
            jobDuration = 75; // 1.25 hours
            break;
          case "Toilet/Shower":
            jobDuration = 90; // 1.5 hours
            break;
          default:
            jobDuration = 60; // 1 hour default
        }
      }

      setDuration(jobDuration);
      setError(null);
    }
  }, [open, job]);

  useEffect(() => {
    // Calculate end time when start time or duration changes
    if (startTime) {
      const [hours, minutes] = startTime.split(":").map(Number);
      const startMinutes = hours * 60 + minutes;
      const endMinutes = startMinutes + duration;

      const endHours = Math.floor(endMinutes / 60) % 24;
      const endMins = endMinutes % 60;

      setEndTime(
        `${endHours.toString().padStart(2, "0")}:${endMins.toString().padStart(2, "0")}`,
      );
    }
  }, [startTime, duration]);

  const adjustDuration = (increment: number) => {
    const newDuration = Math.max(5, duration + increment);
    setDuration(newDuration);
  };

  const handleSave = async () => {
    if (!job || !startDate || !startTime) {
      setError("Please fill in all required fields");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create start and end date objects
      const startDateTime = new Date(`${startDate}T${startTime}`);
      const endDateTime = new Date(startDateTime.getTime() + duration * 60000);

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
          dueDate: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          duration: duration,
        }),
      });

      if (response.ok) {
        onJobUpdated();
        onOpenChange(false);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to update job time");
      }
    } catch (error) {
      setError("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins > 0 ? `${mins}m` : ""}`.trim();
    }
    return `${mins}m`;
  };

  const getTimeSlots = () => {
    const slots = [];
    const start = new Date(`${startDate}T${startTime}`);
    const current = new Date(start);

    for (let i = 0; i < duration; i += 5) {
      slots.push(new Date(current));
      current.setMinutes(current.getMinutes() + 5);
    }

    return slots;
  };

  if (!job) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Edit Job Time: {job.title}
          </DialogTitle>
          <DialogDescription>
            Adjust the job timing with 5-minute precision. The calendar will
            update to show the new time blocks.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Job Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Job Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Title:</span>
                <span className="text-sm">{job.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Status:</span>
                <Badge variant="outline">{job.status}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Priority:</span>
                <Badge
                  variant={
                    job.priority === "high"
                      ? "destructive"
                      : job.priority === "medium"
                        ? "default"
                        : "secondary"
                  }
                >
                  {job.priority}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Time Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="start-time">Start Time</Label>
              <Input
                id="start-time"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Duration Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Duration Control</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Duration:</span>
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => adjustDuration(-5)}
                    disabled={duration <= 5}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="text-lg font-medium min-w-[60px] text-center">
                    {formatDuration(duration)}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => adjustDuration(5)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {[15, 30, 60, 120].map((mins) => (
                  <Button
                    key={mins}
                    size="sm"
                    variant={duration === mins ? "default" : "outline"}
                    onClick={() => setDuration(mins)}
                  >
                    {formatDuration(mins)}
                  </Button>
                ))}
              </div>

              <div className="pt-2 border-t">
                <div className="flex justify-between text-sm">
                  <span>Start Time:</span>
                  <span className="font-medium">{startTime}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>End Time:</span>
                  <span className="font-medium">{endTime}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Calendar Blocks:</span>
                  <span className="font-medium">
                    {Math.ceil(duration / 5)} slots (5min each)
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Time Visualization */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Calendar Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-6 gap-1 text-xs">
                {getTimeSlots()
                  .slice(0, 24)
                  .map((slot, index) => (
                    <div
                      key={index}
                      className="bg-blue-100 text-blue-800 p-1 rounded text-center"
                    >
                      {slot.toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                      })}
                    </div>
                  ))}
                {getTimeSlots().length > 24 && (
                  <div className="col-span-6 text-center text-gray-500 text-xs">
                    +{getTimeSlots().length - 24} more slots...
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Update Job Time
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
