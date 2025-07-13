import React, { useState, useMemo } from "react";
import { Job, User } from "@shared/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, ChevronLeft, ChevronRight, Plus, Clock } from "lucide-react";

interface AdvancedCalendarViewProps {
  jobs: Job[];
  staff: User[];
  onCreateJob: (timeSlot: string, date: Date) => void;
  onMoveJob: (jobId: string, newTime: string, newDate: Date) => void;
  onExtendJob: (jobId: string, duration: number) => void;
}

type ViewMode = "month" | "week" | "day";

function generateTimeSlots(): string[] {
  const slots: string[] = [];
  for (let hour = 8; hour < 18; hour++) {
    slots.push(`${hour.toString().padStart(2, "0")}:00`);
    slots.push(`${hour.toString().padStart(2, "0")}:30`);
  }
  return slots;
}

function getWeekDates(date: Date): Date[] {
  const week: Date[] = [];
  const startOfWeek = new Date(date);
  startOfWeek.setDate(date.getDate() - date.getDay()); // Start from Sunday

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
    const prevDate = new Date(year, month, -i);
    dates.push(prevDate);
  }

  // Add current month's days
  for (let day = 1; day <= lastDay.getDate(); day++) {
    dates.push(new Date(year, month, day));
  }

  // Add next month's days to fill the week
  const remaining = 42 - dates.length; // 6 weeks * 7 days
  for (let day = 1; day <= remaining; day++) {
    dates.push(new Date(year, month + 1, day));
  }

  return dates;
}

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

function isSameDay(date1: Date, date2: Date): boolean {
  return formatDate(date1) === formatDate(date2);
}

export function AdvancedCalendarView({
  jobs,
  staff,
  onCreateJob,
  onMoveJob,
  onExtendJob,
}: AdvancedCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [draggedJob, setDraggedJob] = useState<Job | null>(null);

  const timeSlots = useMemo(() => generateTimeSlots(), []);

  const getJobsForSlot = (date: Date, timeSlot?: string) => {
    return jobs.filter((job) => {
      if (!job.dueDate) return false;

      const jobDate = new Date(job.dueDate);
      if (!isSameDay(jobDate, date)) return false;

      if (timeSlot) {
        const [slotHours, slotMinutes] = timeSlot.split(":").map(Number);
        const jobHours = jobDate.getHours();
        const jobMinutes = jobDate.getMinutes();

        // Create time slot boundaries (30-minute slots)
        const slotStart = slotHours * 60 + slotMinutes;
        const slotEnd = slotStart + 30;
        const jobTime = jobHours * 60 + jobMinutes;

        return jobTime >= slotStart && jobTime < slotEnd;
      }

      return true;
    });
  };

  const isTimeSlotBooked = (date: Date, timeSlot: string): boolean => {
    return getJobsForSlot(date, timeSlot).length > 0;
  };

  const handleTimeSlotClick = (date: Date, timeSlot: string) => {
    if (isTimeSlotBooked(date, timeSlot)) {
      // Show move job option instead of alert
      const existingJobs = getJobsForSlot(date, timeSlot);
      if (existingJobs.length === 1) {
        const shouldMove = confirm(
          `This time slot is occupied by "${existingJobs[0].title}". Would you like to move it to create a new job here?`,
        );
        if (shouldMove) {
          // You could implement a time slot picker here
          alert("Job move functionality would be implemented here");
        }
      } else {
        alert("This time slot is already booked. Please choose another time.");
      }
      return;
    }
    onCreateJob(timeSlot, date);
  };

  const handleDragStart = (job: Job) => {
    setDraggedJob(job);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (date: Date, timeSlot: string) => {
    if (!draggedJob) return;

    if (isTimeSlotBooked(date, timeSlot)) {
      alert("Cannot move job to an occupied time slot.");
      setDraggedJob(null);
      return;
    }

    onMoveJob(draggedJob.id, timeSlot, date);
    setDraggedJob(null);
  };

  const navigateDate = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);

    switch (viewMode) {
      case "month":
        newDate.setMonth(
          currentDate.getMonth() + (direction === "next" ? 1 : -1),
        );
        break;
      case "week":
        newDate.setDate(
          currentDate.getDate() + (direction === "next" ? 7 : -7),
        );
        break;
      case "day":
        newDate.setDate(
          currentDate.getDate() + (direction === "next" ? 1 : -1),
        );
        break;
    }

    setCurrentDate(newDate);
  };

  const renderMonthView = () => {
    const monthDates = getMonthDates(currentDate);
    const weeks: Date[][] = [];

    for (let i = 0; i < monthDates.length; i += 7) {
      weeks.push(monthDates.slice(i, i + 7));
    }

    return (
      <div className="grid grid-cols-7 gap-1">
        {/* Week day headers */}
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="p-2 text-center font-medium text-gray-500">
            {day}
          </div>
        ))}

        {/* Calendar days */}
        {monthDates.map((date, index) => {
          const dayJobs = getJobsForSlot(date);
          const isCurrentMonth = date.getMonth() === currentDate.getMonth();
          const isToday = isSameDay(date, new Date());

          return (
            <div
              key={index}
              className={`min-h-[120px] p-2 border border-gray-200 ${
                isCurrentMonth ? "bg-white" : "bg-gray-50"
              } ${isToday ? "bg-blue-50 border-blue-300" : ""}`}
            >
              <div className="flex justify-between items-center mb-2">
                <span
                  className={`text-sm ${
                    isCurrentMonth ? "text-gray-900" : "text-gray-400"
                  } ${isToday ? "font-bold text-blue-600" : ""}`}
                >
                  {date.getDate()}
                </span>
                {isCurrentMonth && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onCreateJob("09:00", date)}
                    className="h-6 w-6 p-0"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                )}
              </div>

              <div className="space-y-1">
                {dayJobs.slice(0, 3).map((job, index) => (
                  <div
                    key={job.id}
                    className="text-xs p-1 bg-blue-100 border border-blue-200 rounded cursor-move hover:bg-blue-200 transition-colors"
                    draggable
                    onDragStart={() => handleDragStart(job)}
                    style={{
                      zIndex: 10 + index,
                      position: "relative",
                      transform:
                        index > 0 ? `translateY(${index * 2}px)` : "none",
                    }}
                    title="Drag to move this job to another time slot"
                  >
                    <div className="font-medium text-blue-800 truncate">
                      {job.title}
                    </div>
                    <div className="text-gray-600 truncate">
                      {job.insuredName || job.InsuredName || "No client"}
                    </div>
                  </div>
                ))}
                {dayJobs.length > 3 && (
                  <div className="text-xs text-gray-500 text-center">
                    +{dayJobs.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderWeekView = () => {
    const weekDates = getWeekDates(currentDate);

    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-gray-300 px-4 py-2 text-left font-medium w-20">
                Time
              </th>
              {weekDates.map((date) => (
                <th
                  key={formatDate(date)}
                  className="border border-gray-300 px-2 py-2 text-center font-medium min-w-[120px]"
                >
                  <div>
                    {date.toLocaleDateString("en-US", { weekday: "short" })}
                  </div>
                  <div className="text-sm text-gray-500">{date.getDate()}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {timeSlots.map((time) => (
              <tr key={time} className="hover:bg-gray-50">
                <td className="border border-gray-300 px-4 py-2 font-medium text-sm">
                  {time}
                </td>
                {weekDates.map((date) => {
                  const slotJobs = getJobsForSlot(date, time);
                  const isBooked = slotJobs.length > 0;

                  return (
                    <td
                      key={`${formatDate(date)}-${time}`}
                      className="border border-gray-300 px-2 py-2 relative min-h-[60px]"
                      onDragOver={handleDragOver}
                      onDrop={() => handleDrop(date, time)}
                    >
                      {slotJobs.map((job, index) => (
                        <Card
                          key={job.id}
                          className="mb-1 cursor-move hover:shadow-md transition-all duration-200 border-l-4 border-l-blue-500"
                          draggable
                          onDragStart={() => handleDragStart(job)}
                          style={{
                            zIndex: 50 + index,
                            position: "relative",
                            marginTop:
                              index > 0 ? `-${Math.min(index * 8, 24)}px` : "0",
                            transform: `translateX(${index * 4}px)`,
                            opacity: 0.95 - index * 0.1,
                          }}
                          title="Drag to move this job • Click to view details"
                        >
                          <CardContent className="p-2">
                            <div className="text-xs">
                              <div className="font-semibold text-blue-800 truncate">
                                {job.title}
                              </div>
                              <div className="text-gray-600 truncate">
                                {job.insuredName ||
                                  job.InsuredName ||
                                  "No client"}
                              </div>
                              <div className="flex items-center justify-between mt-1">
                                <Badge className="text-xs" variant="secondary">
                                  {job.status.replace("_", " ")}
                                </Badge>
                                {job.excess && (
                                  <span className="text-green-600 text-xs font-medium">
                                    {job.excess}
                                  </span>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}

                      {!isBooked && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleTimeSlotClick(date, time)}
                          className="w-full h-full text-gray-400 hover:text-gray-600 hover:bg-blue-50 transition-colors"
                          title="Click to create a new job at this time"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      )}

                      {isBooked && (
                        <div
                          className="absolute inset-0 cursor-pointer hover:bg-blue-50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center"
                          onClick={() => handleTimeSlotClick(date, time)}
                          title="Time slot occupied - click to see options"
                        >
                          <div className="text-xs text-blue-600 font-medium bg-blue-100 px-2 py-1 rounded">
                            Move?
                          </div>
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderDayView = () => {
    return (
      <div className="max-w-md mx-auto">
        <div className="space-y-2">
          {timeSlots.map((time) => {
            const slotJobs = getJobsForSlot(currentDate, time);
            const isBooked = slotJobs.length > 0;

            return (
              <div
                key={time}
                className="flex items-center space-x-4 p-3 border border-gray-200 rounded-lg"
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(currentDate, time)}
              >
                <div className="w-16 text-sm font-medium text-gray-600">
                  {time}
                </div>

                <div className="flex-1">
                  {slotJobs.map((job) => (
                    <Card
                      key={job.id}
                      className="cursor-move"
                      draggable
                      onDragStart={() => handleDragStart(job)}
                    >
                      <CardContent className="p-3">
                        <div className="text-sm">
                          <div className="font-semibold">{job.title}</div>
                          <div className="text-gray-600">
                            {job.insuredName || "No client"}
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <Badge variant="secondary">{job.status}</Badge>
                            {job.excess && (
                              <span className="text-xs text-green-600">
                                {job.excess}
                              </span>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {!isBooked && (
                    <Button
                      variant="outline"
                      onClick={() => handleTimeSlotClick(currentDate, time)}
                      className="w-full h-12 border-dashed"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Job
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateDate("prev")}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <h2 className="text-lg font-semibold">
            {viewMode === "month" &&
              currentDate.toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            {viewMode === "week" &&
              `Week of ${currentDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
            {viewMode === "day" &&
              currentDate.toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
          </h2>

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateDate("next")}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === "month" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("month")}
          >
            Month
          </Button>
          <Button
            variant={viewMode === "week" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("week")}
          >
            Week
          </Button>
          <Button
            variant={viewMode === "day" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("day")}
          >
            Day
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentDate(new Date())}
          >
            Today
          </Button>
        </div>
      </div>

      {/* Calendar Content */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        {viewMode === "month" && renderMonthView()}
        {viewMode === "week" && renderWeekView()}
        {viewMode === "day" && renderDayView()}
      </div>

      {/* Legend */}
      <div className="text-xs text-gray-500 text-center">
        Drag jobs to move them • Click empty slots to create new jobs • Jobs
        show conflicts
      </div>
    </div>
  );
}
