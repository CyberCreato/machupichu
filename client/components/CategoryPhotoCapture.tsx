import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Camera,
  Upload,
  X,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  Gauge,
} from "lucide-react";

interface CategoryPhotoRequirement {
  id: string;
  label: string;
  description: string;
  required: boolean;
  category: "before" | "after" | "pressure" | "inspection" | "scrap";
}

interface CategoryPhotoCaptureProps {
  jobCategory?: string;
  onPhotosChange: (photos: Record<string, File>) => void;
  existingPhotos?: Record<string, string>; // photo id -> url
}

const PHOTO_REQUIREMENTS: Record<string, CategoryPhotoRequirement[]> = {
  "Geyser Assessment": [
    {
      id: "inspection_before",
      label: "Inspection Photo (Before Work Starts)",
      description:
        "Full geyser with label visible, piping connections, electrical wiring, valves, brackets, and fittings",
      required: true,
      category: "inspection",
    },
    {
      id: "pressure_before",
      label: "Before Pressure Reading",
      description:
        "Clear photo showing the pressure gauge reading before work begins",
      required: true,
      category: "pressure",
    },
    {
      id: "pressure_after",
      label: "After Pressure Reading",
      description:
        "Clear photo showing the pressure gauge reading after work is completed",
      required: true,
      category: "pressure",
    },
    {
      id: "resultant_after",
      label: "Resultant Photo (After Work is Done)",
      description:
        "New installation in full, showing completed work and any changes made",
      required: true,
      category: "after",
    },
  ],
  "Geyser Replacement": [
    {
      id: "inspection_before",
      label: "Inspection Photo (Before Work Starts)",
      description:
        "Full geyser with label visible, all parts expected to be removed (piping, electrical, valves, brackets)",
      required: true,
      category: "inspection",
    },
    {
      id: "pressure_before",
      label: "Before Pressure Reading",
      description: "Pressure gauge reading before replacement begins",
      required: true,
      category: "pressure",
    },
    {
      id: "pressure_after",
      label: "After Pressure Reading",
      description: "Pressure gauge reading after replacement is completed",
      required: true,
      category: "pressure",
    },
    {
      id: "resultant_after",
      label: "Resultant Photo (New Installation)",
      description:
        "Complete new installation showing the replaced geyser in full",
      required: true,
      category: "after",
    },
    {
      id: "scrap_materials",
      label: "Removed Material (Scrap)",
      description:
        "All removed materials laid out clearly - old geyser unit, copper/PEX pipe sections with measurements, valves, elements, wiring",
      required: true,
      category: "scrap",
    },
  ],
  "Leak Detection": [
    {
      id: "pressure_before",
      label: "Before Pressure Reading",
      description: "Initial pressure reading showing current system pressure",
      required: true,
      category: "pressure",
    },
    {
      id: "pressure_after",
      label: "After Pressure Reading",
      description:
        "Final pressure reading after leak detection and any repairs",
      required: true,
      category: "pressure",
    },
  ],
  "Toilet/Shower": [
    {
      id: "pressure_before",
      label: "Before Pressure Reading",
      description: "Water pressure reading before toilet/shower work",
      required: true,
      category: "pressure",
    },
    {
      id: "pressure_after",
      label: "After Pressure Reading",
      description: "Water pressure reading after toilet/shower work completion",
      required: true,
      category: "pressure",
    },
  ],
};

export function CategoryPhotoCapture({
  jobCategory,
  onPhotosChange,
  existingPhotos = {},
}: CategoryPhotoCaptureProps) {
  const [photos, setPhotos] = useState<Record<string, File>>({});
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const requirements = jobCategory ? PHOTO_REQUIREMENTS[jobCategory] || [] : [];

  const handlePhotoCapture = (requirementId: string, file: File) => {
    if (file) {
      const newPhotos = { ...photos, [requirementId]: file };
      setPhotos(newPhotos);
      onPhotosChange(newPhotos);

      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrls((prev) => ({ ...prev, [requirementId]: url }));
    }
  };

  const removePhoto = (requirementId: string) => {
    const newPhotos = { ...photos };
    delete newPhotos[requirementId];
    setPhotos(newPhotos);
    onPhotosChange(newPhotos);

    // Clean up preview URL
    if (previewUrls[requirementId]) {
      URL.revokeObjectURL(previewUrls[requirementId]);
      const newPreviews = { ...previewUrls };
      delete newPreviews[requirementId];
      setPreviewUrls(newPreviews);
    }
  };

  const triggerFileInput = (requirementId: string) => {
    const input = fileInputRefs.current[requirementId];
    if (input) {
      input.click();
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "pressure":
        return <Gauge className="h-5 w-5" />;
      case "inspection":
        return <Camera className="h-5 w-5" />;
      case "scrap":
        return <Wrench className="h-5 w-5" />;
      default:
        return <Camera className="h-5 w-5" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "pressure":
        return "text-blue-600 bg-blue-100";
      case "inspection":
        return "text-green-600 bg-green-100";
      case "scrap":
        return "text-orange-600 bg-orange-100";
      case "before":
        return "text-purple-600 bg-purple-100";
      case "after":
        return "text-teal-600 bg-teal-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const allRequiredPhotosUploaded = requirements
    .filter((req) => req.required)
    .every((req) => photos[req.id] || existingPhotos[req.id]);

  if (requirements.length === 0) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          No special photo requirements for this job category.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Camera className="h-5 w-5 mr-2" />
            Category-Specific Photo Requirements
            <Badge variant="outline" className="ml-2">
              {jobCategory}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {!allRequiredPhotosUploaded && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  All required photos must be uploaded before you can proceed.
                  Please capture all images listed below.
                </AlertDescription>
              </Alert>
            )}

            {allRequiredPhotosUploaded && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  All required photos have been uploaded successfully!
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {requirements.map((requirement) => {
                const hasPhoto =
                  photos[requirement.id] || existingPhotos[requirement.id];
                const previewUrl =
                  previewUrls[requirement.id] || existingPhotos[requirement.id];

                return (
                  <Card
                    key={requirement.id}
                    className={`border-2 ${
                      hasPhoto
                        ? "border-green-200 bg-green-50"
                        : requirement.required
                          ? "border-red-200 bg-red-50"
                          : "border-gray-200"
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <div
                                className={`p-1 rounded ${getCategoryColor(requirement.category)}`}
                              >
                                {getCategoryIcon(requirement.category)}
                              </div>
                              <h4 className="font-medium text-sm">
                                {requirement.label}
                              </h4>
                              {requirement.required && (
                                <Badge
                                  variant="destructive"
                                  className="text-xs"
                                >
                                  Required
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-gray-600 mb-3">
                              {requirement.description}
                            </p>
                          </div>
                          {hasPhoto && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removePhoto(requirement.id)}
                              className="text-red-500 hover:text-red-700 p-1"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>

                        {previewUrl ? (
                          <div className="relative">
                            <img
                              src={previewUrl}
                              alt={requirement.label}
                              className="w-full h-32 object-cover rounded-lg border"
                            />
                            <div className="absolute top-2 right-2">
                              <Badge className="bg-green-600">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Uploaded
                              </Badge>
                            </div>
                          </div>
                        ) : (
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                            <Camera className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-600 mb-2">
                              No photo uploaded
                            </p>
                          </div>
                        )}

                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => triggerFileInput(requirement.id)}
                            className="flex-1"
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            {hasPhoto ? "Replace" : "Upload"}
                          </Button>
                        </div>

                        <input
                          ref={(el) =>
                            (fileInputRefs.current[requirement.id] = el)
                          }
                          type="file"
                          accept="image/*"
                          capture="environment"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handlePhotoCapture(requirement.id, file);
                            }
                          }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
