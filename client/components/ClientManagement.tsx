import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Users,
  MapPin,
  FileText,
  TrendingUp,
  AlertTriangle,
  Plus,
  Search,
  Eye,
} from "lucide-react";
import { Job } from "@shared/types";

interface Client {
  id: string;
  name: string;
  address: string;
  phone?: string;
  email?: string;
  totalClaims: number;
  comebacks: number;
  firstClaimDate: string;
  lastClaimDate: string;
  claims: ClientClaim[];
}

interface ClientClaim {
  jobId: string;
  claimNumber: string;
  date: string;
  category: string;
  status: string;
  isComeback: boolean;
}

interface ClientManagementProps {
  jobs: Job[];
}

export function ClientManagement({ jobs }: ClientManagementProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    generateClientData();
  }, [jobs]);

  const generateClientData = () => {
    const clientMap = new Map<string, Client>();

    jobs.forEach((job) => {
      const clientName = job.insuredName || job.InsuredName || "Unknown";
      const clientAddress = job.riskAddress || job.RiskAddress || "Unknown";
      const clientKey = `${clientName.toLowerCase()}-${clientAddress.toLowerCase()}`;

      if (!clientMap.has(clientKey)) {
        clientMap.set(clientKey, {
          id: `client-${Date.now()}-${Math.random()}`,
          name: clientName,
          address: clientAddress,
          phone: job.insCell || job.InsCell || "",
          email: job.insEmail || job.insEmail || "",
          totalClaims: 0,
          comebacks: 0,
          firstClaimDate: job.dueDate || "",
          lastClaimDate: job.dueDate || "",
          claims: [],
        });
      }

      const client = clientMap.get(clientKey)!;
      const claimDate = job.dueDate || new Date().toISOString();

      // Check if this is a comeback (same address with previous claims)
      const isComeback = client.claims.length > 0;

      const claim: ClientClaim = {
        jobId: job.id,
        claimNumber: job.claimNo || job.ClaimNo || "N/A",
        date: claimDate,
        category: job.category || "General",
        status: job.status,
        isComeback,
      };

      client.claims.push(claim);
      client.totalClaims++;

      if (isComeback) {
        client.comebacks++;
      }

      // Update date ranges
      if (claimDate < client.firstClaimDate) {
        client.firstClaimDate = claimDate;
      }
      if (claimDate > client.lastClaimDate) {
        client.lastClaimDate = claimDate;
      }
    });

    // Sort claims by date for each client
    clientMap.forEach((client) => {
      client.claims.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      );
    });

    const clientArray = Array.from(clientMap.values()).sort(
      (a, b) => b.totalClaims - a.totalClaims,
    );

    setClients(clientArray);
  };

  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.address.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const getClientRiskLevel = (client: Client) => {
    if (client.comebacks >= 3) return "high";
    if (client.comebacks >= 1) return "medium";
    return "low";
  };

  const getRiskBadge = (level: string) => {
    switch (level) {
      case "high":
        return (
          <Badge variant="destructive" className="text-xs">
            High Risk
          </Badge>
        );
      case "medium":
        return (
          <Badge variant="secondary" className="text-xs">
            Medium Risk
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-xs">
            Low Risk
          </Badge>
        );
    }
  };

  const totalClients = clients.length;
  const highRiskClients = clients.filter(
    (c) => getClientRiskLevel(c) === "high",
  ).length;
  const totalComebacks = clients.reduce(
    (sum, client) => sum + client.comebacks,
    0,
  );
  const averageClaims =
    totalClients > 0
      ? (
          clients.reduce((sum, client) => sum + client.totalClaims, 0) /
          totalClients
        ).toFixed(1)
      : "0";

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">
                  Total Clients
                </p>
                <p className="text-2xl font-bold text-blue-600">
                  {totalClients}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">
                  High Risk Clients
                </p>
                <p className="text-2xl font-bold text-red-600">
                  {highRiskClients}
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
                  Total Comebacks
                </p>
                <p className="text-2xl font-bold text-orange-600">
                  {totalComebacks}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">
                  Avg Claims/Client
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {averageClaims}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Client Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Client Management
            </CardTitle>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search clients or addresses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client Name</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Total Claims</TableHead>
                <TableHead>Comebacks</TableHead>
                <TableHead>Risk Level</TableHead>
                <TableHead>Last Claim</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    {searchTerm
                      ? "No clients match your search"
                      : "No clients found"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredClients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <MapPin className="h-3 w-3 mr-1 text-gray-400" />
                        <span className="text-sm truncate max-w-xs">
                          {client.address}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{client.totalClaims}</Badge>
                    </TableCell>
                    <TableCell>
                      {client.comebacks > 0 ? (
                        <Badge variant="destructive">{client.comebacks}</Badge>
                      ) : (
                        <span className="text-gray-400">0</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {getRiskBadge(getClientRiskLevel(client))}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {client.lastClaimDate
                        ? new Date(client.lastClaimDate).toLocaleDateString()
                        : "N/A"}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedClient(client);
                          setShowDetails(true);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Client Details Modal */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Client Details - {selectedClient?.name}
            </DialogTitle>
          </DialogHeader>

          {selectedClient && (
            <div className="space-y-6">
              {/* Client Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Client Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Name</Label>
                      <p className="text-sm">{selectedClient.name}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Address</Label>
                      <p className="text-sm">{selectedClient.address}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Phone</Label>
                      <p className="text-sm">{selectedClient.phone || "N/A"}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Email</Label>
                      <p className="text-sm">{selectedClient.email || "N/A"}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">First Claim</Label>
                      <p className="text-sm">
                        {new Date(
                          selectedClient.firstClaimDate,
                        ).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Risk Level</Label>
                      <div className="mt-1">
                        {getRiskBadge(getClientRiskLevel(selectedClient))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Claims History */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Claims History ({selectedClient.claims.length} claims)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Claim Number</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Type</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedClient.claims.map((claim, index) => (
                        <TableRow key={claim.jobId}>
                          <TableCell>
                            {new Date(claim.date).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="font-medium">
                            {claim.claimNumber}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{claim.category}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                claim.status === "completed"
                                  ? "default"
                                  : claim.status === "in_progress"
                                    ? "secondary"
                                    : "outline"
                              }
                            >
                              {claim.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {claim.isComeback ? (
                              <Badge variant="destructive" className="text-xs">
                                Comeback
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs">
                                Initial
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
