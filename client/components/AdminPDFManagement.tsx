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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, Settings, Save, Download, AlertCircle } from "lucide-react";

interface PDFTemplate {
  filename: string;
  formType: string;
}

interface PDFAssociation {
  formType: string;
  templateFile: string;
  dataMapping: string;
  instructions: string;
}

interface AdminPDFManagementProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdminPDFManagement({
  open,
  onOpenChange,
}: AdminPDFManagementProps) {
  const [templates, setTemplates] = useState<PDFTemplate[]>([]);
  const [associations, setAssociations] = useState<PDFAssociation[]>([]);
  const [selectedFormType, setSelectedFormType] = useState<string>("");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [dataMapping, setDataMapping] = useState<string>("");
  const [instructions, setInstructions] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const formTypes = [
    "Clearance Certificate",
    "Material List",
    "Non-Compliance Form",
    "Enhanced Liability Waiver",
    "Liability Certificate",
  ];

  useEffect(() => {
    if (open) {
      fetchTemplates();
      loadExistingAssociations();
    }
  }, [open]);

  const fetchTemplates = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch("/api/admin/pdf-templates", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
      }
    } catch (error) {
      console.error("Failed to fetch templates:", error);
    }
  };

  const loadExistingAssociations = () => {
    // Load from localStorage or fetch from backend
    const saved = localStorage.getItem("pdfAssociations");
    if (saved) {
      setAssociations(JSON.parse(saved));
    }
  };

  const handleSaveAssociation = async () => {
    if (!selectedFormType || !selectedTemplate) return;

    setLoading(true);
    try {
      const association: PDFAssociation = {
        formType: selectedFormType,
        templateFile: selectedTemplate,
        dataMapping,
        instructions,
      };

      const token = localStorage.getItem("auth_token");
      const response = await fetch("/api/admin/pdf-template-association", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(association),
      });

      if (response.ok) {
        // Update local associations
        const newAssociations = associations.filter(
          (a) => a.formType !== selectedFormType,
        );
        newAssociations.push(association);
        setAssociations(newAssociations);

        // Save to localStorage
        localStorage.setItem(
          "pdfAssociations",
          JSON.stringify(newAssociations),
        );

        // Reset form
        setSelectedFormType("");
        setSelectedTemplate("");
        setDataMapping("");
        setInstructions("");
      }
    } catch (error) {
      console.error("Failed to save association:", error);
    } finally {
      setLoading(false);
    }
  };

  const getAssociationForForm = (formType: string) => {
    return associations.find((a) => a.formType === formType);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Settings className="h-5 w-5 mr-2" />
            PDF Template Management
          </DialogTitle>
          <DialogDescription>
            Associate PDF templates from the public directory with form types
            and specify how form data should be mapped
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Available Templates */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Available PDF Templates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.map((template) => (
                  <div
                    key={template.filename}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 mr-3 text-blue-600" />
                      <div>
                        <div className="font-medium">{template.filename}</div>
                        <div className="text-sm text-gray-600">
                          {template.formType}
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        // In production, open PDF viewer
                        window.open(`/forms/${template.filename}`, "_blank");
                      }}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Current Associations */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Current Associations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {formTypes.map((formType) => {
                  const association = getAssociationForForm(formType);
                  return (
                    <div
                      key={formType}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <div className="font-medium">{formType}</div>
                        {association ? (
                          <div className="text-sm text-gray-600">
                            Associated with: {association.templateFile}
                          </div>
                        ) : (
                          <div className="text-sm text-red-600">
                            No template associated
                          </div>
                        )}
                      </div>
                      <Badge variant={association ? "default" : "destructive"}>
                        {association ? "Configured" : "Not Set"}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* New Association Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Create New Association</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Form Type</Label>
                  <Select
                    value={selectedFormType}
                    onValueChange={setSelectedFormType}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select form type" />
                    </SelectTrigger>
                    <SelectContent>
                      {formTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>PDF Template</Label>
                  <Select
                    value={selectedTemplate}
                    onValueChange={setSelectedTemplate}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select PDF template" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((template) => (
                        <SelectItem
                          key={template.filename}
                          value={template.filename}
                        >
                          {template.filename}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Data Mapping Instructions</Label>
                <Textarea
                  value={dataMapping}
                  onChange={(e) => setDataMapping(e.target.value)}
                  placeholder="Describe how form data should map to PDF fields..."
                  className="min-h-[100px]"
                />
              </div>

              <div>
                <Label>Processing Instructions</Label>
                <Textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="Provide instructions on how staff should use this form and PDF..."
                  className="min-h-[100px]"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <strong>How to use:</strong>
                    <ul className="mt-2 space-y-1 list-disc list-inside">
                      <li>
                        Place PDF templates in the <code>public/forms/</code>{" "}
                        directory
                      </li>
                      <li>
                        Data mapping describes how form fields connect to PDF
                        fillable fields
                      </li>
                      <li>
                        Instructions help staff understand the form's purpose
                        and usage
                      </li>
                      <li>
                        Staff will see a "Download PDF" button after completing
                        each form
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleSaveAssociation}
                  disabled={!selectedFormType || !selectedTemplate || loading}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? "Saving..." : "Save Association"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
