import { RequestHandler } from "express";
import {
  Job,
  CreateJobRequest,
  UpdateJobRequest,
  ParsedJobData,
} from "@shared/types";

// Mock jobs storage - in production, use a proper database
export let jobs: Job[] = [];
let jobIdCounter = 1;

// Enhanced text parser for job data - supports up to 80 fields exactly as parsed
function parseJobText(text: string): ParsedJobData {
  const data: ParsedJobData = {};
  const maxFields = 80;
  let fieldCount = 0;

  // Clean and normalize the text
  const cleanText = text.replace(/\s+/g, " ").trim();
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line);

  // Process each line to extract ALL key-value pairs
  for (const line of lines) {
    if (fieldCount >= maxFields) break;

    // Skip header lines
    if (
      line.includes("Service Provider Appointment") ||
      line.includes("Claim Appointment") ||
      line.includes("Notification Details")
    ) {
      continue;
    }

    // Handle tab-separated format (most common)
    if (line.includes("\t")) {
      const parts = line
        .split("\t")
        .map((part) => part.trim())
        .filter((part) => part);

      for (let i = 0; i < parts.length - 1 && fieldCount < maxFields; i += 2) {
        const key = parts[i];
        const value = parts[i + 1];

        if (key && value) {
          // Use exact key names as parsed, just clean them slightly
          const cleanKey = key.replace(/[^\w\s]/g, "").replace(/\s+/g, "");
          if (cleanKey && !data[cleanKey]) {
            data[cleanKey] = value;
            fieldCount++;
          }
        }
      }
    }
    // Handle colon-separated format
    else if (line.includes(":")) {
      const colonIndex = line.indexOf(":");
      const key = line.substring(0, colonIndex).trim();
      const value = line.substring(colonIndex + 1).trim();

      if (key && value && fieldCount < maxFields) {
        const cleanKey = key.replace(/[^\w\s]/g, "").replace(/\s+/g, "");
        if (cleanKey && !data[cleanKey]) {
          data[cleanKey] = value;
          fieldCount++;
        }
      }
    }
  }

  // Also extract using enhanced patterns for known fields
  const enhancedPatterns = {
    ClaimNo: /(?:ClaimNo|Claim No|Claim)\s*[:\t]\s*([^\s\t]+)/i,
    PolicyNo: /(?:PolicyNo|Policy No|Policy)\s*[:\t]\s*([^\s\t]+)/i,
    SPMNo: /(?:SPM No|SPMNo|SPM)\s*[:\t]\s*([^\s\t]+)/i,
    Underwriter: /Underwriter\s*[:\t]\s*([^\t]+?)(?=\s*[A-Z][a-z]+\s*[:\t]|$)/i,
    Branch: /Branch\s*[:\t]\s*([^\t]+?)(?=\s*[A-Z][a-z]+\s*[:\t]|$)/i,
    Broker: /Broker\s*[:\t]\s*([^\t]+?)(?=\s*[A-Z][a-z]+\s*[:\t]|$)/i,
    ClaimSpecialist:
      /(?:ClaimSpecialist|Claim Specialist)\s*[:\t]\s*([^\t]+?)(?=\s*[A-Z][a-z]+\s*[:\t]|$)/i,
    Email: /Email\s*[:\t]\s*([^\s\t]+@[^\s\t]+)/i,
    RiskAddress:
      /(?:Risk Address|Home Address|Address)\s*[:\t]\s*([^\t]+?)(?=\s*[A-Z][a-z]+\s*[:\t]|$)/i,
    InsuredName:
      /(?:Insured Name|Client|Name)\s*[:\t]\s*([^\t]+?)(?=\s*[A-Z][a-z]+\s*[:\t]|$)/i,
    InsCell: /(?:Ins Cell|Contact|Cell|Phone)\s*[:\t]\s*([+\d\s\-()]+)/i,
    Excess: /Excess\s*[:\t]\s*([^\t]+?)(?=\s*[A-Z][a-z]+\s*[:\t]|$)/i,
  };

  // Fill in any missing standard fields
  for (const [key, pattern] of Object.entries(enhancedPatterns)) {
    if (fieldCount >= maxFields) break;

    if (!data[key]) {
      const match = cleanText.match(pattern);
      if (match && match[1]) {
        data[key] = match[1].trim();
        fieldCount++;
      }
    }
  }

  return data;
}

export const handleCreateJob: RequestHandler = (req, res) => {
  try {
    const jobData: CreateJobRequest = req.body;

    if (!jobData.title) {
      return res.status(400).json({ error: "Title is required" });
    }

    if (!jobData.assignedTo) {
      return res
        .status(400)
        .json({ error: "Please assign the job to a staff member" });
    }

    let parsedData: ParsedJobData = {};

    // Parse raw text if provided
    if (jobData.rawText) {
      parsedData = parseJobText(jobData.rawText);
    }

    // Auto-detect company based on parsed text or provided text
    let companyId = jobData.companyId;
    if (!companyId && (jobData.rawText || jobData.description)) {
      const textToSearch = (
        jobData.rawText +
        " " +
        jobData.description
      ).toLowerCase();

      if (textToSearch.includes("absa")) {
        companyId = "company-2"; // ABSA Insurance Company Limited
      } else if (textToSearch.includes("sahl")) {
        companyId = "company-1"; // SAHL Insurance Company Ltd
      } else {
        companyId = "company-3"; // Discovery Insurance (default)
      }
    }

    // Auto-attach appropriate forms based on company
    let requiredFormIds: string[] = [];
    let optionalFormIds: string[] = [];
    let primaryFormId = jobData.formId;

    // Only Clearance Certificate is required for all jobs
    requiredFormIds = [
      "form-clearance-certificate", // REQUIRED - Clearance Certificate
    ];

    // All other forms are optional
    optionalFormIds = [
      "form-material-list", // OPTIONAL - Material list
      "form-noncompliance", // OPTIONAL - Noncompliance form
      "form-enhanced-liability", // OPTIONAL - Enhanced liability waiver
      "form-liability-certificate", // OPTIONAL - Liability certificate
    ];

    // Add company-specific optional forms
    if (companyId === "company-1") {
      // SAHL
      optionalFormIds.push("form-sahl-certificate");
    } else if (companyId === "company-2") {
      // ABSA
      optionalFormIds.push("form-absa-certificate");
    }

    // Primary form is always clearance certificate
    primaryFormId = primaryFormId || "form-clearance-certificate";

    // Combine required and optional forms - required forms come first
    const finalFormIds = Array.from(
      new Set([
        ...requiredFormIds, // Required forms (only clearance certificate)
        ...(jobData.formIds || []), // Any explicitly requested forms
        ...optionalFormIds, // Optional forms
      ]),
    );

    // Calculate initial pricing for Zaundre
    let pricing;
    if (jobData.assignedTo === "staff-4") {
      // Zaundre
      pricing = {
        type: "call-out" as const,
        amount: 120,
        staffId: jobData.assignedTo,
      };
    }

    const newJob: Job = {
      id: `job-${jobIdCounter++}`,
      title: jobData.title,
      description: jobData.description,
      assignedTo: jobData.assignedTo,
      assignedBy: "admin-1", // Mock admin user
      companyId: companyId,
      formId: primaryFormId,
      formIds: finalFormIds,
      status: "pending",
      priority: jobData.priority,
      dueDate: jobData.dueDate,
      category: jobData.category,
      categoryOther: jobData.categoryOther,
      pricing: pricing,
      isAssisting: false,
      ...parsedData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    jobs.push(newJob);
    res.status(201).json(newJob);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleGetJobs: RequestHandler = (req, res) => {
  try {
    const { assignedTo, status } = req.query;

    let filteredJobs = jobs;

    if (assignedTo) {
      filteredJobs = filteredJobs.filter(
        (job) => job.assignedTo === assignedTo,
      );
    }

    if (status) {
      filteredJobs = filteredJobs.filter((job) => job.status === status);
    }

    res.json(filteredJobs);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleUpdateJob: RequestHandler = (req, res) => {
  try {
    const { id } = req.params;
    const updates: UpdateJobRequest = req.body;

    const jobIndex = jobs.findIndex((job) => job.id === id);

    if (jobIndex === -1) {
      return res.status(404).json({ error: "Job not found" });
    }

    const currentJob = jobs[jobIndex];

    // Update pricing for Zaundre based on category or status changes
    let updatedPricing = currentJob.pricing;
    if (currentJob.assignedTo === "staff-4" && !currentJob.isAssisting) {
      if (updates.category === "Geyser Replacement") {
        updatedPricing = {
          type: "replacement",
          amount: 250,
          staffId: currentJob.assignedTo,
        };
      } else if (
        updates.status === "completed" &&
        currentJob.category !== "Geyser Assessment"
      ) {
        // Job turned into a repair
        updatedPricing = {
          type: "repair",
          amount: 200,
          staffId: currentJob.assignedTo,
        };
      } else if (
        updates.category &&
        updates.category !== "Geyser Replacement"
      ) {
        // Reset to call-out for other categories
        updatedPricing = {
          type: "call-out",
          amount: 120,
          staffId: currentJob.assignedTo,
        };
      }
    }

    jobs[jobIndex] = {
      ...currentJob,
      ...updates,
      pricing: updatedPricing,
      updatedAt: new Date().toISOString(),
    };

    res.json(jobs[jobIndex]);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleDeleteJob: RequestHandler = (req, res) => {
  try {
    const { id } = req.params;

    const jobIndex = jobs.findIndex((job) => job.id === id);

    if (jobIndex === -1) {
      return res.status(404).json({ error: "Job not found" });
    }

    jobs.splice(jobIndex, 1);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleParseJobText: RequestHandler = (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: "Text is required" });
    }

    const parsedData = parseJobText(text);
    res.json(parsedData);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleCheckJobExists: RequestHandler = (req, res) => {
  try {
    const { claimNo, policyNo, title } = req.query;

    // Check if job already exists based on claim number, policy number, or exact title
    const existingJob = jobs.find((job) => {
      if (claimNo && job.claimNo === claimNo) return true;
      if (policyNo && job.policyNo === policyNo) return true;
      if (title && job.title === title) return true;
      return false;
    });

    if (existingJob) {
      res.json({ exists: true, job: existingJob });
    } else {
      res.json({ exists: false });
    }
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

// Mock storage for job notes
let jobNotes: Array<{
  id: string;
  jobId: string;
  content: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
}> = [];
let noteIdCounter = 1;

export const handleGetJobNotes: RequestHandler = (req, res) => {
  try {
    const { jobId } = req.params;

    const notes = jobNotes
      .filter((note) => note.jobId === jobId)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

    res.json(notes);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleAddJobNote: RequestHandler = (req, res) => {
  try {
    const { jobId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: "Note content is required" });
    }

    // Get user from token
    const token = req.headers.authorization?.replace("Bearer ", "");
    const userId = token ? token.replace("mock-token-", "") : "admin-1";

    // Get user info from users array (import from auth.ts or mock it)
    const users = [
      { id: "admin-1", name: "System Administrator" },
      { id: "admin-2", name: "Apollos" },
      { id: "staff-1", name: "John Doe" },
      { id: "staff-2", name: "Jane Smith" },
      { id: "staff-3", name: "Mike Wilson" },
    ];

    const user = users.find((u) => u.id === userId);
    const userName = user ? user.name : "Unknown User";

    const newNote = {
      id: `note-${noteIdCounter++}`,
      jobId,
      content: content.trim(),
      createdBy: userId,
      createdByName: userName,
      createdAt: new Date().toISOString(),
    };

    jobNotes.push(newNote);
    res.status(201).json(newNote);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};
