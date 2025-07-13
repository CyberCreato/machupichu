import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Save, User, Building, FileText } from "lucide-react";
import { Job, Form, User as UserType, FormField } from "@shared/types";
import { SignaturePad } from "@/components/SignaturePad";

export default function FormFillPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // Get jobId and formId from either state or URL params
  const urlParams = new URLSearchParams(location.search);
  const stateParams = (location.state as any) || {};

  const jobId = stateParams.jobId || urlParams.get("jobId");
  const formId = stateParams.formId || urlParams.get("formId");

  const [job, setJob] = useState<Job | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [staff, setStaff] = useState<UserType[]>([]);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [signature, setSignature] = useState<string>("");

  useEffect(() => {
    if (jobId && formId) {
      fetchData();
    } else {
      setError("Missing job or form information");
      setLoading(false);
    }
  }, [jobId, formId]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const [jobRes, formRes, staffRes] = await Promise.all([
        fetch(`/api/jobs?id=${jobId}`, { headers }),
        fetch(`/api/forms/${formId}`, { headers }),
        fetch("/api/auth/users", { headers }),
      ]);

      const [jobsData, formData, staffData] = await Promise.all([
        jobRes.json(),
        formRes.json(),
        staffRes.json(),
      ]);

      const jobDetails = Array.isArray(jobsData)
        ? jobsData.find((j) => j.id === jobId)
        : jobsData;

      if (!jobDetails) {
        throw new Error("Job not found");
      }

      setJob(jobDetails);
      setForm(formData);
      setStaff(staffData.filter((u: UserType) => u.role === "staff"));

      // Auto-fill form data with job and staff information
      const autoFilledData: Record<string, any> = {};

      // Pre-fill known data from job
      formData.fields.forEach((field: FormField) => {
        const fieldLabel = field.label.toLowerCase();
        const fieldId = field.id;

        // Staff information auto-fill
        const assignedStaff = staffData.find(
          (s: UserType) => s.id === jobDetails.assignedTo,
        );
        if (assignedStaff) {
          if (
            fieldLabel.includes("staff") ||
            fieldLabel.includes("technician") ||
            fieldLabel.includes("inspector") ||
            fieldLabel.includes("plumber")
          ) {
            autoFilledData[fieldId] = assignedStaff.name;
          }
          if (
            fieldLabel.includes("staff email") ||
            fieldLabel.includes("technician email")
          ) {
            autoFilledData[fieldId] = assignedStaff.email;
          }
        }

        // Company/Insurance auto-fill
        if (
          fieldLabel.includes("company") ||
          fieldLabel.includes("insurance")
        ) {
          autoFilledData[fieldId] =
            jobDetails.underwriter ||
            jobDetails.Underwriter ||
            "Insurance Company";
        }

        // Client information auto-fill
        if (fieldLabel.includes("client") || fieldLabel.includes("insured")) {
          if (fieldLabel.includes("name")) {
            autoFilledData[fieldId] =
              jobDetails.insuredName || jobDetails.InsuredName || "";
          }
          if (fieldLabel.includes("email")) {
            autoFilledData[fieldId] =
              jobDetails.insEmail || jobDetails.Email || "";
          }
          if (fieldLabel.includes("phone") || fieldLabel.includes("cell")) {
            autoFilledData[fieldId] =
              jobDetails.insCell || jobDetails.InsCell || "";
          }
        }

        // Address auto-fill
        if (fieldLabel.includes("address") || fieldLabel.includes("location")) {
          autoFilledData[fieldId] =
            jobDetails.riskAddress || jobDetails.RiskAddress || "";
        }

        // Job-specific information
        if (fieldLabel.includes("claim")) {
          if (fieldLabel.includes("number") || fieldLabel.includes("no")) {
            autoFilledData[fieldId] =
              jobDetails.claimNo || jobDetails.ClaimNo || "";
          }
        }
        if (fieldLabel.includes("policy")) {
          if (fieldLabel.includes("number") || fieldLabel.includes("no")) {
            autoFilledData[fieldId] =
              jobDetails.policyNo || jobDetails.PolicyNo || "";
          }
        }
        if (fieldLabel.includes("excess")) {
          autoFilledData[fieldId] =
            jobDetails.excess || jobDetails.Excess || "";
        }
        if (fieldLabel.includes("underwriter")) {
          autoFilledData[fieldId] =
            jobDetails.underwriter || jobDetails.Underwriter || "";
        }
        if (fieldLabel.includes("branch")) {
          autoFilledData[fieldId] =
            jobDetails.branch || jobDetails.Branch || "";
        }
        if (fieldLabel.includes("broker")) {
          autoFilledData[fieldId] =
            jobDetails.broker || jobDetails.Broker || "";
        }

        // Description and notes
        if (
          fieldLabel.includes("description") ||
          fieldLabel.includes("details")
        ) {
          autoFilledData[fieldId] = jobDetails.description || "";
        }

        // Date fields
        if (fieldLabel.includes("date")) {
          if (fieldLabel.includes("incident")) {
            autoFilledData[fieldId] = jobDetails.incidentDate || "";
          } else if (
            fieldLabel.includes("inspection") ||
            fieldLabel.includes("appointment")
          ) {
            autoFilledData[fieldId] = jobDetails.dueDate
              ? new Date(jobDetails.dueDate).toISOString().split("T")[0]
              : "";
          }
        }

        // Try to fill from any matching parsed data
        Object.entries(jobDetails).forEach(([key, value]) => {
          if (typeof value === "string" || typeof value === "number") {
            const keyLower = key.toLowerCase();
            if (
              fieldLabel.includes(keyLower) ||
              keyLower.includes(fieldLabel)
            ) {
              if (!autoFilledData[fieldId]) {
                autoFilledData[fieldId] = value;
              }
            }
          }
        });
      });

      setFormData(autoFilledData);
    } catch (error) {
      setError("Failed to load form data");
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [fieldId]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    // Validate signature
    if (!signature || signature.trim() === "") {
      setError("Please provide your signature before submitting the form.");
      setSaving(false);
      return;
    }

    try {
      const token = localStorage.getItem("auth_token");
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch("/api/form-submissions", {
        method: "POST",
        headers,
        body: JSON.stringify({
          jobId,
          formId,
          data: {
            ...formData,
            signature: signature,
            submissionTimestamp: new Date().toISOString(),
          },
        }),
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          navigate(-1); // Go back to previous page
        }, 2000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to submit form");
      }
    } catch (error) {
      setError("Network error occurred");
    } finally {
      setSaving(false);
    }
  };

  const renderField = (field: FormField) => {
    const value = formData[field.id] || "";
    const hasValue = value && value.toString().trim() !== "";

    // Only show fields that don't have auto-filled data or are required
    if (hasValue && !field.required) {
      return (
        <div key={field.id} className="space-y-2">
          <Label htmlFor={field.id} className="text-green-700">
            {field.label} {field.required && "*"}
          </Label>
          <div className="p-2 bg-green-50 border border-green-200 rounded-md">
            <span className="text-green-800 font-medium">{value}</span>
            <Badge variant="secondary" className="ml-2 text-xs">
              Auto-filled
            </Badge>
          </div>
        </div>
      );
    }

    return (
      <div key={field.id} className="space-y-2">
        <Label htmlFor={field.id}>
          {field.label} {field.required && "*"}
        </Label>

        {field.type === "textarea" ? (
          <Textarea
            id={field.id}
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
          />
        ) : field.type === "select" ? (
          <Select
            value={value}
            onValueChange={(val) => handleFieldChange(field.id, val)}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={`Select ${field.label.toLowerCase()}`}
              />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : field.type === "checkbox" ? (
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id={field.id}
              checked={value}
              onChange={(e) => handleFieldChange(field.id, e.target.checked)}
              className="rounded border-gray-300"
            />
            <Label htmlFor={field.id}>{field.label}</Label>
          </div>
        ) : (
          <Input
            id={field.id}
            type={field.type}
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
          />
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading form...</p>
        </div>
      </div>
    );
  }

  if (error && !job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <div className="flex items-center space-x-4 mb-4">
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Building className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Fill Form</h1>
              <p className="text-gray-600">{form?.name || "Form"}</p>
            </div>
          </div>
        </div>

        {/* Job Information Card */}
        {job && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Job Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium">Title:</span> {job.title}
                </div>
                <div>
                  <span className="font-medium">Client:</span>{" "}
                  {job.insuredName || job.InsuredName || "N/A"}
                </div>
                <div>
                  <span className="font-medium">Claim No:</span>{" "}
                  {job.claimNo || job.ClaimNo || "N/A"}
                </div>
                <div>
                  <span className="font-medium">Policy No:</span>{" "}
                  {job.policyNo || job.PolicyNo || "N/A"}
                </div>
                <div>
                  <span className="font-medium">Address:</span>{" "}
                  {job.riskAddress || job.RiskAddress || "N/A"}
                </div>
                <div>
                  <span className="font-medium">Staff:</span>{" "}
                  {staff.find((s) => s.id === job.assignedTo)?.name ||
                    "Unassigned"}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Success Message */}
        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <AlertDescription className="text-green-800">
              Form submitted successfully! Redirecting back...
            </AlertDescription>
          </Alert>
        )}

        {/* Error Message */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Form */}
        {form && (
          <Card>
            <CardHeader>
              <CardTitle>Form Details</CardTitle>
              <p className="text-gray-600">
                Fields marked with green are auto-filled from job data. Complete
                the remaining fields.
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {form.fields.map((field) => renderField(field))}
                </div>

                {/* Signature Section */}
                <div className="mt-8 pt-6 border-t">
                  <SignaturePad
                    onSignatureChange={setSignature}
                    width={400}
                    height={150}
                  />
                </div>

                <div className="flex justify-between items-center pt-6 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={async () => {
                      if (!form) return;
                      try {
                        const response = await fetch(
                          `/api/forms/${form.id}/pdf`,
                          {
                            method: "POST",
                            headers: {
                              "Content-Type": "application/json",
                              ...(localStorage.getItem("auth_token")
                                ? {
                                    Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
                                  }
                                : {}),
                            },
                            body: JSON.stringify({
                              ...formData,
                              signature: signature,
                              jobId: jobId,
                            }),
                          },
                        );
                        if (response.ok) {
                          const blob = await response.blob();
                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = `${form.name}-${job?.claimNo || job?.ClaimNo || "form"}.pdf`;
                          document.body.appendChild(a);
                          a.click();
                          window.URL.revokeObjectURL(url);
                          document.body.removeChild(a);
                        }
                      } catch (error) {
                        console.error("Error generating PDF:", error);
                      }
                    }}
                    className="flex items-center"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Generate PDF
                  </Button>
                  <div className="flex space-x-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate(-1)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={saving}>
                      {saving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Submit Form
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
