import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Clock,
  Users,
  Settings,
  Save,
  RotateCcw,
  Moon,
  Sun,
  AlertCircle,
} from "lucide-react";
import { User } from "@shared/types";

interface ShiftSettings {
  normalShiftStart: string;
  normalShiftEnd: string;
  lateShiftStart: string;
  lateShiftEnd: string;
  alternatingWeeks: boolean;
  allowExtensions: boolean;
  maxExtensionHours: number;
}

interface StaffShiftAssignment {
  staffId: string;
  currentShift: "normal" | "late";
  customStart?: string;
  customEnd?: string;
  weekType: "normal" | "late";
}

interface EnhancedShiftManagementProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staff: User[];
  currentUser: User;
  onShiftUpdate: (assignments: StaffShiftAssignment[]) => void;
}

export function EnhancedShiftManagement({
  open,
  onOpenChange,
  staff,
  currentUser,
  onShiftUpdate,
}: EnhancedShiftManagementProps) {
  const [shiftSettings, setShiftSettings] = useState<ShiftSettings>({
    normalShiftStart: "05:00",
    normalShiftEnd: "17:00",
    lateShiftStart: "05:00",
    lateShiftEnd: "19:00",
    alternatingWeeks: true,
    allowExtensions: true,
    maxExtensionHours: 3,
  });

  const [staffAssignments, setStaffAssignments] = useState<
    StaffShiftAssignment[]
  >([]);
  const [presetTemplates] = useState([
    { name: "Standard Business Hours", start: "08:00", end: "17:00" },
    { name: "Early Shift", start: "05:00", end: "14:00" },
    { name: "Late Shift", start: "14:00", end: "23:00" },
    { name: "Extended Day", start: "05:00", end: "19:00" },
  ]);

  const isAdmin = currentUser.role === "admin";

  useEffect(() => {
    if (open) {
      initializeStaffAssignments();
    }
  }, [open, staff]);

  const initializeStaffAssignments = () => {
    const assignments = staff
      .filter((s) => s.role === "staff")
      .map(
        (staffMember): StaffShiftAssignment => ({
          staffId: staffMember.id,
          currentShift:
            staffMember.schedule?.workingLateShift || false ? "late" : "normal",
          customStart: staffMember.schedule?.shiftStartTime,
          customEnd: staffMember.schedule?.shiftEndTime,
          weekType: staffMember.schedule?.weekType || "normal",
        }),
      );

    setStaffAssignments(assignments);
  };

  const updateStaffShift = (
    staffId: string,
    field: keyof StaffShiftAssignment,
    value: any,
  ) => {
    setStaffAssignments((prev) =>
      prev.map((assignment) =>
        assignment.staffId === staffId
          ? { ...assignment, [field]: value }
          : assignment,
      ),
    );
  };

  const applyTemplate = (template: { start: string; end: string }) => {
    setShiftSettings((prev) => ({
      ...prev,
      normalShiftStart: template.start,
      normalShiftEnd: template.end,
    }));
  };

  const swapStaffShifts = (staffId1: string, staffId2: string) => {
    setStaffAssignments((prev) => {
      const newAssignments = [...prev];
      const staff1Index = newAssignments.findIndex(
        (a) => a.staffId === staffId1,
      );
      const staff2Index = newAssignments.findIndex(
        (a) => a.staffId === staffId2,
      );

      if (staff1Index !== -1 && staff2Index !== -1) {
        const temp = newAssignments[staff1Index].currentShift;
        newAssignments[staff1Index].currentShift =
          newAssignments[staff2Index].currentShift;
        newAssignments[staff2Index].currentShift = temp;
      }

      return newAssignments;
    });
  };

  const resetToDefaults = () => {
    setShiftSettings({
      normalShiftStart: "05:00",
      normalShiftEnd: "17:00",
      lateShiftStart: "05:00",
      lateShiftEnd: "19:00",
      alternatingWeeks: true,
      allowExtensions: true,
      maxExtensionHours: 3,
    });
    initializeStaffAssignments();
  };

  const handleSave = () => {
    if (!isAdmin) {
      alert("Only administrators can save shift changes.");
      return;
    }

    onShiftUpdate(staffAssignments);
    onOpenChange(false);
  };

  const getStaffMember = (staffId: string) => {
    return staff.find((s) => s.id === staffId);
  };

  const getLocationTeams = () => {
    const johannesburg = staff.filter(
      (s) => s.role === "staff" && s.location?.city === "Johannesburg",
    );
    const capeTown = staff.filter(
      (s) => s.role === "staff" && s.location?.city === "Cape Town",
    );
    return { johannesburg, capeTown };
  };

  const { johannesburg, capeTown } = getLocationTeams();

  if (!isAdmin) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Shift Management</DialogTitle>
          </DialogHeader>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Only administrators can access shift management.
            </AlertDescription>
          </Alert>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Settings className="h-5 w-5 mr-2" />
            Enhanced Shift Management
            <Badge variant="outline" className="ml-2">
              Admin Only
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Global Shift Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Global Shift Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label>Normal Shift Start</Label>
                  <Input
                    type="time"
                    value={shiftSettings.normalShiftStart}
                    onChange={(e) =>
                      setShiftSettings((prev) => ({
                        ...prev,
                        normalShiftStart: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <Label>Normal Shift End</Label>
                  <Input
                    type="time"
                    value={shiftSettings.normalShiftEnd}
                    onChange={(e) =>
                      setShiftSettings((prev) => ({
                        ...prev,
                        normalShiftEnd: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <Label>Late Shift Start</Label>
                  <Input
                    type="time"
                    value={shiftSettings.lateShiftStart}
                    onChange={(e) =>
                      setShiftSettings((prev) => ({
                        ...prev,
                        lateShiftStart: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <Label>Late Shift End</Label>
                  <Input
                    type="time"
                    value={shiftSettings.lateShiftEnd}
                    onChange={(e) =>
                      setShiftSettings((prev) => ({
                        ...prev,
                        lateShiftEnd: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Label className="text-sm font-medium">Quick Templates:</Label>
                {presetTemplates.map((template, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => applyTemplate(template)}
                  >
                    {template.name}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Team Management */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Johannesburg Team */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Johannesburg Team
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {johannesburg.map((staffMember) => {
                  const assignment = staffAssignments.find(
                    (a) => a.staffId === staffMember.id,
                  );
                  if (!assignment) return null;

                  return (
                    <Card key={staffMember.id} className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="font-medium">{staffMember.name}</div>
                        <Badge
                          variant={
                            assignment.currentShift === "late"
                              ? "default"
                              : "outline"
                          }
                          className="cursor-pointer"
                          onClick={() =>
                            updateStaffShift(
                              staffMember.id,
                              "currentShift",
                              assignment.currentShift === "late"
                                ? "normal"
                                : "late",
                            )
                          }
                        >
                          {assignment.currentShift === "late" ? (
                            <Moon className="h-3 w-3 mr-1" />
                          ) : (
                            <Sun className="h-3 w-3 mr-1" />
                          )}
                          {assignment.currentShift === "late"
                            ? "Late Shift"
                            : "Normal Shift"}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">Custom Start</Label>
                          <Input
                            type="time"
                            size="sm"
                            value={assignment.customStart || ""}
                            onChange={(e) =>
                              updateStaffShift(
                                staffMember.id,
                                "customStart",
                                e.target.value,
                              )
                            }
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Custom End</Label>
                          <Input
                            type="time"
                            size="sm"
                            value={assignment.customEnd || ""}
                            onChange={(e) =>
                              updateStaffShift(
                                staffMember.id,
                                "customEnd",
                                e.target.value,
                              )
                            }
                          />
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </CardContent>
            </Card>

            {/* Cape Town Team */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Cape Town Team
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {capeTown.map((staffMember) => {
                  const assignment = staffAssignments.find(
                    (a) => a.staffId === staffMember.id,
                  );
                  if (!assignment) return null;

                  return (
                    <Card key={staffMember.id} className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="font-medium">{staffMember.name}</div>
                        <Badge
                          variant={
                            assignment.currentShift === "late"
                              ? "default"
                              : "outline"
                          }
                          className="cursor-pointer"
                          onClick={() =>
                            updateStaffShift(
                              staffMember.id,
                              "currentShift",
                              assignment.currentShift === "late"
                                ? "normal"
                                : "late",
                            )
                          }
                        >
                          {assignment.currentShift === "late" ? (
                            <Moon className="h-3 w-3 mr-1" />
                          ) : (
                            <Sun className="h-3 w-3 mr-1" />
                          )}
                          {assignment.currentShift === "late"
                            ? "Late Shift"
                            : "Normal Shift"}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">Custom Start</Label>
                          <Input
                            type="time"
                            size="sm"
                            value={assignment.customStart || ""}
                            onChange={(e) =>
                              updateStaffShift(
                                staffMember.id,
                                "customStart",
                                e.target.value,
                              )
                            }
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Custom End</Label>
                          <Input
                            type="time"
                            size="sm"
                            value={assignment.customEnd || ""}
                            onChange={(e) =>
                              updateStaffShift(
                                staffMember.id,
                                "customEnd",
                                e.target.value,
                              )
                            }
                          />
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          {/* Drag & Drop Shift Assignment */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Drag & Drop Shift Assignment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                {/* Normal Shift Drop Zone */}
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-4 min-h-[200px] bg-blue-50"
                  onDrop={(e) => {
                    e.preventDefault();
                    const staffId = e.dataTransfer.getData("staffId");
                    if (staffId) {
                      updateStaffShift(staffId, "currentShift", "normal");
                    }
                  }}
                  onDragOver={(e) => e.preventDefault()}
                >
                  <div className="text-center mb-4">
                    <Sun className="h-8 w-8 mx-auto text-blue-600 mb-2" />
                    <h3 className="font-medium text-blue-600">
                      Normal Shift Team
                    </h3>
                    <p className="text-sm text-gray-600">
                      Drag staff members here
                    </p>
                  </div>
                  <div className="space-y-2">
                    {staffAssignments
                      .filter((a) => a.currentShift === "normal")
                      .map((assignment) => {
                        const staffMember = getStaffMember(assignment.staffId);
                        if (!staffMember) return null;
                        return (
                          <div
                            key={assignment.staffId}
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData(
                                "staffId",
                                assignment.staffId,
                              );
                            }}
                            className="bg-white border rounded-lg p-3 cursor-move hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium">
                                {staffMember.name}
                              </span>
                              <Badge
                                variant="outline"
                                className="text-blue-600"
                              >
                                <Sun className="h-3 w-3 mr-1" />
                                Normal
                              </Badge>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {staffMember.location?.city || "Unknown Location"}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* Late Shift Drop Zone */}
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-4 min-h-[200px] bg-purple-50"
                  onDrop={(e) => {
                    e.preventDefault();
                    const staffId = e.dataTransfer.getData("staffId");
                    if (staffId) {
                      updateStaffShift(staffId, "currentShift", "late");
                    }
                  }}
                  onDragOver={(e) => e.preventDefault()}
                >
                  <div className="text-center mb-4">
                    <Moon className="h-8 w-8 mx-auto text-purple-600 mb-2" />
                    <h3 className="font-medium text-purple-600">
                      Late Shift Team
                    </h3>
                    <p className="text-sm text-gray-600">
                      Drag staff members here
                    </p>
                  </div>
                  <div className="space-y-2">
                    {staffAssignments
                      .filter((a) => a.currentShift === "late")
                      .map((assignment) => {
                        const staffMember = getStaffMember(assignment.staffId);
                        if (!staffMember) return null;
                        return (
                          <div
                            key={assignment.staffId}
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData(
                                "staffId",
                                assignment.staffId,
                              );
                            }}
                            className="bg-white border rounded-lg p-3 cursor-move hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium">
                                {staffMember.name}
                              </span>
                              <Badge
                                variant="outline"
                                className="text-purple-600"
                              >
                                <Moon className="h-3 w-3 mr-1" />
                                Late
                              </Badge>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {staffMember.location?.city || "Unknown Location"}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    // Swap shifts between teams
                    johannesburg.forEach((jStaff) => {
                      const ctStaff = capeTown[0];
                      if (ctStaff) {
                        swapStaffShifts(jStaff.id, ctStaff.id);
                      }
                    });
                  }}
                >
                  Swap Team Shifts
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    // Set all to normal shift
                    setStaffAssignments((prev) =>
                      prev.map((a) => ({
                        ...a,
                        currentShift: "normal" as const,
                      })),
                    );
                  }}
                >
                  All Normal Shifts
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    // Set all to late shift
                    setStaffAssignments((prev) =>
                      prev.map((a) => ({
                        ...a,
                        currentShift: "late" as const,
                      })),
                    );
                  }}
                >
                  All Late Shifts
                </Button>
                <Button variant="outline" onClick={resetToDefaults}>
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Reset to Defaults
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-6 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
