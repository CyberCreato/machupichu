import { RequestHandler } from "express";
import {
  Form,
  FormField,
  CreateFormRequest,
  FormSubmission,
} from "@shared/types";
import { predefinedForms, getAllPredefinedForms } from "./predefinedForms";
import { saveFormSubmissionToMongo } from "../utils/mongoDataAccess";

// Mock storage - in production, use a proper database
export let forms: Form[] = [...predefinedForms]; // Initialize with predefined forms

// Initialize forms with PDF forms included
async function initializeForms() {
  try {
    const allForms = await getAllPredefinedForms();
    forms = [...allForms];
  } catch (error) {
    console.error("Error initializing forms with PDF forms:", error);
    forms = [...predefinedForms]; // fallback to legacy forms
  }
}

// Initialize on module load
initializeForms();
export let formSubmissions: FormSubmission[] = [];
let formIdCounter = predefinedForms.length + 1;
let submissionIdCounter = 1;

// Initialize form submissions from MongoDB
async function initializeFormSubmissions() {
  try {
    // Import MongoDB models
    const { connectToDatabase } = await import("../utils/mongodb");
    const { FormSubmission: MongoFormSubmission } = await import("../models");

    await connectToDatabase();

    // Load existing form submissions from MongoDB
    const existingSubmissions = await MongoFormSubmission.find({}).sort({
      submittedAt: -1,
    });

    if (existingSubmissions.length > 0) {
      formSubmissions = existingSubmissions.map((submission: any) => ({
        id: submission.id,
        jobId: submission.jobId,
        formId: submission.formId,
        formType: submission.formType || "standard",
        data: submission.data,
        signature: submission.signature,
        submittedBy: submission.submittedBy,
        submittedAt: submission.submittedAt,
      }));

      // Update counter to avoid ID conflicts
      submissionIdCounter =
        Math.max(
          ...formSubmissions.map(
            (fs) => parseInt(fs.id.replace("submission-", "")) || 0,
          ),
        ) + 1;

      console.log(
        `Loaded ${formSubmissions.length} form submissions from MongoDB`,
      );
    }
  } catch (error) {
    console.error("Error initializing form submissions from MongoDB:", error);
    // Continue with empty array as fallback
  }
}

// Initialize form submissions
initializeFormSubmissions();

// Schema parser for form creation
function parseFormSchema(schema: string): Omit<FormField, "id">[] {
  const fields: Omit<FormField, "id">[] = [];

  // Split by lines and clean
  const lines = schema
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  for (const line of lines) {
    // Skip headers or obvious non-field lines
    if (
      line.includes("Details") ||
      line.includes("Notification") ||
      line.includes("Appointment")
    ) {
      continue;
    }

    // Check if line contains a field pattern (word followed by tab/colon and value)
    const fieldMatch = line.match(/^([^:\t]+)[\t:]\s*(.*)$/);

    if (fieldMatch) {
      const label = fieldMatch[1].trim();
      const sampleValue = fieldMatch[2].trim();

      let fieldType: FormField["type"] = "text";
      let required = true;

      // Determine field type based on label and sample value
      if (label.toLowerCase().includes("email")) {
        fieldType = "email";
      } else if (
        label.toLowerCase().includes("date") ||
        sampleValue.match(/\d{1,2}\/\d{1,2}\/\d{2,4}/) ||
        sampleValue.match(/\d{1,2}\s+\w+\s+\d{4}/)
      ) {
        fieldType = "date";
      } else if (
        label.toLowerCase().includes("amount") ||
        label.toLowerCase().includes("sum") ||
        label.toLowerCase().includes("estimate") ||
        sampleValue.match(/^\d+\.?\d*$/)
      ) {
        fieldType = "number";
      } else if (
        label.toLowerCase().includes("description") ||
        label.toLowerCase().includes("address") ||
        sampleValue.length > 50
      ) {
        fieldType = "textarea";
      } else if (
        label.toLowerCase().includes("status") ||
        label.toLowerCase().includes("section") ||
        label.toLowerCase().includes("peril")
      ) {
        fieldType = "select";
      }

      fields.push({
        type: fieldType,
        label,
        required,
        placeholder: fieldType === "select" ? undefined : `Enter ${label}`,
        options:
          fieldType === "select"
            ? ["Current", "Pending", "Completed"]
            : undefined,
      });
    }
  }

  return fields;
}

export const handleCreateForm: RequestHandler = (req, res) => {
  try {
    const formData: CreateFormRequest = req.body;

    if (!formData.name) {
      return res.status(400).json({ error: "Form name is required" });
    }

    let fields = formData.fields;

    // Parse schema if provided
    if (formData.rawSchema) {
      const parsedFields = parseFormSchema(formData.rawSchema);
      if (parsedFields.length > 0) {
        fields = parsedFields;
      }
    }

    // Add IDs to fields
    const fieldsWithIds: FormField[] = fields.map((field, index) => ({
      ...field,
      id: `field-${formIdCounter}-${index + 1}`,
    }));

    const newForm: Form = {
      id: `form-${formIdCounter++}`,
      name: formData.name,
      description: formData.description,
      fields: fieldsWithIds,
      isTemplate: formData.isTemplate,
      restrictedToCompanies: formData.restrictedToCompanies || [],
      createdBy: "admin-1", // Mock admin user
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    forms.push(newForm);
    res.status(201).json(newForm);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleGetForms: RequestHandler = (req, res) => {
  try {
    const { isTemplate, companyId } = req.query;

    let filteredForms = forms;

    if (isTemplate !== undefined) {
      filteredForms = filteredForms.filter(
        (form) => form.isTemplate === (isTemplate === "true"),
      );
    }

    if (companyId) {
      filteredForms = filteredForms.filter(
        (form) =>
          form.restrictedToCompanies.length === 0 ||
          form.restrictedToCompanies.includes(companyId as string),
      );
    }

    res.json(filteredForms);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleGetForm: RequestHandler = (req, res) => {
  try {
    const { id } = req.params;

    const form = forms.find((f) => f.id === id);

    if (!form) {
      return res.status(404).json({ error: "Form not found" });
    }

    res.json(form);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleUpdateForm: RequestHandler = (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const formIndex = forms.findIndex((form) => form.id === id);

    if (formIndex === -1) {
      return res.status(404).json({ error: "Form not found" });
    }

    forms[formIndex] = {
      ...forms[formIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    res.json(forms[formIndex]);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleSubmitForm: RequestHandler = async (req, res) => {
  try {
    const { jobId, formId, data, signature } = req.body;

    if (!jobId || !formId || !data) {
      return res.status(400).json({
        error: "jobId, formId, and data are required",
      });
    }

    // Get user from token
    const token = req.headers.authorization?.replace("Bearer ", "");
    const userId = token ? token.replace("mock-token-", "") : "admin-1";

    // Check existing submissions for this job/form combination
    const existingSubmissions = formSubmissions.filter(
      (sub) =>
        sub.jobId === jobId &&
        sub.formId === formId &&
        sub.submittedBy === userId,
    );

    // Limit to 3 submissions per form per job per user
    if (existingSubmissions.length >= 3) {
      return res.status(400).json({
        error: "Maximum of 3 submissions allowed per form",
        submissionsCount: existingSubmissions.length,
      });
    }

    // Determine submission number (1, 2, or 3)
    const submissionNumber = existingSubmissions.length + 1;

    const submission: FormSubmission = {
      id: `submission-${submissionIdCounter++}`,
      jobId,
      formId,
      submittedBy: userId,
      data,
      submittedAt: new Date().toISOString(),
      submissionNumber,
      signature,
    };

    formSubmissions.push(submission);

    // Save to MongoDB
    try {
      await saveFormSubmissionToMongo(submission);
    } catch (mongoError) {
      console.error("Failed to sync form submission to MongoDB:", mongoError);
      // Continue with local storage as fallback
    }

    res.status(201).json({
      ...submission,
      message: `Form submitted successfully (submission ${submissionNumber}/3)`,
      remainingSubmissions: 3 - submissionNumber,
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleGetFormSubmissions: RequestHandler = (req, res) => {
  try {
    const { jobId, formId, submittedBy } = req.query;

    let filteredSubmissions = formSubmissions;

    if (jobId) {
      filteredSubmissions = filteredSubmissions.filter(
        (sub) => sub.jobId === jobId,
      );
    }

    if (formId) {
      filteredSubmissions = filteredSubmissions.filter(
        (sub) => sub.formId === formId,
      );
    }

    if (submittedBy) {
      filteredSubmissions = filteredSubmissions.filter(
        (sub) => sub.submittedBy === submittedBy,
      );
    }

    res.json(filteredSubmissions);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleDeleteForm: RequestHandler = (req, res) => {
  try {
    const { id } = req.params;

    // Check if user is admin (simple check for mock implementation)
    const token = req.headers.authorization?.replace("Bearer ", "");
    const userId = token ? token.replace("mock-token-", "") : "";

    if (userId !== "admin-1") {
      return res
        .status(403)
        .json({ error: "Only administrators can delete forms" });
    }

    const formIndex = forms.findIndex((form) => form.id === id);

    if (formIndex === -1) {
      return res.status(404).json({ error: "Form not found" });
    }

    // Remove the form
    forms.splice(formIndex, 1);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleParseFormSchema: RequestHandler = (req, res) => {
  try {
    const { schema } = req.body;

    if (!schema) {
      return res.status(400).json({ error: "Schema is required" });
    }

    const fields = parseFormSchema(schema);
    res.json({ fields });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};
