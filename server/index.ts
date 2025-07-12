import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import {
  handleLogin,
  handleGetUsers,
  handleVerifyToken,
  handleDeleteUser,
} from "./routes/auth";
import {
  handleCreateJob,
  handleGetJobs,
  handleUpdateJob,
  handleDeleteJob,
  handleParseJobText,
  handleCheckJobExists,
  handleGetJobNotes,
  handleAddJobNote,
} from "./routes/jobs";
import {
  handleCreateForm,
  handleGetForms,
  handleGetForm,
  handleUpdateForm,
  handleDeleteForm,
  handleSubmitForm,
  handleGetFormSubmissions,
  handleParseFormSchema,
} from "./routes/forms";
import {
  handleCreateCompany,
  handleGetCompanies,
  handleGetCompany,
  handleUpdateCompany,
  handleDeleteCompany,
} from "./routes/companies";
import {
  handleGetStaffProfile,
  handleUpdateStaffProfile,
  handleGetStaffPhotos,
  handleUploadJobPhoto,
  handleGetJobPhotos,
  handleCheckIn,
  handleUploadProfileImage,
  uploadMiddleware,
  profileUploadMiddleware,
} from "./routes/staff";
import multer from "multer";

// Multer setup for form data parsing
const upload = multer();
import {
  handleSubmitSignature,
  handleGetSignatures,
} from "./routes/signatures";
import {
  handleJobPDFGeneration,
  handleGetFormTemplates,
  handleUpdatePDFConfig,
  handleIndividualFormPDF,
  handleAdminPDFTemplates,
  handleSetPDFTemplateAssociation,
  handleTestPDF,
  handleGenerateABSAPDF,
  handleGenerateLiabilityPDF,
  handleGenerateSAHLPDF,
  handleGenerateClearancePDF,
  handleGenerateDiscoveryPDF,
  handleGenerateNoncompliancePDF,
  handleGenerateMaterialListPDF,
} from "./routes/pdf-generation";
import MongoSyncService from "./services/mongoSync";

export async function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // Serve uploaded files
  app.use("/uploads", express.static("uploads"));

  // Health check
  app.get("/api/ping", (_req, res) => {
    res.json({ message: "Job Management System API v1.0" });
  });

  // Authentication routes
  app.post("/api/auth/login", handleLogin);
  app.get("/api/auth/verify", handleVerifyToken);
  app.get("/api/auth/users", handleGetUsers);
  app.delete("/api/auth/users/:id", handleDeleteUser);

  // Job routes
  app.post("/api/jobs", handleCreateJob);
  app.get("/api/jobs", handleGetJobs);
  app.get("/api/jobs/check-exists", handleCheckJobExists);
  app.put("/api/jobs/:id", handleUpdateJob);
  app.delete("/api/jobs/:id", handleDeleteJob);
  app.post("/api/jobs/parse", handleParseJobText);

  // Job notes routes
  app.get("/api/jobs/:jobId/notes", handleGetJobNotes);
  app.post("/api/jobs/:jobId/notes", handleAddJobNote);

  // Form routes
  app.post("/api/forms", handleCreateForm);
  app.get("/api/forms", handleGetForms);
  app.get("/api/forms/:id", handleGetForm);
  app.put("/api/forms/:id", handleUpdateForm);
  app.delete("/api/forms/:id", handleDeleteForm);
  app.post("/api/forms/parse-schema", handleParseFormSchema);

  // Form submission routes
  app.post("/api/form-submissions", handleSubmitForm);
  app.get("/api/form-submissions", handleGetFormSubmissions);

  // Company routes
  app.post("/api/companies", handleCreateCompany);
  app.get("/api/companies", handleGetCompanies);
  app.get("/api/companies/:id", handleGetCompany);
  app.put("/api/companies/:id", handleUpdateCompany);
  app.delete("/api/companies/:id", handleDeleteCompany);

  // Staff profile routes
  app.get("/api/staff/profile/:staffId", handleGetStaffProfile);
  app.put("/api/staff/profile/:staffId", handleUpdateStaffProfile);
  app.post(
    "/api/staff/profile/:staffId/image",
    profileUploadMiddleware,
    handleUploadProfileImage,
  );
  app.get("/api/staff/:staffId/photos", handleGetStaffPhotos);
  app.post(
    "/api/staff/:staffId/photos",
    uploadMiddleware,
    handleUploadJobPhoto,
  );
  app.get("/api/jobs/:jobId/photos", handleGetJobPhotos);
  app.post("/api/staff/:staffId/checkin", handleCheckIn);

  // Signature routes
  app.post("/api/signatures", handleSubmitSignature);
  app.get("/api/signatures", handleGetSignatures);

  // PDF Generation routes
  app.get("/api/jobs/:jobId/pdf", handleJobPDFGeneration);
  app.get("/api/forms/templates", handleGetFormTemplates);
  app.put("/api/jobs/:jobId/pdf-config", handleUpdatePDFConfig);

  // Individual form PDF routes (for staff)
  app.get(
    "/api/forms/:formId/submissions/:submissionId/pdf",
    handleIndividualFormPDF,
  );

  // Specific form PDF generation routes
  app.post(
    "/api/generate-ABSACertificat-pdf",
    upload.none(),
    handleGenerateABSAPDF,
  );
  app.get("/api/generate-liability-pdf", handleGenerateLiabilityPDF);
  app.get("/api/generate-sahl-pdf", handleGenerateSAHLPDF);
  app.get("/api/generate-clearance-pdf", handleGenerateClearancePDF);
  app.get("/api/discovery/:id", handleGenerateDiscoveryPDF);
  app.get(
    "/api/generate-noncompliance-pdf/:id",
    handleGenerateNoncompliancePDF,
  );
  app.post("/api/fill-material-list-pdf", handleGenerateMaterialListPDF);

  // Admin PDF template management routes
  app.get("/api/admin/pdf-templates", handleAdminPDFTemplates);
  app.post(
    "/api/admin/pdf-template-association",
    handleSetPDFTemplateAssociation,
  );

  // PDF test route for debugging
  app.get("/api/test-pdf", handleTestPDF);

  // Legacy demo route
  app.get("/api/demo", handleDemo);

  // MongoDB sync routes
  app.post("/api/mongo/sync", async (req, res) => {
    try {
      const syncService = MongoSyncService.getInstance();
      await syncService.manualSync();
      res.json({ success: true, message: "Manual sync completed" });
    } catch (error) {
      console.error("Manual sync error:", error);
      res.status(500).json({ success: false, error: "Sync failed" });
    }
  });

  app.get("/api/mongo/status", (req, res) => {
    const syncService = MongoSyncService.getInstance();
    const status = syncService.getSyncStatus();
    res.json(status);
  });

  // Initialize data from MongoDB
  const { initializeDataFromMongo } = await import("./utils/mongoDataAccess");
  await initializeDataFromMongo();

  // Initialize MongoDB sync service
  const syncService = MongoSyncService.getInstance();
  syncService.startSync(5); // Sync every 5 minutes

  return app;
}
