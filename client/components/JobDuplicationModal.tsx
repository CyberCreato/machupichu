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
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Copy, Clock, MapPin, User } from "lucide-react";
import { Job, User as UserType } from "@shared/types";
import { format } from "date-fns";

interface JobDuplicationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: Job | null;
  staff: UserType[];
  onDuplicate: (originalJob: Job, newDate: Date, newStaffId?: string) => void;
}

export function JobDuplicationModal({
  open,
  onOpenChange,
  job,
  staff,
  onDuplicate,
}: JobDuplicationModalProps) {
  const [newDate, setNewDate] = useState<string>("");
  const [newTime, setNewTime] = useState<string>("09:00");
  const [newStaffId, setNewStaffId] = useState<string>("");
  const [keepOriginalStaff, setKeepOriginalStaff] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!job || !newDate) return;

    const [year, month, day] = newDate.split("-").map(Number);
    const [hours, minutes] = newTime.split(":").map(Number);
    const duplicateDate = new Date(year, month - 1, day, hours, minutes);

    const staffId = keepOriginalStaff ? job.assignedTo : newStaffId;
    onDuplicate(job, duplicateDate, staffId);
    onOpenChange(false);

    // Reset form
    setNewDate("");
    setNewTime("09:00");
    setNewStaffId("");
    setKeepOriginalStaff(true);
  };

  const assignedStaff = staff.find((s) => s.id === job?.assignedTo);

  if (!job) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Copy className="h-5 w-5 mr-2" />
            Duplicate Job
          </DialogTitle>
          <DialogDescription>
            Create a copy of this job for a different date and time
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Original Job Info */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-medium">{job.title}</h3>
                  <p className="text-sm text-gray-600">{job.description}</p>
                </div>
                <Badge variant="outline">Original Job</Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  {job.dueDate
                    ? format(new Date(job.dueDate), "PPP p")
                    : "No due date"}
                </div>
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  {assignedStaff?.name || "Unassigned"}
                </div>
                {job.claimNo && (
                  <div>
                    <strong>Claim:</strong> {job.claimNo}
                  </div>
                )}
                {job.riskAddress && (
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2" />
                    {job.riskAddress.length > 30
                      ? `${job.riskAddress.substring(0, 30)}...`
                      : job.riskAddress}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Duplication Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="newDate">New Date</Label>
                <Input
                  id="newDate"
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  required
                  min={format(new Date(), "yyyy-MM-dd")}
                />
              </div>
              <div>
                <Label htmlFor="newTime">New Time</Label>
                <Input
                  id="newTime"
                  type="time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Staff Assignment */}
            <div className="space-y-3">
              <Label>Staff Assignment</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="keepOriginal"
                    name="staffAssignment"
                    checked={keepOriginalStaff}
                    onChange={() => setKeepOriginalStaff(true)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <Label htmlFor="keepOriginal" className="text-sm">
                    Keep original staff member ({assignedStaff?.name})
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="changeStaff"
                    name="staffAssignment"
                    checked={!keepOriginalStaff}
                    onChange={() => setKeepOriginalStaff(false)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <Label htmlFor="changeStaff" className="text-sm">
                    Assign to different staff member
                  </Label>
                </div>
              </div>

              {!keepOriginalStaff && (
                <select
                  value={newStaffId}
                  onChange={(e) => setNewStaffId(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="">Select staff member</option>
                  {staff.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name} ({member.role})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Preview */}
            {newDate && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <h4 className="font-medium mb-2 text-blue-900">
                    Duplicate Job Preview
                  </h4>
                  <div className="text-sm text-blue-800 space-y-1">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      {format(new Date(`${newDate}T${newTime}`), "PPP p")}
                    </div>
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-2" />
                      {keepOriginalStaff
                        ? assignedStaff?.name
                        : staff.find((s) => s.id === newStaffId)?.name ||
                          "Select staff"}
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2" />
                      Status will be reset to "pending"
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={!newDate}>
                <Copy className="h-4 w-4 mr-2" />
                Duplicate Job
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
