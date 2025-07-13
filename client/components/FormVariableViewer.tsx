import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FileText,
  Search,
  Download,
  Copy,
  CheckCircle,
  AlertCircle,
  Settings,
  Database,
} from "lucide-react";
import { Form, FormField } from "@shared/types";
import { cn } from "@/lib/utils";

interface FormVariableViewerProps {
  onClose?: () => void;
}

export function FormVariableViewer({ onClose }: FormVariableViewerProps) {
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<
    "all" | "standard" | "template"
  >("all");
  const [copiedField, setCopiedField] = useState<string>("");

  useEffect(() => {
    fetchForms();
  }, []);

  const fetchForms = async () => {
    try {
      const response = await fetch("/api/forms");
      const data = await response.json();
      setForms(data);
    } catch (error) {
      console.error("Error fetching forms:", error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, fieldId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldId);
      setTimeout(() => setCopiedField(""), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const downloadFormVariables = (form: Form) => {
    const variables = form.fields.map((field) => ({
      id: field.id,
      label: field.label,
      type: field.type,
      required: field.required,
      autoFillFrom: field.autoFillFrom || "N/A",
      section: field.section || "general",
      options: field.options?.join(", ") || "N/A",
    }));

    const csvContent = [
      [
        "Variable ID",
        "Label",
        "Type",
        "Required",
        "Auto Fill From",
        "Section",
        "Options",
      ],
      ...variables.map((v) => [
        v.id,
        v.label,
        v.type,
        v.required.toString(),
        v.autoFillFrom,
        v.section,
        v.options,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${form.name.replace(/[^a-zA-Z0-9]/g, "_")}_variables.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredForms = forms.filter((form) => {
    const matchesSearch =
      form.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      form.fields.some(
        (field) =>
          field.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
          field.id.toLowerCase().includes(searchTerm.toLowerCase()),
      );

    if (selectedCategory === "all") return matchesSearch;
    if (selectedCategory === "standard")
      return matchesSearch && !form.isTemplate;
    if (selectedCategory === "template")
      return matchesSearch && form.isTemplate;

    return matchesSearch;
  });

  const getFormTypeIcon = (form: Form) => {
    if (form.isTemplate) return <Settings className="h-4 w-4 text-blue-500" />;
    return <Database className="h-4 w-4 text-green-500" />;
  };

  const getFormTypeBadge = (form: Form) => {
    if (form.isTemplate) return <Badge variant="default">Template</Badge>;
    return <Badge variant="secondary">Standard</Badge>;
  };

  const getFieldTypeColor = (type: FormField["type"]) => {
    const colors = {
      text: "bg-blue-100 text-blue-800",
      email: "bg-purple-100 text-purple-800",
      number: "bg-green-100 text-green-800",
      date: "bg-yellow-100 text-yellow-800",
      textarea: "bg-indigo-100 text-indigo-800",
      select: "bg-pink-100 text-pink-800",
      checkbox: "bg-orange-100 text-orange-800",
      radio: "bg-teal-100 text-teal-800",
      "datetime-local": "bg-amber-100 text-amber-800",
    };
    return colors[type] || "bg-gray-100 text-gray-800";
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading forms...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Form Variable Viewer
            </CardTitle>
            {onClose && (
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            View and manage all form fields and their variable names across
            standard, template, and PDF forms.
          </p>
        </CardHeader>
        <CardContent>
          {/* Search and Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search forms or fields..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Tabs
              value={selectedCategory}
              onValueChange={(value) => setSelectedCategory(value as any)}
              className="w-auto"
            >
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="standard">Standard</TabsTrigger>
                <TabsTrigger value="template">Templates</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{filteredForms.length}</div>
                <p className="text-xs text-muted-foreground">Total Forms</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-blue-600">
                  {filteredForms.filter((f) => f.isTemplate).length}
                </div>
                <p className="text-xs text-muted-foreground">Templates</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-green-600">
                  {filteredForms.filter((f) => !f.isTemplate).length}
                </div>
                <p className="text-xs text-muted-foreground">Standard Forms</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-green-600">
                  {filteredForms.reduce(
                    (sum, form) => sum + form.fields.length,
                    0,
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Total Fields</p>
              </CardContent>
            </Card>
          </div>

          {/* Forms List */}
          <Accordion type="single" collapsible className="w-full">
            {filteredForms.map((form) => (
              <AccordionItem key={form.id} value={form.id}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center justify-between w-full pr-4">
                    <div className="flex items-center space-x-3">
                      {getFormTypeIcon(form)}
                      <div className="text-left">
                        <div className="font-medium">{form.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {form.fields.length} fields •{" "}
                          {form.description || "No description"}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getFormTypeBadge(form)}
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="pt-4">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-lg font-semibold">
                        Form Fields & Variables
                      </h4>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadFormVariables(form)}
                        className="flex items-center space-x-2"
                      >
                        <Download className="h-4 w-4" />
                        <span>Export CSV</span>
                      </Button>
                    </div>

                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Variable ID</TableHead>
                            <TableHead>Label</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Required</TableHead>
                            <TableHead>Auto Fill From</TableHead>
                            <TableHead>Section</TableHead>
                            <TableHead>Options</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {form.fields.map((field) => (
                            <TableRow key={field.id}>
                              <TableCell>
                                <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                                  {field.id}
                                </code>
                              </TableCell>
                              <TableCell className="font-medium">
                                {field.label}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  className={cn(
                                    "text-xs",
                                    getFieldTypeColor(field.type),
                                  )}
                                >
                                  {field.type}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {field.required ? (
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                ) : (
                                  <AlertCircle className="h-4 w-4 text-gray-400" />
                                )}
                              </TableCell>
                              <TableCell>
                                {field.autoFillFrom ? (
                                  <code className="bg-blue-100 px-2 py-1 rounded text-xs">
                                    {field.autoFillFrom}
                                  </code>
                                ) : (
                                  <span className="text-muted-foreground">
                                    N/A
                                  </span>
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-xs">
                                  {field.section || "general"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {field.options && field.options.length > 0 ? (
                                  <div
                                    className="text-xs text-muted-foreground max-w-32 truncate"
                                    title={field.options.join(", ")}
                                  >
                                    {field.options.slice(0, 2).join(", ")}
                                    {field.options.length > 2 &&
                                      ` +${field.options.length - 2}`}
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground">
                                    N/A
                                  </span>
                                )}
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    copyToClipboard(field.id, field.id)
                                  }
                                  className="h-6 w-6 p-0"
                                >
                                  {copiedField === field.id ? (
                                    <CheckCircle className="h-3 w-3 text-green-500" />
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          {filteredForms.length === 0 && (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No forms found</h3>
              <p className="text-muted-foreground">
                {searchTerm
                  ? "Try adjusting your search criteria"
                  : "No forms are available"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
