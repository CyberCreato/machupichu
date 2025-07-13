import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  DollarSign,
  Calendar,
  TrendingUp,
  FileText,
  Download,
  Users,
  AlertCircle,
} from "lucide-react";
import { Job, User } from "@shared/types";
import { format, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";

interface SalaryRecord {
  jobId: string;
  jobTitle: string;
  jobCategory: string;
  pricingType: "call-out" | "repair" | "replacement";
  amount: number;
  date: string;
  status: "completed" | "pending";
  isAssisting: boolean;
}

interface StaffSalaryData {
  staffId: string;
  staffName: string;
  totalEarnings: number;
  jobsCompleted: number;
  jobsAssisting: number;
  records: SalaryRecord[];
}

interface StaffSalaryTrackerProps {
  jobs: Job[];
  staff: User[];
  currentUser: User;
}

const ZAUNDRE_PRICING = {
  "call-out": 120,
  repair: 200,
  replacement: 250,
};

export function StaffSalaryTracker({
  jobs,
  staff,
  currentUser,
}: StaffSalaryTrackerProps) {
  const [selectedMonth, setSelectedMonth] = useState(
    format(new Date(), "yyyy-MM"),
  );
  const [selectedStaff, setSelectedStaff] = useState<string>("staff-4"); // Zaundre's ID
  const [salaryData, setSalaryData] = useState<Record<string, StaffSalaryData>>(
    {},
  );

  // Only show to admins
  if (currentUser.role !== "admin") {
    return null;
  }

  useEffect(() => {
    calculateSalaryData();
  }, [jobs, selectedMonth]);

  const calculateSalaryData = () => {
    const monthStart = startOfMonth(new Date(selectedMonth + "-01"));
    const monthEnd = endOfMonth(monthStart);

    const staffSalaries: Record<string, StaffSalaryData> = {};

    // Initialize staff data
    staff.forEach((staffMember) => {
      staffSalaries[staffMember.id] = {
        staffId: staffMember.id,
        staffName: staffMember.name,
        totalEarnings: 0,
        jobsCompleted: 0,
        jobsAssisting: 0,
        records: [],
      };
    });

    // Process jobs for the selected month
    jobs.forEach((job) => {
      if (!job.dueDate || !job.assignedTo) return;

      const jobDate = new Date(job.dueDate);
      if (!isWithinInterval(jobDate, { start: monthStart, end: monthEnd }))
        return;

      const staffMember = staffSalaries[job.assignedTo];
      if (!staffMember) return;

      // Only calculate salary for Zaundre (staff-4) for now
      if (job.assignedTo === "staff-4" && !job.isAssisting) {
        let pricingType: "call-out" | "repair" | "replacement" = "call-out";
        let amount = ZAUNDRE_PRICING["call-out"];

        // Determine pricing based on job category and status
        if (job.category === "Geyser Replacement") {
          pricingType = "replacement";
          amount = ZAUNDRE_PRICING.replacement;
        } else if (
          job.status === "completed" &&
          (job.category === "Geyser Assessment" ||
            job.category === "Leak Detection" ||
            job.category === "Toilet/Shower")
        ) {
          // Check if it became a repair (simplified logic)
          pricingType =
            job.category !== "Geyser Assessment" ? "repair" : "call-out";
          amount =
            pricingType === "repair"
              ? ZAUNDRE_PRICING.repair
              : ZAUNDRE_PRICING["call-out"];
        }

        const record: SalaryRecord = {
          jobId: job.id,
          jobTitle: job.title,
          jobCategory: job.category || "Not specified",
          pricingType,
          amount,
          date: job.dueDate,
          status: job.status as "completed" | "pending",
          isAssisting: false,
        };

        staffMember.records.push(record);

        if (job.status === "completed") {
          staffMember.totalEarnings += amount;
          staffMember.jobsCompleted++;
        }
      } else if (job.isAssisting) {
        staffMember.jobsAssisting++;
      }
    });

    setSalaryData(staffSalaries);
  };

  const generateCSV = () => {
    const selectedStaffData = salaryData[selectedStaff];
    if (!selectedStaffData) return;

    const headers = [
      "Date",
      "Job Title",
      "Category",
      "Pricing Type",
      "Amount (R)",
      "Status",
      "Is Assisting",
    ];

    const csvContent = [
      headers.join(","),
      ...selectedStaffData.records.map((record) =>
        [
          format(new Date(record.date), "yyyy-MM-dd"),
          `"${record.jobTitle}"`,
          `"${record.jobCategory}"`,
          record.pricingType,
          record.amount,
          record.status,
          record.isAssisting ? "Yes" : "No",
        ].join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${selectedStaffData.staffName}_salary_${selectedMonth}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const selectedStaffData = salaryData[selectedStaff];
  const completedRecords =
    selectedStaffData?.records.filter((r) => r.status === "completed") || [];
  const pendingRecords =
    selectedStaffData?.records.filter((r) => r.status === "pending") || [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <DollarSign className="h-5 w-5 mr-2" />
            Staff Salary Tracker
            <Badge variant="outline" className="ml-2">
              Admin Only
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Month</label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => {
                    const date = new Date();
                    date.setMonth(date.getMonth() - i);
                    const value = format(date, "yyyy-MM");
                    const label = format(date, "MMMM yyyy");
                    return (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Select Staff</label>
              <Select value={selectedStaff} onValueChange={setSelectedStaff}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {staff
                    .filter((s) => s.role === "staff")
                    .map((staffMember) => (
                      <SelectItem key={staffMember.id} value={staffMember.id}>
                        <div
                          key={`${staffMember.id}-container`}
                          className="flex items-center"
                        >
                          <span key={`${staffMember.id}-name`}>
                            {staffMember.name}
                          </span>
                          {staffMember.id === "staff-4" && (
                            <Badge
                              key={`${staffMember.id}-badge`}
                              variant="secondary"
                              className="ml-2 text-xs"
                            >
                              Salary Tracking Active
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Actions</label>
              <Button
                onClick={generateCSV}
                disabled={!selectedStaffData}
                className="w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>

          {selectedStaff !== "staff-4" && (
            <div className="mb-6">
              <Badge variant="outline" className="text-amber-600">
                <AlertCircle className="h-4 w-4 mr-1" />
                Salary tracking is currently only active for Zaundre
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedStaffData && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <DollarSign className="h-8 w-8 text-green-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">
                      Total Earnings
                    </p>
                    <p className="text-2xl font-bold text-green-600">
                      {`R${selectedStaffData.totalEarnings}`}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <FileText className="h-8 w-8 text-blue-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">
                      Jobs Completed
                    </p>
                    <p className="text-2xl font-bold text-blue-600">
                      {selectedStaffData.jobsCompleted}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-purple-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">
                      Jobs Assisting
                    </p>
                    <p className="text-2xl font-bold text-purple-600">
                      {selectedStaffData.jobsAssisting}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <TrendingUp className="h-8 w-8 text-orange-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">
                      Avg per Job
                    </p>
                    <p className="text-2xl font-bold text-orange-600">
                      {`R${
                        selectedStaffData.jobsCompleted > 0
                          ? Math.round(
                              selectedStaffData.totalEarnings /
                                selectedStaffData.jobsCompleted,
                            )
                          : 0
                      }`}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Pricing Structure */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Pricing Structure (Zaundre)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <span className="font-medium">Call-out (Assessment)</span>
                  <Badge variant="secondary">R120</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <span className="font-medium">Repair Work</span>
                  <Badge variant="secondary">R200</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                  <span className="font-medium">Geyser Replacement</span>
                  <Badge variant="secondary">R250</Badge>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                * Assisting other staff members does not generate payment
              </p>
            </CardContent>
          </Card>

          {/* Job Records Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Job Records - {selectedStaffData.staffName}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Job Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedStaffData.records.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        No jobs found for this month
                      </TableCell>
                    </TableRow>
                  ) : (
                    selectedStaffData.records.map((record) => (
                      <TableRow key={record.jobId}>
                        <TableCell>
                          {format(new Date(record.date), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell className="font-medium">
                          {record.jobTitle}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{record.jobCategory}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              record.pricingType === "replacement"
                                ? "default"
                                : record.pricingType === "repair"
                                  ? "secondary"
                                  : "outline"
                            }
                          >
                            {record.pricingType}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium text-green-600">
                          {`R${record.amount}`}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              record.status === "completed"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {record.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
