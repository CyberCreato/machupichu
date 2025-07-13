import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Job, User, Company, Form } from "@shared/types";
import { Loader2, FileText, ExternalLink } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface JobEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: Job | null;
  onJobUpdated: () => void;
}

export function JobEditModal({
  open,
  onOpenChange,
  job,
  onJobUpdated,
}: JobEditModalProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [staff, setStaff] = useState<User[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [forms, setForms] = useState<Form[]>([]);

  const [jobData, setJobData] = useState({
    title: "",
    description: "",
    assignedTo: "",
    companyId: "",
    formId: "",
    status: "pending" as "pending" | "in_progress" | "completed",
    priority: "medium" as "low" | "medium" | "high",
    dueDate: "",
  });

  useEffect(() => {
    if (open) {
      fetchData();
      if (job) {
        setJobData({
          title: job.title,
          description: job.description,
          assignedTo: job.assignedTo,
          companyId: job.companyId || "",
          formId: job.formId || "",
          status: job.status,
          priority: job.priority,
          dueDate: job.dueDate ? job.dueDate.split("T")[0] : "",
        });
      }
      setError(null);
    }
  }, [open, job]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const [usersRes, companiesRes, formsRes] = await Promise.all([
        fetch("/api/auth/users", { headers }),
        fetch("/api/companies", { headers }),
        fetch("/api/forms", { headers }),
      ]);

      const [usersData, companiesData, formsData] = await Promise.all([
        usersRes.json(),
        companiesRes.json(),
        formsRes.json(),
      ]);

      setStaff(usersData.filter((u: User) => u.role === "staff"));
      setCompanies(companiesData);
      setForms(formsData);
    } catch (error) {
      setError("Failed to load data");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!job) return;

    // Check permissions - supervisors can only assign jobs, not edit details
    if (user?.role === "supervisor") {
      if (jobData.assignedTo === job.assignedTo) {
        setError("No changes to save");
        return;
      }
      // Only allow changing assignedTo
      const updateData = { assignedTo: jobData.assignedTo };
      await updateJob(updateData);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (!jobData.title.trim()) {
        setError("Job title is required");
        setLoading(false);
        return;
      }

      // If we have selectedJobTime, make sure the dueDate includes the time
      let finalJobData = { ...jobData };
      if (jobData.dueDate) {
        const dueDateTime = new Date(jobData.dueDate);
        if (job.dueDate) {
          const originalDate = new Date(job.dueDate);
          dueDateTime.setHours(
            originalDate.getHours(),
            originalDate.getMinutes(),
          );
        }
        finalJobData.dueDate = dueDateTime.toISOString();
      }

      await updateJob(finalJobData);
    } catch (error) {
      setError("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  const updateJob = async (updateData: any) => {
    const token = localStorage.getItem("auth_token");
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`/api/jobs/${job!.id}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(updateData),
    });

    if (response.ok) {
      onJobUpdated();
      onOpenChange(false);
    } else {
      const errorData = await response.json();
      setError(errorData.error || "Failed to update job");
    }
  };

  const handleFillForm = () => {
    if (!job || !job.formId) {
      setError("No form attached to this job");
      return;
    }

    navigate("/fill-form", {
      state: { jobId: job.id, formId: job.formId },
    });
  };

  const canEdit = user?.role === "admin";
  const canAssign = user?.role === "admin" || user?.role === "supervisor";

  if (!job) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{canEdit ? "Edit Job" : "Job Details"}</DialogTitle>
          <DialogDescription>
            {canEdit
              ? "Update job information and assignments"
              : canAssign
                ? "View job details and manage assignments"
                : "View job details"}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Job Title</Label>
                  <Input
                    id="title"
                    value={jobData.title}
                    onChange={(e) =>
                      setJobData({ ...jobData, title: e.target.value })
                    }
                    placeholder="Enter job title"
                    disabled={!canEdit}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={jobData.status}
                    onValueChange={(
                      value: "pending" | "in_progress" | "completed",
                    ) => setJobData({ ...jobData, status: value })}
                    disabled={!canEdit}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem key="pending" value="pending">
                        Pending
                      </SelectItem>
                      <SelectItem key="in_progress" value="in_progress">
                        In Progress
                      </SelectItem>
                      <SelectItem key="completed" value="completed">
                        Completed
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={jobData.description}
                  onChange={(e) =>
                    setJobData({ ...jobData, description: e.target.value })
                  }
                  placeholder="Enter job description"
                  disabled={!canEdit}
                  className="min-h-[100px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="assignedTo">Assign to Staff</Label>
                  <Select
                    value={jobData.assignedTo}
                    onValueChange={(value) =>
                      setJobData({ ...jobData, assignedTo: value })
                    }
                    disabled={!canAssign}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select staff member" />
                    </SelectTrigger>
                    <SelectContent>
                      {staff.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={jobData.priority}
                    onValueChange={(value: "low" | "medium" | "high") =>
                      setJobData({ ...jobData, priority: value })
                    }
                    disabled={!canEdit}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem key="low" value="low">
                        Low
                      </SelectItem>
                      <SelectItem key="medium" value="medium">
                        Medium
                      </SelectItem>
                      <SelectItem key="high" value="high">
                        High
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyId">Company</Label>
                  <Select
                    value={jobData.companyId}
                    onValueChange={(value) =>
                      setJobData({ ...jobData, companyId: value })
                    }
                    disabled={!canEdit}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select company" />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="formId">Attach Form</Label>
                  <div className="flex gap-2">
                    <Select
                      value={jobData.formId}
                      onValueChange={(value) =>
                        setJobData({ ...jobData, formId: value })
                      }
                      disabled={!canEdit}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select form" />
                      </SelectTrigger>
                      <SelectContent>
                        {forms.map((form) => (
                          <SelectItem key={form.id} value={form.id}>
                            {form.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {job.formId && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleFillForm}
                        className="flex-shrink-0"
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Fill
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={jobData.dueDate}
                  onChange={(e) =>
                    setJobData({ ...jobData, dueDate: e.target.value })
                  }
                  disabled={!canEdit}
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
                  onClick={() => onOpenChange(false)}
                >
                  {canEdit || canAssign ? "Cancel" : "Close"}
                </Button>
                {(canEdit || canAssign) && (
                  <Button type="submit" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <FileText className="mr-2 h-4 w-4" />
                        {canEdit ? "Update Job" : "Update Assignment"}
                      </>
                    )}
                  </Button>
                )}
              </div>
            </form>
          </div>

          {/* Job Information Sidebar */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Job Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <span className="font-medium">Created:</span>
                  <br />
                  {new Date(job.createdAt).toLocaleDateString()}
                </div>
                <div>
                  <span className="font-medium">Updated:</span>
                  <br />
                  {new Date(job.updatedAt).toLocaleDateString()}
                </div>
                <div>
                  <span className="font-medium">Priority:</span>
                  <br />
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
                <div>
                  <span className="font-medium">Status:</span>
                  <br />
                  <Badge variant="outline">
                    {job.status.replace("_", " ")}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Parsed Data Card */}
            {(job.claimNo || job.policyNo || job.insuredName) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Client Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {(job.claimNo || job.ClaimNo) && (
                    <div>
                      <span className="font-medium">Claim No:</span>
                      <br />
                      {job.claimNo || job.ClaimNo}
                    </div>
                  )}
                  {(job.policyNo || job.PolicyNo) && (
                    <div>
                      <span className="font-medium">Policy No:</span>
                      <br />
                      {job.policyNo || job.PolicyNo}
                    </div>
                  )}
                  {(job.insuredName || job.InsuredName) && (
                    <div>
                      <span className="font-medium">Client:</span>
                      <br />
                      {job.insuredName || job.InsuredName}
                    </div>
                  )}
                  {(job.insCell || job.InsCell) && (
                    <div>
                      <span className="font-medium">Contact:</span>
                      <br />
                      {job.insCell || job.InsCell}
                    </div>
                  )}
                  {(job.riskAddress || job.RiskAddress) && (
                    <div>
                      <span className="font-medium">Address:</span>
                      <br />
                      {job.riskAddress || job.RiskAddress}
                    </div>
                  )}
                  {(job.excess || job.Excess) && (
                    <div>
                      <span className="font-medium">Excess:</span>
                      <br />
                      <span className="text-green-600 font-medium">
                        {job.excess || job.Excess}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Additional Parsed Fields */}
            {Object.entries(job)
              .filter(
                ([key, value]) =>
                  value &&
                  typeof value === "string" &&
                  ![
                    "id",
                    "title",
                    "description",
                    "assignedTo",
                    "assignedBy",
                    "companyId",
                    "formId",
                    "status",
                    "priority",
                    "dueDate",
                    "createdAt",
                    "updatedAt",
                    "notes",
                    "carryOver",
                    "claimNo",
                    "policyNo",
                    "insuredName",
                    "insCell",
                    "riskAddress",
                    "excess",
                    "ClaimNo",
                    "PolicyNo",
                    "InsuredName",
                    "InsCell",
                    "RiskAddress",
                    "Excess",
                  ].includes(key),
              )
              .slice(0, 10).length > 0 && ( // Limit to 10 additional fields
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">
                    Additional Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {Object.entries(job)
                    .filter(
                      ([key, value]) =>
                        value &&
                        typeof value === "string" &&
                        ![
                          "id",
                          "title",
                          "description",
                          "assignedTo",
                          "assignedBy",
                          "companyId",
                          "formId",
                          "status",
                          "priority",
                          "dueDate",
                          "createdAt",
                          "updatedAt",
                          "notes",
                          "carryOver",
                          "claimNo",
                          "policyNo",
                          "insuredName",
                          "insCell",
                          "riskAddress",
                          "excess",
                          "ClaimNo",
                          "PolicyNo",
                          "InsuredName",
                          "InsCell",
                          "RiskAddress",
                          "Excess",
                        ].includes(key),
                    )
                    .slice(0, 10)
                    .map(([key, value]) => (
                      <div key={key}>
                        <span className="font-medium capitalize">
                          {key.replace(/([A-Z])/g, " $1").trim()}:
                        </span>
                        <br />
                        {String(value).length > 50
                          ? `${String(value).substring(0, 50)}...`
                          : String(value)}
                      </div>
                    ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
