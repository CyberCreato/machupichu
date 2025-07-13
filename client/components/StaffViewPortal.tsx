import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Job, User, FormSubmission } from "@shared/types";
import {
  Calendar,
  Clock,
  MapPin,
  User as UserIcon,
  CheckCircle2,
  AlertCircle,
  FileText,
  Camera,
  Navigation,
} from "lucide-react";
import { format, parseISO, isSameDay } from "date-fns";

interface StaffViewPortalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobs: Job[];
  staff: User[];
  currentUser: User | null;
}

export function StaffViewPortal({
  open,
  onOpenChange,
  jobs,
  staff,
  currentUser,
}: StaffViewPortalProps) {
  const [selectedStaffId, setSelectedStaffId] = useState<string>("");
  const [formSubmissions, setFormSubmissions] = useState<FormSubmission[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  useEffect(() => {
    if (open && staff.length > 0) {
      setSelectedStaffId(staff[0].id);
    }
  }, [open, staff]);

  useEffect(() => {
    if (open) {
      fetchFormSubmissions();
    }
  }, [open]);

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

  const selectedStaff = staff.find((s) => s.id === selectedStaffId);
  const staffJobs = jobs.filter((job) => job.assignedTo === selectedStaffId);
  const todayJobs = staffJobs.filter((job) => {
    if (!job.dueDate) return false;
    return isSameDay(parseISO(job.dueDate), new Date());
  });

  const getJobProgress = (job: Job) => {
    const jobSubmissions = formSubmissions.filter((s) => s.jobId === job.id);
    const totalForms = job.formIds?.length || 0;
    const formsCompleted = jobSubmissions.length;
    const percentage = totalForms > 0 ? (formsCompleted / totalForms) * 100 : 0;

    return {
      formsCompleted,
      totalForms,
      percentage,
      status:
        percentage === 100
          ? ("completed" as const)
          : percentage > 0
            ? ("in_progress" as const)
            : ("not_started" as const),
    };
  };

  const getStatusColor = (status: string) => {
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
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "destructive";
      case "medium":
        return "default";
      case "low":
        return "secondary";
      default:
        return "outline";
    }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <UserIcon className="h-5 w-5 mr-2" />
            Staff Portal View
          </DialogTitle>
          <DialogDescription>
            View the system from a staff member's perspective - Admin/Apollo
            Privilege
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Staff Selection */}
          <div className="flex items-center space-x-4">
            <label className="font-medium">View as Staff Member:</label>
            <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select staff member" />
              </SelectTrigger>
              <SelectContent>
                {staff.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    <div className="flex items-center space-x-2">
                      <span>{member.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {member.role}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedStaff && (
            <>
              {/* Staff Dashboard Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center">
                      <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FileText className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-600">
                          Total Jobs
                        </p>
                        <p className="text-xl font-bold text-gray-900">
                          {staffJobs.length}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center">
                      <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-600">
                          Completed
                        </p>
                        <p className="text-xl font-bold text-gray-900">
                          {
                            staffJobs.filter((j) => j.status === "completed")
                              .length
                          }
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center">
                      <div className="h-10 w-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                        <Clock className="h-5 w-5 text-yellow-600" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-600">
                          Today's Jobs
                        </p>
                        <p className="text-xl font-bold text-gray-900">
                          {todayJobs.length}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Today's Jobs */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calendar className="h-5 w-5 mr-2" />
                    Today's Schedule -{" "}
                    {format(new Date(), "EEEE, MMMM d, yyyy")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {todayJobs.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p>No jobs scheduled for today</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {todayJobs.map((job) => {
                        const progress = getJobProgress(job);
                        return (
                          <div
                            key={job.id}
                            className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                            onClick={() => setSelectedJob(job)}
                          >
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <h3 className="font-medium">{job.title}</h3>
                                <p className="text-sm text-gray-600">
                                  {job.description}
                                </p>
                              </div>
                              <div className="flex space-x-2">
                                <Badge variant={getPriorityColor(job.priority)}>
                                  {job.priority}
                                </Badge>
                                <Badge
                                  className={getStatusColor(job.status)}
                                  variant="secondary"
                                >
                                  {job.status.replace("_", " ")}
                                </Badge>
                              </div>
                            </div>

                            {job.dueDate && (
                              <div className="flex items-center text-sm text-gray-600 mb-2">
                                <Clock className="h-4 w-4 mr-2" />
                                Due: {format(parseISO(job.dueDate), "h:mm a")}
                              </div>
                            )}

                            {job.riskAddress && (
                              <div className="flex items-center text-sm text-gray-600 mb-3">
                                <MapPin className="h-4 w-4 mr-2" />
                                {job.riskAddress}
                              </div>
                            )}

                            {/* Progress Bar */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">
                                  Forms Progress
                                </span>
                                <span
                                  className={
                                    progress.status === "completed"
                                      ? "text-green-600"
                                      : progress.status === "in_progress"
                                        ? "text-blue-600"
                                        : "text-gray-400"
                                  }
                                >
                                  {progress.formsCompleted}/
                                  {progress.totalForms}
                                </span>
                              </div>
                              <Progress
                                value={progress.percentage}
                                className="h-2"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* All Jobs List */}
              <Card>
                <CardHeader>
                  <CardTitle>All Assigned Jobs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {staffJobs.map((job) => {
                      const progress = getJobProgress(job);
                      return (
                        <div
                          key={job.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                          onClick={() => setSelectedJob(job)}
                        >
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <div>
                                <h4 className="font-medium">{job.title}</h4>
                                <p className="text-sm text-gray-600">
                                  {job.claimNo && `Claim: ${job.claimNo}`}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <Badge
                              className={getStatusColor(job.status)}
                              variant="secondary"
                            >
                              {job.status.replace("_", " ")}
                            </Badge>
                            {job.dueDate && (
                              <span className="text-sm text-gray-500">
                                {format(parseISO(job.dueDate), "MMM d")}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Staff Actions Panel */}
              <Card>
                <CardHeader>
                  <CardTitle>Staff Actions (Simulated)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Button variant="outline" className="h-16 flex-col">
                      <Camera className="h-5 w-5 mb-1" />
                      <span className="text-xs">Take Photos</span>
                    </Button>
                    <Button variant="outline" className="h-16 flex-col">
                      <FileText className="h-5 w-5 mb-1" />
                      <span className="text-xs">Fill Forms</span>
                    </Button>
                    <Button variant="outline" className="h-16 flex-col">
                      <Navigation className="h-5 w-5 mb-1" />
                      <span className="text-xs">Navigation</span>
                    </Button>
                    <Button variant="outline" className="h-16 flex-col">
                      <CheckCircle2 className="h-5 w-5 mb-1" />
                      <span className="text-xs">Mark Complete</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        <div className="flex justify-end">
          <Button onClick={() => onOpenChange(false)}>Close Staff View</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
