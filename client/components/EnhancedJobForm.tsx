import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  MapPin,
  ExternalLink,
  Package,
  FileText,
  Shield,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { Job, User } from "@shared/types";
import { MaterialListManager } from "@/components/MaterialListManager";
import { NoncomplianceForm } from "@/components/NoncomplianceForm";
import { EnhancedLiabilityForm } from "@/components/EnhancedLiabilityForm";

interface EnhancedJobFormProps {
  job: Job;
  assignedStaff: User | null;
  onFormSubmit: (formType: string, data: any) => void;
  existingMaterialList?: any;
  existingNoncomplianceForm?: any;
  existingLiabilityForm?: any;
}

export function EnhancedJobForm({
  job,
  assignedStaff,
  onFormSubmit,
  existingMaterialList,
  existingNoncomplianceForm,
  existingLiabilityForm,
}: EnhancedJobFormProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [addressVerified, setAddressVerified] = useState(false);

  // Determine which forms are required vs optional
  const isLiabilityRequired = [
    "Geyser Replacement",
    "Leak Detection",
    "Toilet/Shower",
  ].includes(job.category || "");
  const isMaterialListOptional = true;
  const isNoncomplianceOptional = true;

  const openInMaps = () => {
    const address = job.riskAddress || job.RiskAddress || "";
    if (address) {
      // Encode the address for URL
      const encodedAddress = encodeURIComponent(address);
      const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
      window.open(mapsUrl, "_blank");
    }
  };

  const verifyAddress = async () => {
    // Simulate address verification
    setAddressVerified(true);
    // In real implementation, this would call a geocoding API
  };

  const getJobCategoryIcon = () => {
    switch (job.category) {
      case "Geyser Replacement":
      case "Geyser Assessment":
        return "🔥";
      case "Leak Detection":
        return "💧";
      case "Drain Blockage":
        return "🚿";
      case "Camera Inspection":
        return "📹";
      case "Toilet/Shower":
        return "🚽";
      default:
        return "🔧";
    }
  };

  return (
    <div className="space-y-6">
      {/* Job Header with Address */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <span className="text-2xl mr-2">{getJobCategoryIcon()}</span>
              {job.title.length > 12
                ? `${job.title.substring(0, 12)}..`
                : job.title}
              <Badge variant="outline" className="ml-2">
                {job.category || "General"}
              </Badge>
            </CardTitle>
            <Badge
              variant={job.priority === "high" ? "destructive" : "secondary"}
            >
              {job.priority} priority
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Job Details</h4>
              <div className="space-y-2 text-sm">
                <div>
                  <strong>Claim No:</strong>{" "}
                  {job.claimNo || job.ClaimNo || "N/A"}
                </div>
                <div>
                  <strong>Client:</strong>{" "}
                  {job.insuredName || job.InsuredName || "N/A"}
                </div>
                <div>
                  <strong>Phone:</strong> {job.insCell || job.InsCell || "N/A"}
                </div>
                <div>
                  <strong>Staff:</strong> {assignedStaff?.name || "Unassigned"}
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Service Address</h4>
              <div className="space-y-2">
                <div className="flex items-start space-x-2">
                  <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm">
                      {job.riskAddress ||
                        job.RiskAddress ||
                        "Address not specified"}
                    </p>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={openInMaps}
                    className="flex items-center"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Open in Maps
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={verifyAddress}
                    className={`flex items-center ${addressVerified ? "text-green-600" : ""}`}
                  >
                    {addressVerified ? (
                      <CheckCircle className="h-3 w-3 mr-1" />
                    ) : (
                      <AlertTriangle className="h-3 w-3 mr-1" />
                    )}
                    {addressVerified ? "Verified" : "Verify Address"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form Requirements Alert */}
      <Alert>
        <FileText className="h-4 w-4" />
        <AlertDescription>
          <strong>Form Requirements:</strong>
          {isLiabilityRequired &&
            " Enhanced Liability form is required for this job type."}
          {
            " Material List and Noncompliance forms are optional but recommended for comprehensive documentation."
          }
        </AlertDescription>
      </Alert>

      {/* Enhanced Forms Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Job Forms & Materials</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="materials" className="flex items-center">
                <Package className="h-4 w-4 mr-1" />
                Materials
                <Badge variant="outline" className="ml-1 text-xs">
                  Optional
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="noncompliance" className="flex items-center">
                <AlertTriangle className="h-4 w-4 mr-1" />
                Compliance
                <Badge variant="outline" className="ml-1 text-xs">
                  Optional
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="liability" className="flex items-center">
                <Shield className="h-4 w-4 mr-1" />
                Liability
                {isLiabilityRequired && (
                  <Badge variant="destructive" className="ml-1 text-xs">
                    Required
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Material List</h4>
                      <p className="text-sm text-gray-600">
                        Track parts and supplies
                      </p>
                    </div>
                    {existingMaterialList ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <div className="h-5 w-5 border-2 border-gray-300 rounded-full" />
                    )}
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Noncompliance Check</h4>
                      <p className="text-sm text-gray-600">
                        Safety and code compliance
                      </p>
                    </div>
                    {existingNoncomplianceForm ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <div className="h-5 w-5 border-2 border-gray-300 rounded-full" />
                    )}
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Liability Assessment</h4>
                      <p className="text-sm text-gray-600">
                        Before/after evaluation
                      </p>
                    </div>
                    {existingLiabilityForm ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <div
                        className={`h-5 w-5 border-2 rounded-full ${isLiabilityRequired ? "border-red-500" : "border-gray-300"}`}
                      />
                    )}
                  </div>
                </Card>
              </div>

              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">Auto-filled Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Date:</strong> {new Date().toLocaleDateString()}
                  </div>
                  <div>
                    <strong>Plumber:</strong> {assignedStaff?.name}
                  </div>
                  <div>
                    <strong>Claim Number:</strong> {job.claimNo || job.ClaimNo}
                  </div>
                  <div>
                    <strong>Insurance:</strong>{" "}
                    {job.underwriter || job.Underwriter}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="materials" className="mt-6">
              <MaterialListManager
                job={job}
                onMaterialListSave={(materialList) => {
                  onFormSubmit("materials", materialList);
                }}
                existingMaterialList={existingMaterialList}
              />
            </TabsContent>

            <TabsContent value="noncompliance" className="mt-6">
              <NoncomplianceForm
                job={job}
                assignedStaff={assignedStaff}
                onSubmit={(formData) => {
                  onFormSubmit("noncompliance", formData);
                }}
                existingData={existingNoncomplianceForm}
              />
            </TabsContent>

            <TabsContent value="liability" className="mt-6">
              <EnhancedLiabilityForm
                job={job}
                assignedStaff={assignedStaff}
                onSubmit={(formData) => {
                  onFormSubmit("liability", formData);
                }}
                existingData={existingLiabilityForm}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
