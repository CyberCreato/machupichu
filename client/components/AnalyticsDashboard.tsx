import React, { useMemo } from "react";
import { Job, User } from "@shared/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import {
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Users,
  Briefcase,
} from "lucide-react";

// Chart Error Boundary Component
class ChartErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Only log non-ResizeObserver errors
    if (!error.message.includes("ResizeObserver")) {
      console.error("Chart error:", error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex items-center justify-center h-64 text-gray-500">
            <div className="text-center">
              <AlertCircle className="h-8 w-8 mx-auto mb-2" />
              <p>Chart temporarily unavailable</p>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

interface AnalyticsDashboardProps {
  jobs: Job[];
  staff: User[];
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

interface StaffPerformance {
  staffId: string;
  name: string;
  totalJobs: number;
  completedJobs: number;
  pendingJobs: number;
  inProgressJobs: number;
  completionRate: number;
  avgCompletionTime: number;
  onTimeJobs: number;
  lateJobs: number;
  onTimeRate: number;
}

interface JobTypeStats {
  type: string;
  count: number;
  percentage: number;
}

export function AnalyticsDashboard({ jobs, staff }: AnalyticsDashboardProps) {
  // Calculate job status distribution
  const jobStatusData = useMemo(() => {
    const statusCounts = jobs.reduce(
      (acc, job) => {
        acc[job.status] = (acc[job.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return Object.entries(statusCounts).map(([status, count]) => ({
      name: status.replace("_", " "),
      value: count,
      percentage: ((count / jobs.length) * 100).toFixed(1),
    }));
  }, [jobs]);

  // Calculate job types distribution
  const jobTypeData = useMemo(() => {
    const typeCounts = jobs.reduce(
      (acc, job) => {
        const type = job.section || "General";
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return Object.entries(typeCounts).map(([type, count]) => ({
      type,
      count,
      percentage: ((count / jobs.length) * 100).toFixed(1),
    }));
  }, [jobs]);

  // Calculate staff performance metrics
  const staffPerformance = useMemo(() => {
    return staff.map((member): StaffPerformance => {
      const memberJobs = jobs.filter((job) => job.assignedTo === member.id);
      const completedJobs = memberJobs.filter((j) => j.status === "completed");
      const pendingJobs = memberJobs.filter((j) => j.status === "pending");
      const inProgressJobs = memberJobs.filter(
        (j) => j.status === "in_progress",
      );

      // Calculate completion rate
      const completionRate =
        memberJobs.length > 0
          ? (completedJobs.length / memberJobs.length) * 100
          : 0;

      // Calculate average completion time (mock calculation)
      const avgCompletionTime = Math.random() * 5 + 1; // 1-6 days average

      // Calculate on-time performance
      const onTimeJobs = completedJobs.filter(() => Math.random() > 0.3).length; // Mock: 70% on time
      const lateJobs = completedJobs.length - onTimeJobs;
      const onTimeRate =
        completedJobs.length > 0
          ? (onTimeJobs / completedJobs.length) * 100
          : 0;

      return {
        staffId: member.id,
        name: member.name,
        totalJobs: memberJobs.length,
        completedJobs: completedJobs.length,
        pendingJobs: pendingJobs.length,
        inProgressJobs: inProgressJobs.length,
        completionRate,
        avgCompletionTime,
        onTimeJobs,
        lateJobs,
        onTimeRate,
      };
    });
  }, [staff, jobs]);

  // Monthly job completion trends (mock data for demo)
  const monthlyData = useMemo(() => {
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    return months.map((month, index) => ({
      month,
      completed: Math.floor(Math.random() * 50) + 10,
      pending: Math.floor(Math.random() * 20) + 5,
      inProgress: Math.floor(Math.random() * 15) + 3,
    }));
  }, []);

  const topPerformer = staffPerformance.reduce(
    (top, current) =>
      current.completionRate > top.completionRate ? current : top,
    staffPerformance[0] || ({} as StaffPerformance),
  );

  const totalJobsCompleted = jobs.filter(
    (job) => job.status === "completed",
  ).length;
  const totalJobsPending = jobs.filter(
    (job) => job.status === "pending",
  ).length;
  const overallCompletionRate =
    jobs.length > 0 ? (totalJobsCompleted / jobs.length) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Completion Rate
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {overallCompletionRate.toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Briefcase className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Jobs</p>
                <p className="text-2xl font-bold text-gray-900">
                  {jobs.length - totalJobsCompleted}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg. Time</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(
                    staffPerformance.reduce(
                      (sum, s) => sum + s.avgCompletionTime,
                      0,
                    ) / staffPerformance.length || 0
                  ).toFixed(1)}
                  d
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Top Performer
                </p>
                <p className="text-lg font-bold text-gray-900">
                  {topPerformer?.name || "N/A"}
                </p>
                <p className="text-xs text-gray-500">
                  {topPerformer?.completionRate?.toFixed(1)}% rate
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Job Status Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Job Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartErrorBoundary>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={jobStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name} (${percentage}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {jobStatusData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </ChartErrorBoundary>
          </CardContent>
        </Card>

        {/* Staff Performance Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Staff Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartErrorBoundary>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={staffPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="completedJobs"
                    fill="#00C49F"
                    name="Completed"
                  />
                  <Bar
                    dataKey="inProgressJobs"
                    fill="#FFBB28"
                    name="In Progress"
                  />
                  <Bar dataKey="pendingJobs" fill="#FF8042" name="Pending" />
                </BarChart>
              </ResponsiveContainer>
            </ChartErrorBoundary>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trends Line Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Job Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartErrorBoundary>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="completed"
                    stroke="#00C49F"
                    name="Completed"
                  />
                  <Line
                    type="monotone"
                    dataKey="inProgress"
                    stroke="#FFBB28"
                    name="In Progress"
                  />
                  <Line
                    type="monotone"
                    dataKey="pending"
                    stroke="#FF8042"
                    name="Pending"
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartErrorBoundary>
          </CardContent>
        </Card>

        {/* Job Types Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Job Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {jobTypeData.map((type, index) => (
                <div
                  key={type.type}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm font-medium">{type.type}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">{type.count}</span>
                    <Badge variant="secondary">{type.percentage}%</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Staff Performance Details Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Staff Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Staff Member</th>
                  <th className="text-center p-3">Total Jobs</th>
                  <th className="text-center p-3">Completed</th>
                  <th className="text-center p-3">Completion Rate</th>
                  <th className="text-center p-3">On-Time Rate</th>
                  <th className="text-center p-3">Avg. Time</th>
                </tr>
              </thead>
              <tbody>
                {staffPerformance.map((performance) => (
                  <tr key={performance.staffId} className="border-b">
                    <td className="p-3">
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <Users className="h-4 w-4 text-blue-600" />
                        </div>
                        <span className="font-medium">{performance.name}</span>
                      </div>
                    </td>
                    <td className="text-center p-3">{performance.totalJobs}</td>
                    <td className="text-center p-3">
                      {performance.completedJobs}
                    </td>
                    <td className="text-center p-3">
                      <Badge
                        variant={
                          performance.completionRate >= 80
                            ? "default"
                            : performance.completionRate >= 60
                              ? "secondary"
                              : "destructive"
                        }
                      >
                        {performance.completionRate.toFixed(1)}%
                      </Badge>
                    </td>
                    <td className="text-center p-3">
                      <Badge
                        variant={
                          performance.onTimeRate >= 80
                            ? "default"
                            : performance.onTimeRate >= 60
                              ? "secondary"
                              : "destructive"
                        }
                      >
                        {performance.onTimeRate.toFixed(1)}%
                      </Badge>
                    </td>
                    <td className="text-center p-3">
                      {performance.avgCompletionTime.toFixed(1)}d
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
