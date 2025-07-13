import React, { useState, useEffect, useRef, useCallback } from "react";
import { Job, User, FormSubmission } from "@shared/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  User as UserIcon,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Plus,
} from "lucide-react";
import { format, startOfWeek, addDays, isSameDay, parseISO } from "date-fns";

interface EnhancedStaffCalendarViewProps {
  jobs: Job[];
  staff: User[];
  onJobUpdate?: (jobId: string, updates: Partial<Job>) => void;
  onJobClick?: (job: Job) => void;
  onCreateJob?: (date: Date, timeSlot: string) => void;
  currentUser?: User;
}

interface DragState {
  isDragging: boolean;
  draggedJob: Job | null;
  dragOffset: { x: number; y: number };
  originalPosition: { x: number; y: number };
  targetDate: Date | null;
  targetTime: string | null;
  isResizing: boolean;
  resizeDirection: "up" | "down" | null;
  initialDuration: number;
}

interface JobProgress {
  jobId: string;
  formsCompleted: number;
  totalForms: number;
  percentage: number;
  status: "not_started" | "in_progress" | "completed";
}

export function EnhancedStaffCalendarView({
  jobs,
  staff,
  onJobUpdate,
  onJobClick,
  onCreateJob,
  currentUser,
}: EnhancedStaffCalendarViewProps) {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedJob: null,
    dragOffset: { x: 0, y: 0 },
    originalPosition: { x: 0, y: 0 },
    targetDate: null,
    targetTime: null,
    isResizing: false,
    resizeDirection: null,
    initialDuration: 60,
  });
  const [jobProgress, setJobProgress] = useState<Record<string, JobProgress>>(
    {},
  );
  const [formSubmissions, setFormSubmissions] = useState<FormSubmission[]>([]);

  const calendarRef = useRef<HTMLDivElement>(null);
  const dragOverlayRef = useRef<HTMLDivElement>(null);

  // Fetch form submissions to calculate progress
  useEffect(() => {
    const fetchFormSubmissions = async () => {
      try {
        const token = localStorage.getItem("auth_token");
        const response = await fetch("/api/form-submissions", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (response.ok) {
          const data = await response.json();
          setFormSubmissions(data);
        }
      } catch (error) {
        console.error("Failed to fetch form submissions:", error);
      }
    };

    fetchFormSubmissions();
  }, []);

  // Calculate job progress
  useEffect(() => {
    const progress: Record<string, JobProgress> = {};

    jobs.forEach((job) => {
      const jobSubmissions = formSubmissions.filter((s) => s.jobId === job.id);
      const totalForms = job.formIds?.length || 0;
      const formsCompleted = jobSubmissions.length;
      const percentage =
        totalForms > 0 ? (formsCompleted / totalForms) * 100 : 0;

      let status: "not_started" | "in_progress" | "completed" = "not_started";
      if (percentage === 100) {
        status = "completed";
      } else if (percentage > 0) {
        status = "in_progress";
      }

      progress[job.id] = {
        jobId: job.id,
        formsCompleted,
        totalForms,
        percentage,
        status,
      };
    });

    setJobProgress(progress);
  }, [jobs, formSubmissions]);

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const timeSlots = Array.from(
    { length: 24 },
    (_, i) => `${i.toString().padStart(2, "0")}:00`,
  );

  const getJobsForDateAndTime = (date: Date, timeSlot: string) => {
    return jobs.filter((job) => {
      if (!job.dueDate) return false;
      const jobDate = parseISO(job.dueDate);
      const jobHour = format(jobDate, "HH:00");
      return isSameDay(jobDate, date) && jobHour === timeSlot;
    });
  };

  const handleMouseDown = useCallback((e: React.MouseEvent, job: Job) => {
    e.preventDefault();
    e.stopPropagation();

    const rect = e.currentTarget.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;

    // Detect if clicking near the bottom for resize (last 10 pixels)
    const isResizeHandle = offsetY > rect.height - 10;

    setDragState({
      isDragging: true,
      draggedJob: job,
      dragOffset: { x: offsetX, y: offsetY },
      originalPosition: { x: e.clientX, y: e.clientY },
      targetDate: null,
      targetTime: null,
      isResizing: isResizeHandle,
      resizeDirection: null,
      initialDuration: 60, // Default 1 hour
    });

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!dragState.isDragging || !dragOverlayRef.current) return;

      const overlay = dragOverlayRef.current;

      if (dragState.isResizing) {
        // Handle resize behavior - vertical movement only
        const deltaY = e.clientY - dragState.originalPosition.y;
        const timeSlotHeight = 80; // Approximate height of time slot
        const hoursDelta = Math.round(deltaY / timeSlotHeight);

        // Determine resize direction
        const newDirection = deltaY > 0 ? "down" : deltaY < 0 ? "up" : null;

        setDragState((prev) => ({
          ...prev,
          resizeDirection: newDirection,
        }));

        // Visual feedback for resize - change cursor and highlight
        document.body.style.cursor = "ns-resize";
        overlay.style.left = `${dragState.originalPosition.x - dragState.dragOffset.x}px`;
        overlay.style.top = `${dragState.originalPosition.y - dragState.dragOffset.y}px`;

        // Update overlay appearance to show resize
        if (overlay.querySelector(".job-card")) {
          const jobCard = overlay.querySelector(".job-card") as HTMLElement;
          if (newDirection === "down") {
            jobCard.style.height = `${Math.max(40, 60 + Math.abs(deltaY))}px`;
            jobCard.classList.add("border-blue-400", "bg-blue-100");
          } else if (newDirection === "up") {
            jobCard.style.height = `${Math.max(20, 60 - Math.abs(deltaY))}px`;
            jobCard.classList.add("border-blue-400", "bg-blue-100");
          }
        }
      } else {
        // Handle normal drag behavior
        overlay.style.left = `${e.clientX - dragState.dragOffset.x}px`;
        overlay.style.top = `${e.clientY - dragState.dragOffset.y}px`;

        // Find target drop zone
        const elementBelow = document.elementFromPoint(e.clientX, e.clientY);
        const timeSlot = elementBelow?.closest("[data-time-slot]");
        const dateCell = elementBelow?.closest("[data-date]");

        if (timeSlot && dateCell) {
          const targetTime = timeSlot.getAttribute("data-time-slot");
          const targetDateStr = dateCell.getAttribute("data-date");
          const targetDate = targetDateStr ? new Date(targetDateStr) : null;

          setDragState((prev) => ({
            ...prev,
            targetDate,
            targetTime,
          }));

          // Visual feedback
          document.querySelectorAll(".drop-zone-active").forEach((el) => {
            el.classList.remove("drop-zone-active");
          });

          if (timeSlot && !timeSlot.querySelector(".job-card")) {
            timeSlot.classList.add("drop-zone-active");
          }
        }
      }
    },
    [
      dragState.isDragging,
      dragState.dragOffset,
      dragState.isResizing,
      dragState.originalPosition,
    ],
  );

  const handleMouseUp = useCallback(async () => {
    if (dragState.isDragging && dragState.draggedJob && onJobUpdate) {
      try {
        if (dragState.isResizing && dragState.resizeDirection) {
          // Handle resize operation - extend job duration
          const job = dragState.draggedJob;
          const currentDueDate = job.dueDate
            ? new Date(job.dueDate)
            : new Date();

          // Calculate new end time based on resize direction
          let newEndTime = new Date(currentDueDate);
          if (dragState.resizeDirection === "down") {
            // Extend by 1 hour
            newEndTime.setHours(newEndTime.getHours() + 1);
          } else if (dragState.resizeDirection === "up") {
            // Reduce by 30 minutes (minimum)
            newEndTime.setMinutes(newEndTime.getMinutes() + 30);
          }

          // Update job with new duration
          await onJobUpdate(job.id, {
            dueDate: currentDueDate.toISOString(),
            endTime: newEndTime.toISOString(), // Add end time field
          });
        } else if (dragState.targetDate && dragState.targetTime) {
          // Handle normal move operation
          const [hours, minutes] = dragState.targetTime.split(":").map(Number);
          const newDate = new Date(dragState.targetDate);
          newDate.setHours(hours, minutes, 0, 0);

          // Update job with new date/time
          await onJobUpdate(dragState.draggedJob.id, {
            dueDate: newDate.toISOString(),
          });
        }
      } catch (error) {
        console.error("Failed to update job:", error);
      }
    }

    // Clean up
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
    document.querySelectorAll(".drop-zone-active").forEach((el) => {
      el.classList.remove("drop-zone-active");
    });
    document.body.style.cursor = "default";

    // Reset drag state
    setDragState({
      isDragging: false,
      draggedJob: null,
      dragOffset: { x: 0, y: 0 },
      originalPosition: { x: 0, y: 0 },
      targetDate: null,
      targetTime: null,
      isResizing: false,
      resizeDirection: null,
      initialDuration: 60,
    });
  }, [dragState, onJobUpdate, handleMouseMove]);

  const handleJobClick = (job: Job, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!dragState.isDragging && onJobClick) {
      onJobClick(job);
    }
  };

  const handleJobContextMenu = (job: Job, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isAdmin) {
      // Create context menu for job duplication
      const contextMenu = document.createElement("div");
      contextMenu.className =
        "fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-2 min-w-48";
      contextMenu.style.left = `${e.clientX}px`;
      contextMenu.style.top = `${e.clientY}px`;

      contextMenu.innerHTML = `
        <div class="px-3 py-2 text-sm font-medium text-gray-900 border-b">${job.title}</div>
        <button class="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50" data-action="duplicate">
          Duplicate Job for Later Date
        </button>
        <button class="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50" data-action="view">
          View Job Details
        </button>
      `;

      // Add event listeners
      contextMenu.addEventListener("click", (event) => {
        const target = event.target as HTMLElement;
        const action = target.getAttribute("data-action");

        if (action === "duplicate") {
          // Trigger job duplication - you can emit a custom event or use props
          console.log("Duplicate job:", job);
        } else if (action === "view" && onJobClick) {
          onJobClick(job);
        }

        document.body.removeChild(contextMenu);
      });

      // Remove menu when clicking outside
      const removeMenu = () => {
        if (document.body.contains(contextMenu)) {
          document.body.removeChild(contextMenu);
        }
        document.removeEventListener("click", removeMenu);
      };

      setTimeout(() => document.addEventListener("click", removeMenu), 100);
      document.body.appendChild(contextMenu);
    }
  };

  const handleEmptySlotClick = (date: Date, timeSlot: string) => {
    if (onCreateJob) {
      onCreateJob(date, timeSlot);
    }
  };

  const isAdmin =
    currentUser?.role === "admin" || currentUser?.role === "supervisor";

  const JobCard = ({
    job,
    isCompact = false,
  }: {
    job: Job;
    isCompact?: boolean;
  }) => {
    const progress = jobProgress[job.id];
    const assignedStaff = staff.find((s) => s.id === job.assignedTo);
    const isOwnJob = currentUser?.id === job.assignedTo;
    const canDrag = isAdmin || isOwnJob;

    return (
      <div
        className={`job-card relative p-2 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-md ${
          isCompact ? "text-xs" : "text-sm"
        } ${
          job.priority === "high"
            ? "border-blue-300 bg-blue-50 hover:bg-blue-100"
            : job.priority === "medium"
              ? "border-blue-200 bg-blue-50 hover:bg-blue-100"
              : "border-blue-200 bg-blue-50 hover:bg-blue-100"
        } ${dragState.draggedJob?.id === job.id ? "opacity-50" : ""}`}
        onMouseDown={canDrag ? (e) => handleMouseDown(e, job) : undefined}
        onClick={(e) => handleJobClick(job, e)}
        onContextMenu={(e) => handleJobContextMenu(job, e)}
        style={{ userSelect: "none" }}
        title={
          isAdmin
            ? "Right-click for options | Drag to reschedule"
            : "Click to view details"
        }
      >
        <div className="flex items-start justify-between mb-1">
          <div className="flex-1 min-w-0">
            <div className="font-medium truncate">{job.title}</div>
            {assignedStaff && (
              <div className="text-xs text-gray-600 flex items-center mt-1">
                <UserIcon className="h-3 w-3 mr-1" />
                {assignedStaff.name}
              </div>
            )}
          </div>
          <Badge
            variant={job.priority === "high" ? "destructive" : "secondary"}
            className="text-xs ml-2"
          >
            {job.priority}
          </Badge>
        </div>

        {progress && (
          <div className="mt-2">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-gray-600">
                {progress.formsCompleted}/{progress.totalForms} forms
              </span>
              <span
                className={`flex items-center ${
                  progress.status === "completed"
                    ? "text-green-600"
                    : progress.status === "in_progress"
                      ? "text-yellow-600"
                      : "text-gray-400"
                }`}
              >
                {progress.status === "completed" && (
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                )}
                {progress.status === "in_progress" && (
                  <Clock className="h-3 w-3 mr-1" />
                )}
                {progress.status === "not_started" && (
                  <AlertCircle className="h-3 w-3 mr-1" />
                )}
                {Math.round(progress.percentage)}%
              </span>
            </div>
            <Progress value={progress.percentage} className="h-1" />
          </div>
        )}

        {job.description && !isCompact && (
          <div className="text-xs text-gray-600 mt-1 truncate">
            {job.description}
          </div>
        )}

        {canDrag && (
          <div className="text-xs text-blue-400 mt-1 flex items-center justify-between">
            <span className="flex items-center">
              <FileText className="h-3 w-3 mr-1" />
              Drag to reschedule
            </span>
            <span className="text-blue-500">↕ Resize</span>
          </div>
        )}

        {/* Resize Handle */}
        {canDrag && (
          <div
            className="absolute bottom-0 left-0 right-0 h-2 bg-blue-400 opacity-0 hover:opacity-50 cursor-ns-resize transition-opacity rounded-b-lg"
            title="Drag to adjust job duration"
          />
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader className="bg-blue-50 border-b border-blue-200">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center text-blue-800">
              <Calendar className="h-5 w-5 mr-2 text-blue-600" />
              Staff Calendar Management - Week of{" "}
              {format(weekStart, "MMM d, yyyy")}
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                className="border-blue-300 text-blue-600 hover:bg-blue-50"
                onClick={() => setCurrentWeek(addDays(currentWeek, -7))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-blue-300 text-blue-600 hover:bg-blue-50"
                onClick={() => setCurrentWeek(new Date())}
              >
                Today
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-blue-300 text-blue-600 hover:bg-blue-50"
                onClick={() => setCurrentWeek(addDays(currentWeek, 7))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Calendar Grid */}
      <Card>
        <CardContent className="p-0">
          <div ref={calendarRef} className="calendar-grid overflow-auto">
            {/* Header Row */}
            <div className="grid grid-cols-8 border-b bg-blue-50">
              <div className="p-3 font-medium border-r text-blue-800">Time</div>
              {weekDays.map((day) => (
                <div
                  key={day.toISOString()}
                  className="p-3 text-center font-medium border-r text-blue-800"
                  data-date={day.toISOString()}
                >
                  <div>{format(day, "EEE")}</div>
                  <div className="text-sm text-blue-600">
                    {format(day, "MMM d")}
                  </div>
                </div>
              ))}
            </div>

            {/* Time Slots */}
            {timeSlots.map((timeSlot) => (
              <div
                key={timeSlot}
                className="grid grid-cols-8 border-b hover:bg-gray-50"
              >
                <div className="p-3 text-sm font-medium border-r bg-blue-50 flex items-center text-blue-700">
                  {timeSlot}
                </div>
                {weekDays.map((day) => {
                  const sameSlotJobs = getJobsForDateAndTime(day, timeSlot);
                  const isEmpty = sameSlotJobs.length === 0;

                  return (
                    <div
                      key={`${day.toISOString()}-${timeSlot}`}
                      className={`min-h-[80px] p-2 border-r transition-colors duration-200 relative ${
                        isEmpty && isAdmin
                          ? "hover:bg-blue-50 cursor-pointer group"
                          : ""
                      }`}
                      data-date={day.toISOString()}
                      data-time-slot={timeSlot}
                      onClick={
                        isEmpty && isAdmin
                          ? () => handleEmptySlotClick(day, timeSlot)
                          : undefined
                      }
                    >
                      <div className="space-y-1">
                        {sameSlotJobs.map((job) => (
                          <JobCard key={job.id} job={job} isCompact />
                        ))}
                      </div>

                      {/* Add Job Button for Empty Slots */}
                      {isEmpty && isAdmin && (
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="bg-blue-600 text-white rounded-full p-2 shadow-lg">
                            <Plus className="h-4 w-4" />
                          </div>
                        </div>
                      )}

                      {/* Time Slot Info on Hover */}
                      {isEmpty && isAdmin && (
                        <div className="absolute bottom-1 left-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded text-center">
                            Click to create job
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Drag Overlay */}
      {dragState.isDragging && dragState.draggedJob && (
        <div
          ref={dragOverlayRef}
          className="fixed z-50 pointer-events-none opacity-80 transform rotate-3 shadow-xl"
          style={{
            left: dragState.originalPosition.x - dragState.dragOffset.x,
            top: dragState.originalPosition.y - dragState.dragOffset.y,
          }}
        >
          <div className="w-48">
            <JobCard job={dragState.draggedJob} />
          </div>
        </div>
      )}

      <style>{`
        .calendar-grid {
          max-height: 70vh;
        }
        .drop-zone-active {
          background-color: rgba(59, 130, 246, 0.15) !important;
          border: 2px dashed rgba(59, 130, 246, 0.7) !important;
          box-shadow: 0 0 10px rgba(59, 130, 246, 0.3);
        }
        .job-card {
          will-change: transform;
          border-color: #3b82f6 !important;
        }
        .job-card:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
          border-color: #2563eb !important;
        }
        .job-card .resize-handle {
          background: linear-gradient(90deg, #3b82f6, #1d4ed8);
        }
      `}</style>
    </div>
  );
}
