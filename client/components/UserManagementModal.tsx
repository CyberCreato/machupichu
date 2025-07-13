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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { User } from "@shared/types";
import { Loader2, UserCheck, Trash2 } from "lucide-react";

interface UserManagementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  onUserUpdated: () => void;
}

export function UserManagementModal({
  open,
  onOpenChange,
  user,
  onUserUpdated,
}: UserManagementModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [userData, setUserData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    username: user?.username || "",
    role: user?.role || "staff",
  });

  React.useEffect(() => {
    if (user) {
      setUserData({
        name: user.name,
        email: user.email,
        username: user.username,
        role: user.role,
      });
    }
  }, [user]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

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

      const response = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(userData),
      });

      if (response.ok) {
        onUserUpdated();
        setIsEditing(false);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to update user");
      }
    } catch (error) {
      setError("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!user) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete ${user.name}? This action cannot be undone.`,
    );

    if (!confirmed) return;

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("auth_token");
      const headers: Record<string, string> = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`/api/users/${user.id}`, {
        method: "DELETE",
        headers,
      });

      if (response.ok) {
        onUserUpdated();
        onOpenChange(false);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to delete user");
      }
    } catch (error) {
      setError("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-2 h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
            <UserCheck className="h-6 w-6 text-purple-600" />
          </div>
          <DialogTitle className="text-center">
            {isEditing ? "Edit User" : "User Profile"}
          </DialogTitle>
          <DialogDescription className="text-center">
            {isEditing
              ? "Update user information and permissions"
              : "View and manage user details"}
          </DialogDescription>
        </DialogHeader>

        {!isEditing ? (
          // View Mode
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold">{user.name}</h3>
              <p className="text-gray-600">@{user.username}</p>
              <Badge
                variant={user.role === "admin" ? "default" : "secondary"}
                className="mt-2"
              >
                {user.role}
              </Badge>
            </div>

            <div className="space-y-3">
              <div>
                <Label className="text-sm font-medium text-gray-500">
                  Email
                </Label>
                <p className="text-sm">{user.email}</p>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-500">
                  Member Since
                </Label>
                <p className="text-sm">
                  {new Date(user.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="flex justify-between space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsEditing(true)}
                className="flex-1"
              >
                Edit Details
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={loading || user.role === "admin"}
                className="flex-1"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          // Edit Mode
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={userData.name}
                onChange={(e) =>
                  setUserData({ ...userData, name: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={userData.email}
                onChange={(e) =>
                  setUserData({ ...userData, email: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={userData.username}
                onChange={(e) =>
                  setUserData({ ...userData, username: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={userData.role}
                onValueChange={(value: "admin" | "staff") =>
                  setUserData({ ...userData, role: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem key="staff" value="staff">
                    Staff
                  </SelectItem>
                  <SelectItem key="admin" value="admin">
                    Admin
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update User"
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
