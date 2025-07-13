import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Job, User } from "@shared/types";
import { NoncomplianceForm } from "./NoncomplianceForm";
import { MaterialListForm } from "./MaterialListForm";
import { AlertTriangle, Package } from "lucide-react";

interface AdditionalFormsModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: Job;
  assignedStaff: User | null;
}

export function AdditionalFormsModal({
  isOpen,
  onClose,
  job,
  assignedStaff,
}: AdditionalFormsModalProps) {
  const [activeTab, setActiveTab] = useState("noncompliance");

  const handleNoncomplianceSubmit = async (formData: any) => {
    try {
      // Submit the form data to your backend
      const response = await fetch("/api/form-submissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          formId: "noncompliance-form",
          jobId: job.id,
          data: formData,
          submittedBy: assignedStaff?.id,
          submissionNumber: Date.now().toString(),
        }),
      });

      if (response.ok) {
        console.log("Noncompliance form submitted successfully");
        // You might want to show a success message or refresh data
      } else {
        console.error("Failed to submit noncompliance form");
      }
    } catch (error) {
      console.error("Error submitting noncompliance form:", error);
    }
  };

  const handleMaterialListSubmit = async (formData: any) => {
    try {
      // Submit the form data to your backend
      const response = await fetch("/api/form-submissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          formId: "material-list-form",
          jobId: job.id,
          data: formData,
          submittedBy: assignedStaff?.id,
          submissionNumber: Date.now().toString(),
        }),
      });

      if (response.ok) {
        console.log("Material list form submitted successfully");
        // You might want to show a success message or refresh data
      } else {
        console.error("Failed to submit material list form");
      }
    } catch (error) {
      console.error("Error submitting material list form:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            Additional Forms
            <Badge variant="outline" className="ml-2">
              {job.title}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="noncompliance" className="flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Noncompliance Form
            </TabsTrigger>
            <TabsTrigger value="material-list" className="flex items-center">
              <Package className="h-4 w-4 mr-2" />
              Material List
            </TabsTrigger>
          </TabsList>

          <div className="overflow-y-auto max-h-[calc(95vh-120px)] mt-4">
            <TabsContent value="noncompliance" className="mt-0">
              <NoncomplianceForm
                job={job}
                assignedStaff={assignedStaff}
                onSubmit={handleNoncomplianceSubmit}
              />
            </TabsContent>

            <TabsContent value="material-list" className="mt-0">
              <MaterialListForm
                job={job}
                assignedStaff={assignedStaff}
                onSubmit={handleMaterialListSubmit}
              />
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
