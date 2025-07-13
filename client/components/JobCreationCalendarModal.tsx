import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Calendar,
  Clock,
  User as UserIcon,
  Plus,
  ChevronLeft,
} from "lucide-react";
import { User } from "@shared/types";
import { StaffCalendarView } from "./StaffCalendarView";
import { Job } from "@shared/types";

interface JobCreationCalendarModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staff: User[];
  jobs: Job[];
  onCreateJobWithTime: (staffId: string, timeSlot: string, date: Date) => void;
}

export function JobCreationCalendarModal({
  open,
  onOpenChange,
  staff,
  jobs,
  onCreateJobWithTime,
}: JobCreationCalendarModalProps) {
  const [selectedStaff, setSelectedStaff] = useState<string>("");

  const handleCreateJob = (staffId: string, timeSlot: string, date: Date) => {
    onCreateJobWithTime(staffId, timeSlot, date);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            {selectedStaff && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedStaff("")}
                className="mr-2 p-1 hover:bg-gray-100"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
            <Calendar className="h-5 w-5 mr-2" />
            Create Job with Calendar
            {selectedStaff && (
              <span className="ml-2 text-sm font-normal text-gray-600">
                - {staff.find((s) => s.id === selectedStaff)?.name}
              </span>
            )}
          </DialogTitle>
          <DialogDescription>
            {selectedStaff
              ? "Click on a time slot to create a new job for the selected staff member"
              : "Select a staff member and click on a time slot to create a new job"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <StaffCalendarView
            jobs={jobs}
            staff={staff}
            selectedStaff={selectedStaff}
            onStaffSelect={setSelectedStaff}
            onCreateJob={handleCreateJob}
          />

          {!selectedStaff && (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <UserIcon className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  Select a Staff Member
                </h3>
                <p className="text-muted-foreground text-center">
                  Choose a staff member to view their calendar and create jobs
                </p>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-between items-center pt-4 border-t">
            <div className="flex space-x-2 text-sm text-muted-foreground">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-100 border border-red-200 rounded mr-1"></div>
                High Priority
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-yellow-100 border border-yellow-200 rounded mr-1"></div>
                Medium Priority
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-100 border border-green-200 rounded mr-1"></div>
                Low Priority
              </div>
            </div>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
