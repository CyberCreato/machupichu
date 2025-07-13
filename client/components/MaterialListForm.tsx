import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Package, Save, FileText, Plus, Trash2 } from "lucide-react";
import { Job, User } from "@shared/types";

interface MaterialItem {
  kwikot: boolean;
  heatTech: boolean;
  techron: boolean;
  size: string;
}

interface ExtraItem {
  name: string;
  quantity: number;
}

interface SundryItem {
  name: string;
  qtyRequested: number;
  qtyUsed: number;
}

interface AdditionalMaterial {
  name: string;
  qtyRequested: number;
  qtyUsed: number;
}

interface MaterialListFormData {
  id: string;
  jobId: string;
  date: string;
  plumber: string;
  claimNumber: string;
  insurance: string;
  geyser: MaterialItem;
  dripTray: MaterialItem;
  vacuumBreaker1: MaterialItem;
  vacuumBreaker2: MaterialItem;
  pressureControlValve: MaterialItem;
  nonReturnValve: MaterialItem;
  fogiPack: { size: string };
  extraItem1: ExtraItem;
  extraItem2: ExtraItem;
  sundries: SundryItem[];
  additionalMaterials: AdditionalMaterial[];
}

interface MaterialListFormProps {
  job: Job;
  assignedStaff: User | null;
  onSubmit: (formData: MaterialListFormData) => void;
  existingData?: MaterialListFormData;
}

export function MaterialListForm({
  job,
  assignedStaff,
  onSubmit,
  existingData,
}: MaterialListFormProps) {
  const [formData, setFormData] = useState<MaterialListFormData>(() => ({
    id: existingData?.id || `material-list-${Date.now()}`,
    jobId: job.id,
    date: existingData?.date || new Date().toISOString().split("T")[0],
    plumber: existingData?.plumber || assignedStaff?.name || "",
    claimNumber: existingData?.claimNumber || job.claimNo || job.ClaimNo || "",
    insurance:
      existingData?.insurance ||
      job.underwriter ||
      job.Underwriter ||
      "Insurance Company",
    geyser: existingData?.geyser || {
      kwikot: false,
      heatTech: false,
      techron: false,
      size: "",
    },
    dripTray: existingData?.dripTray || {
      kwikot: false,
      heatTech: false,
      techron: false,
      size: "",
    },
    vacuumBreaker1: existingData?.vacuumBreaker1 || {
      kwikot: false,
      heatTech: false,
      techron: false,
      size: "",
    },
    vacuumBreaker2: existingData?.vacuumBreaker2 || {
      kwikot: false,
      heatTech: false,
      techron: false,
      size: "",
    },
    pressureControlValve: existingData?.pressureControlValve || {
      kwikot: false,
      heatTech: false,
      techron: false,
      size: "",
    },
    nonReturnValve: existingData?.nonReturnValve || {
      kwikot: false,
      heatTech: false,
      techron: false,
      size: "",
    },
    fogiPack: existingData?.fogiPack || { size: "" },
    extraItem1: existingData?.extraItem1 || { name: "", quantity: 0 },
    extraItem2: existingData?.extraItem2 || { name: "", quantity: 0 },
    sundries:
      existingData?.sundries ||
      Array(15)
        .fill(null)
        .map(() => ({ name: "", qtyRequested: 0, qtyUsed: 0 })),
    additionalMaterials:
      existingData?.additionalMaterials ||
      Array(5)
        .fill(null)
        .map(() => ({ name: "", qtyRequested: 0, qtyUsed: 0 })),
  }));

  const handleMaterialItemChange = (
    itemName: keyof MaterialListFormData,
    field: keyof MaterialItem,
    value: boolean | string,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [itemName]: {
        ...(prev[itemName] as MaterialItem),
        [field]: value,
      },
    }));
  };

  const handleExtraItemChange = (
    itemName: "extraItem1" | "extraItem2",
    field: keyof ExtraItem,
    value: string | number,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [itemName]: {
        ...prev[itemName],
        [field]: value,
      },
    }));
  };

  const handleSundryChange = (
    index: number,
    field: keyof SundryItem,
    value: string | number,
  ) => {
    setFormData((prev) => ({
      ...prev,
      sundries: prev.sundries.map((item, i) =>
        i === index ? { ...item, [field]: value } : item,
      ),
    }));
  };

  const handleAdditionalMaterialChange = (
    index: number,
    field: keyof AdditionalMaterial,
    value: string | number,
  ) => {
    setFormData((prev) => ({
      ...prev,
      additionalMaterials: prev.additionalMaterials.map((item, i) =>
        i === index ? { ...item, [field]: value } : item,
      ),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const generatePDF = async () => {
    try {
      const response = await fetch("/api/fill-material-list-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `material-list-${formData.claimNumber}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        console.error("Failed to generate PDF");
      }
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  };

  const renderMaterialSection = (
    title: string,
    itemName: keyof MaterialListFormData,
    item: MaterialItem,
  ) => (
    <Card className="p-4">
      <h4 className="font-medium mb-3">{title}</h4>
      <div className="space-y-3">
        <div>
          <Label className="text-sm">Size</Label>
          <Input
            value={item.size}
            onChange={(e) =>
              handleMaterialItemChange(itemName, "size", e.target.value)
            }
            placeholder="Enter size"
            className="text-sm"
          />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <label className="flex items-center space-x-2 text-sm">
            <input
              type="checkbox"
              checked={item.kwikot}
              onChange={(e) =>
                handleMaterialItemChange(itemName, "kwikot", e.target.checked)
              }
              className="rounded"
            />
            <span>Kwikot</span>
          </label>
          <label className="flex items-center space-x-2 text-sm">
            <input
              type="checkbox"
              checked={item.heatTech}
              onChange={(e) =>
                handleMaterialItemChange(itemName, "heatTech", e.target.checked)
              }
              className="rounded"
            />
            <span>HeatTech</span>
          </label>
          <label className="flex items-center space-x-2 text-sm">
            <input
              type="checkbox"
              checked={item.techron}
              onChange={(e) =>
                handleMaterialItemChange(itemName, "techron", e.target.checked)
              }
              className="rounded"
            />
            <span>Techron</span>
          </label>
        </div>
      </div>
    </Card>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Package className="h-5 w-5 mr-2 text-blue-600" />
            Material List
            <Badge variant="outline" className="ml-2">
              {job.title}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-blue-50 rounded-lg">
              <div>
                <Label className="text-sm font-medium">Date</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, date: e.target.value }))
                  }
                  className="text-sm bg-white"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Plumber</Label>
                <Input
                  value={formData.plumber}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      plumber: e.target.value,
                    }))
                  }
                  className="text-sm bg-white"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Claim Number</Label>
                <Input
                  value={formData.claimNumber}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      claimNumber: e.target.value,
                    }))
                  }
                  className="text-sm bg-white"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Insurance</Label>
                <Input
                  value={formData.insurance}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      insurance: e.target.value,
                    }))
                  }
                  className="text-sm bg-white"
                />
              </div>
            </div>

            <Separator />

            {/* Main Materials */}
            <div>
              <h3 className="text-lg font-medium mb-4">Main Materials</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {renderMaterialSection("Geyser", "geyser", formData.geyser)}
                {renderMaterialSection(
                  "Drip Tray",
                  "dripTray",
                  formData.dripTray,
                )}
                {renderMaterialSection(
                  "Vacuum Breaker 1",
                  "vacuumBreaker1",
                  formData.vacuumBreaker1,
                )}
                {renderMaterialSection(
                  "Vacuum Breaker 2",
                  "vacuumBreaker2",
                  formData.vacuumBreaker2,
                )}
                {renderMaterialSection(
                  "Pressure Control Valve",
                  "pressureControlValve",
                  formData.pressureControlValve,
                )}
                {renderMaterialSection(
                  "Non Return Valve",
                  "nonReturnValve",
                  formData.nonReturnValve,
                )}
              </div>
            </div>

            <Separator />

            {/* Fogi Pack */}
            <div>
              <h3 className="text-lg font-medium mb-4">Fogi Pack</h3>
              <Card className="p-4">
                <div>
                  <Label className="text-sm">Size</Label>
                  <Input
                    value={formData.fogiPack.size}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        fogiPack: { ...prev.fogiPack, size: e.target.value },
                      }))
                    }
                    placeholder="Enter fogi pack size"
                    className="text-sm"
                  />
                </div>
              </Card>
            </div>

            <Separator />

            {/* Extra Items */}
            <div>
              <h3 className="text-lg font-medium mb-4">Extra Items</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-4">
                  <h4 className="font-medium mb-3">Extra Item 1</h4>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm">Name</Label>
                      <Input
                        value={formData.extraItem1.name}
                        onChange={(e) =>
                          handleExtraItemChange(
                            "extraItem1",
                            "name",
                            e.target.value,
                          )
                        }
                        placeholder="Enter item name"
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Quantity</Label>
                      <Input
                        type="number"
                        value={formData.extraItem1.quantity}
                        onChange={(e) =>
                          handleExtraItemChange(
                            "extraItem1",
                            "quantity",
                            parseInt(e.target.value) || 0,
                          )
                        }
                        placeholder="Enter quantity"
                        className="text-sm"
                      />
                    </div>
                  </div>
                </Card>
                <Card className="p-4">
                  <h4 className="font-medium mb-3">Extra Item 2</h4>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm">Name</Label>
                      <Input
                        value={formData.extraItem2.name}
                        onChange={(e) =>
                          handleExtraItemChange(
                            "extraItem2",
                            "name",
                            e.target.value,
                          )
                        }
                        placeholder="Enter item name"
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Quantity</Label>
                      <Input
                        type="number"
                        value={formData.extraItem2.quantity}
                        onChange={(e) =>
                          handleExtraItemChange(
                            "extraItem2",
                            "quantity",
                            parseInt(e.target.value) || 0,
                          )
                        }
                        placeholder="Enter quantity"
                        className="text-sm"
                      />
                    </div>
                  </div>
                </Card>
              </div>
            </div>

            <Separator />

            {/* Sundries */}
            <div>
              <h3 className="text-lg font-medium mb-4">Sundries</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {formData.sundries.map((sundry, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-4 gap-2 p-2 border rounded"
                  >
                    <Input
                      placeholder="Item name"
                      value={sundry.name}
                      onChange={(e) =>
                        handleSundryChange(index, "name", e.target.value)
                      }
                      className="text-sm"
                    />
                    <Input
                      type="number"
                      placeholder="Qty Req."
                      value={sundry.qtyRequested}
                      onChange={(e) =>
                        handleSundryChange(
                          index,
                          "qtyRequested",
                          parseInt(e.target.value) || 0,
                        )
                      }
                      className="text-sm"
                    />
                    <Input
                      type="number"
                      placeholder="Qty Used"
                      value={sundry.qtyUsed}
                      onChange={(e) =>
                        handleSundryChange(
                          index,
                          "qtyUsed",
                          parseInt(e.target.value) || 0,
                        )
                      }
                      className="text-sm"
                    />
                    <div className="text-sm text-gray-500 flex items-center px-2">
                      #{index + 1}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Additional Materials */}
            <div>
              <h3 className="text-lg font-medium mb-4">Additional Materials</h3>
              <div className="space-y-2">
                {formData.additionalMaterials.map((material, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-4 gap-2 p-2 border rounded"
                  >
                    <Input
                      placeholder="Material name"
                      value={material.name}
                      onChange={(e) =>
                        handleAdditionalMaterialChange(
                          index,
                          "name",
                          e.target.value,
                        )
                      }
                      className="text-sm"
                    />
                    <Input
                      type="number"
                      placeholder="Qty Req."
                      value={material.qtyRequested}
                      onChange={(e) =>
                        handleAdditionalMaterialChange(
                          index,
                          "qtyRequested",
                          parseInt(e.target.value) || 0,
                        )
                      }
                      className="text-sm"
                    />
                    <Input
                      type="number"
                      placeholder="Qty Used"
                      value={material.qtyUsed}
                      onChange={(e) =>
                        handleAdditionalMaterialChange(
                          index,
                          "qtyUsed",
                          parseInt(e.target.value) || 0,
                        )
                      }
                      className="text-sm"
                    />
                    <div className="text-sm text-gray-500 flex items-center px-2">
                      #{index + 1}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Submit and PDF Generation */}
            <div className="flex justify-between items-center pt-6 border-t">
              <Button
                type="button"
                onClick={generatePDF}
                variant="outline"
                className="flex items-center"
              >
                <FileText className="h-4 w-4 mr-2" />
                Generate PDF
              </Button>
              <div className="flex space-x-4">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Submit Material List
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
