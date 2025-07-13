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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField, Company, CreateFormRequest } from "@shared/types";
import {
  Loader2,
  Plus,
  Trash2,
  FileText,
  Upload,
  GripVertical,
} from "lucide-react";
import { parseFormSchema, type ParsedFormField } from "@/utils/textParser";

interface CreateFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFormCreated: () => void;
}

export function CreateFormModal({
  open,
  onOpenChange,
  onFormCreated,
}: CreateFormModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [parseLoading, setParseLoading] = useState(false);

  const [formData, setFormData] = useState<CreateFormRequest>({
    name: "",
    description: "",
    fields: [],
    isTemplate: false,
    restrictedToCompanies: [],
  });

  const [rawSchema, setRawSchema] = useState("");
  const [activeTab, setActiveTab] = useState("builder");

  useEffect(() => {
    if (open) {
      fetchCompanies();
      // Reset states when modal opens
      setError(null);
      setRawSchema("");
      setActiveTab("builder");
    }
  }, [open]);

  const fetchCompanies = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const response = await fetch("/api/companies", { headers });
      const data = await response.json();
      setCompanies(data);
    } catch (error) {
      setError("Failed to load companies");
    }
  };

  const handleParseSchema = async () => {
    if (!rawSchema.trim()) return;

    setParseLoading(true);
    try {
      // Use the enhanced local parser
      const parsedFields = parseFormSchema(rawSchema);

      // Convert ParsedFormField to FormField format (without id)
      const fields = parsedFields.map((field: ParsedFormField) => ({
        type: field.type,
        label: field.label,
        required: field.required,
        options: field.options,
        placeholder: field.placeholder,
      }));

      // Auto-generate form name based on content
      let formName = "Auto-Generated Form";
      if (rawSchema.includes("Service Provider Appointment")) {
        formName = "Service Provider Form";
      } else if (rawSchema.includes("Claim Appointment")) {
        formName = "Claim Information Form";
      } else if (rawSchema.includes("Notification Details")) {
        formName = "Notification Form";
      } else if (rawSchema.includes("<form")) {
        formName = "HTML Form";
      } else if (rawSchema.includes("mongoose.Schema")) {
        formName = "Mongoose Schema Form";
      }

      setFormData((prev) => ({
        ...prev,
        fields,
        name: prev.name || formName,
      }));

      // Auto-switch to builder tab to show populated fields
      setActiveTab("builder");
    } catch (error) {
      console.error("Schema parsing error:", error);
      setError("Failed to parse schema");
    } finally {
      setParseLoading(false);
    }
  };

  const addField = () => {
    const newField: Omit<FormField, "id"> = {
      type: "text",
      label: "",
      required: true,
      placeholder: "",
    };

    setFormData((prev) => ({
      ...prev,
      fields: [...prev.fields, newField],
    }));
  };

  const updateField = (index: number, updates: Partial<FormField>) => {
    setFormData((prev) => ({
      ...prev,
      fields: prev.fields.map((field, i) =>
        i === index ? { ...field, ...updates } : field,
      ),
    }));
  };

  const removeField = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      fields: prev.fields.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const requestData = {
        ...formData,
        rawSchema: rawSchema || undefined,
      };

      const token = localStorage.getItem("auth_token");
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch("/api/forms", {
        method: "POST",
        headers,
        body: JSON.stringify(requestData),
      });

      if (response.ok) {
        onFormCreated();
        onOpenChange(false);
        // Reset form
        setFormData({
          name: "",
          description: "",
          fields: [],
          isTemplate: false,
          restrictedToCompanies: [],
        });
        setRawSchema("");
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Form</DialogTitle>
          <DialogDescription>
            Create a dynamic form or parse from schema text
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="builder">Form Builder</TabsTrigger>
            <TabsTrigger value="parse">Parse Schema</TabsTrigger>
          </TabsList>

          <TabsContent value="parse" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rawSchema">Schema Text</Label>
              <Textarea
                id="rawSchema"
                value={rawSchema}
                onChange={(e) => setRawSchema(e.target.value)}
                placeholder="Paste form schema or job data here..."
                className="min-h-[200px]"
              />
            </div>

            <Button
              type="button"
              onClick={handleParseSchema}
              disabled={!rawSchema.trim() || parseLoading}
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
                  Parse Schema
                </>
              )}
            </Button>

            {formData.fields.length > 0 && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-medium text-green-800 mb-2">
                  Parsed Fields ({formData.fields.length})
                </h4>
                <div className="space-y-1">
                  {formData.fields.map((field, index) => (
                    <div key={index} className="text-sm">
                      <Badge variant="outline" className="mr-2">
                        {field.type}
                      </Badge>
                      {field.label}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="builder">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Form Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Form Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Form Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        placeholder="Enter form name"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Form Type</Label>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="isTemplate"
                          checked={formData.isTemplate}
                          onCheckedChange={(checked) =>
                            setFormData({
                              ...formData,
                              isTemplate: checked as boolean,
                            })
                          }
                        />
                        <Label htmlFor="isTemplate">Use as template</Label>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      placeholder="Enter form description"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Company Access (Optional)</Label>
                    <p className="text-xs text-gray-500 mb-3">
                      Leave empty to make this form available to all companies.
                      Select specific companies to restrict access.
                    </p>
                    <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto border rounded-lg p-3">
                      {companies.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-2">
                          No companies available
                        </p>
                      ) : (
                        companies.map((company) => {
                          const isSelected =
                            formData.restrictedToCompanies.includes(company.id);
                          return (
                            <div
                              key={company.id}
                              className={`flex items-center space-x-2 p-2 rounded ${
                                isSelected ? "bg-blue-50" : ""
                              }`}
                            >
                              <Checkbox
                                id={company.id}
                                checked={isSelected}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setFormData((prev) => ({
                                      ...prev,
                                      restrictedToCompanies: [
                                        ...prev.restrictedToCompanies,
                                        company.id,
                                      ],
                                    }));
                                  } else {
                                    setFormData((prev) => ({
                                      ...prev,
                                      restrictedToCompanies:
                                        prev.restrictedToCompanies.filter(
                                          (id) => id !== company.id,
                                        ),
                                    }));
                                  }
                                }}
                              />
                              <Label
                                htmlFor={company.id}
                                className="text-sm cursor-pointer"
                              >
                                {company.name}
                              </Label>
                            </div>
                          );
                        })
                      )}
                    </div>
                    {formData.restrictedToCompanies.length > 0 && (
                      <p className="text-xs text-green-600">
                        ✓ Form restricted to{" "}
                        {formData.restrictedToCompanies.length} selected{" "}
                        {formData.restrictedToCompanies.length === 1
                          ? "company"
                          : "companies"}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Form Fields */}
              {/* Show parsed fields notification */}
              {rawSchema && formData.fields.length > 0 && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-medium text-green-800 mb-2 flex items-center">
                    <Upload className="h-4 w-4 mr-2" />
                    Schema Parsed Successfully
                  </h4>
                  <p className="text-sm text-green-700">
                    {formData.fields.length} fields were automatically generated
                    from your schema. You can edit, reorder, or add more fields
                    below.
                  </p>
                </div>
              )}

              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>
                      Form Fields ({formData.fields.length})
                      {rawSchema && formData.fields.length > 0 && (
                        <Badge variant="secondary" className="ml-2">
                          Auto-generated
                        </Badge>
                      )}
                    </CardTitle>
                    <Button type="button" onClick={addField} size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Field
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {formData.fields.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        No fields added yet. Click "Add Field" to get started.
                      </div>
                    ) : (
                      formData.fields.map((field, index) => (
                        <div
                          key={index}
                          className="border rounded-lg p-4 space-y-3"
                        >
                          <div className="flex justify-between items-center">
                            <div className="flex items-center space-x-2">
                              <GripVertical className="h-4 w-4 text-gray-400" />
                              <span className="font-medium">
                                Field {index + 1}
                              </span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeField(index)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="grid grid-cols-3 gap-3">
                            <div className="space-y-1">
                              <Label>Field Type</Label>
                              <Select
                                value={field.type}
                                onValueChange={(value: FormField["type"]) =>
                                  updateField(index, { type: value })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem key="text" value="text">
                                    Text
                                  </SelectItem>
                                  <SelectItem key="email" value="email">
                                    Email
                                  </SelectItem>
                                  <SelectItem key="number" value="number">
                                    Number
                                  </SelectItem>
                                  <SelectItem key="date" value="date">
                                    Date
                                  </SelectItem>
                                  <SelectItem key="textarea" value="textarea">
                                    Textarea
                                  </SelectItem>
                                  <SelectItem key="select" value="select">
                                    Select
                                  </SelectItem>
                                  <SelectItem key="checkbox" value="checkbox">
                                    Checkbox
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-1">
                              <Label>Label</Label>
                              <Input
                                value={field.label}
                                onChange={(e) =>
                                  updateField(index, { label: e.target.value })
                                }
                                placeholder="Field label"
                              />
                            </div>

                            <div className="space-y-1">
                              <Label>Placeholder</Label>
                              <Input
                                value={field.placeholder || ""}
                                onChange={(e) =>
                                  updateField(index, {
                                    placeholder: e.target.value,
                                  })
                                }
                                placeholder="Field placeholder"
                              />
                            </div>
                          </div>

                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={`required-${index}`}
                                checked={field.required}
                                onCheckedChange={(checked) =>
                                  updateField(index, {
                                    required: checked as boolean,
                                  })
                                }
                              />
                              <Label htmlFor={`required-${index}`}>
                                Required
                              </Label>
                            </div>

                            {field.type === "select" && (
                              <div className="flex-1">
                                <Label>Options (comma separated)</Label>
                                <Input
                                  value={(field.options || []).join(", ")}
                                  onChange={(e) =>
                                    updateField(index, {
                                      options: e.target.value
                                        .split(",")
                                        .map((opt) => opt.trim())
                                        .filter((opt) => opt.length > 0),
                                    })
                                  }
                                  placeholder="Option 1, Option 2, Option 3"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

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
                <Button
                  type="submit"
                  disabled={loading || formData.fields.length === 0}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <FileText className="mr-2 h-4 w-4" />
                      Create Form
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
