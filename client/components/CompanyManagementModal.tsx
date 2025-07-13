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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Company } from "@shared/types";
import { Loader2, Save, Trash2, Building2 } from "lucide-react";

interface CompanyManagementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company: Company | null;
  onCompanyUpdated: () => void;
}

export function CompanyManagementModal({
  open,
  onOpenChange,
  company,
  onCompanyUpdated,
}: CompanyManagementModalProps) {
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const [companyData, setCompanyData] = useState({
    name: "",
    description: "",
    address: "",
    phone: "",
    email: "",
    website: "",
  });

  useEffect(() => {
    if (company && open) {
      setCompanyData({
        name: company.name || "",
        description: (company as any).description || "",
        address: (company as any).address || "",
        phone: (company as any).phone || "",
        email: (company as any).email || "",
        website: (company as any).website || "",
      });
      setIsEditing(false);
      setError(null);
    }
  }, [company, open]);

  const handleUpdate = async () => {
    if (!company) return;

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

      const response = await fetch(`/api/companies/${company.id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(companyData),
      });

      if (response.ok) {
        onCompanyUpdated();
        setIsEditing(false);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to update company");
      }
    } catch (error) {
      setError("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!company) return;

    if (
      !confirm(
        `Are you sure you want to delete "${company.name}"? This action cannot be undone.`,
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

      const response = await fetch(`/api/companies/${company.id}`, {
        method: "DELETE",
        headers,
      });

      if (response.ok) {
        onCompanyUpdated();
        onOpenChange(false);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to delete company");
      }
    } catch (error) {
      setError("Network error occurred");
    } finally {
      setDeleteLoading(false);
    }
  };

  if (!company) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Building2 className="h-5 w-5 mr-2" />
            {isEditing ? "Edit Company" : "Company Details"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update company information"
              : "View and manage company details"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Company Name</Label>
            <Input
              id="name"
              value={companyData.name}
              onChange={(e) =>
                setCompanyData({ ...companyData, name: e.target.value })
              }
              disabled={!isEditing}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={companyData.description}
              onChange={(e) =>
                setCompanyData({ ...companyData, description: e.target.value })
              }
              disabled={!isEditing}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={companyData.phone}
                onChange={(e) =>
                  setCompanyData({ ...companyData, phone: e.target.value })
                }
                disabled={!isEditing}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={companyData.email}
                onChange={(e) =>
                  setCompanyData({ ...companyData, email: e.target.value })
                }
                disabled={!isEditing}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={companyData.address}
              onChange={(e) =>
                setCompanyData({ ...companyData, address: e.target.value })
              }
              disabled={!isEditing}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              value={companyData.website}
              onChange={(e) =>
                setCompanyData({ ...companyData, website: e.target.value })
              }
              disabled={!isEditing}
              placeholder="https://..."
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-between pt-4">
            <div className="space-x-2">
              {!isEditing ? (
                <Button onClick={() => setIsEditing(true)}>Edit Company</Button>
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
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                </>
              )}
            </div>

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
                  Delete
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
