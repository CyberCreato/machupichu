import React, { useMemo } from "react";
import { Job, User } from "@shared/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface JobCalendarViewProps {
  jobs: Job[];
  staff: User[];
}

function generateTimeSlots(): string[] {
  const slots: string[] = [];
  for (let hour = 8; hour < 18; hour++) {
    slots.push(`${hour.toString().padStart(2, "0")}:00`);
    slots.push(`${hour.toString().padStart(2, "0")}:30`);
  }
  return slots;
}

function getStatusColor(status: string): string {
  switch (status) {
    case "completed":
      return "bg-green-100 text-green-800";
    case "in_progress":
      return "bg-blue-100 text-blue-800";
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export function JobCalendarView({ jobs, staff }: JobCalendarViewProps) {
  const timeSlots = useMemo(() => generateTimeSlots(), []);

  const getJobsForTimeSlot = (time: string, userId?: string) => {
    return jobs.filter((job) => {
      if (userId && job.assignedTo !== userId) return false;
      if (!job.dueDate) return false;

      const jobTime = new Date(job.dueDate).toTimeString().substring(0, 5);
      return jobTime === time;
    });
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-50">
            <th className="border border-gray-300 px-4 py-2 text-left font-medium">
              Time
            </th>
            <th className="border border-gray-300 px-4 py-2 text-center font-medium">
              Admin
            </th>
            {staff.map((member) => (
              <th
                key={member.id}
                className="border border-gray-300 px-4 py-2 text-center font-medium"
              >
                {member.name}
              </th>
            ))}
            <th className="border border-gray-300 px-4 py-2 text-center font-medium">
              Available Slots
            </th>
          </tr>
        </thead>
        <tbody>
          {timeSlots.map((time) => {
            const adminJobs = jobs.filter(
              (job) =>
                job.assignedTo === "admin-1" &&
                job.dueDate &&
                new Date(job.dueDate).toTimeString().substring(0, 5) === time,
            );

            const allJobsAtTime = jobs.filter(
              (job) =>
                job.dueDate &&
                new Date(job.dueDate).toTimeString().substring(0, 5) === time,
            );

            const isAvailable = allJobsAtTime.length === 0;

            return (
              <tr key={time} className="hover:bg-gray-50">
                <td className="border border-gray-300 px-4 py-2 font-medium">
                  {time}
                </td>

                {/* Admin Column */}
                <td className="border border-gray-300 px-2 py-2">
                  {adminJobs.map((job) => (
                    <Card
                      key={job.id}
                      className="mb-2 p-2 bg-blue-50 border-blue-200"
                    >
                      <CardContent className="p-0">
                        <div className="text-xs">
                          <div className="font-semibold text-blue-800">
                            {job.title}
                          </div>
                          <div className="text-gray-600">
                            {job.insuredName || job.description || "No client"}
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <Badge
                              className={getStatusColor(job.status)}
                              variant="secondary"
                            >
                              {job.status.replace("_", " ")}
                            </Badge>
                            {job.excess && (
                              <span className="text-green-600 text-xs">
                                {job.excess}
                              </span>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </td>

                {/* Staff Columns */}
                {staff.map((member) => {
                  const memberJobs = getJobsForTimeSlot(time, member.id);
                  return (
                    <td
                      key={member.id}
                      className="border border-gray-300 px-2 py-2"
                    >
                      {memberJobs.map((job) => (
                        <Card
                          key={job.id}
                          className="mb-2 p-2 bg-green-50 border-green-200"
                        >
                          <CardContent className="p-0">
                            <div className="text-xs">
                              <div className="font-semibold text-green-800">
                                {job.title}
                              </div>
                              <div className="text-gray-600">
                                {job.insuredName ||
                                  job.description ||
                                  "No client"}
                              </div>
                              <div className="flex items-center justify-between mt-1">
                                <Badge
                                  className={getStatusColor(job.status)}
                                  variant="secondary"
                                >
                                  {job.status.replace("_", " ")}
                                </Badge>
                                {job.excess && (
                                  <span className="text-green-600 text-xs">
                                    {job.excess}
                                  </span>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </td>
                  );
                })}

                {/* Available Slots Column */}
                <td className="border border-gray-300 px-4 py-2 text-center">
                  {isAvailable ? (
                    <span className="text-green-600 font-medium">
                      Available
                    </span>
                  ) : (
                    <span className="text-red-600 font-medium">Booked</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
