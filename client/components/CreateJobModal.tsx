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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Company, Form, CreateJobRequest } from "@shared/types";
import { Loader2, Upload, FileText } from "lucide-react";
import { parseJobText, type ParsedJobData } from "@/utils/textParser";

interface CreateJobModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onJobCreated: () => void;
  selectedJobTime?: {
    time: string;
    date: Date | string;
    staffId?: string;
  } | null;
}

export function CreateJobModal({
  open,
  onOpenChange,
  onJobCreated,
  selectedJobTime,
}: CreateJobModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [staff, setStaff] = useState<User[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [forms, setForms] = useState<Form[]>([]);
  const [parsedData, setParsedData] = useState<any>(null);

  const [jobData, setJobData] = useState<CreateJobRequest>({
    title: "",
    description: "",
    assignedTo: "",
    priority: "medium",
    dueDate: new Date().toISOString().split("T")[0], // Default to today
    category: undefined,
    categoryOther: "",
  });

  const [rawText, setRawText] = useState("");
  const [parseLoading, setParseLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("manual");

  useEffect(() => {
    if (open) {
      fetchData();
      // Reset states when modal opens
      setError(null);
      setParsedData(null);
      setRawText("");
      setActiveTab("manual");

      // Set initial data from selectedJobTime if provided
      if (selectedJobTime) {
        // Handle both Date object and string formats
        const dateObj =
          typeof selectedJobTime.date === "string"
            ? new Date(selectedJobTime.date)
            : selectedJobTime.date;
        const scheduledDate = dateObj.toISOString().split("T")[0];
        const scheduledTime = selectedJobTime.time;

        setJobData((prev) => ({
          ...prev,
          dueDate: scheduledDate,
          title: prev.title || `Job scheduled for ${scheduledTime}`,
          // Use the staff ID from selectedJobTime if available
          assignedTo: selectedJobTime.staffId || prev.assignedTo,
        }));
      }
    }
  }, [open, selectedJobTime]);

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

  const handleParseText = async () => {
    if (!rawText.trim()) return;

    setParseLoading(true);
    try {
      // Use the enhanced local parser
      const parsed = parseJobText(rawText);
      setParsedData(parsed);

      // Auto-fill job data from parsed fields - handle both old and new field names
      const clientName =
        parsed.InsuredName || parsed.insuredName || parsed.clientName || "";
      const clientEmail =
        parsed.Email ||
        parsed.insEmail ||
        parsed.clientEmail ||
        parsed.email ||
        "";
      const clientPhone =
        parsed.InsCell || parsed.insCell || parsed.clientPhone || "";
      const serviceAddress =
        parsed.RiskAddress || parsed.riskAddress || parsed.serviceAddress || "";
      const policyNumber =
        parsed.PolicyNo || parsed.policyNo || parsed.policyNumber || "";
      const claimNumber =
        parsed.ClaimNo || parsed.claimNo || parsed.refNumber || "";

      // Check if job already exists
      if (claimNumber || policyNumber) {
        try {
          const token = localStorage.getItem("auth_token");
          const headers = token ? { Authorization: `Bearer ${token}` } : {};

          const checkParams = new URLSearchParams();
          if (claimNumber) checkParams.append("claimNo", claimNumber);
          if (policyNumber) checkParams.append("policyNo", policyNumber);

          const checkResponse = await fetch(
            `/api/jobs/check-exists?${checkParams}`,
            { headers },
          );
          const checkData = await checkResponse.json();

          if (checkData.exists) {
            const shouldUpdate = confirm(
              `A job with ${claimNumber ? `Claim No: ${claimNumber}` : `Policy No: ${policyNumber}`} already exists.\n\n` +
                `Existing job: ${checkData.job.title}\n` +
                `Do you want to update the existing job instead of creating a new one?`,
            );

            if (shouldUpdate) {
              setError(
                "Please use the Edit function for existing jobs. This modal is for creating new jobs only.",
              );
              setParseLoading(false);
              return;
            }
          }
        } catch (error) {
          console.warn("Could not check for existing jobs:", error);
        }
      }

      // Generate job title using Claim Number and Client Name or Policy Number
      let title = "";
      if (claimNumber && clientName) {
        title = `${claimNumber} - ${clientName}`;
      } else if (claimNumber) {
        title = claimNumber;
      } else if (policyNumber && clientName) {
        title = `${policyNumber} - ${clientName}`;
      } else if (policyNumber) {
        title = policyNumber;
      } else if (clientName) {
        title = clientName;
      } else {
        title = "New Claim";
      }

      const description =
        parsed.description ||
        `${parsed.Section || parsed.section || "General"} ${parsed.Peril || parsed.peril || "claim"}${
          parsed.descriptionOfLoss
            ? ` - ${parsed.descriptionOfLoss.substring(0, 200)}${parsed.descriptionOfLoss.length > 200 ? "..." : ""}`
            : ""
        }`.trim();

      // Auto-detect company based on parsed text
      let companyId = "";
      const textToSearch = rawText.toLowerCase();

      if (textToSearch.includes("absa")) {
        companyId =
          companies.find((c) => c.name.toLowerCase().includes("absa"))?.id ||
          "";
      } else if (textToSearch.includes("sahl")) {
        companyId =
          companies.find((c) => c.name.toLowerCase().includes("sahl"))?.id ||
          "";
      } else {
        companyId =
          companies.find((c) => c.name.toLowerCase().includes("discovery"))
            ?.id || "";
      }

      setJobData((prev) => ({
        ...prev,
        title,
        description,
        companyId,
        priority:
          (parsed.Excess || parsed.excess) &&
          (parsed.Excess || parsed.excess).toLowerCase().includes("urgent")
            ? "high"
            : "medium",
        dueDate: new Date().toISOString().split("T")[0], // Default to today
      }));

      // Auto-switch to manual tab to show populated fields
      setActiveTab("manual");
    } catch (error) {
      console.error("Parsing error:", error);
      setError("Failed to parse job text");
    } finally {
      setParseLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate required fields
    if (!jobData.title.trim()) {
      setError("Job title is required");
      setLoading(false);
      return;
    }

    try {
      // If we have selectedJobTime, make sure the dueDate includes the time
      let finalJobData = { ...jobData };
      if (selectedJobTime && jobData.dueDate) {
        const [hours, minutes] = selectedJobTime.time.split(":").map(Number);
        const dueDateTime = new Date(jobData.dueDate);
        dueDateTime.setHours(hours, minutes, 0, 0);
        finalJobData.dueDate = dueDateTime.toISOString();
      }

      const requestData = {
        ...finalJobData,
        rawText: rawText || undefined,
      };

      const token = localStorage.getItem("auth_token");
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch("/api/jobs", {
        method: "POST",
        headers,
        body: JSON.stringify(requestData),
      });

      if (response.ok) {
        onJobCreated();
        onOpenChange(false);
        // Reset form
        setJobData({
          title: "",
          description: "",
          assignedTo: "",
          priority: "medium",
          dueDate: new Date().toISOString().split("T")[0], // Default to today
        });
        setRawText("");
        setParsedData(null);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to create job");
      }
    } catch (error) {
      setError("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Job</DialogTitle>
          <DialogDescription>
            Create a new job assignment or paste job data to auto-parse
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual">Manual Entry</TabsTrigger>
            <TabsTrigger value="parse">Parse Job Text</TabsTrigger>
          </TabsList>

          <TabsContent value="parse" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rawText">Job Text Data</Label>
              <Textarea
                id="rawText"
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder={`Paste job appointment text here in any of these formats:

SERVICE PROVIDER FORMAT:
Service Provider Appointment
ClaimNo	5586306	PolicyNo	PL-HOC6525797942/03
SPM No	SPM 2393953/6/25	Underwriter	ABSA Insurance Company Limited
Branch	HOC	Broker	ABSA HOC
ClaimSpecialist	Shakirah Hussain	Email	andrew.garven@outlook.com
Risk Address	71 ASCOT, KRAAIFONTEIN, WINDSOR ESTATE, 7570

CLAIM NOTIFICATION FORMAT:
Claim Appointment Notification Details
ClaimNo	CL4469957	PolicyNo	7912642
SPM No	SPM 259868/6/25	Underwriter	SAHL Insurance Company Ltd
Branch	SA Home Loans	Broker	SAHL Insurance Company Ltd
ClaimSpecialist	NDUMISOC	Email	ndumisoc@sahomeloans.com
Risk Address	132 KAYBURNE AVENUE RANDPARK RIDGE, RANDBURG 2169

SIMPLE FORMAT:
Claim: 3801751
Client: Bradley Lester Stevens
Contact: 0614830672
Address: 43 Callington Crescent, Parklands, Milnerton
Email: bls.brad@gmail.com
Excess: R0.00

The system will automatically extract and populate all relevant fields!`}
                className="min-h-[200px]"
              />
            </div>

            <Button
              type="button"
              onClick={handleParseText}
              disabled={!rawText.trim() || parseLoading}
              className="w-full"
            >
              {parseLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Parsing...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Parse Job Data
                </>
              )}
            </Button>

            {parsedData && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-medium text-green-800 mb-2">
                  Parsed Data Preview
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {Object.entries(parsedData).map(([key, value]) => (
                    <div key={key}>
                      <span className="font-medium capitalize">
                        {key.replace(/([A-Z])/g, " $1").trim()}:
                      </span>{" "}
                      <span className="text-gray-700">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="manual">
            {parsedData && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-3 flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  Parsed Job Data (Auto-filled below)
                </h4>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  {Object.entries(parsedData)
                    .filter(([_, value]) => value && String(value).trim())
                    .map(([key, value]) => (
                      <div key={key} className="flex">
                        <span className="font-medium text-blue-700 min-w-[120px] capitalize">
                          {key.replace(/([A-Z])/g, " $1").trim()}:
                        </span>
                        <span className="text-gray-700 break-words">
                          {String(value)}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}

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
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={jobData.priority}
                    onValueChange={(value: "low" | "medium" | "high") =>
                      setJobData({ ...jobData, priority: value })
                    }
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

                <div className="space-y-2">
                  <Label htmlFor="category">Job Category</Label>
                  <Select
                    value={jobData.category || ""}
                    onValueChange={(value) =>
                      setJobData({
                        ...jobData,
                        category: value as any,
                        categoryOther:
                          value !== "Other" ? "" : jobData.categoryOther,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select job category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem
                        key="geyser-assessment"
                        value="Geyser Assessment"
                      >
                        Geyser Assessment
                      </SelectItem>
                      <SelectItem
                        key="geyser-replacement"
                        value="Geyser Replacement"
                      >
                        Geyser Replacement
                      </SelectItem>
                      <SelectItem key="leak-detection" value="Leak Detection">
                        Leak Detection
                      </SelectItem>
                      <SelectItem key="drain-blockage" value="Drain Blockage">
                        Drain Blockage
                      </SelectItem>
                      <SelectItem
                        key="camera-inspection"
                        value="Camera Inspection"
                      >
                        Camera Inspection
                      </SelectItem>
                      <SelectItem key="toilet-shower" value="Toilet/Shower">
                        Toilet/Shower
                      </SelectItem>
                      <SelectItem key="other" value="Other">
                        Other
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {jobData.category === "Other" && (
                <div className="space-y-2">
                  <Label htmlFor="categoryOther">Specify Category</Label>
                  <Input
                    id="categoryOther"
                    value={jobData.categoryOther || ""}
                    onChange={(e) =>
                      setJobData({ ...jobData, categoryOther: e.target.value })
                    }
                    placeholder="Please specify the job category"
                    required
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={jobData.description}
                  onChange={(e) =>
                    setJobData({ ...jobData, description: e.target.value })
                  }
                  placeholder="Enter job description"
                  required
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
                  <Label htmlFor="companyId">Company (Optional)</Label>
                  <Select
                    value={jobData.companyId || ""}
                    onValueChange={(value) =>
                      setJobData({
                        ...jobData,
                        companyId: value || undefined,
                      })
                    }
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
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="formId">Attach Form (Optional)</Label>
                  <Select
                    value={jobData.formId || ""}
                    onValueChange={(value) =>
                      setJobData({ ...jobData, formId: value || undefined })
                    }
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
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date (Optional)</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={jobData.dueDate || ""}
                    onChange={(e) =>
                      setJobData({
                        ...jobData,
                        dueDate: e.target.value || undefined,
                      })
                    }
                  />
                </div>
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
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <FileText className="mr-2 h-4 w-4" />
                      Create Job
                    </>
                  )}
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
