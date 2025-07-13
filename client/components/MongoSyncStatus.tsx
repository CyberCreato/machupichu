import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Database, RefreshCw, CheckCircle, AlertCircle } from "lucide-react";

interface SyncStatus {
  isRunning: boolean;
  lastSync: string | null;
}

export function MongoSyncStatus() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSyncStatus = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const token = localStorage.getItem("auth_token");
      const response = await fetch("/api/mongo/status", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.ok) {
        throw new Error("Failed to fetch sync status");
      }

      const status = await response.json();
      setSyncStatus(status);
    } catch (error) {
      console.error("Error fetching sync status:", error);
      setError(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  };

  const triggerManualSync = async () => {
    try {
      setIsSyncing(true);
      setError(null);

      const token = localStorage.getItem("auth_token");
      const response = await fetch("/api/mongo/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!response.ok) {
        throw new Error("Failed to trigger sync");
      }

      const result = await response.json();
      if (result.success) {
        // Refresh status after successful sync
        await fetchSyncStatus();
      } else {
        throw new Error(result.error || "Sync failed");
      }
    } catch (error) {
      console.error("Error triggering sync:", error);
      setError(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    fetchSyncStatus();
    // Refresh status every 30 seconds
    const interval = setInterval(fetchSyncStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Database className="h-5 w-5 mr-2" />
          MongoDB Sync Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {syncStatus && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Service Status:</span>
              <Badge
                variant={syncStatus.isRunning ? "default" : "secondary"}
                className={
                  syncStatus.isRunning
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }
              >
                {syncStatus.isRunning ? (
                  <CheckCircle className="h-3 w-3 mr-1" />
                ) : (
                  <AlertCircle className="h-3 w-3 mr-1" />
                )}
                {syncStatus.isRunning ? "Running" : "Stopped"}
              </Badge>
            </div>

            {syncStatus.lastSync && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Last Sync:</span>
                <span className="text-sm text-gray-600">
                  {new Date(syncStatus.lastSync).toLocaleString()}
                </span>
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchSyncStatus}
                disabled={isLoading}
              >
                <RefreshCw
                  className={`h-4 w-4 mr-1 ${isLoading ? "animate-spin" : ""}`}
                />
                Refresh Status
              </Button>

              <Button
                variant="default"
                size="sm"
                onClick={triggerManualSync}
                disabled={isSyncing}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Database
                  className={`h-4 w-4 mr-1 ${isSyncing ? "animate-pulse" : ""}`}
                />
                {isSyncing ? "Syncing..." : "Manual Sync"}
              </Button>
            </div>

            <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
              <strong>Auto-sync:</strong> Data is automatically synced to
              MongoDB every 5 minutes.
              <br />
              <strong>Collections:</strong> Users, Jobs, Schedules, Clients,
              Forms, Submissions
            </div>
          </div>
        )}

        {isLoading && !syncStatus && (
          <div className="flex items-center justify-center py-4">
            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            Loading sync status...
          </div>
        )}
      </CardContent>
    </Card>
  );
}
