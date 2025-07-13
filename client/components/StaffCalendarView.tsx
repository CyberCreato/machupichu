import React, { useState, useRef, useCallback } from "react";
import { Job, User } from "@shared/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  User as UserIcon,
  Map,
  MapPin,
  Navigation,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MapView } from "./MapView";
import { JobTimeExtension } from "./JobTimeExtension";

interface StaffCalendarViewProps {
  jobs: Job[];
  staff: User[];
  onCreateJob: (staffId: string, timeSlot: string, date: Date) => void;
  selectedStaff?: string;
  onStaffSelect: (staffId: string) => void;
  onJobTimeChange?: (
    jobId: string,
    newStartTime: Date,
    newEndTime: Date,
  ) => void;
  onJobUpdate?: (jobId: string, updates: Partial<Job>) => void;
  onJobClick?: (job: Job) => void;
  currentUser?: User;
  showAllStaff?: boolean;
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
}

function generateTimeSlots(is24Hour: boolean = false): string[] {
  const slots: string[] = [];
  const startHour = is24Hour ? 0 : 8;
  const endHour = is24Hour ? 24 : 18;

  for (let hour = startHour; hour < endHour; hour++) {
    slots.push(`${hour.toString().padStart(2, "0")}:00`);
    slots.push(`${hour.toString().padStart(2, "0")}:30`);
  }
  return slots;
}

function getWeekDates(date: Date): Date[] {
  const week: Date[] = [];
  const startOfWeek = new Date(date);
  startOfWeek.setDate(date.getDate() - date.getDay() + 1); // Start from Monday

  for (let i = 0; i < 7; i++) {
    const day = new Date(startOfWeek);
    day.setDate(startOfWeek.getDate() + i);
    week.push(day);
  }
  return week;
}

function getMonthDates(date: Date): Date[] {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const dates: Date[] = [];

  // Add previous month's days to fill the week
  const startDay = firstDay.getDay();
  for (let i = startDay - 1; i >= 0; i--) {
    const prevDate = new Date(firstDay);
    prevDate.setDate(firstDay.getDate() - i - 1);
    dates.push(prevDate);
  }

  // Add current month's days
  for (let day = 1; day <= lastDay.getDate(); day++) {
    dates.push(new Date(year, month, day));
  }

  // Add next month's days to complete the grid
  const remaining = 42 - dates.length; // 6 weeks * 7 days
  for (let day = 1; day <= remaining; day++) {
    dates.push(new Date(year, month + 1, day));
  }

  return dates;
}

// Fallback addresses for staff locations
const FALLBACK_ADDRESSES = {
  "cape town": "98 Marine Dr, Paarden Eiland, Cape Town, 7405",
  johannesburg: "5 Thora Crescent, Johannesburg",
};

function openInMaps(address: string, staffLocation?: string) {
  let finalAddress = address;

  // If address is empty or doesn't seem valid, use fallback
  if (!address || address.length < 10) {
    const location = staffLocation?.toLowerCase() || "cape town";
    if (
      location.includes("johannesburg") ||
      location.includes("joburg") ||
      location.includes("jhb")
    ) {
      finalAddress = FALLBACK_ADDRESSES.johannesburg;
    } else {
      finalAddress = FALLBACK_ADDRESSES["cape town"];
    }
  }

  const encodedAddress = encodeURIComponent(finalAddress);
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
  window.open(mapsUrl, "_blank");
}

export function StaffCalendarView({
  jobs,
  staff,
  onCreateJob,
  selectedStaff,
  onStaffSelect,
  onJobTimeChange,
  onJobUpdate,
  onJobClick,
  currentUser,
  showAllStaff = false,
}: StaffCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"week" | "month" | "map">("map");
  const [is24Hour, setIs24Hour] = useState(true);
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedJob: null,
    dragOffset: { x: 0, y: 0 },
    originalPosition: { x: 0, y: 0 },
    targetDate: null,
    targetTime: null,
    isResizing: false,
    resizeDirection: null,
  });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleJobTimeChange = (
    jobId: string,
    newStartTime: Date,
    newEndTime: Date,
  ) => {
    if (onJobTimeChange) {
      onJobTimeChange(jobId, newStartTime, newEndTime);
    }
  };

  const handleMouseDown = useCallback(
    (event: React.MouseEvent, job: Job, isResizeHandle?: boolean) => {
      event.preventDefault();
      const rect = (event.target as HTMLElement).getBoundingClientRect();

      setDragState({
        isDragging: true,
        draggedJob: job,
        dragOffset: {
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
        },
        originalPosition: {
          x: rect.left,
          y: rect.top,
        },
        targetDate: null,
        targetTime: null,
        isResizing: isResizeHandle || false,
        resizeDirection: isResizeHandle
          ? event.clientY < rect.top + rect.height / 2
            ? "up"
            : "down"
          : null,
      });
    },
    [],
  );

  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      if (!dragState.isDragging || !dragState.draggedJob) return;

      if (dragState.isResizing) {
        // Handle job duration resizing
        // Implementation for resizing job duration
      } else {
        // Handle job movement
        if (containerRef.current) {
          const containerRect = containerRef.current.getBoundingClientRect();
          const timeSlotElements =
            containerRef.current.querySelectorAll("[data-time-slot]");

          for (const element of timeSlotElements) {
            const rect = element.getBoundingClientRect();
            if (
              event.clientX >= rect.left &&
              event.clientX <= rect.right &&
              event.clientY >= rect.top &&
              event.clientY <= rect.bottom
            ) {
              const timeSlot = element.getAttribute("data-time-slot");
              const dateStr = element.getAttribute("data-date");
              if (timeSlot && dateStr) {
                setDragState((prev) => ({
                  ...prev,
                  targetTime: timeSlot,
                  targetDate: new Date(dateStr),
                }));
              }
              break;
            }
          }
        }
      }
    },
    [dragState],
  );

  const handleMouseUp = useCallback(() => {
    if (
      dragState.isDragging &&
      dragState.draggedJob &&
      dragState.targetDate &&
      dragState.targetTime &&
      onJobUpdate
    ) {
      // Update job time and date
      const [hours, minutes] = dragState.targetTime.split(":").map(Number);
      const newDate = new Date(dragState.targetDate);
      newDate.setHours(hours, minutes, 0, 0);

      onJobUpdate(dragState.draggedJob.id, {
        dueDate: newDate.toISOString(),
      });
    }

    setDragState({
      isDragging: false,
      draggedJob: null,
      dragOffset: { x: 0, y: 0 },
      originalPosition: { x: 0, y: 0 },
      targetDate: null,
      targetTime: null,
      isResizing: false,
      resizeDirection: null,
    });
  }, [dragState, onJobUpdate]);

  React.useEffect(() => {
    if (dragState.isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [dragState.isDragging, handleMouseMove, handleMouseUp]);

  const timeSlots = generateTimeSlots(is24Hour);
  const weekDates = getWeekDates(currentDate);
  const monthDates = getMonthDates(currentDate);

  const selectedStaffMember = staff.find((s) => s.id === selectedStaff);
  const staffJobs = selectedStaff
    ? jobs.filter((job) => job.assignedTo === selectedStaff)
    : [];

  // Check if current user is admin or apollo
  const isAdminOrApollo =
    currentUser &&
    (currentUser.role === "admin" || currentUser.role === "apollo");

  // Determine if we should show staff selection
  const shouldShowStaffSelection =
    showAllStaff || isAdminOrApollo || (staff.length > 1 && !selectedStaff);

  // Calculate job duration in 30-minute slots
  const getJobDuration = (job: Job): number => {
    // Default duration is 1 slot (30 minutes) if no specific duration is set
    if (job.category === "Geyser Replacement") return 6; // 3 hours
    if (job.category === "Geyser Assessment") return 2; // 1 hour
    if (job.category === "Leak Detection") return 4; // 2 hours
    if (job.category === "Drain Blockage") return 3; // 1.5 hours
    if (job.category === "Camera Inspection") return 2; // 1 hour
    if (job.category === "Toilet/Shower") return 2; // 1 hour
    return 2; // Default 1 hour for other jobs
  };

  const getJobsForTimeSlot = (date: Date, timeSlot: string) => {
    return staffJobs.filter((job) => {
      if (!job.dueDate) return false;
      const jobDate = new Date(job.dueDate);
      const [slotHours, slotMinutes] = timeSlot.split(":").map(Number);

      // Check if the job is on the same date
      const sameDate = jobDate.toDateString() === date.toDateString();

      // Check if the job starts at this time slot
      const jobHours = jobDate.getHours();
      const jobMinutes = jobDate.getMinutes();

      return sameDate && jobHours === slotHours && jobMinutes === slotMinutes;
    });
  };

  // Check if a time slot is occupied by a job that started earlier
  const isSlotOccupiedByEarlierJob = (
    date: Date,
    timeSlot: string,
  ): Job | null => {
    const [slotHours, slotMinutes] = timeSlot.split(":").map(Number);
    const currentSlotMinutes = slotHours * 60 + slotMinutes;

    for (const job of staffJobs) {
      if (!job.dueDate) continue;
      const jobDate = new Date(job.dueDate);

      // Check if same date
      if (jobDate.toDateString() !== date.toDateString()) continue;

      const jobStartMinutes = jobDate.getHours() * 60 + jobDate.getMinutes();
      const jobDurationSlots = getJobDuration(job);
      const jobEndMinutes = jobStartMinutes + jobDurationSlots * 30;

      // Check if current slot is within the job's duration
      if (
        currentSlotMinutes >= jobStartMinutes &&
        currentSlotMinutes < jobEndMinutes &&
        currentSlotMinutes !== jobStartMinutes
      ) {
        return job;
      }
    }
    return null;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const navigateDate = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    if (viewMode === "week") {
      newDate.setDate(currentDate.getDate() + (direction === "next" ? 7 : -7));
    } else {
      newDate.setMonth(
        currentDate.getMonth() + (direction === "next" ? 1 : -1),
      );
    }
    setCurrentDate(newDate);
  };

  return (
    <div className="space-y-6" ref={containerRef}>
      {/* Staff Selection - show for admins/apollo or when multiple staff */}
      {shouldShowStaffSelection && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <UserIcon key="user-icon" className="h-5 w-5 mr-2" />
              <span key="title-text">Select Staff Member</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {staff.map((member) => (
                <Button
                  key={member.id}
                  variant={selectedStaff === member.id ? "default" : "outline"}
                  className={cn(
                    "h-auto p-4 justify-start",
                    selectedStaff === member.id && "ring-2 ring-blue-500",
                  )}
                  onClick={() => onStaffSelect(member.id)}
                >
                  <div key={`${member.id}-details`} className="text-left">
                    <div key={`${member.id}-name`} className="font-medium">
                      {member.name}
                    </div>
                    <div
                      key={`${member.id}-jobs`}
                      className="text-sm text-muted-foreground"
                    >
                      {`${jobs.filter((j) => j.assignedTo === member.id).length} jobs`}
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Calendar View */}
      {selectedStaffMember && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <Calendar key="calendar-icon" className="h-5 w-5 mr-2" />
                <span key="calendar-title">
                  {selectedStaffMember.name}'s Calendar
                </span>
              </CardTitle>
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1 mr-4">
                  <Button
                    key="week"
                    variant={viewMode === "week" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("week")}
                  >
                    Week
                  </Button>
                  <Button
                    key="month"
                    variant={viewMode === "month" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("month")}
                  >
                    Month
                  </Button>
                  <Button
                    key="map"
                    variant={viewMode === "map" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("map")}
                  >
                    <Map className="h-4 w-4 mr-1" />
                    Map
                  </Button>
                </div>
                <div className="flex space-x-1 mr-4">
                  <Button
                    key="8-18h"
                    variant={!is24Hour ? "default" : "outline"}
                    size="sm"
                    onClick={() => setIs24Hour(false)}
                  >
                    8-18h
                  </Button>
                  <Button
                    key="24h"
                    variant={is24Hour ? "default" : "outline"}
                    size="sm"
                    onClick={() => setIs24Hour(true)}
                  >
                    24h
                  </Button>
                </div>
                <Button
                  key="prev"
                  variant="outline"
                  size="sm"
                  onClick={() => navigateDate("prev")}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span key="date-display" className="text-sm font-medium px-3">
                  {viewMode === "week"
                    ? `Week of ${weekDates[0].toLocaleDateString()}`
                    : currentDate.toLocaleDateString("en", {
                        month: "long",
                        year: "numeric",
                      })}
                </span>
                <Button
                  key="next"
                  variant="outline"
                  size="sm"
                  onClick={() => navigateDate("next")}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {viewMode === "map" ? (
              <MapView
                jobs={jobs}
                staff={staff}
                selectedStaff={selectedStaff}
                selectedDate={currentDate}
                onJobClick={onJobClick}
              />
            ) : viewMode === "week" ? (
              <div className="overflow-x-auto">
                <div className="min-w-[800px]">
                  {/* Header with days */}
                  <div className="grid grid-cols-8 gap-1 mb-2">
                    <div className="p-2 text-sm font-medium text-muted-foreground">
                      Time
                    </div>
                    {weekDates.map((date, index) => (
                      <div
                        key={`header-${index}`}
                        className="p-2 text-center text-sm font-medium"
                      >
                        <div>
                          {date.toLocaleDateString("en", { weekday: "short" })}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {date.getDate()}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Time slots grid */}
                  <div className="space-y-1 max-h-[600px] overflow-y-auto">
                    {timeSlots.map((timeSlot) => (
                      <div key={timeSlot} className="grid grid-cols-8 gap-1">
                        <div className="p-2 text-sm text-muted-foreground flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {timeSlot}
                        </div>
                        {weekDates.map((date, dateIndex) => {
                          const slotJobs = getJobsForTimeSlot(date, timeSlot);
                          const isToday =
                            date.toDateString() === new Date().toDateString();
                          const isPast = date < new Date() && !isToday;

                          return (
                            <div
                              key={`${timeSlot}-${dateIndex}-${date.toISOString()}`}
                              className={cn(
                                "p-1 min-h-[60px] border rounded-md relative group",
                                isToday && "bg-blue-50 border-blue-200",
                                isPast && "bg-gray-50 opacity-60",
                                dragState.targetDate?.toDateString() ===
                                  date.toDateString() &&
                                  dragState.targetTime === timeSlot &&
                                  "bg-green-100 border-green-300",
                              )}
                              data-time-slot={timeSlot}
                              data-date={date.toISOString()}
                            >
                              {/* Check if this slot is occupied by an earlier job */}
                              {(() => {
                                const occupyingJob = isSlotOccupiedByEarlierJob(
                                  date,
                                  timeSlot,
                                );
                                if (occupyingJob) {
                                  return (
                                    <div className="absolute inset-0 bg-gray-200 border border-gray-300 rounded opacity-50 flex items-center justify-center">
                                      <span className="text-xs text-gray-600">
                                        {`${occupyingJob.title} (cont.)`}
                                      </span>
                                    </div>
                                  );
                                }
                                return null;
                              })()}

                              {/* Jobs starting in this time slot */}
                              {slotJobs.map((job) => {
                                const duration = getJobDuration(job);
                                const heightInPixels =
                                  duration * 60 + (duration - 1) * 8; // 60px per slot + 8px gap between slots

                                return (
                                  <div
                                    key={job.id}
                                    className={cn(
                                      "bg-white border rounded p-2 cursor-move shadow-sm absolute left-1 right-1 z-10",
                                      "hover:shadow-md transition-shadow",
                                      getPriorityColor(job.priority),
                                      dragState.draggedJob?.id === job.id &&
                                        "opacity-50",
                                    )}
                                    style={{
                                      height: `${heightInPixels}px`,
                                      top: "4px",
                                    }}
                                    onMouseDown={(e) => handleMouseDown(e, job)}
                                    title={`Drag to reschedule: ${job.title} (${duration * 0.5}h duration)`}
                                  >
                                    <div
                                      key={`${job.id}-title`}
                                      className="text-xs font-medium truncate"
                                    >
                                      {job.title}
                                    </div>
                                    <div
                                      key={`${job.id}-client`}
                                      className="text-xs text-muted-foreground truncate"
                                    >
                                      {job.client?.name || "No client"}
                                    </div>
                                    <div
                                      key={`${job.id}-duration`}
                                      className="text-xs text-muted-foreground mt-1"
                                    >
                                      {`${duration * 0.5}h duration`}
                                    </div>
                                    {job.address && (
                                      <div
                                        key={`${job.id}-address`}
                                        className="text-xs text-muted-foreground mt-1 flex items-center"
                                      >
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-3 w-3 p-0 hover:bg-transparent mr-1"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            openInMaps(
                                              job.address || "",
                                              selectedStaffMember?.location
                                                ?.city,
                                            );
                                          }}
                                          title="Open in Maps"
                                        >
                                          <Navigation className="h-2 w-2 text-blue-600" />
                                        </Button>
                                        <span
                                          className="truncate text-xs"
                                          title={job.address}
                                        >
                                          {job.address.length > 20
                                            ? `${job.address.substring(0, 20)}...`
                                            : job.address}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}

                              {/* Add job button - only show on hover when no jobs present and not dragging */}
                              {!isPast &&
                                slotJobs.length === 0 &&
                                !dragState.isDragging && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="absolute inset-0 w-full h-full opacity-0 group-hover:opacity-100 transition-opacity border-dashed"
                                    onClick={() =>
                                      onCreateJob(
                                        selectedStaff!,
                                        timeSlot,
                                        date,
                                      )
                                    }
                                    title="Create new job for this time slot"
                                  >
                                    <Plus className="h-4 w-4 text-gray-400" />
                                  </Button>
                                )}

                              {/* Past date indicator */}
                              {isPast && slotJobs.length === 0 && (
                                <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-400">
                                  Past
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* Month View */
              <div className="grid grid-cols-7 gap-1">
                {/* Days header */}
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                  (day) => (
                    <div
                      key={day}
                      className="p-2 text-center text-sm font-medium"
                    >
                      {day}
                    </div>
                  ),
                )}

                {/* Month grid */}
                {monthDates.map((date, index) => {
                  const dayJobs = staffJobs.filter((job) => {
                    if (!job.dueDate) return false;
                    const jobDate = new Date(job.dueDate);
                    return jobDate.toDateString() === date.toDateString();
                  });

                  const isCurrentMonth =
                    date.getMonth() === currentDate.getMonth();
                  const isToday =
                    date.toDateString() === new Date().toDateString();

                  return (
                    <div
                      key={date.toISOString()}
                      className={cn(
                        "min-h-[100px] p-2 border rounded-md",
                        !isCurrentMonth && "opacity-40 bg-gray-50",
                        isToday && "bg-blue-50 border-blue-200",
                        "hover:bg-gray-50 cursor-pointer",
                      )}
                    >
                      <div className="text-sm font-medium mb-1">
                        {date.getDate()}
                      </div>
                      <div className="space-y-1">
                        {dayJobs.slice(0, 3).map((job) => (
                          <div
                            key={job.id}
                            className={cn(
                              "text-xs p-1 rounded truncate",
                              getPriorityColor(job.priority),
                            )}
                            title={job.title}
                          >
                            {job.title}
                          </div>
                        ))}
                        {dayJobs.length > 3 && (
                          <div className="text-xs text-muted-foreground">
                            {`+${dayJobs.length - 3} more`}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Job Statistics */}
      {selectedStaffMember && (
        <Card>
          <CardHeader>
            <CardTitle>Weekly Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {staffJobs.filter((j) => j.status === "pending").length}
                </div>
                <div className="text-sm text-muted-foreground">Pending</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-600">
                  {staffJobs.filter((j) => j.status === "in_progress").length}
                </div>
                <div className="text-sm text-muted-foreground">In Progress</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {staffJobs.filter((j) => j.status === "completed").length}
                </div>
                <div className="text-sm text-muted-foreground">Completed</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
