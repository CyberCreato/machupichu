import { Request, Response } from "express";
import { formSubmissions } from "./forms";
import { FormSubmission as MongoFormSubmission } from "../models";
import connectToDatabase from "../utils/mongodb";

interface SignatureSubmission {
  jobId: string;
  formType: "material" | "noncompliance" | "liability" | "signature";
  signature: string;
  formData?: any;
  submittedBy: string;
}

export async function handleSubmitSignature(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const {
      jobId,
      formType,
      signature,
      formData,
      submittedBy,
    }: SignatureSubmission = req.body;

    if (!jobId || !signature || !submittedBy) {
      res.status(400).json({
        error: "Missing required fields: jobId, signature, submittedBy",
      });
      return;
    }

    // Create submission object
    const submission = {
      id: `signature-${jobId}-${Date.now()}`,
      jobId,
      formId: `signature-${formType}`,
      formType,
      data: {
        signature,
        ...formData,
      },
      signature,
      submittedBy,
      submittedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save to local array (existing system)
    formSubmissions.push(submission);

    // Save to MongoDB
    try {
      await connectToDatabase();
      await MongoFormSubmission.findOneAndUpdate(
        { id: submission.id },
        submission,
        { upsert: true, new: true },
      );
      console.log(`Signature synced to MongoDB: ${submission.id}`);
    } catch (mongoError) {
      console.error("Failed to sync signature to MongoDB:", mongoError);
      // Don't fail the request if MongoDB sync fails
    }

    res.status(201).json({
      success: true,
      submission,
      message: "Signature submitted successfully",
    });
  } catch (error) {
    console.error("Error submitting signature:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function handleGetSignatures(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const { jobId } = req.query;

    let signatures = formSubmissions.filter(
      (sub) => sub.formType === "signature" || sub.signature,
    );

    if (jobId) {
      signatures = signatures.filter((sub) => sub.jobId === jobId);
    }

    res.json(signatures);
  } catch (error) {
    console.error("Error fetching signatures:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
