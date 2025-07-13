import React, { useState, useRef, useCallback } from "react";
import { Job } from "@shared/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Clock, GripVertical } from "lucide-react";

interface JobTimeExtensionProps {
  job: Job;
  onTimeChange: (jobId: string, newStartTime: Date, newEndTime: Date) => void;
  timeSlot: string;
  date: Date;
}

export function JobTimeExtension({
  job,
  onTimeChange,
  timeSlot,
  date,
}: JobTimeExtensionProps) {
  const [isDragging, setIsDragging] = useState<"top" | "bottom" | null>(null);
  const [duration, setDuration] = useState(60); // Default 60 minutes
  const jobRef = useRef<HTMLDivElement>(null);

  const [startTime, endTime] = React.useMemo(() => {
    const [hours, minutes] = timeSlot.split(":").map(Number);
    const start = new Date(date);
    start.setHours(hours, minutes, 0, 0);

    const end = new Date(start);
    end.setMinutes(end.getMinutes() + duration);

    return [start, end];
  }, [timeSlot, date, duration]);

  const handleMouseDown = useCallback(
    (type: "top" | "bottom", e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(type);

      const startY = e.clientY;
      const startDuration = duration;

      const handleMouseMove = (e: MouseEvent) => {
        const deltaY = e.clientY - startY;
        const timeChange = Math.round(deltaY / 4); // 4 pixels = 1 minute

        let newDuration = startDuration;

        if (type === "bottom") {
          // Extending/shrinking from bottom
          newDuration = Math.max(15, startDuration + timeChange); // Minimum 15 minutes
        } else {
          // Extending/shrinking from top (changes start time)
          newDuration = Math.max(15, startDuration - timeChange); // Minimum 15 minutes
        }

        setDuration(newDuration);
      };

      const handleMouseUp = () => {
        setIsDragging(null);

        // Calculate new times
        const [hours, minutes] = timeSlot.split(":").map(Number);
        let newStart = new Date(date);
        newStart.setHours(hours, minutes, 0, 0);

        if (type === "top") {
          // Adjust start time when dragging from top
          const timeDiff = duration - startDuration;
          newStart.setMinutes(newStart.getMinutes() - timeDiff);
        }

        const newEnd = new Date(newStart);
        newEnd.setMinutes(newEnd.getMinutes() + duration);

        onTimeChange(job.id, newStart, newEnd);

        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [duration, job.id, timeSlot, date, onTimeChange],
  );

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200 hover:bg-red-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200";
      case "low":
        return "bg-green-100 text-green-800 border-green-200 hover:bg-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200";
    }
  };

  const jobHeight = Math.max(60, (duration / 30) * 60); // 60px per 30-minute slot

  return (
    <div
      ref={jobRef}
      className={cn(
        "relative border rounded text-xs cursor-pointer transition-all duration-200 ease-in-out group",
        getPriorityColor(job.priority),
        isDragging && "shadow-lg scale-105 z-10",
      )}
      style={{
        height: `${jobHeight}px`,
        minHeight: "60px",
      }}
      title={`${job.title} - ${job.description}\nDuration: ${duration} minutes`}
    >
      {/* Top resize handle */}
      <div
        className={cn(
          "absolute top-0 left-0 right-0 h-1 cursor-ns-resize opacity-0 group-hover:opacity-100 transition-opacity",
          "bg-gradient-to-b from-black/20 to-transparent",
          isDragging === "top" && "opacity-100",
        )}
        onMouseDown={(e) => handleMouseDown("top", e)}
      >
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1">
          <GripVertical className="h-3 w-3 text-gray-600" />
        </div>
      </div>

      {/* Job content */}
      <div className="p-2 h-full flex flex-col justify-between">
        <div>
          <div className="font-medium truncate mb-1">{job.title}</div>
          {jobHeight > 80 && (
            <div className="text-xs opacity-75 truncate">{job.description}</div>
          )}
        </div>

        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            <span>{duration}m</span>
          </div>
          <Badge variant="secondary" className="text-xs">
            {job.priority}
          </Badge>
        </div>

        {jobHeight > 100 && job.insuredName && (
          <div className="text-xs opacity-75 truncate mt-1">
            Client: {job.insuredName}
          </div>
        )}
      </div>

      {/* Bottom resize handle */}
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 h-1 cursor-ns-resize opacity-0 group-hover:opacity-100 transition-opacity",
          "bg-gradient-to-t from-black/20 to-transparent",
          isDragging === "bottom" && "opacity-100",
        )}
        onMouseDown={(e) => handleMouseDown("bottom", e)}
      >
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1">
          <GripVertical className="h-3 w-3 text-gray-600" />
        </div>
      </div>

      {/* Drag indicator */}
      {isDragging && (
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white px-2 py-1 rounded text-xs whitespace-nowrap">
          {startTime.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}{" "}
          -
          {endTime.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
          ({duration}m)
        </div>
      )}
    </div>
  );
}
