import mongoose from "mongoose";

// User Schema
const userSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ["admin", "staff", "supervisor"],
    required: true,
  },
  name: { type: String, required: true },
  location: {
    city: String,
    address: String,
    coordinates: {
      lat: Number,
      lng: Number,
    },
  },
  schedule: {
    workingLateShift: Boolean,
    shiftStartTime: String,
    shiftEndTime: String,
    weekType: String,
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Job Schema
const jobSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: String,
  assignedTo: String,
  assignedBy: String,
  companyId: String,
  formIds: [String],
  status: {
    type: String,
    enum: ["pending", "in_progress", "completed", "cancelled"],
    default: "pending",
  },
  priority: {
    type: String,
    enum: ["low", "medium", "high"],
    default: "medium",
  },
  dueDate: Date,
  category: String,
  categoryOther: String,
  notes: String,
  carryOver: Boolean,

  // Insurance/Claim fields
  claimNo: String,
  ClaimNo: String,
  policyNo: String,
  PolicyNo: String,
  insuredName: String,
  InsuredName: String,
  insCell: String,
  InsCell: String,
  riskAddress: String,
  RiskAddress: String,
  excess: String,
  Excess: String,
  underwriter: String,
  Underwriter: String,

  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Schedule Schema
const scheduleSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  date: { type: Date, required: true },
  shiftType: { type: String, enum: ["normal", "late"], required: true },
  startTime: String,
  endTime: String,
  jobIds: [String],
  location: String,
  notes: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Client Schema
const clientSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: String,
  phone: String,
  address: String,
  insuranceName: String,
  policyNumber: String,
  totalClaims: { type: Number, default: 0 },
  comebacks: { type: Number, default: 0 },
  riskLevel: { type: String, enum: ["low", "medium", "high"], default: "low" },
  lastJobDate: Date,
  notes: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Form Submission Schema
const formSubmissionSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  jobId: { type: String, required: true },
  formId: { type: String, required: true },
  formType: {
    type: String,
    enum: ["material", "noncompliance", "liability", "standard"],
  },
  data: mongoose.Schema.Types.Mixed,
  signature: String,
  submittedBy: String,
  submittedAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Company Schema
const companySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  contactPerson: String,
  email: String,
  phone: String,
  address: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Form Schema
const formSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: String,
  fields: [mongoose.Schema.Types.Mixed],
  isTemplate: { type: Boolean, default: false },
  restrictedToCompanies: [String],
  createdBy: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Create and export models
export const User = mongoose.models.User || mongoose.model("User", userSchema);
export const Job = mongoose.models.Job || mongoose.model("Job", jobSchema);
export const Schedule =
  mongoose.models.Schedule || mongoose.model("Schedule", scheduleSchema);
export const Client =
  mongoose.models.Client || mongoose.model("Client", clientSchema);
export const FormSubmission =
  mongoose.models.FormSubmission ||
  mongoose.model("FormSubmission", formSubmissionSchema);
export const Company =
  mongoose.models.Company || mongoose.model("Company", companySchema);
export const Form = mongoose.models.Form || mongoose.model("Form", formSchema);
