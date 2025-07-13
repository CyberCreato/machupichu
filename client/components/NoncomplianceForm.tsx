import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, Save, FileText, CheckCircle } from "lucide-react";
import { Job, User } from "@shared/types";

interface NoncomplianceFormData {
  id: string;
  jobId: string;
  geyserMake: string;
  serial: string;
  code: string;
  quotationAvailable: "YES" | "NO" | "";
  insuranceName: string;
  claimNumber: string;
  clientName: string;
  staffName: string;
  date: string;
  selectedIssues: number[];
  plumberIndemnity:
    | "Electric geyser"
    | "Solar geyser"
    | "Heat pump"
    | "Pipe Repairs"
    | "Assessment"
    | "";
}

const NONCOMPLIANCE_ISSUES = [
  "Cold vacuum breaker (Must be 300mm above geyser)",
  "Hot vacuum breaker (Must be 300mm above geyser and 430mm away)",
  "Vacuum breaker not over drip tray",
  "Safety valve",
  "Not copper",
  "Need brackets",
  "Has a 90 degree short radius bend",
  "Exceeds 4m, Must be upsized to 28mm",
  "Must have 1m copper from hot water outlet",
  "Must have 1m copper from cold water inlet",
  "Pipes in roof not secured properly",
  "PRV overflow pipe not adequately secured",
  "PRV not over drip tray",
  "System unbalanced",
  "No shut off to the geyser",
  "No electrical isolator switch",
  "Pipes not electrically bonded or not correctly bonded",
  "Non return valve installed on unbalanced system (warranty can be voided if not installed)",
  "Tray overflow item not compliant",
  "Not PVC",
  "No bracket every 1m",
  "Has a 90 degree short radius bend",
  "No fall on the outlet pipe",
  "Geyser support",
  "Lagging",
  "No lagging",
  "Lagging is split",
  "Incorrect type of lagging",
  "Geyser access",
  "Roof sheets/tiles need to be removed to replace the geyser",
  "Trap door is in bathroom",
  "Trap door to be enlarged or roof access",
  "Type of pipe in the ceiling or exposed",
];

interface NoncomplianceFormProps {
  job: Job;
  assignedStaff: User | null;
  onSubmit: (formData: NoncomplianceFormData) => void;
  existingData?: NoncomplianceFormData;
}

export function NoncomplianceForm({
  job,
  assignedStaff,
  onSubmit,
  existingData,
}: NoncomplianceFormProps) {
  const [formData, setFormData] = useState<NoncomplianceFormData>(() => ({
    id: existingData?.id || `noncompliance-${Date.now()}`,
    jobId: job.id,
    geyserMake: existingData?.geyserMake || "",
    serial: existingData?.serial || "",
    code: existingData?.code || "",
    quotationAvailable: existingData?.quotationAvailable || "",
    insuranceName:
      existingData?.insuranceName || job.underwriter || job.Underwriter || "",
    claimNumber: existingData?.claimNumber || job.claimNo || job.ClaimNo || "",
    clientName:
      existingData?.clientName || job.insuredName || job.InsuredName || "",
    staffName: existingData?.staffName || assignedStaff?.name || "Staff Member",
    date: existingData?.date || new Date().toISOString().split("T")[0],
    selectedIssues: existingData?.selectedIssues || [],
    plumberIndemnity: existingData?.plumberIndemnity || "",
  }));

  const handleIssueToggle = (issueIndex: number) => {
    setFormData((prev) => ({
      ...prev,
      selectedIssues: prev.selectedIssues.includes(issueIndex)
        ? prev.selectedIssues.filter((i) => i !== issueIndex)
        : [...prev.selectedIssues, issueIndex],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const generatePDF = async () => {
    try {
      const response = await fetch(
        `/api/generate-noncompliance-pdf/${formData.id}?${new URLSearchParams({
          claimNumber: formData.claimNumber,
          clientName: formData.clientName,
          insuranceName: formData.insuranceName,
          date: formData.date,
          geyserMake: formData.geyserMake,
          serial: formData.serial,
          code: formData.code,
          quotationAvailable: formData.quotationAvailable,
          plumberIndemnity: formData.plumberIndemnity,
          selectedIssues: JSON.stringify(formData.selectedIssues),
        })}`,
        {
          method: "GET",
        },
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `noncompliance-${formData.claimNumber}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        console.error("Failed to generate PDF");
      }
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 text-orange-600" />
            Noncompliance Form
            <Badge variant="outline" className="ml-2">
              {job.title}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Auto-filled Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-blue-50 rounded-lg">
              <div>
                <Label className="text-sm font-medium">Insurance Name</Label>
                <Input
                  value={formData.insuranceName}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      insuranceName: e.target.value,
                    }))
                  }
                  className="text-sm bg-white"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-green-600">
                  Claim Number *
                </Label>
                <Input
                  value={formData.claimNumber}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      claimNumber: e.target.value,
                    }))
                  }
                  className="text-sm bg-white"
                  placeholder="Auto-filled from job"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">
                  Client Name and Surname
                </Label>
                <Input
                  value={formData.clientName}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      clientName: e.target.value,
                    }))
                  }
                  className="text-sm bg-white"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Staff Name</Label>
                <Input
                  value={formData.staffName}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      staffName: e.target.value,
                    }))
                  }
                  className="text-sm bg-white"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Date</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, date: e.target.value }))
                  }
                  className="text-sm bg-white"
                />
              </div>
            </div>

            <Separator />

            {/* Geyser Information */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Geyser Make</Label>
                <Input
                  value={formData.geyserMake}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      geyserMake: e.target.value,
                    }))
                  }
                  placeholder="Enter geyser make"
                />
              </div>
              <div>
                <Label>Serial</Label>
                <Input
                  value={formData.serial}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, serial: e.target.value }))
                  }
                  placeholder="Enter serial number"
                />
              </div>
              <div>
                <Label>Code</Label>
                <Input
                  value={formData.code}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, code: e.target.value }))
                  }
                  placeholder="Enter code"
                />
              </div>
            </div>

            {/* Plumber Indemnity */}
            <div>
              <Label>Plumber Indemnity</Label>
              <Select
                value={formData.plumberIndemnity}
                onValueChange={(value: any) =>
                  setFormData((prev) => ({ ...prev, plumberIndemnity: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select plumber indemnity type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem key="electric-geyser" value="Electric geyser">
                    Electric geyser
                  </SelectItem>
                  <SelectItem key="solar-geyser" value="Solar geyser">
                    Solar geyser
                  </SelectItem>
                  <SelectItem key="heat-pump" value="Heat pump">
                    Heat pump
                  </SelectItem>
                  <SelectItem key="pipe-repairs" value="Pipe Repairs">
                    Pipe Repairs
                  </SelectItem>
                  <SelectItem key="assessment" value="Assessment">
                    Assessment
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Noncompliance Issues */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Noncompliance Issues</h3>
                <Badge variant="outline">
                  {formData.selectedIssues.length} selected
                </Badge>
              </div>

              <div className="max-h-96 overflow-y-auto border rounded-lg p-4 space-y-2">
                {NONCOMPLIANCE_ISSUES.map((issue, index) => (
                  <div
                    key={index}
                    className={`flex items-start space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      formData.selectedIssues.includes(index)
                        ? "bg-red-50 border border-red-200"
                        : "bg-gray-50 hover:bg-gray-100"
                    }`}
                    onClick={() => handleIssueToggle(index)}
                  >
                    <div className="flex-shrink-0 mt-1">
                      {formData.selectedIssues.includes(index) ? (
                        <CheckCircle className="h-5 w-5 text-red-600" />
                      ) : (
                        <div className="h-5 w-5 border-2 border-gray-300 rounded-full"></div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start">
                        <span className="text-sm font-medium text-gray-700 mr-2">
                          {index + 1}.
                        </span>
                        <span className="text-sm text-gray-800">{issue}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Quotation Availability */}
            <div>
              <Label>
                Please advise if a quotation can be supplied to meet these
                critical compliance requirements
              </Label>
              <Select
                value={formData.quotationAvailable}
                onValueChange={(value: "YES" | "NO") =>
                  setFormData((prev) => ({
                    ...prev,
                    quotationAvailable: value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select YES or NO" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem key="yes" value="YES">
                    YES
                  </SelectItem>
                  <SelectItem key="no" value="NO">
                    NO
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Submit Button */}
            <div className="flex justify-between items-center pt-6 border-t">
              <Button
                type="button"
                onClick={generatePDF}
                variant="outline"
                className="flex items-center"
              >
                <FileText className="h-4 w-4 mr-2" />
                Generate PDF
              </Button>
              <div className="flex space-x-4">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-red-600 hover:bg-red-700 text-white"
                  disabled={formData.selectedIssues.length === 0}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Submit Noncompliance Form
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Form Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {formData.selectedIssues.length}
              </div>
              <div className="text-sm text-red-800">Issues Selected</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {33 - formData.selectedIssues.length}
              </div>
              <div className="text-sm text-blue-800">Compliant Items</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-600">
                {Math.round(((33 - formData.selectedIssues.length) / 33) * 100)}
                %
              </div>
              <div className="text-sm text-gray-800">Compliance Rate</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
