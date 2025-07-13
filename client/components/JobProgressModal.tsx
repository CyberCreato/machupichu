import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Clock,
  User,
  MapPin,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Phone,
  Mail,
  Building,
} from "lucide-react";
import { Job, User as UserType, Form, FormSubmission } from "@shared/types";
import { format } from "date-fns";

interface JobProgressModalProps {
  job: Job | null;
  isOpen: boolean;
  onClose: () => void;
  staff: UserType[];
}

interface JobProgress {
  totalForms: number;
  completedForms: number;
  percentage: number;
  forms: Array<{
    form: Form;
    submission: FormSubmission | null;
    status: "completed" | "pending";
  }>;
}

export function JobProgressModal({
  job,
  isOpen,
  onClose,
  staff,
}: JobProgressModalProps) {
  const [jobProgress, setJobProgress] = useState<JobProgress | null>(null);
  const [forms, setForms] = useState<Form[]>([]);
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [loading, setLoading] = useState(false);

  const assignedStaff = job ? staff.find((s) => s.id === job.assignedTo) : null;

  useEffect(() => {
    if (job && isOpen) {
      fetchJobProgress();
    }
  }, [job, isOpen]);

  const fetchJobProgress = async () => {
    if (!job) return;

    setLoading(true);
    try {
      const token = localStorage.getItem("auth_token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      // Fetch forms and submissions in parallel
      const [formsRes, submissionsRes] = await Promise.all([
        fetch("/api/forms", { headers }),
        fetch(`/api/form-submissions?jobId=${job.id}`, { headers }),
      ]);

      const [allForms, jobSubmissions] = await Promise.all([
        formsRes.json(),
        submissionsRes.json(),
      ]);

      setForms(allForms);
      setSubmissions(jobSubmissions);

      // Calculate progress
      const jobForms = job.formIds
        ? allForms.filter((form: Form) => job.formIds!.includes(form.id))
        : [];

      const progress: JobProgress = {
        totalForms: jobForms.length,
        completedForms: jobSubmissions.length,
        percentage:
          jobForms.length > 0
            ? (jobSubmissions.length / jobForms.length) * 100
            : 0,
        forms: jobForms.map((form: Form) => ({
          form,
          submission: jobSubmissions.find(
            (sub: FormSubmission) => sub.formId === form.id,
          ),
          status: jobSubmissions.find(
            (sub: FormSubmission) => sub.formId === form.id,
          )
            ? "completed"
            : "pending",
        })),
      };

      setJobProgress(progress);
    } catch (error) {
      console.error("Failed to fetch job progress:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-600 bg-green-100";
      case "in_progress":
        return "text-yellow-600 bg-yellow-100";
      case "pending":
        return "text-gray-600 bg-gray-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "destructive";
      case "medium":
        return "secondary";
      case "low":
        return "outline";
      default:
        return "outline";
    }
  };

  if (!job) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Job Progress - {job.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Job Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                Job Details
                <Badge variant={getPriorityColor(job.priority)}>
                  {job.priority} priority
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <User className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <div className="font-medium">Assigned Staff</div>
                      <div className="text-gray-600">
                        {assignedStaff?.name || "Unassigned"}
                      </div>
                      {assignedStaff?.email && (
                        <div className="text-sm text-gray-500 flex items-center mt-1">
                          <Mail className="h-3 w-3 mr-1" />
                          {assignedStaff.email}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <div className="font-medium">Due Date</div>
                      <div className="text-gray-600">
                        {job.dueDate
                          ? format(new Date(job.dueDate), "PPP 'at' p")
                          : "Not set"}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <div className="font-medium">Status</div>
                      <Badge className={getStatusColor(job.status)}>
                        {job.status.replace("_", " ")}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Building className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <div className="font-medium">Client</div>
                      <div className="text-gray-600">
                        {job.insuredName || job.InsuredName || "N/A"}
                      </div>
                      {(job.insCell || job.InsCell) && (
                        <div className="text-sm text-gray-500 flex items-center mt-1">
                          <Phone className="h-3 w-3 mr-1" />
                          {job.insCell || job.InsCell}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <div className="font-medium">Address</div>
                      <div className="text-gray-600">
                        {job.riskAddress || job.RiskAddress || "N/A"}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <div className="font-medium">Claim Number</div>
                      <div className="text-gray-600">
                        {job.claimNo || job.ClaimNo || "N/A"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {job.description && (
                <div className="mt-4 pt-4 border-t">
                  <div className="font-medium mb-2">Description</div>
                  <div className="text-gray-600">{job.description}</div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Progress Overview */}
          {jobProgress && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  Form Completion Progress
                  <div className="text-sm font-normal text-gray-600">
                    {jobProgress.completedForms} of {jobProgress.totalForms}{" "}
                    forms completed
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span>Overall Progress</span>
                    <span className="font-medium">
                      {Math.round(jobProgress.percentage)}%
                    </span>
                  </div>
                  <Progress value={jobProgress.percentage} className="h-3" />

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                    {jobProgress.forms.map(({ form, submission, status }) => (
                      <Card
                        key={form.id}
                        className={`border-2 ${
                          status === "completed"
                            ? "border-green-200 bg-green-50"
                            : "border-gray-200"
                        }`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="font-medium text-sm truncate flex-1">
                              {form.name}
                            </div>
                            {status === "completed" ? (
                              <CheckCircle2 className="h-5 w-5 text-green-600 ml-2" />
                            ) : (
                              <AlertTriangle className="h-5 w-5 text-gray-400 ml-2" />
                            )}
                          </div>

                          <div className="text-xs text-gray-600 mb-3">
                            {form.description}
                          </div>

                          <div className="flex items-center justify-between">
                            <Badge
                              variant={
                                status === "completed" ? "default" : "secondary"
                              }
                              className="text-xs"
                            >
                              {status === "completed" ? "Complete" : "Pending"}
                            </Badge>

                            {submission && (
                              <div className="text-xs text-gray-500">
                                {format(
                                  new Date(submission.submittedAt),
                                  "MMM d, p",
                                )}
                              </div>
                            )}
                          </div>

                          {submission && (
                            <div className="mt-2 text-xs text-gray-600">
                              Submitted by:{" "}
                              {staff.find(
                                (s) => s.id === submission.submittedBy,
                              )?.name || "Unknown"}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading progress...</span>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
