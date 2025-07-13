import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Plus,
  Trash2,
  Package,
  Wrench,
  List,
  Save,
  AlertCircle,
} from "lucide-react";
import { Job } from "@shared/types";

interface MaterialItem {
  name: string;
  size: string;
  kwikot: boolean;
  heatTech: boolean;
  techron: boolean;
  quantityRequested: number;
  quantityUsed: number;
}

interface MaterialList {
  id: string;
  jobId: string;
  date: string;
  plumber: string;
  claimNumber: string;
  insurance: string;

  // Standard items
  geyser: MaterialItem;
  dripTray: MaterialItem;
  vacuumBreaker1: MaterialItem;
  vacuumBreaker2: MaterialItem;
  pressureControlValve: MaterialItem;
  nonReturnValve: MaterialItem;
  fogiPack: MaterialItem;

  // Extra items
  extraItem1: { name: string; quantity: number };
  extraItem2: { name: string; quantity: number };

  // Sundries (up to 15)
  sundries: Array<{ name: string; qtyRequested: number; qtyUsed: number }>;

  // Additional materials (1-5)
  additionalMaterials: Array<{
    name: string;
    qtyRequested: number;
    qtyUsed: number;
  }>;

  jobPhase: "assessment" | "repair" | "replacement";
}

interface MaterialListManagerProps {
  job: Job;
  onMaterialListSave: (materialList: MaterialList) => void;
  existingMaterialList?: MaterialList;
}

const DEFAULT_MATERIAL_ITEM: MaterialItem = {
  name: "",
  size: "",
  kwikot: false,
  heatTech: false,
  techron: false,
  quantityRequested: 0,
  quantityUsed: 0,
};

const STANDARD_ITEMS = [
  { key: "geyser", label: "Geyser" },
  { key: "dripTray", label: "Drip Tray" },
  { key: "vacuumBreaker1", label: "Vacuum Breaker 1" },
  { key: "vacuumBreaker2", label: "Vacuum Breaker 2" },
  { key: "pressureControlValve", label: "Pressure Control Valve" },
  { key: "nonReturnValve", label: "Non Return Valve" },
  { key: "fogiPack", label: "Fogi Pack" },
];

export function MaterialListManager({
  job,
  onMaterialListSave,
  existingMaterialList,
}: MaterialListManagerProps) {
  const [materialList, setMaterialList] = useState<MaterialList>(() => ({
    id: existingMaterialList?.id || `ml-${Date.now()}`,
    jobId: job.id,
    date: new Date().toISOString().split("T")[0],
    plumber: job.assignedTo,
    claimNumber: job.claimNo || job.ClaimNo || "",
    insurance: job.companyId || "",

    geyser: { ...DEFAULT_MATERIAL_ITEM, name: "Geyser" },
    dripTray: { ...DEFAULT_MATERIAL_ITEM, name: "Drip Tray" },
    vacuumBreaker1: { ...DEFAULT_MATERIAL_ITEM, name: "Vacuum Breaker 1" },
    vacuumBreaker2: { ...DEFAULT_MATERIAL_ITEM, name: "Vacuum Breaker 2" },
    pressureControlValve: {
      ...DEFAULT_MATERIAL_ITEM,
      name: "Pressure Control Valve",
    },
    nonReturnValve: { ...DEFAULT_MATERIAL_ITEM, name: "Non Return Valve" },
    fogiPack: { ...DEFAULT_MATERIAL_ITEM, name: "Fogi Pack" },

    extraItem1: { name: "", quantity: 0 },
    extraItem2: { name: "", quantity: 0 },

    sundries: [],
    additionalMaterials: [],

    jobPhase: job.status === "completed" ? "replacement" : "assessment",

    ...existingMaterialList,
  }));

  const canEditUsedQuantities = job.status === "completed";

  const updateMaterialItem = (
    itemKey: keyof MaterialList,
    field: keyof MaterialItem,
    value: any,
  ) => {
    setMaterialList((prev) => ({
      ...prev,
      [itemKey]: {
        ...(prev[itemKey] as MaterialItem),
        [field]: value,
      },
    }));
  };

  const addSundry = () => {
    if (materialList.sundries.length < 15) {
      setMaterialList((prev) => ({
        ...prev,
        sundries: [...prev.sundries, { name: "", qtyRequested: 0, qtyUsed: 0 }],
      }));
    }
  };

  const removeSundry = (index: number) => {
    setMaterialList((prev) => ({
      ...prev,
      sundries: prev.sundries.filter((_, i) => i !== index),
    }));
  };

  const updateSundry = (index: number, field: string, value: any) => {
    setMaterialList((prev) => ({
      ...prev,
      sundries: prev.sundries.map((item, i) =>
        i === index ? { ...item, [field]: value } : item,
      ),
    }));
  };

  const addAdditionalMaterial = () => {
    if (materialList.additionalMaterials.length < 5) {
      setMaterialList((prev) => ({
        ...prev,
        additionalMaterials: [
          ...prev.additionalMaterials,
          { name: "", qtyRequested: 0, qtyUsed: 0 },
        ],
      }));
    }
  };

  const removeAdditionalMaterial = (index: number) => {
    setMaterialList((prev) => ({
      ...prev,
      additionalMaterials: prev.additionalMaterials.filter(
        (_, i) => i !== index,
      ),
    }));
  };

  const updateAdditionalMaterial = (
    index: number,
    field: string,
    value: any,
  ) => {
    setMaterialList((prev) => ({
      ...prev,
      additionalMaterials: prev.additionalMaterials.map((item, i) =>
        i === index ? { ...item, [field]: value } : item,
      ),
    }));
  };

  const handleSave = () => {
    onMaterialListSave(materialList);
  };

  const MaterialItemComponent = ({
    item,
    itemKey,
    label,
  }: {
    item: MaterialItem;
    itemKey: keyof MaterialList;
    label: string;
  }) => (
    <Card className="p-4">
      <h4 className="font-medium mb-3 flex items-center">
        <Package className="h-4 w-4 mr-2" />
        {label}
      </h4>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <Label className="text-xs">Size</Label>
          <Input
            value={item.size}
            onChange={(e) =>
              updateMaterialItem(itemKey, "size", e.target.value)
            }
            placeholder="Enter size"
            className="text-sm"
          />
        </div>
        <div>
          <Label className="text-xs">Quantity Requested</Label>
          <Input
            type="number"
            value={item.quantityRequested}
            onChange={(e) =>
              updateMaterialItem(
                itemKey,
                "quantityRequested",
                parseInt(e.target.value) || 0,
              )
            }
            className="text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="flex items-center space-x-2">
          <Checkbox
            checked={item.kwikot}
            onCheckedChange={(checked) => {
              if (checked) {
                // Clear other selections when this is selected
                updateMaterialItem(itemKey, "heatTech", false);
                updateMaterialItem(itemKey, "techron", false);
              }
              updateMaterialItem(itemKey, "kwikot", checked);
            }}
          />
          <Label className="text-xs">Kwikot</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            checked={item.heatTech}
            onCheckedChange={(checked) => {
              if (checked) {
                // Clear other selections when this is selected
                updateMaterialItem(itemKey, "kwikot", false);
                updateMaterialItem(itemKey, "techron", false);
              }
              updateMaterialItem(itemKey, "heatTech", checked);
            }}
          />
          <Label className="text-xs">Heat Tech</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            checked={item.techron}
            onCheckedChange={(checked) => {
              if (checked) {
                // Clear other selections when this is selected
                updateMaterialItem(itemKey, "kwikot", false);
                updateMaterialItem(itemKey, "heatTech", false);
              }
              updateMaterialItem(itemKey, "techron", checked);
            }}
          />
          <Label className="text-xs">Techron</Label>
        </div>
      </div>

      {/* Optional indicator for Enhanced Liability Waiver Form */}
      <div className="text-xs text-green-600 mb-2 flex items-center">
        <AlertCircle className="h-3 w-3 mr-1" />
        Optional for Enhanced Liability Waiver Form - Select only one option
        above
      </div>

      {canEditUsedQuantities && (
        <div>
          <Label className="text-xs">Quantity Used</Label>
          <Input
            type="number"
            value={item.quantityUsed}
            onChange={(e) =>
              updateMaterialItem(
                itemKey,
                "quantityUsed",
                parseInt(e.target.value) || 0,
              )
            }
            className="text-sm"
            placeholder="Enter after completion"
          />
        </div>
      )}
    </Card>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <List className="h-5 w-5 mr-2" />
            Material List - {job.title}
            <Badge variant="outline" className="ml-2">
              {materialList.jobPhase}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Job Details */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
            <div>
              <Label className="text-xs font-medium">Date</Label>
              <Input
                type="date"
                value={materialList.date}
                onChange={(e) =>
                  setMaterialList((prev) => ({ ...prev, date: e.target.value }))
                }
                className="text-sm"
              />
            </div>
            <div>
              <Label className="text-xs font-medium">Plumber</Label>
              <Input
                value={materialList.plumber}
                onChange={(e) =>
                  setMaterialList((prev) => ({
                    ...prev,
                    plumber: e.target.value,
                  }))
                }
                className="text-sm"
                readOnly
              />
            </div>
            <div>
              <Label className="text-xs font-medium text-green-600">
                Claim Number *
              </Label>
              <Input
                value={materialList.claimNumber}
                onChange={(e) =>
                  setMaterialList((prev) => ({
                    ...prev,
                    claimNumber: e.target.value,
                  }))
                }
                className="text-sm"
                placeholder="Auto-filled from job"
              />
            </div>
            <div>
              <Label className="text-xs font-medium">Insurance</Label>
              <Input
                value={materialList.insurance}
                onChange={(e) =>
                  setMaterialList((prev) => ({
                    ...prev,
                    insurance: e.target.value,
                  }))
                }
                className="text-sm"
              />
            </div>
          </div>

          {!canEditUsedQuantities && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="h-4 w-4 text-blue-600 mr-2" />
                <span className="text-sm text-blue-800">
                  Quantity used can only be filled after job completion
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Standard Items */}
      <Card>
        <CardHeader>
          <CardTitle>Standard Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {STANDARD_ITEMS.map(({ key, label }) => (
              <MaterialItemComponent
                key={key}
                item={materialList[key as keyof MaterialList] as MaterialItem}
                itemKey={key as keyof MaterialList}
                label={label}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Extra Items */}
      <Card>
        <CardHeader>
          <CardTitle>Extra Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Extra Item 1</Label>
              <Input
                value={materialList.extraItem1.name}
                onChange={(e) =>
                  setMaterialList((prev) => ({
                    ...prev,
                    extraItem1: { ...prev.extraItem1, name: e.target.value },
                  }))
                }
                placeholder="Item name"
              />
              <Input
                type="number"
                value={materialList.extraItem1.quantity}
                onChange={(e) =>
                  setMaterialList((prev) => ({
                    ...prev,
                    extraItem1: {
                      ...prev.extraItem1,
                      quantity: parseInt(e.target.value) || 0,
                    },
                  }))
                }
                placeholder="Quantity"
              />
            </div>
            <div className="space-y-2">
              <Label>Extra Item 2</Label>
              <Input
                value={materialList.extraItem2.name}
                onChange={(e) =>
                  setMaterialList((prev) => ({
                    ...prev,
                    extraItem2: { ...prev.extraItem2, name: e.target.value },
                  }))
                }
                placeholder="Item name"
              />
              <Input
                type="number"
                value={materialList.extraItem2.quantity}
                onChange={(e) =>
                  setMaterialList((prev) => ({
                    ...prev,
                    extraItem2: {
                      ...prev.extraItem2,
                      quantity: parseInt(e.target.value) || 0,
                    },
                  }))
                }
                placeholder="Quantity"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sundries */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Sundries</CardTitle>
            <Button
              onClick={addSundry}
              disabled={materialList.sundries.length >= 15}
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Sundry ({materialList.sundries.length}/15)
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {materialList.sundries.map((sundry, index) => (
              <div
                key={index}
                className="grid grid-cols-4 gap-3 p-3 border rounded-lg"
              >
                <Input
                  value={sundry.name}
                  onChange={(e) => updateSundry(index, "name", e.target.value)}
                  placeholder="Sundry name"
                />
                <Input
                  type="number"
                  value={sundry.qtyRequested}
                  onChange={(e) =>
                    updateSundry(
                      index,
                      "qtyRequested",
                      parseInt(e.target.value) || 0,
                    )
                  }
                  placeholder="Qty Requested"
                />
                <Input
                  type="number"
                  value={sundry.qtyUsed}
                  onChange={(e) =>
                    updateSundry(
                      index,
                      "qtyUsed",
                      parseInt(e.target.value) || 0,
                    )
                  }
                  placeholder="Qty Used"
                  disabled={!canEditUsedQuantities}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeSundry(index)}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Additional Materials */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Additional Materials</CardTitle>
            <Button
              onClick={addAdditionalMaterial}
              disabled={materialList.additionalMaterials.length >= 5}
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Material ({materialList.additionalMaterials.length}/5)
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {materialList.additionalMaterials.map((material, index) => (
              <div
                key={index}
                className="grid grid-cols-4 gap-3 p-3 border rounded-lg"
              >
                <Input
                  value={material.name}
                  onChange={(e) =>
                    updateAdditionalMaterial(index, "name", e.target.value)
                  }
                  placeholder="Material name"
                />
                <Input
                  type="number"
                  value={material.qtyRequested}
                  onChange={(e) =>
                    updateAdditionalMaterial(
                      index,
                      "qtyRequested",
                      parseInt(e.target.value) || 0,
                    )
                  }
                  placeholder="Qty Requested"
                />
                <Input
                  type="number"
                  value={material.qtyUsed}
                  onChange={(e) =>
                    updateAdditionalMaterial(
                      index,
                      "qtyUsed",
                      parseInt(e.target.value) || 0,
                    )
                  }
                  placeholder="Qty Used"
                  disabled={!canEditUsedQuantities}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeAdditionalMaterial(index)}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} className="px-6">
          <Save className="h-4 w-4 mr-2" />
          Save Material List
        </Button>
      </div>
    </div>
  );
}
