import { promises as fs } from "fs";
import { join } from "path";
import { Form } from "@shared/types";

// Map PDF filenames to readable form names
const PDF_DISPLAY_NAMES: Record<string, string> = {
  "ABSACertificate.pdf": "ABSA Certificate",
  "BBPClearanceCertificate.pdf": "BBP Clearance Certificate",
  "Disc Clearance .pdf": "Disc Clearance Certificate",
  "DiscoveryCS.pdf": "Discovery CS Form",
  "liabWave.pdf": "Liability Waiver",
  "ML.pdf": "Material List",
  "Noncompliance.pdf": "Non-compliance Form",
  "sahlld.pdf": "SAHL Certificate",
};

// Map PDF filenames to form types/categories
const PDF_FORM_TYPES: Record<string, string> = {
  "ABSACertificate.pdf": "Certificate",
  "BBPClearanceCertificate.pdf": "Clearance Certificate",
  "Disc Clearance .pdf": "Clearance Certificate",
  "DiscoveryCS.pdf": "CS Form",
  "liabWave.pdf": "Liability Waiver",
  "ML.pdf": "Material List",
  "Noncompliance.pdf": "Non-compliance Form",
  "sahlld.pdf": "Certificate",
};

// Enhanced form field generation based on PDF type
function generateFormFields(filename: string): any[] {
  const baseFields = [
    {
      id: "client-name",
      type: "text",
      label: "Client Name",
      required: true,
      autoFillFrom: "insuredName",
    },
    {
      id: "claim-number",
      type: "text",
      label: "Claim Number",
      required: true,
      autoFillFrom: "claimNo",
    },
    {
      id: "property-address",
      type: "text",
      label: "Property Address",
      required: true,
      autoFillFrom: "riskAddress",
    },
    {
      id: "staff-name",
      type: "text",
      label: "Staff Member",
      required: true,
      autoFillFrom: "assignedStaffName",
      readonly: true,
    },
  ];

  // Add specific fields based on PDF type
  switch (filename) {
    case "ABSACertificate.pdf":
      return [
        ...baseFields,
        {
          id: "csa-ref",
          type: "text",
          label: "CSA Reference",
          required: true,
          autoFillFrom: "title",
        },
        {
          id: "cause-of-damage",
          type: "text",
          label: "Cause of Damage",
          required: true,
        },
        ...Array.from({ length: 13 }, (_, i) => ({
          id: `rating-${i + 1}`,
          type: "select",
          label: `Service Rating ${i + 1}`,
          required: true,
          options: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
          section: "client",
        })),
      ];

    case "BBPClearanceCertificate.pdf":
      return [
        ...baseFields,
        {
          id: "cause-of-damage",
          type: "text",
          label: "Cause of Damage",
          required: true,
        },
        {
          id: "scope-of-work",
          type: "textarea",
          label: "Scope of Work",
          required: true,
        },
        {
          id: "old-geyser-details",
          type: "text",
          label: "Old Geyser Details",
          required: false,
        },
        {
          id: "new-geyser-details",
          type: "text",
          label: "New Geyser Details",
          required: false,
        },
        {
          id: "excess-paid",
          type: "select",
          label: "Excess Paid",
          required: true,
          options: ["Yes", "No"],
        },
        {
          id: "excess-amount",
          type: "number",
          label: "Excess Amount",
          required: false,
        },
      ];

    case "ML.pdf":
      return [
        ...baseFields,
        {
          id: "material-list",
          type: "textarea",
          label: "Materials Used",
          required: true,
        },
        {
          id: "quantities",
          type: "textarea",
          label: "Quantities",
          required: true,
        },
        {
          id: "supplier",
          type: "text",
          label: "Supplier",
          required: false,
        },
      ];

    case "liabWave.pdf":
      return [
        ...baseFields,
        {
          id: "liability-company-name",
          type: "text",
          label: "Company Name",
          required: true,
          defaultValue: "BlockBusters And Partners",
        },
        {
          id: "plumber-name",
          type: "text",
          label: "Plumber Name",
          required: true,
        },
        ...[
          "existing-pipes",
          "roof-entry",
          "geyser-enclosure",
          "wiring",
          "waterproofing",
          "pipes-secured",
          "other-issues",
          "pressure-change",
          "water-hammer",
        ].map((field) => ({
          id: field,
          type: "select",
          label: field
            .split("-")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" "),
          required: true,
          options: ["Yes", "No"],
        })),
        {
          id: "general-comments",
          type: "textarea",
          label: "General Comments",
          required: true,
        },
      ];

    case "Noncompliance.pdf":
      return [
        ...baseFields,
        {
          id: "noncompliance-type",
          type: "select",
          label: "Non-compliance Type",
          required: true,
          options: [
            "Material Quality",
            "Workmanship",
            "Safety",
            "Documentation",
            "Other",
          ],
        },
        {
          id: "description",
          type: "textarea",
          label: "Description of Non-compliance",
          required: true,
        },
        {
          id: "corrective-action",
          type: "textarea",
          label: "Corrective Action Required",
          required: true,
        },
      ];

    default:
      return [
        ...baseFields,
        {
          id: "form-data",
          type: "textarea",
          label: "Form Data",
          required: false,
        },
      ];
  }
}

export async function getAvailablePDFForms(): Promise<Form[]> {
  // PDF forms are disabled - return empty array
  return [];
}

export function getPDFFormPath(filename: string): string {
  return `/forms/${filename}`;
}

export function getAvailablePDFTemplates() {
  return Object.keys(PDF_DISPLAY_NAMES).map((filename) => ({
    filename,
    formType: PDF_FORM_TYPES[filename] || "General Form",
    displayName: PDF_DISPLAY_NAMES[filename] || filename.replace(".pdf", ""),
  }));
}
