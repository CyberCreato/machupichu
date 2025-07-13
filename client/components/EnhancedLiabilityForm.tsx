import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Shield, Save, AlertCircle, ArrowRight } from "lucide-react";
import { Job, User } from "@shared/types";

interface LiabilityFormData {
  id: string;
  jobId: string;
  date: string;
  insurance: string;
  claimNumber: string;
  client: string;
  plumber: string;

  // Main assessment items
  existingPipesFittings: string;
  roofEntry: string;
  geyserEnclosure: string;
  wiringElectricalAlarm: string;
  waterproofing: string;
  pipesNotSecured: string;
  notListedComments: string;
  increaseDecreasePressure: string;

  // Before/After sections
  waterHammerBefore: string;
  waterHammerAfter: string;
  pressureTestBefore: string;
  pressureTestAfter: string;
  thermostatSettingBefore: string;
  thermostatSettingAfter: string;
  externalIsolatorBefore: string;
  externalIsolatorAfter: string;
  numberOfGeysersBefore: string;
  numberOfGeysersAfter: string;
  balancedSystemBefore: string;
  balancedSystemAfter: string;
  nonReturnValveBefore: string;
  nonReturnValveAfter: string;

  additionalComments: string;
}

interface EnhancedLiabilityFormProps {
  job: Job;
  assignedStaff: User | null;
  onSubmit: (formData: LiabilityFormData) => void;
  existingData?: LiabilityFormData;
}

export function EnhancedLiabilityForm({
  job,
  assignedStaff,
  onSubmit,
  existingData,
}: EnhancedLiabilityFormProps) {
  const [formData, setFormData] = useState<LiabilityFormData>(() => ({
    id: existingData?.id || `liability-${Date.now()}`,
    jobId: job.id,
    date: existingData?.date || new Date().toISOString().split("T")[0],
    insurance:
      existingData?.insurance || job.underwriter || job.Underwriter || "",
    claimNumber: existingData?.claimNumber || job.claimNo || job.ClaimNo || "",
    client: existingData?.client || job.insuredName || job.InsuredName || "",
    plumber: existingData?.plumber || assignedStaff?.name || "",

    existingPipesFittings: existingData?.existingPipesFittings || "",
    roofEntry: existingData?.roofEntry || "",
    geyserEnclosure: existingData?.geyserEnclosure || "",
    wiringElectricalAlarm: existingData?.wiringElectricalAlarm || "",
    waterproofing: existingData?.waterproofing || "",
    pipesNotSecured: existingData?.pipesNotSecured || "",
    notListedComments: existingData?.notListedComments || "",
    increaseDecreasePressure: existingData?.increaseDecreasePressure || "",

    waterHammerBefore: existingData?.waterHammerBefore || "",
    waterHammerAfter: existingData?.waterHammerAfter || "",
    pressureTestBefore: existingData?.pressureTestBefore || "",
    pressureTestAfter: existingData?.pressureTestAfter || "",
    thermostatSettingBefore: existingData?.thermostatSettingBefore || "",
    thermostatSettingAfter: existingData?.thermostatSettingAfter || "",
    externalIsolatorBefore: existingData?.externalIsolatorBefore || "",
    externalIsolatorAfter: existingData?.externalIsolatorAfter || "",
    numberOfGeysersBefore: existingData?.numberOfGeysersBefore || "",
    numberOfGeysersAfter: existingData?.numberOfGeysersAfter || "",
    balancedSystemBefore: existingData?.balancedSystemBefore || "",
    balancedSystemAfter: existingData?.balancedSystemAfter || "",
    nonReturnValveBefore: existingData?.nonReturnValveBefore || "",
    nonReturnValveAfter: existingData?.nonReturnValveAfter || "",

    additionalComments: existingData?.additionalComments || "",
  }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const updateField = (field: keyof LiabilityFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const BeforeAfterField = ({
    label,
    beforeField,
    afterField,
  }: {
    label: string;
    beforeField: keyof LiabilityFormData;
    afterField: keyof LiabilityFormData;
  }) => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
      <div className="font-medium text-sm">{label}</div>
      <div className="space-y-1">
        <Label className="text-xs text-gray-600">Before</Label>
        <Input
          value={formData[beforeField] as string}
          onChange={(e) => updateField(beforeField, e.target.value)}
          placeholder="Before value"
          className="text-sm"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs text-gray-600">After</Label>
        <Input
          value={formData[afterField] as string}
          onChange={(e) => updateField(afterField, e.target.value)}
          placeholder="After value"
          className="text-sm"
        />
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2 text-blue-600" />
            Enhanced Liability Waiver Form
            <Badge variant="outline" className="ml-2">
              {job.title}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Header Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-blue-50 rounded-lg">
              <div>
                <Label className="text-sm font-medium">Date</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => updateField("date", e.target.value)}
                  className="text-sm bg-white"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Insurance</Label>
                <Input
                  value={formData.insurance}
                  onChange={(e) => updateField("insurance", e.target.value)}
                  className="text-sm bg-white"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-green-600">
                  Claim Number *
                </Label>
                <Input
                  value={formData.claimNumber}
                  onChange={(e) => updateField("claimNumber", e.target.value)}
                  className="text-sm bg-white"
                  placeholder="Auto-filled from job"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Client</Label>
                <Input
                  value={formData.client}
                  onChange={(e) => updateField("client", e.target.value)}
                  className="text-sm bg-white"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Plumber</Label>
                <Input
                  value={formData.plumber}
                  onChange={(e) => updateField("plumber", e.target.value)}
                  className="text-sm bg-white"
                />
              </div>
            </div>

            <Separator />

            {/* Main Assessment Items */}
            <div>
              <h3 className="text-lg font-medium mb-4 flex items-center">
                <AlertCircle className="h-5 w-5 mr-2 text-orange-600" />
                Primary Assessment Items
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Existing Pipes/Fittings</Label>
                  <Input
                    value={formData.existingPipesFittings}
                    onChange={(e) =>
                      updateField("existingPipesFittings", e.target.value)
                    }
                    placeholder="Enter assessment or 'X'"
                  />
                </div>
                <div>
                  <Label>Roof Entry</Label>
                  <Input
                    value={formData.roofEntry}
                    onChange={(e) => updateField("roofEntry", e.target.value)}
                    placeholder="Enter assessment or 'X'"
                  />
                </div>
                <div>
                  <Label>Geyser Enclosure</Label>
                  <Input
                    value={formData.geyserEnclosure}
                    onChange={(e) =>
                      updateField("geyserEnclosure", e.target.value)
                    }
                    placeholder="Enter assessment or 'X'"
                  />
                </div>
                <div>
                  <Label>Wiring (Electrical/Alarm)</Label>
                  <Input
                    value={formData.wiringElectricalAlarm}
                    onChange={(e) =>
                      updateField("wiringElectricalAlarm", e.target.value)
                    }
                    placeholder="Enter assessment or 'X'"
                  />
                </div>
                <div>
                  <Label>Waterproofing</Label>
                  <Input
                    value={formData.waterproofing}
                    onChange={(e) =>
                      updateField("waterproofing", e.target.value)
                    }
                    placeholder="Enter assessment or 'X'"
                  />
                </div>
                <div>
                  <Label>Pipes Not Secured</Label>
                  <Input
                    value={formData.pipesNotSecured}
                    onChange={(e) =>
                      updateField("pipesNotSecured", e.target.value)
                    }
                    placeholder="Enter assessment or 'X'"
                  />
                </div>
                <div>
                  <Label>Not Listed (Note by Comments)</Label>
                  <Input
                    value={formData.notListedComments}
                    onChange={(e) =>
                      updateField("notListedComments", e.target.value)
                    }
                    placeholder="Enter assessment or 'X'"
                  />
                </div>
                <div>
                  <Label>Increase/Decrease in Pressure</Label>
                  <Input
                    value={formData.increaseDecreasePressure}
                    onChange={(e) =>
                      updateField("increaseDecreasePressure", e.target.value)
                    }
                    placeholder="Enter assessment or 'X'"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Before/After Sections */}
            <div>
              <h3 className="text-lg font-medium mb-4 flex items-center">
                <ArrowRight className="h-5 w-5 mr-2 text-green-600" />
                Before/After Comparisons
              </h3>
              <div className="space-y-4">
                <BeforeAfterField
                  label="Water Hammer"
                  beforeField="waterHammerBefore"
                  afterField="waterHammerAfter"
                />
                <BeforeAfterField
                  label="Pressure Test (Rating)"
                  beforeField="pressureTestBefore"
                  afterField="pressureTestAfter"
                />
                <BeforeAfterField
                  label="Thermostat Setting"
                  beforeField="thermostatSettingBefore"
                  afterField="thermostatSettingAfter"
                />
                <BeforeAfterField
                  label="External Isolator"
                  beforeField="externalIsolatorBefore"
                  afterField="externalIsolatorAfter"
                />
                <BeforeAfterField
                  label="Number of Geysers on Property"
                  beforeField="numberOfGeysersBefore"
                  afterField="numberOfGeysersAfter"
                />
                <BeforeAfterField
                  label="Balanced System"
                  beforeField="balancedSystemBefore"
                  afterField="balancedSystemAfter"
                />
                <BeforeAfterField
                  label="Non Return Valve"
                  beforeField="nonReturnValveBefore"
                  afterField="nonReturnValveAfter"
                />
              </div>
            </div>

            <Separator />

            {/* Additional Comments */}
            <div>
              <Label>Additional Comments</Label>
              <Textarea
                value={formData.additionalComments}
                onChange={(e) =>
                  updateField("additionalComments", e.target.value)
                }
                placeholder="Enter any additional comments from staff assessment..."
                rows={4}
                className="resize-none"
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4 pt-6 border-t">
              <Button type="button" variant="outline">
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Save className="h-4 w-4 mr-2" />
                Submit Liability Form
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Form Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-gray-700">
            <p>
              <strong>Before/After Fields:</strong> Enter numbers, words, or
              simply "X" as needed for each assessment item.
            </p>
            <p>
              <strong>Primary Items:</strong> Assess each item and mark with
              appropriate values or "X" if not applicable.
            </p>
            <p>
              <strong>Additional Comments:</strong> Use this section to provide
              detailed notes on any specific findings or recommendations.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
