import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Users,
  FileText,
  Briefcase,
  Building2,
  Plus,
  Settings,
  BarChart3,
  Calendar,
  List,
  Search,
  User,
  Package,
  AlertCircle,
  Shield,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Job,
  Form,
  User as UserType,
  Company,
  FormSubmission,
} from "@shared/types";
import { CreateJobModal } from "@/components/CreateJobModal";
import { CreateFormModal } from "@/components/CreateFormModal";
import { JobCalendarView } from "@/components/JobCalendarView";
import { AdvancedCalendarView } from "@/components/AdvancedCalendarView";
import { AnalyticsDashboard } from "@/components/AnalyticsDashboard";
import { CreateCompanyModal } from "@/components/CreateCompanyModal";
import { StaffProfileModal } from "@/components/StaffProfileModal";
import { JobEditModal } from "@/components/JobEditModal";
import { JobCreationCalendarModal } from "@/components/JobCreationCalendarModal";
import { StaffCalendarView } from "@/components/StaffCalendarView";
import { JobProgressModal } from "@/components/JobProgressModal";
import { StaffSalaryTracker } from "@/components/StaffSalaryTracker";
import { StaffScheduleManager } from "@/components/StaffScheduleManager";
import { MaterialListManager } from "@/components/MaterialListManager";
import { NoncomplianceForm } from "@/components/NoncomplianceForm";
import { EnhancedLiabilityForm } from "@/components/EnhancedLiabilityForm";
import { EnhancedShiftManagement } from "@/components/EnhancedShiftManagement";
import { ClientManagement } from "@/components/ClientManagement";
import { CompanyManagementModal } from "@/components/CompanyManagementModal";
import { FormEditModal } from "@/components/FormEditModal";
import { PDFFormGenerator } from "@/components/PDFFormGenerator";
import { DeletionConfirmModal } from "@/components/DeletionConfirmModal";
import { JobTimeEditor } from "@/components/JobTimeEditor";
import { MongoSyncStatus } from "@/components/MongoSyncStatus";
import { StaffViewPortal } from "@/components/StaffViewPortal";
import { JobDuplicationModal } from "@/components/JobDuplicationModal";
import { AdminPDFManagement } from "@/components/AdminPDFManagement";
import { FormVariableViewer } from "@/components/FormVariableViewer";

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [forms, setForms] = useState<Form[]>([]);
  const [staff, setStaff] = useState<UserType[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateJob, setShowCreateJob] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showCreateCompany, setShowCreateCompany] = useState(false);
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [showJobEdit, setShowJobEdit] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showCalendarJobCreation, setShowCalendarJobCreation] = useState(false);
  const [selectedStaffForCalendar, setSelectedStaffForCalendar] =
    useState<string>("");
  const [selectedStaff, setSelectedStaff] = useState<string>("");
  const [showCompanyManagement, setShowCompanyManagement] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [showFormEdit, setShowFormEdit] = useState(false);
  const [selectedForm, setSelectedForm] = useState<Form | null>(null);
  const [showPDFFormGenerator, setShowPDFFormGenerator] = useState(false);
  const [showDeletionConfirm, setShowDeletionConfirm] = useState(false);
  const [deletionItem, setDeletionItem] = useState<{
    type: "staff" | "company";
    id: string;
    name: string;
  } | null>(null);
  const [showJobTimeEditor, setShowJobTimeEditor] = useState(false);
  const [showJobProgress, setShowJobProgress] = useState(false);
  const [selectedJobForProgress, setSelectedJobForProgress] =
    useState<Job | null>(null);
  const [selectedJobForTimeEdit, setSelectedJobForTimeEdit] =
    useState<Job | null>(null);
  const [showEnhancedShiftManagement, setShowEnhancedShiftManagement] =
    useState(false);
  const [jobView, setJobView] = useState<"calendar" | "list">("calendar");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedJobTime, setSelectedJobTime] = useState<{
    time: string;
    date: Date;
  } | null>(null);
  const [selectedStaffFilter, setSelectedStaffFilter] = useState<string>("all");
  const [showStaffViewPortal, setShowStaffViewPortal] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    job: Job | null;
  }>({ visible: false, x: 0, y: 0, job: null });
  const [showJobDuplication, setShowJobDuplication] = useState(false);
  const [jobToDuplicate, setJobToDuplicate] = useState<Job | null>(null);
  const [showAdminPDFManagement, setShowAdminPDFManagement] = useState(false);
  const [showFormVariableViewer, setShowFormVariableViewer] = useState(false);

  useEffect(() => {
    if (user && (user.role === "admin" || user.role === "supervisor")) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    try {
      const token = localStorage.getItem("auth_token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const [jobsRes, formsRes, usersRes, companiesRes, submissionsRes] =
        await Promise.all([
          fetch("/api/jobs", { headers }),
          fetch("/api/forms", { headers }),
          fetch("/api/auth/users", { headers }),
          fetch("/api/companies", { headers }),
          fetch("/api/form-submissions", { headers }),
        ]);

      const [jobsData, formsData, usersData, companiesData, submissionsData] =
        await Promise.all([
          jobsRes.json(),
          formsRes.json(),
          usersRes.json(),
          companiesRes.json(),
          submissionsRes.json(),
        ]);

      setJobs(jobsData);
      setForms(formsData);
      setStaff(usersData.filter((u: UserType) => u.role === "staff"));
      setCompanies(companiesData);
      setSubmissions(submissionsData);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter jobs based on search term and staff selection
  const filteredJobs = React.useMemo(() => {
    let filtered = jobs;

    // Filter by staff selection
    if (selectedStaffFilter !== "all") {
      filtered = filtered.filter(
        (job) => job.assignedTo === selectedStaffFilter,
      );
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (job) =>
          job.title.toLowerCase().includes(term) ||
          job.description.toLowerCase().includes(term) ||
          (job.insuredName && job.insuredName.toLowerCase().includes(term)) ||
          (job.claimNo && job.claimNo.toLowerCase().includes(term)) ||
          (job.policyNo && job.policyNo.toLowerCase().includes(term)) ||
          (job.riskAddress && job.riskAddress.toLowerCase().includes(term)) ||
          staff
            .find((s) => s.id === job.assignedTo)
            ?.name.toLowerCase()
            .includes(term),
      );
    }

    return filtered;
  }, [jobs, searchTerm, selectedStaffFilter, staff]);

  const stats = {
    totalJobs: jobs.length,
    pendingJobs: jobs.filter((j) => j.status === "pending").length,
    completedJobs: jobs.filter((j) => j.status === "completed").length,
    totalStaff: staff.length,
    totalForms: forms.length,
    totalCompanies: companies.length,
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
        return "default";
    }
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

  const handleCreateJobFromCalendar = (timeSlot: string, date: Date) => {
    setSelectedJobTime({ time: timeSlot, date });
    setShowCreateJob(true);
  };

  const handleMoveJob = async (
    jobId: string,
    newTime: string,
    newDate: Date,
  ) => {
    try {
      const newDueDate = new Date(newDate);
      const [hours, minutes] = newTime.split(":").map(Number);
      newDueDate.setHours(hours, minutes);

      const token = localStorage.getItem("auth_token");
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`/api/jobs/${jobId}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ dueDate: newDueDate.toISOString() }),
      });

      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error("Failed to move job:", error);
    }
  };

  const handleExtendJob = async (jobId: string, duration: number) => {
    // Implementation for extending job duration
    console.log("Extending job", jobId, "by", duration, "minutes");
  };

  const handleUserClick = (user: UserType) => {
    setSelectedUser(user);
    setShowUserManagement(true);
  };

  const handleJobEdit = (job: Job) => {
    setSelectedJob(job);
    setShowJobEdit(true);
  };

  const handleCreateJobWithTime = (
    staffId: string,
    timeSlot: string,
    date: Date,
  ) => {
    // Set the selected time and date for job creation
    const [hours, minutes] = timeSlot.split(":").map(Number);
    const scheduledDate = new Date(date);
    scheduledDate.setHours(hours, minutes);

    setSelectedJobTime({
      time: timeSlot,
      date: scheduledDate,
      staffId, // Add staff ID to the selected job time
    });

    // Pre-select the staff member
    setSelectedJob(null); // Clear any existing job
    setShowCreateJob(true);
  };

  const handleCompanyManage = (company: Company) => {
    setSelectedCompany(company);
    setShowCompanyManagement(true);
  };

  const handleFormEdit = (form: Form) => {
    setSelectedForm(form);
    setShowFormEdit(true);
  };

  const handleJobTimeChange = async (
    jobId: string,
    newStartTime: Date,
    newEndTime: Date,
  ) => {
    try {
      const token = localStorage.getItem("auth_token");
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`/api/jobs/${jobId}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({
          dueDate: newStartTime.toISOString(),
          endTime: newEndTime.toISOString(),
        }),
      });

      if (response.ok) {
        fetchData(); // Refresh data
      } else {
        console.error("Failed to update job time");
      }
    } catch (error) {
      console.error("Error updating job time:", error);
    }
  };

  const handleJobUpdate = async (jobId: string, updates: Partial<Job>) => {
    try {
      const token = localStorage.getItem("auth_token");
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`/api/jobs/${jobId}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        fetchData(); // Refresh data
      } else {
        console.error("Failed to update job");
      }
    } catch (error) {
      console.error("Error updating job:", error);
    }
  };

  const handleJobClick = (job: Job) => {
    setSelectedJobForProgress(job);
    setShowJobProgress(true);
  };

  const handleJobContextMenu = (e: React.MouseEvent, job: Job) => {
    e.preventDefault();
    if (user?.role === "admin" || user?.role === "supervisor") {
      setContextMenu({
        visible: true,
        x: e.clientX,
        y: e.clientY,
        job,
      });
    }
  };

  const handleJobDuplicate = (job: Job, newDate: Date) => {
    const duplicatedJob = {
      ...job,
      id: `job-${Date.now()}`,
      dueDate: newDate.toISOString(),
      status: "pending" as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setJobs((prev) => [...prev, duplicatedJob]);
    setContextMenu({ visible: false, x: 0, y: 0, job: null });
  };

  const handleJobDragToDate = (job: Job, newDate: Date) => {
    const staffJobsOnDate = jobs.filter(
      (j) =>
        j.assignedTo === job.assignedTo &&
        j.dueDate &&
        new Date(j.dueDate).toDateString() === newDate.toDateString(),
    );

    let finalDateTime = new Date(newDate);

    if (staffJobsOnDate.length > 0) {
      const lastJobTime = Math.max(
        ...staffJobsOnDate.map((j) => new Date(j.dueDate!).getTime()),
      );
      finalDateTime = new Date(lastJobTime + 60 * 60 * 1000);
    } else {
      finalDateTime.setHours(9, 0, 0, 0);
    }

    handleJobUpdate(job.id, { dueDate: finalDateTime.toISOString() });
  };

  const handleJobPDFDownload = async (job: Job) => {
    try {
      const token = localStorage.getItem("auth_token");
      const headers: Record<string, string> = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`/api/jobs/${job.id}/pdf`, {
        method: "GET",
        headers,
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `job-${job.id}-report.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        // Handle error response safely to avoid "body stream already read" error
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = await response.text();
          errorMessage = errorData || errorMessage;
        } catch (readError) {
          console.warn("Could not read error response body:", readError);
        }
        console.error(
          `Failed to generate PDF (${response.status}):`,
          errorMessage,
        );
        alert(`Failed to generate PDF: ${errorMessage}`);
      }
    } catch (error) {
      console.error("Error downloading PDF:", error);
      alert(
        `Error downloading PDF: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  };

  const handleDownloadFormPDF = async (submission: FormSubmission) => {
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(
        `/api/forms/${submission.formId}/submissions/${submission.id}/pdf`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        },
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${submission.formType || submission.formId}-${submission.jobId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = await response.text();
          errorMessage = errorData || errorMessage;
        } catch (readError) {
          console.warn("Could not read error response body:", readError);
        }
        console.error(
          `Failed to download PDF (${response.status}):`,
          errorMessage,
        );
        alert(`Failed to download PDF: ${errorMessage}`);
      }
    } catch (error) {
      console.error("Error downloading PDF:", error);
      alert(
        `Error downloading PDF: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading dashboard...</p>
        </div>

        {/* Context Menu for Job Operations */}
        {contextMenu.visible && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() =>
                setContextMenu({ visible: false, x: 0, y: 0, job: null })
              }
            />
            <div
              className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-2 min-w-48"
              style={{ left: contextMenu.x, top: contextMenu.y }}
            >
              <div className="px-3 py-2 text-sm font-medium text-gray-900 border-b">
                {contextMenu.job?.title}
              </div>
              <button
                className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                onClick={() => {
                  if (contextMenu.job) {
                    setJobToDuplicate(contextMenu.job);
                    setShowJobDuplication(true);
                  }
                  setContextMenu({ visible: false, x: 0, y: 0, job: null });
                }}
              >
                Duplicate Job for Later Date
              </button>
              <button
                className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                onClick={() => {
                  if (contextMenu.job) {
                    setSelectedJobForProgress(contextMenu.job);
                    setShowJobProgress(true);
                  }
                  setContextMenu({ visible: false, x: 0, y: 0, job: null });
                }}
              >
                View Job Details
              </button>
              {contextMenu.job?.status === "completed" && (
                <button
                  className="w-full px-3 py-2 text-left text-sm text-green-700 hover:bg-green-50"
                  onClick={() => {
                    if (contextMenu.job) {
                      handleJobPDFDownload(contextMenu.job);
                    }
                    setContextMenu({ visible: false, x: 0, y: 0, job: null });
                  }}
                >
                  Download PDF Report
                </button>
              )}
            </div>
          </>
        )}

        {/* Click outside handler */}
        {contextMenu.visible && (
          <div
            className="fixed inset-0 z-30"
            onClick={() =>
              setContextMenu({ visible: false, x: 0, y: 0, job: null })
            }
          />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-semibold text-gray-900">
                  JobFlow Admin
                </h1>
                <p className="text-sm text-gray-500">
                  Welcome back, {user?.name}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                key="pdf-templates"
                variant="outline"
                size="sm"
                onClick={() => setShowAdminPDFManagement(true)}
              >
                <FileText key="pdf-icon" className="h-4 w-4 mr-2" />
                <span key="pdf-text">PDF Templates</span>
              </Button>
              <Button key="settings" variant="outline" size="sm">
                <Settings key="settings-icon" className="h-4 w-4 mr-2" />
                <span key="settings-text">Settings</span>
              </Button>
              <Button key="logout" variant="outline" size="sm" onClick={logout}>
                <span key="logout-text">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview - Clickable */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => {
              // Navigate to jobs tab and show all jobs
              const tabElement = document.querySelector(
                '[value="jobs"]',
              ) as HTMLElement;
              if (tabElement) tabElement.click();
              setSearchTerm("");
            }}
          >
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Briefcase className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Total Jobs
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.totalJobs}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => {
              // Navigate to jobs tab and filter pending
              const tabElement = document.querySelector(
                '[value="jobs"]',
              ) as HTMLElement;
              if (tabElement) tabElement.click();
              setSearchTerm("pending");
            }}
          >
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Briefcase className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Pending Jobs
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.pendingJobs}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => {
              // Navigate to staff tab
              const tabElement = document.querySelector(
                '[value="staff"]',
              ) as HTMLElement;
              if (tabElement) tabElement.click();
            }}
          >
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Staff Members
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.totalStaff}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => {
              // Navigate to forms tab
              const tabElement = document.querySelector(
                '[value="forms"]',
              ) as HTMLElement;
              if (tabElement) tabElement.click();
            }}
          >
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <FileText className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Active Forms
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.totalForms}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="jobs" className="space-y-6">
          <TabsList
            className={`grid w-full ${user?.role === "apollo" ? "grid-cols-6" : "grid-cols-10"}`}
          >
            <TabsTrigger key="jobs" value="jobs">
              Jobs
            </TabsTrigger>
            <TabsTrigger key="schedule" value="schedule">
              Schedule
            </TabsTrigger>
            <TabsTrigger key="salary" value="salary">
              Salary
            </TabsTrigger>
            {user?.role !== "apollo" && (
              <TabsTrigger key="materials-trigger" value="materials">
                Materials
              </TabsTrigger>
            )}
            <TabsTrigger key="clients" value="clients">
              Clients
            </TabsTrigger>
            {user?.role !== "apollo" && (
              <TabsTrigger key="forms-trigger" value="forms">
                Forms
              </TabsTrigger>
            )}
            <TabsTrigger key="staff" value="staff">
              Staff
            </TabsTrigger>
            {user?.role !== "apollo" && (
              <TabsTrigger key="companies-trigger" value="companies">
                Companies
              </TabsTrigger>
            )}
            <TabsTrigger key="analytics" value="analytics">
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Jobs Tab */}
          <TabsContent key="jobs-content" value="jobs">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Job Management</CardTitle>
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search jobs..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 w-64"
                      />
                    </div>
                    {(user?.role === "admin" ||
                      user?.role === "supervisor") && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowStaffViewPortal(true)}
                      >
                        <User key="staff-view-icon" className="h-4 w-4 mr-2" />
                        <span key="staff-view-text">View as Staff</span>
                      </Button>
                    )}
                    <div className="flex space-x-2">
                      <Button
                        key="quick-create"
                        size="sm"
                        onClick={() => setShowCreateJob(true)}
                      >
                        <Plus
                          key="quick-create-icon"
                          className="h-4 w-4 mr-2"
                        />
                        <span key="quick-create-text">Quick Create</span>
                      </Button>
                      <Button
                        key="schedule-job"
                        size="sm"
                        variant="outline"
                        onClick={() => setShowCalendarJobCreation(true)}
                      >
                        <Calendar
                          key="schedule-job-icon"
                          className="h-4 w-4 mr-2"
                        />
                        <span key="schedule-job-text">Schedule Job</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* View Toggle and Staff Filter */}
                <div className="mb-4 flex flex-wrap items-center gap-4">
                  <div className="flex space-x-2">
                    <Button
                      key="calendar-view"
                      variant={jobView === "calendar" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setJobView("calendar")}
                    >
                      <Calendar
                        key="calendar-view-icon"
                        className="h-4 w-4 mr-2"
                      />
                      <span key="calendar-view-text">Calendar View</span>
                    </Button>
                    <Button
                      key="list-view"
                      variant={jobView === "list" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setJobView("list")}
                    >
                      <List key="list-view-icon" className="h-4 w-4 mr-2" />
                      <span key="list-view-text">List View</span>
                    </Button>
                  </div>

                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium">
                      Select Staff Member:
                    </label>
                    <Select
                      value={selectedStaffFilter}
                      onValueChange={setSelectedStaffFilter}
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="All Staff" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem key="all-staff" value="all">
                          All Staff Members
                        </SelectItem>
                        {staff.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            <div
                              key={`${member.id}-content`}
                              className="flex justify-between items-center w-full"
                            >
                              <span key={`${member.id}-name`}>
                                {member.name}
                              </span>
                              <Badge
                                key={`${member.id}-badge`}
                                variant="secondary"
                                className="ml-2"
                              >
                                {`${jobs.filter((j) => j.assignedTo === member.id).length} jobs`}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Calendar View */}
                {jobView === "calendar" && (
                  <div className="mb-6">
                    <StaffCalendarView
                      jobs={filteredJobs}
                      staff={staff}
                      currentUser={user}
                      showAllStaff={true}
                      selectedStaff={selectedStaff}
                      onStaffSelect={setSelectedStaff}
                      onJobUpdate={handleJobUpdate}
                      onJobTimeChange={(jobId, newStartTime, newEndTime) => {
                        handleJobUpdate(jobId, {
                          dueDate: newStartTime.toISOString(),
                        });
                      }}
                      onCreateJob={(staffId, timeSlot, date) => {
                        const [hours, minutes] = timeSlot
                          .split(":")
                          .map(Number);
                        const jobDateTime = new Date(date);
                        jobDateTime.setHours(hours, minutes, 0, 0);
                        setSelectedJobTime({
                          date: jobDateTime,
                          time: timeSlot,
                        });
                        setShowCreateJob(true);
                      }}
                      onJobClick={handleJobClick}
                    />
                  </div>
                )}

                {/* List View */}
                {jobView === "list" && (
                  <div className="space-y-4">
                    {filteredJobs.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        {searchTerm
                          ? `No jobs found matching "${searchTerm}"`
                          : "No jobs found. Create your first job to get started."}
                      </div>
                    ) : (
                      filteredJobs.map((job) => (
                        <div
                          key={job.id}
                          className="border rounded-lg p-4 space-y-2 cursor-pointer hover:bg-gray-50 transition-colors"
                          onDoubleClick={() => {
                            if (user?.role === "admin") {
                              setSelectedJobForTimeEdit(job);
                              setShowJobTimeEditor(true);
                            } else {
                              handleJobEdit(job);
                            }
                          }}
                          onContextMenu={(e) => handleJobContextMenu(e, job)}
                          title={
                            user?.role === "admin" ||
                            user?.role === "supervisor"
                              ? "Double-click to edit | Right-click for options"
                              : "Double-click to edit job"
                          }
                        >
                          <div className="flex justify-between items-start">
                            <div className="space-y-1">
                              <h3 className="font-medium" title={job.title}>
                                {job.title.length > 12
                                  ? `${job.title.substring(0, 12)}..`
                                  : job.title}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {job.description}
                              </p>
                              <div className="text-xs text-gray-500 space-y-1">
                                {job.claimNo && <p>Claim: {job.claimNo}</p>}
                                {job.insuredName && (
                                  <p>Client: {job.insuredName}</p>
                                )}
                                {job.riskAddress && (
                                  <p>Address: {job.riskAddress}</p>
                                )}
                                {job.excess && (
                                  <p className="text-green-600">
                                    Excess: {job.excess}
                                  </p>
                                )}
                              </div>
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
                          <div className="flex justify-between items-center text-sm text-gray-500">
                            <span>
                              Assigned to:{" "}
                              {staff.find((s) => s.id === job.assignedTo)
                                ?.name || "Unassigned"}
                            </span>
                            <div className="flex items-center space-x-2">
                              <span>
                                {new Date(job.createdAt).toLocaleDateString()}
                              </span>
                              <div className="flex space-x-1">
                                {job.status === "completed" && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleJobPDFDownload(job);
                                    }}
                                    className="text-green-600 border-green-600 hover:bg-green-50"
                                  >
                                    <FileText className="h-3 w-3 mr-1" />
                                    PDF
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleJobEdit(job);
                                  }}
                                >
                                  Edit
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Forms Tab */}
          {user?.role !== "apollo" && (
            <TabsContent key="forms-content" value="forms">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Form Management</CardTitle>
                    <div className="space-x-2">
                      <Button
                        key="create-form"
                        size="sm"
                        onClick={() => setShowCreateForm(true)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create Form
                      </Button>
                      <Button
                        key="generate-from-pdf"
                        size="sm"
                        variant="outline"
                        onClick={() => setShowPDFFormGenerator(true)}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Generate from PDF
                      </Button>
                      <Button
                        key="view-variables"
                        size="sm"
                        variant="outline"
                        onClick={() => setShowFormVariableViewer(true)}
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        View Variables
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Material Forms Templates Section */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4 flex items-center">
                        <Package className="h-5 w-5 mr-2 text-blue-600" />
                        Material Forms Templates
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Material List Template */}
                        <div className="border rounded-lg p-4 hover:bg-blue-50 cursor-pointer transition-colors border-blue-200">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center">
                              <Package className="h-6 w-6 text-blue-600 mr-3" />
                              <div>
                                <h4 className="font-medium text-blue-900">
                                  Material List
                                </h4>
                                <p className="text-sm text-blue-600">
                                  Complete material tracking
                                </p>
                              </div>
                            </div>
                            <Badge
                              variant="secondary"
                              className="bg-blue-100 text-blue-800"
                            >
                              Template
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-600 mb-3">
                            Track standard items, sizes, manufacturers,
                            quantities requested vs used
                          </p>
                          <Button
                            size="sm"
                            className="w-full bg-blue-600 hover:bg-blue-700"
                            onClick={() => {
                              if (jobs.length > 0) {
                                // Open material list for first available job as template
                                setSelectedJobForProgress(jobs[0]);
                                setShowJobProgress(true);
                              }
                            }}
                          >
                            <Package className="h-3 w-3 mr-1" />
                            Use Template
                          </Button>
                        </div>

                        {/* Non Compliance Template */}
                        <div className="border rounded-lg p-4 hover:bg-red-50 cursor-pointer transition-colors border-red-200">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center">
                              <AlertCircle className="h-6 w-6 text-red-600 mr-3" />
                              <div>
                                <h4 className="font-medium text-red-900">
                                  Non Compliance
                                </h4>
                                <p className="text-sm text-red-600">
                                  33-question compliance form
                                </p>
                              </div>
                            </div>
                            <Badge
                              variant="secondary"
                              className="bg-red-100 text-red-800"
                            >
                              Template
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-600 mb-3">
                            Comprehensive compliance assessment from cold vacuum
                            breaker to pipe types
                          </p>
                          <Button
                            size="sm"
                            className="w-full bg-red-600 hover:bg-red-700"
                            onClick={() => {
                              if (jobs.length > 0) {
                                // Open non-compliance form for first available job as template
                                setSelectedJobForProgress(jobs[0]);
                                setShowJobProgress(true);
                              }
                            }}
                          >
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Use Template
                          </Button>
                        </div>

                        {/* Enhanced Liability Template */}
                        <div className="border rounded-lg p-4 hover:bg-green-50 cursor-pointer transition-colors border-green-200">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center">
                              <Shield className="h-6 w-6 text-green-600 mr-3" />
                              <div>
                                <h4 className="font-medium text-green-900">
                                  Enhanced Liability
                                </h4>
                                <p className="text-sm text-green-600">
                                  Before/after assessment
                                </p>
                              </div>
                            </div>
                            <Badge
                              variant="secondary"
                              className="bg-green-100 text-green-800"
                            >
                              Template
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-600 mb-3">
                            8 primary assessment items, 7 before/after
                            comparison sections
                          </p>
                          <Button
                            size="sm"
                            className="w-full bg-green-600 hover:bg-green-700"
                            onClick={() => {
                              if (jobs.length > 0) {
                                // Open liability form for first available job as template
                                setSelectedJobForProgress(jobs[0]);
                                setShowJobProgress(true);
                              }
                            }}
                          >
                            <Shield className="h-3 w-3 mr-1" />
                            Use Template
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Standard Forms Section */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4 flex items-center">
                        <FileText className="h-5 w-5 mr-2 text-gray-600" />
                        Standard Forms
                      </h3>
                      <div className="space-y-4">
                        {forms.length === 0 ? (
                          <div className="text-center py-8 text-gray-500">
                            No forms found. Create your first form to get
                            started.
                          </div>
                        ) : (
                          forms.map((form) => (
                            <div
                              key={form.id}
                              className="border rounded-lg p-4 space-y-2 cursor-pointer hover:bg-gray-50 transition-colors"
                              onClick={() => handleFormEdit(form)}
                              title="Click to view and edit form details"
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <h3 className="font-medium">{form.name}</h3>
                                  <p className="text-sm text-gray-600">
                                    {form.description}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {form.fields.length} fields
                                  </p>
                                </div>
                                <div className="flex space-x-2">
                                  {form.isTemplate && (
                                    <Badge variant="secondary">Template</Badge>
                                  )}
                                  <Badge variant="outline">
                                    {form.restrictedToCompanies?.length === 0
                                      ? "All Companies"
                                      : `${form.restrictedToCompanies?.length || 0} Companies`}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Job-Sectioned Forms Display */}
                  <div className="mt-8">
                    <h3 className="text-lg font-semibold mb-4">Forms by Job</h3>
                    <div className="space-y-4">
                      {jobs.map((job) => {
                        const jobSubmissions = submissions.filter(
                          (sub) => sub.jobId === job.id,
                        );
                        if (jobSubmissions.length === 0) return null;

                        return (
                          <Card
                            key={job.id}
                            className="border-l-4 border-l-blue-500"
                          >
                            <CardHeader className="pb-3">
                              <div className="flex justify-between items-start">
                                <div>
                                  <CardTitle className="text-lg">
                                    {job.title}
                                  </CardTitle>
                                  <div className="flex gap-2 mt-2">
                                    <Badge
                                      key={`${job.id}-claim`}
                                      variant="outline"
                                    >
                                      {job.claimNo || job.ClaimNo}
                                    </Badge>
                                    <Badge
                                      key={`${job.id}-status`}
                                      variant={
                                        job.status === "completed"
                                          ? "default"
                                          : "secondary"
                                      }
                                    >
                                      {job.status}
                                    </Badge>
                                  </div>
                                </div>
                                <div className="text-right text-sm text-gray-600">
                                  <div key={`${job.id}-insured`}>
                                    {job.insuredName || job.InsuredName}
                                  </div>
                                  <div key={`${job.id}-scheduled`}>
                                    {new Date(
                                      job.scheduledDate,
                                    ).toLocaleDateString()}
                                  </div>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-3">
                                <h4 className="font-medium text-sm">
                                  Form Submissions ({jobSubmissions.length})
                                </h4>
                                <div className="grid gap-2">
                                  {jobSubmissions.map((submission) => (
                                    <div
                                      key={submission.id}
                                      className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                                    >
                                      <div className="flex items-center gap-3">
                                        <FileText
                                          key={`${submission.id}-icon`}
                                          className="h-4 w-4 text-blue-600"
                                        />
                                        <div key={`${submission.id}-content`}>
                                          <div
                                            key={`${submission.id}-name`}
                                            className="font-medium text-sm"
                                          >
                                            {submission.formId ===
                                            "noncompliance-form"
                                              ? "Noncompliance Form"
                                              : submission.formId ===
                                                  "material-list-form"
                                                ? "Material List"
                                                : forms.find(
                                                    (f) =>
                                                      f.id ===
                                                      submission.formId,
                                                  )?.name || "Unknown Form"}
                                          </div>
                                          <div
                                            key={`${submission.id}-date`}
                                            className="text-xs text-gray-600"
                                          >
                                            Submitted:{" "}
                                            {new Date(
                                              submission.submissionDate,
                                            ).toLocaleDateString()}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex gap-2">
                                        <Button
                                          key={`${submission.id}-download`}
                                          size="sm"
                                          variant="outline"
                                          onClick={() =>
                                            handleDownloadFormPDF(submission)
                                          }
                                          className="text-xs"
                                        >
                                          Download PDF
                                        </Button>
                                        <Button
                                          key={`${submission.id}-details`}
                                          size="sm"
                                          variant="ghost"
                                          className="text-xs"
                                        >
                                          View Details
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                      {jobs.filter((job) =>
                        submissions.some((sub) => sub.jobId === job.id),
                      ).length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                          <p>No form submissions found for any jobs yet.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Staff Tab - Only for staff and supervisors */}
          <TabsContent key="staff-content" value="staff">
            <Card>
              <CardHeader>
                <CardTitle>Staff Management</CardTitle>
                <p className="text-sm text-gray-600">
                  {user?.role === "supervisor"
                    ? "View and manage staff (limited permissions)"
                    : "View and manage staff members"}
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {staff.map((member) => (
                    <div
                      key={member.id}
                      className="border rounded-lg p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => handleUserClick(member)}
                      title="Click to view staff profile and details"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-medium">{member.name}</h3>
                          <p className="text-sm text-gray-600">
                            {member.email}
                          </p>
                          <p className="text-xs text-gray-500">
                            @{member.username}
                          </p>
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <Badge variant="outline">{member.role}</Badge>
                        <p className="text-xs text-gray-500">
                          {`${jobs.filter((j) => j.assignedTo === member.id).length} active jobs`}
                        </p>
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{
                              width: `${Math.min(100, (jobs.filter((j) => j.assignedTo === member.id && j.status === "completed").length / Math.max(1, jobs.filter((j) => j.assignedTo === member.id).length)) * 100)}%`,
                            }}
                          />
                        </div>
                        <p className="text-xs text-green-600">
                          {`${jobs.filter((j) => j.assignedTo === member.id && j.status === "completed").length} completed`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Companies Tab - Restricted for supervisors */}
          {user?.role !== "apollo" && (
            <TabsContent key="companies-content" value="companies">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Company Management</CardTitle>
                    {user?.role === "admin" ? (
                      <Button
                        size="sm"
                        onClick={() => setShowCreateCompany(true)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Company
                      </Button>
                    ) : (
                      <Badge variant="secondary">View Only</Badge>
                    )}
                  </div>
                  {user?.role === "supervisor" && (
                    <p className="text-sm text-amber-600">
                      You have read-only access to company information
                    </p>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {companies.map((company) => (
                      <div
                        key={company.id}
                        className="border rounded-lg p-4 flex justify-between items-center hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => handleCompanyManage(company)}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-medium">{company.name}</h3>
                            <p className="text-sm text-gray-600">
                              {`${jobs.filter((j) => j.companyId === company.id).length} active jobs`}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCompanyManage(company);
                          }}
                        >
                          Manage
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Schedule Tab */}
          <TabsContent key="schedule-content" value="schedule">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">
                  Staff Schedule Management
                </h2>
                {user?.role === "admin" && (
                  <Button
                    onClick={() => setShowEnhancedShiftManagement(true)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Enhanced Shift Management
                  </Button>
                )}
              </div>
              <StaffScheduleManager
                jobs={jobs}
                staff={staff}
                currentUser={user!}
              />
            </div>
          </TabsContent>

          {/* Salary Tab */}
          <TabsContent key="salary-content" value="salary">
            <StaffSalaryTracker jobs={jobs} staff={staff} currentUser={user!} />
          </TabsContent>

          {/* Materials Tab */}
          {user?.role !== "apollo" && (
            <TabsContent key="materials-content" value="materials">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Materials & Advanced Forms Management</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="material-lists" className="w-full">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger
                          key="material-lists"
                          value="material-lists"
                        >
                          Material Lists
                        </TabsTrigger>
                        <TabsTrigger key="noncompliance" value="noncompliance">
                          Noncompliance Forms
                        </TabsTrigger>
                        <TabsTrigger key="liability" value="liability">
                          Enhanced Liability
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent
                        key="material-lists-content"
                        value="material-lists"
                        className="mt-6"
                      >
                        {jobs.length > 0 ? (
                          <MaterialListManager
                            job={jobs[0]}
                            onMaterialListSave={(materialList) => {
                              console.log("Material list saved:", materialList);
                              // In real implementation: save to backend
                            }}
                          />
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            Select a job to manage materials
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent
                        key="noncompliance-content"
                        value="noncompliance"
                        className="mt-6"
                      >
                        {jobs.length > 0 ? (
                          <NoncomplianceForm
                            job={jobs[0]}
                            assignedStaff={
                              staff.find((s) => s.id === jobs[0].assignedTo) ||
                              null
                            }
                            onSubmit={(formData) => {
                              console.log(
                                "Noncompliance form submitted:",
                                formData,
                              );
                              // In real implementation: save to backend
                            }}
                          />
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            Select a job to create noncompliance form
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent
                        key="liability-content"
                        value="liability"
                        className="mt-6"
                      >
                        {jobs.length > 0 ? (
                          <EnhancedLiabilityForm
                            job={jobs[0]}
                            assignedStaff={
                              staff.find((s) => s.id === jobs[0].assignedTo) ||
                              null
                            }
                            onSubmit={(formData) => {
                              console.log(
                                "Enhanced liability form submitted:",
                                formData,
                              );
                              // In real implementation: save to backend
                            }}
                          />
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            Select a job to create enhanced liability form
                          </div>
                        )}
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          )}

          {/* Clients Tab */}
          <TabsContent key="clients-content" value="clients">
            <ClientManagement jobs={jobs} />
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent key="analytics-content" value="analytics">
            <div className="space-y-6">
              <AnalyticsDashboard jobs={jobs} staff={staff} />
              <MongoSyncStatus />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modals */}
      <CreateJobModal
        open={showCreateJob}
        onOpenChange={(open) => {
          setShowCreateJob(open);
          if (!open) setSelectedJobTime(null);
        }}
        onJobCreated={fetchData}
        selectedJobTime={selectedJobTime}
      />

      <CreateFormModal
        open={showCreateForm}
        onOpenChange={setShowCreateForm}
        onFormCreated={fetchData}
      />

      <CreateCompanyModal
        open={showCreateCompany}
        onOpenChange={setShowCreateCompany}
        onCompanyCreated={fetchData}
      />

      <StaffProfileModal
        open={showUserManagement}
        onOpenChange={setShowUserManagement}
        staffMember={selectedUser}
        jobs={jobs}
        onProfileUpdated={fetchData}
      />

      <JobEditModal
        open={showJobEdit}
        onOpenChange={(open) => {
          setShowJobEdit(open);
          if (!open) setSelectedJob(null);
        }}
        job={selectedJob}
        onJobUpdated={fetchData}
      />

      <JobCreationCalendarModal
        open={showCalendarJobCreation}
        onOpenChange={setShowCalendarJobCreation}
        staff={staff}
        jobs={jobs}
        onCreateJobWithTime={handleCreateJobWithTime}
      />

      <CompanyManagementModal
        open={showCompanyManagement}
        onOpenChange={(open) => {
          setShowCompanyManagement(open);
          if (!open) setSelectedCompany(null);
        }}
        company={selectedCompany}
        onCompanyUpdated={fetchData}
      />

      <FormEditModal
        open={showFormEdit}
        onOpenChange={(open) => {
          setShowFormEdit(open);
          if (!open) setSelectedForm(null);
        }}
        form={selectedForm}
        onFormUpdated={fetchData}
        isAdmin={user?.role === "admin"}
      />

      <PDFFormGenerator
        open={showPDFFormGenerator}
        onOpenChange={setShowPDFFormGenerator}
        onFormCreated={fetchData}
      />

      <DeletionConfirmModal
        open={showDeletionConfirm}
        onOpenChange={setShowDeletionConfirm}
        title={`Delete ${deletionItem?.type === "staff" ? "Staff Member" : "Company"}`}
        description={`You are about to permanently delete this ${deletionItem?.type}. This action cannot be undone and may affect existing jobs and data.`}
        itemName={deletionItem?.name || ""}
        onConfirm={async () => {
          if (!deletionItem) return;

          const token = localStorage.getItem("auth_token");
          const headers: Record<string, string> = {};
          if (token) {
            headers.Authorization = `Bearer ${token}`;
          }

          const endpoint =
            deletionItem.type === "staff"
              ? `/api/auth/users/${deletionItem.id}`
              : `/api/companies/${deletionItem.id}`;

          const response = await fetch(endpoint, {
            method: "DELETE",
            headers,
          });

          if (response.ok) {
            fetchData();
          } else {
            throw new Error("Failed to delete");
          }
        }}
      />

      <JobTimeEditor
        open={showJobTimeEditor}
        onOpenChange={(open) => {
          setShowJobTimeEditor(open);
          if (!open) setSelectedJobForTimeEdit(null);
        }}
        job={selectedJobForTimeEdit}
        onJobUpdated={fetchData}
      />

      <JobProgressModal
        job={selectedJobForProgress}
        isOpen={showJobProgress}
        onClose={() => {
          setShowJobProgress(false);
          setSelectedJobForProgress(null);
        }}
        staff={staff}
      />

      <EnhancedShiftManagement
        open={showEnhancedShiftManagement}
        onOpenChange={setShowEnhancedShiftManagement}
        staff={staff}
        currentUser={user!}
        onShiftUpdate={(assignments) => {
          console.log("Shift assignments updated:", assignments);
          // In real implementation: save to backend
          fetchData(); // Refresh data
        }}
      />

      <StaffViewPortal
        open={showStaffViewPortal}
        onOpenChange={setShowStaffViewPortal}
        jobs={jobs}
        staff={staff}
        currentUser={user}
      />

      <JobDuplicationModal
        open={showJobDuplication}
        onOpenChange={setShowJobDuplication}
        job={jobToDuplicate}
        staff={staff}
        onDuplicate={(originalJob, newDate, newStaffId) => {
          const duplicatedJob = {
            ...originalJob,
            id: `job-${Date.now()}`,
            dueDate: newDate.toISOString(),
            assignedTo: newStaffId || originalJob.assignedTo,
            status: "pending" as const,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          setJobs((prev) => [...prev, duplicatedJob]);
          setJobToDuplicate(null);
        }}
      />

      <AdminPDFManagement
        open={showAdminPDFManagement}
        onOpenChange={setShowAdminPDFManagement}
      />

      {/* Form Variable Viewer Modal */}
      {showFormVariableViewer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-7xl w-full max-h-[90vh] overflow-auto">
            <FormVariableViewer
              onClose={() => setShowFormVariableViewer(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
