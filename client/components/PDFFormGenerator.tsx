import React, { useState } from "react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Loader2,
  Upload,
  FileText,
  Eye,
  Save,
  Trash2,
  Plus,
  Minus,
} from "lucide-react";
import { FormField } from "@shared/types";

interface PDFFormGeneratorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFormCreated: () => void;
}

interface ExtractedField {
  label: string;
  type: FormField["type"];
  required: boolean;
  options?: string[];
  placeholder?: string;
}

export function PDFFormGenerator({
  open,
  onOpenChange,
  onFormCreated,
}: PDFFormGeneratorProps) {
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState("");
  const [extractedFields, setExtractedFields] = useState<ExtractedField[]>([]);
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [progress, setProgress] = useState(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);
      setError(null);
    } else {
      setError("Please select a valid PDF file");
      setFile(null);
    }
  };

  const extractTextFromPDF = async (pdfFile: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          // Simulate PDF text extraction (in real implementation, use PDF.js or similar)
          // For demo purposes, we'll simulate OCR processing
          setProgress(25);
          await new Promise((resolve) => setTimeout(resolve, 1000));

          setProgress(50);
          await new Promise((resolve) => setTimeout(resolve, 1000));

          setProgress(75);
          await new Promise((resolve) => setTimeout(resolve, 1000));

          // Simulate extracted text from PDF
          const simulatedExtractedText = `
            INSURANCE CLAIM FORM
            
            Client Information:
            Full Name: ________________
            Email Address: ________________
            Phone Number: ________________
            Property Address: ________________
            
            Claim Details:
            Claim Number: ________________
            Policy Number: ________________
            Date of Incident: ________________
            Cause of Damage: ________________
            Description of Loss: ________________
            
            Assessment Questions:
            Did the service provider arrive on time? □ Yes □ No
            Was the work completed satisfactorily? □ Yes □ No
            Rate the quality of service (1-10): ________________
            Would you recommend this provider? □ Yes □ No
            
            Additional Comments:
            ________________
            ________________
            
            Staff Member: ________________
            Signature: ________________
            Date: ________________
          `;

          setProgress(100);
          resolve(simulatedExtractedText);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error("Failed to read PDF file"));
      reader.readAsArrayBuffer(pdfFile);
    });
  };

  const parseFieldsFromText = (text: string): ExtractedField[] => {
    const fields: ExtractedField[] = [];
    const lines = text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line);

    for (const line of lines) {
      // Skip headers and sections
      if (
        line.includes("FORM") ||
        line.includes("Information:") ||
        line.includes("Details:") ||
        line.includes("Questions:") ||
        line.includes("Comments:") ||
        line.length < 3
      ) {
        continue;
      }

      // Look for field patterns
      if (line.includes("________________") || line.includes("□")) {
        let label = line
          .replace(/[_\□]+/g, "")
          .replace(/:/g, "")
          .trim();

        if (!label) continue;

        let fieldType: FormField["type"] = "text";
        let options: string[] | undefined;
        let required = true;

        // Determine field type based on content
        if (line.includes("□")) {
          if (line.includes("Yes") && line.includes("No")) {
            fieldType = "select";
            options = ["Yes", "No"];
          } else {
            fieldType = "checkbox";
          }
        } else if (label.toLowerCase().includes("email")) {
          fieldType = "email";
        } else if (
          label.toLowerCase().includes("phone") ||
          label.toLowerCase().includes("number")
        ) {
          if (label.toLowerCase().includes("phone")) {
            fieldType = "text";
          } else {
            fieldType = "number";
          }
        } else if (label.toLowerCase().includes("date")) {
          fieldType = "date";
        } else if (
          label.toLowerCase().includes("address") ||
          label.toLowerCase().includes("description") ||
          label.toLowerCase().includes("comments")
        ) {
          fieldType = "textarea";
        } else if (
          label.toLowerCase().includes("rate") &&
          (line.includes("1-10") || line.includes("(1-10)"))
        ) {
          fieldType = "select";
          options = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];
        }

        fields.push({
          label: label,
          type: fieldType,
          required,
          options,
          placeholder: `Enter ${label.toLowerCase()}`,
        });
      }
    }

    return fields;
  };

  const handleProcessPDF = async () => {
    if (!file) {
      setError("Please select a PDF file first");
      return;
    }

    setProcessing(true);
    setError(null);
    setProgress(0);

    try {
      const extractedText = await extractTextFromPDF(file);
      setExtractedText(extractedText);

      const fields = parseFieldsFromText(extractedText);
      setExtractedFields(fields);

      // Auto-generate form name and description
      setFormName(
        file.name
          .replace(".pdf", "")
          .replace(/[_-]/g, " ")
          .replace(/\b\w/g, (l) => l.toUpperCase()),
      );
      setFormDescription(`Auto-generated form from ${file.name}`);
    } catch (error) {
      setError("Failed to process PDF. Please try again.");
    } finally {
      setProcessing(false);
      setProgress(0);
    }
  };

  const handleFieldChange = (index: number, field: Partial<ExtractedField>) => {
    setExtractedFields((prev) =>
      prev.map((f, i) => (i === index ? { ...f, ...field } : f)),
    );
  };

  const handleAddField = () => {
    setExtractedFields((prev) => [
      ...prev,
      {
        label: "New Field",
        type: "text",
        required: false,
        placeholder: "Enter value",
      },
    ]);
  };

  const handleRemoveField = (index: number) => {
    setExtractedFields((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCreateForm = async () => {
    if (!formName.trim()) {
      setError("Form name is required");
      return;
    }

    if (extractedFields.length === 0) {
      setError("At least one field is required");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("auth_token");
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const formData = {
        name: formName,
        description: formDescription,
        fields: extractedFields.map((field, index) => ({
          ...field,
          id: undefined, // Let server assign IDs
        })),
        isTemplate: true,
        restrictedToCompanies: [],
        extractedText: extractedText, // Store original extracted text for reference
      };

      const response = await fetch("/api/forms", {
        method: "POST",
        headers,
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        onFormCreated();
        onOpenChange(false);
        resetForm();
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to create form");
      }
    } catch (error) {
      setError("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setExtractedText("");
    setExtractedFields([]);
    setFormName("");
    setFormDescription("");
    setError(null);
    setProgress(0);
  };

  const fieldTypeOptions: FormField["type"][] = [
    "text",
    "email",
    "number",
    "date",
    "textarea",
    "select",
    "checkbox",
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Create Form from PDF
          </DialogTitle>
          <DialogDescription>
            Upload a PDF document and automatically generate a form using OCR
            text extraction
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* File Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">1. Upload PDF Document</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pdf-file">Select PDF File</Label>
                <Input
                  id="pdf-file"
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  disabled={processing}
                />
                {file && (
                  <div className="flex items-center space-x-2 text-sm text-green-600">
                    <FileText className="h-4 w-4" />
                    <span>
                      {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                )}
              </div>

              {processing && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Processing PDF...</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} className="w-full" />
                </div>
              )}

              <Button
                onClick={handleProcessPDF}
                disabled={!file || processing}
                className="w-full"
              >
                {processing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing PDF...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Extract Text & Generate Fields
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Extracted Text Preview */}
          {extractedText && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">2. Extracted Text</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={extractedText}
                  onChange={(e) => setExtractedText(e.target.value)}
                  className="min-h-[150px] text-xs font-mono"
                  placeholder="Extracted text will appear here..."
                />
              </CardContent>
            </Card>
          )}

          {/* Form Configuration */}
          {extractedFields.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">3. Form Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="form-name">Form Name</Label>
                    <Input
                      id="form-name"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="Enter form name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="form-description">Description</Label>
                    <Input
                      id="form-description"
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      placeholder="Enter form description"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Generated Fields */}
          {extractedFields.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">
                    4. Generated Form Fields
                  </CardTitle>
                  <Button size="sm" variant="outline" onClick={handleAddField}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Field
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {extractedFields.map((field, index) => (
                    <div
                      key={index}
                      className="border rounded-lg p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <Badge variant="outline">Field {index + 1}</Badge>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveField(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Label</Label>
                          <Input
                            value={field.label}
                            onChange={(e) =>
                              handleFieldChange(index, {
                                label: e.target.value,
                              })
                            }
                            className="text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Type</Label>
                          <select
                            value={field.type}
                            onChange={(e) =>
                              handleFieldChange(index, {
                                type: e.target.value as FormField["type"],
                              })
                            }
                            className="w-full text-sm border border-gray-300 rounded-md px-3 py-2"
                          >
                            {fieldTypeOptions.map((type) => (
                              <option key={type} value={type}>
                                {type.charAt(0).toUpperCase() + type.slice(1)}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Placeholder</Label>
                          <Input
                            value={field.placeholder || ""}
                            onChange={(e) =>
                              handleFieldChange(index, {
                                placeholder: e.target.value,
                              })
                            }
                            className="text-sm"
                          />
                        </div>
                      </div>

                      {field.type === "select" && (
                        <div className="space-y-1">
                          <Label className="text-xs">
                            Options (comma-separated)
                          </Label>
                          <Input
                            value={field.options?.join(", ") || ""}
                            onChange={(e) =>
                              handleFieldChange(index, {
                                options: e.target.value
                                  .split(",")
                                  .map((opt) => opt.trim())
                                  .filter((opt) => opt),
                              })
                            }
                            placeholder="Option 1, Option 2, Option 3"
                            className="text-sm"
                          />
                        </div>
                      )}

                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`required-${index}`}
                          checked={field.required}
                          onChange={(e) =>
                            handleFieldChange(index, {
                              required: e.target.checked,
                            })
                          }
                          className="rounded"
                        />
                        <Label
                          htmlFor={`required-${index}`}
                          className="text-xs"
                        >
                          Required field
                        </Label>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                resetForm();
              }}
            >
              Cancel
            </Button>

            {extractedFields.length > 0 && (
              <Button
                onClick={handleCreateForm}
                disabled={loading || !formName.trim()}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Form...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Create Form
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
