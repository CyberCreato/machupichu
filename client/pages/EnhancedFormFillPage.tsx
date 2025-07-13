import React, { useState, useEffect, useCallback } from "react";
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
import {
  ArrowLeft,
  Save,
  User,
  Building,
  Smartphone,
  Check,
  AlertCircle,
} from "lucide-react";
import { Job, Form, User as UserType, FormField } from "@shared/types";
import { FullScreenSignaturePad } from "@/components/FullScreenSignaturePad";
import { useAuth } from "@/contexts/AuthContext";

export default function EnhancedFormFillPage() {
  const { user } = useAuth();
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
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [currentSection, setCurrentSection] = useState<
    "staff" | "client" | "signature"
  >("staff");
  const [autoSaveKey, setAutoSaveKey] = useState<string>("");

  // Auto-save functionality
  const saveFormData = useCallback(
    (data: Record<string, any>) => {
      if (autoSaveKey) {
        localStorage.setItem(autoSaveKey, JSON.stringify(data));
      }
    },
    [autoSaveKey],
  );

  const loadSavedData = useCallback(() => {
    if (autoSaveKey) {
      const saved = localStorage.getItem(autoSaveKey);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error("Failed to parse saved form data:", e);
        }
      }
    }
    return {};
  }, [autoSaveKey]);

  useEffect(() => {
    if (jobId && formId) {
      setAutoSaveKey(`form_${jobId}_${formId}`);
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

      // Load saved data first
      const savedData = loadSavedData();

      // Auto-fill form data with job and staff information
      const autoFilledData: Record<string, any> = { ...savedData };

      // Pre-fill known data from job
      formData.fields.forEach((field: FormField) => {
        if (autoFilledData[field.id]) return; // Don't override saved data

        const fieldLabel = field.label.toLowerCase();
        const fieldId = field.id;

        // Auto-fill based on autoFillFrom property
        if (field.autoFillFrom) {
          switch (field.autoFillFrom) {
            case "title":
              autoFilledData[fieldId] = jobDetails.title || "";
              break;
            case "assignedStaffName":
              const assignedStaff = staffData.find(
                (s: UserType) => s.id === jobDetails.assignedTo,
              );
              autoFilledData[fieldId] = assignedStaff?.name || "";
              break;
            case "clientName":
              autoFilledData[fieldId] =
                jobDetails.insuredName || jobDetails.InsuredName || "";
              break;
            case "claimNo":
              autoFilledData[fieldId] =
                jobDetails.claimNo || jobDetails.ClaimNo || "";
              break;
            default:
              // Try to match from job data
              const value = jobDetails[field.autoFillFrom];
              if (value) autoFilledData[fieldId] = value;
          }
        }

        // Legacy auto-fill logic for backward compatibility
        const assignedStaff = staffData.find(
          (s: UserType) => s.id === jobDetails.assignedTo,
        );

        if (assignedStaff) {
          if (
            fieldLabel.includes("staff") ||
            fieldLabel.includes("technician") ||
            fieldLabel.includes("inspector")
          ) {
            autoFilledData[fieldId] = assignedStaff.name;
          }
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
        }

        // Address auto-fill
        if (fieldLabel.includes("address") || fieldLabel.includes("location")) {
          autoFilledData[fieldId] =
            jobDetails.riskAddress || jobDetails.RiskAddress || "";
        }

        // Auto-calculate excess amount
        if (field.autoCalculate && fieldLabel.includes("amount")) {
          const excessPaidField = formData.fields.find((f: FormField) =>
            f.label.toLowerCase().includes("excess paid"),
          );
          if (excessPaidField) {
            const excessPaid = autoFilledData[excessPaidField.id];
            if (excessPaid === "Yes") {
              autoFilledData[fieldId] =
                jobDetails.excess || jobDetails.Excess || "0";
            } else {
              autoFilledData[fieldId] = "0";
            }
          }
        }
      });

      setFormData(autoFilledData);
      saveFormData(autoFilledData);
    } catch (error) {
      setError("Failed to load form data");
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (fieldId: string, value: any) => {
    const updatedData = {
      ...formData,
      [fieldId]: value,
    };

    // Handle auto-calculation for excess amount
    if (form) {
      const changedField = form.fields.find((f) => f.id === fieldId);
      if (changedField?.label.toLowerCase().includes("excess paid")) {
        const amountField = form.fields.find(
          (f) => f.autoCalculate && f.label.toLowerCase().includes("amount"),
        );
        if (amountField && job) {
          if (value === "Yes") {
            updatedData[amountField.id] = job.excess || job.Excess || "0";
          } else {
            updatedData[amountField.id] = "0";
          }
        }
      }
    }

    setFormData(updatedData);
    saveFormData(updatedData);
  };

  const handleNextSection = () => {
    if (currentSection === "staff") {
      setCurrentSection("client");
    } else if (currentSection === "client") {
      setCurrentSection("signature");
      setShowSignaturePad(true);
    }
  };

  const handleBackSection = () => {
    if (currentSection === "signature") {
      setCurrentSection("client");
    } else if (currentSection === "client") {
      setCurrentSection("staff");
    }
  };

  const handleSignatureComplete = (signatureData: string) => {
    setSignature(signatureData);
    setShowSignaturePad(false);

    // Save signature to form data
    const updatedData = {
      ...formData,
      signature: signatureData,
    };
    setFormData(updatedData);
    saveFormData(updatedData);
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
        // Clear saved data on successful submission
        if (autoSaveKey) {
          localStorage.removeItem(autoSaveKey);
        }
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

  const getFieldsBySection = (section: "staff" | "client") => {
    if (!form) return [];

    // Use section property if available, otherwise fallback to form-specific logic
    const fieldsWithSection = form.fields.some((field) => field.section);

    if (fieldsWithSection) {
      return form.fields.filter(
        (field) =>
          field.section === section || (!field.section && section === "staff"),
      );
    }

    // Fallback logic for forms without section markers
    if (form.name === "ABSA Form") {
      if (section === "staff") {
        return form.fields.filter((_, index) => index < 5 || index >= 13);
      } else {
        return form.fields.filter((_, index) => index >= 5 && index < 13);
      }
    } else if (form.name === "SAHL Certificate Form") {
      if (section === "staff") {
        return form.fields.filter((_, index) => index < 5 || index >= 11);
      } else {
        return form.fields.filter((_, index) => index >= 5 && index < 11);
      }
    } else if (form.name === "Clearance Certificate") {
      if (section === "staff") {
        return form.fields.filter((_, index) => index < 4 || index >= 10);
      } else {
        return form.fields.filter((_, index) => index >= 4 && index < 10);
      }
    }

    return form.fields;
  };

  const renderField = (field: FormField) => {
    const value = formData[field.id] || "";

    // Handle conditional fields
    if (field.dependsOn && field.showWhen) {
      const dependentValue = formData[field.dependsOn];
      if (dependentValue !== field.showWhen) {
        return null;
      }
    }

    const isAutoFilled = field.autoFillFrom && value;
    const isReadonly = field.readonly || isAutoFilled;

    return (
      <div key={field.id} className="space-y-2">
        <Label
          htmlFor={field.id}
          className={isAutoFilled ? "text-green-700" : ""}
        >
          {field.label} {field.required && "*"}
        </Label>

        {isAutoFilled ? (
          <div className="p-2 bg-green-50 border border-green-200 rounded-md">
            <span className="text-green-800 font-medium">{value}</span>
            <Badge variant="secondary" className="ml-2 text-xs">
              Auto-filled
            </Badge>
          </div>
        ) : field.type === "textarea" ? (
          <Textarea
            id={field.id}
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            readOnly={isReadonly}
          />
        ) : field.type === "select" ? (
          <Select
            value={value}
            onValueChange={(val) => handleFieldChange(field.id, val)}
            disabled={isReadonly}
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
              disabled={isReadonly}
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
            readOnly={isReadonly}
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

  const currentFields = getFieldsBySection(currentSection);
  const staffFields = getFieldsBySection("staff");
  const clientFields = getFieldsBySection("client");

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

          {/* Progress Indicator */}
          <div className="flex items-center space-x-4 mb-4">
            <div
              className={`flex items-center space-x-2 ${currentSection === "staff" ? "text-blue-600" : "text-gray-400"}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${currentSection === "staff" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
              >
                <User className="h-4 w-4" />
              </div>
              <span className="font-medium">Staff Section</span>
            </div>
            <div className="flex-1 h-px bg-gray-300"></div>
            <div
              className={`flex items-center space-x-2 ${currentSection === "client" ? "text-blue-600" : "text-gray-400"}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${currentSection === "client" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
              >
                <Smartphone className="h-4 w-4" />
              </div>
              <span className="font-medium">Client Section</span>
            </div>
            <div className="flex-1 h-px bg-gray-300"></div>
            <div
              className={`flex items-center space-x-2 ${currentSection === "signature" ? "text-blue-600" : "text-gray-400"}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${currentSection === "signature" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
              >
                <Check className="h-4 w-4" />
              </div>
              <span className="font-medium">Signature</span>
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

        {/* Auto-save Indicator */}
        <div className="mb-4 text-sm text-gray-600 flex items-center">
          <AlertCircle className="h-4 w-4 mr-2" />
          Form data is automatically saved as you type
        </div>

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

        {/* Current Section Instructions */}
        {currentSection === "client" && (
          <Alert className="mb-6 border-blue-200 bg-blue-50">
            <Smartphone className="h-4 w-4" />
            <AlertDescription className="text-blue-800">
              <strong>Hand phone to client:</strong> Let the client fill out
              this section and provide their signature.
            </AlertDescription>
          </Alert>
        )}

        {/* Form Section */}
        {form && currentSection !== "signature" && (
          <Card>
            <CardHeader>
              <CardTitle>
                {currentSection === "staff"
                  ? "Staff Section"
                  : "Client Section"}
              </CardTitle>
              <p className="text-gray-600">
                {currentSection === "staff"
                  ? "Complete the staff portion of the form"
                  : "Client to complete this section"}
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {currentFields.map(renderField)}
                </div>

                <div className="flex justify-between pt-6 border-t">
                  {currentSection === "client" && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleBackSection}
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Staff Section
                    </Button>
                  )}

                  <div className="flex space-x-4 ml-auto">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate(-1)}
                    >
                      Cancel
                    </Button>
                    <Button type="button" onClick={handleNextSection}>
                      {currentSection === "staff"
                        ? "Hand to Client"
                        : "Get Signature"}
                      <Smartphone className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Signature Section */}
        {currentSection === "signature" && !showSignaturePad && (
          <Card>
            <CardHeader>
              <CardTitle>Signature Required</CardTitle>
              <p className="text-gray-600">
                Client signature is required to complete the form
              </p>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                {signature ? (
                  <div className="space-y-4">
                    <div className="text-green-600 font-medium">
                      ✓ Signature captured
                    </div>
                    <img
                      src={signature}
                      alt="Client signature"
                      className="mx-auto border rounded-lg max-w-md"
                    />
                    <div className="flex justify-center space-x-4">
                      <Button
                        variant="outline"
                        onClick={() => setShowSignaturePad(true)}
                      >
                        Retake Signature
                      </Button>
                      <Button
                        onClick={handleSubmit}
                        disabled={saving}
                        className="bg-green-600 hover:bg-green-700"
                      >
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
                ) : (
                  <div className="space-y-4">
                    <p className="text-lg">Ready for client signature</p>
                    <Button
                      onClick={() => setShowSignaturePad(true)}
                      size="lg"
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Smartphone className="h-4 w-4 mr-2" />
                      Open Signature Pad
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex justify-start pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBackSection}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Client Section
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Full Screen Signature Pad */}
      <FullScreenSignaturePad
        isOpen={showSignaturePad}
        onSignatureComplete={handleSignatureComplete}
        onCancel={() => setShowSignaturePad(false)}
        title="Client Signature Required"
      />
    </div>
  );
}
