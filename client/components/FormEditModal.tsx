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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormField, Company } from "@shared/types";
import {
  Loader2,
  Save,
  Trash2,
  FileText,
  Plus,
  X,
  Eye,
  Edit,
} from "lucide-react";

interface FormEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: Form | null;
  onFormUpdated: () => void;
  isAdmin: boolean;
}

export function FormEditModal({
  open,
  onOpenChange,
  form,
  onFormUpdated,
  isAdmin,
}: FormEditModalProps) {
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    fields: [] as FormField[],
    isTemplate: false,
    restrictedToCompanies: [] as string[],
  });

  useEffect(() => {
    if (open) {
      fetchCompanies();
      if (form) {
        setFormData({
          name: form.name || "",
          description: form.description || "",
          fields: form.fields || [],
          isTemplate: form.isTemplate || false,
          restrictedToCompanies: form.restrictedToCompanies || [],
        });
        setIsEditing(false);
        setError(null);
      }
    }
  }, [form, open]);

  const fetchCompanies = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const response = await fetch("/api/companies", { headers });
      const data = await response.json();
      setCompanies(data);
    } catch (error) {
      console.error("Failed to fetch companies:", error);
    }
  };

  const handleUpdate = async () => {
    if (!form || !isAdmin) return;

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

      const response = await fetch(`/api/forms/${form.id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        onFormUpdated();
        setIsEditing(false);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to update form");
      }
    } catch (error) {
      setError("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!form || !isAdmin) return;

    if (
      !confirm(
        `Are you sure you want to delete "${form.name}"? This action cannot be undone and will affect all jobs using this form.`,
      )
    ) {
      return;
    }

    setDeleteLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("auth_token");
      const headers: Record<string, string> = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`/api/forms/${form.id}`, {
        method: "DELETE",
        headers,
      });

      if (response.ok) {
        onFormUpdated();
        onOpenChange(false);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to delete form");
      }
    } catch (error) {
      setError("Network error occurred");
    } finally {
      setDeleteLoading(false);
    }
  };

  const addField = () => {
    const newField: FormField = {
      id: `field-${Date.now()}`,
      type: "text",
      label: "New Field",
      required: false,
      placeholder: "",
    };
    setFormData({
      ...formData,
      fields: [...formData.fields, newField],
    });
  };

  const updateField = (index: number, updates: Partial<FormField>) => {
    const updatedFields = [...formData.fields];
    updatedFields[index] = { ...updatedFields[index], ...updates };
    setFormData({ ...formData, fields: updatedFields });
  };

  const removeField = (index: number) => {
    const updatedFields = formData.fields.filter((_, i) => i !== index);
    setFormData({ ...formData, fields: updatedFields });
  };

  const toggleCompanyRestriction = (companyId: string) => {
    const restricted = formData.restrictedToCompanies.includes(companyId);
    if (restricted) {
      setFormData({
        ...formData,
        restrictedToCompanies: formData.restrictedToCompanies.filter(
          (id) => id !== companyId,
        ),
      });
    } else {
      setFormData({
        ...formData,
        restrictedToCompanies: [...formData.restrictedToCompanies, companyId],
      });
    }
  };

  if (!form) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            {isEditing && isAdmin ? "Edit Form" : "Form Details"}
          </DialogTitle>
          <DialogDescription>
            {isEditing && isAdmin
              ? "Update form information and fields"
              : `View form details${isAdmin ? " and manage settings" : ""}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Form Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                disabled={!isEditing || !isAdmin}
              />
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="isTemplate"
                  checked={formData.isTemplate}
                  onChange={(e) =>
                    setFormData({ ...formData, isTemplate: e.target.checked })
                  }
                  disabled={!isEditing || !isAdmin}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="isTemplate">Template Form</Label>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              disabled={!isEditing || !isAdmin}
              rows={3}
            />
          </div>

          {/* Company Restrictions */}
          {isAdmin && (
            <div className="space-y-2">
              <Label>Company Restrictions</Label>
              <p className="text-sm text-muted-foreground">
                Select companies that can use this form. Leave empty for all
                companies.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-32 overflow-y-auto">
                {companies.map((company) => (
                  <div
                    key={company.id}
                    className={`p-2 border rounded cursor-pointer transition-colors ${
                      formData.restrictedToCompanies.includes(company.id)
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() =>
                      isEditing && toggleCompanyRestriction(company.id)
                    }
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {company.name}
                      </span>
                      {formData.restrictedToCompanies.includes(company.id) && (
                        <Badge variant="secondary" className="text-xs">
                          ✓
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Form Fields */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Form Fields</Label>
              {isEditing && isAdmin && (
                <Button onClick={addField} size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Field
                </Button>
              )}
            </div>

            <div className="space-y-3 max-h-64 overflow-y-auto">
              {formData.fields.map((field, index) => (
                <Card key={field.id} className="relative">
                  <CardContent className="p-4">
                    <div className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-3">
                        <Label className="text-xs">Label</Label>
                        <Input
                          value={field.label}
                          onChange={(e) =>
                            updateField(index, { label: e.target.value })
                          }
                          disabled={!isEditing || !isAdmin}
                          className="text-sm"
                        />
                      </div>

                      <div className="col-span-2">
                        <Label className="text-xs">Type</Label>
                        <Select
                          value={field.type}
                          onValueChange={(value: FormField["type"]) =>
                            updateField(index, { type: value })
                          }
                          disabled={!isEditing || !isAdmin}
                        >
                          <SelectTrigger className="text-sm">
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

                      <div className="col-span-3">
                        <Label className="text-xs">Placeholder</Label>
                        <Input
                          value={field.placeholder || ""}
                          onChange={(e) =>
                            updateField(index, { placeholder: e.target.value })
                          }
                          disabled={!isEditing || !isAdmin}
                          className="text-sm"
                        />
                      </div>

                      <div className="col-span-2 flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={field.required}
                          onChange={(e) =>
                            updateField(index, { required: e.target.checked })
                          }
                          disabled={!isEditing || !isAdmin}
                          className="rounded border-gray-300"
                        />
                        <Label className="text-xs">Required</Label>
                      </div>

                      <div className="col-span-2 flex justify-end">
                        {isEditing && isAdmin && (
                          <Button
                            onClick={() => removeField(index)}
                            size="sm"
                            variant="ghost"
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {field.type === "select" && (
                      <div className="mt-2">
                        <Label className="text-xs">
                          Options (comma-separated)
                        </Label>
                        <Input
                          value={field.options?.join(", ") || ""}
                          onChange={(e) =>
                            updateField(index, {
                              options: e.target.value
                                .split(",")
                                .map((opt) => opt.trim())
                                .filter(Boolean),
                            })
                          }
                          disabled={!isEditing || !isAdmin}
                          placeholder="Option 1, Option 2, Option 3"
                          className="text-sm"
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}

              {formData.fields.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No fields defined for this form</p>
                </div>
              )}
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between pt-4 border-t">
            <div className="space-x-2">
              {isAdmin && (
                <>
                  {!isEditing ? (
                    <Button onClick={() => setIsEditing(true)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Form
                    </Button>
                  ) : (
                    <>
                      <Button onClick={handleUpdate} disabled={loading}>
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Save Changes
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setIsEditing(false)}
                      >
                        Cancel
                      </Button>
                    </>
                  )}
                </>
              )}
            </div>

            <div className="space-x-2">
              {isAdmin && (
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deleteLoading}
                >
                  {deleteLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Form
                    </>
                  )}
                </Button>
              )}
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
