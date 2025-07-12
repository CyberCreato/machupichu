import connectToDatabase from "./mongodb";
import {
  User as MongoUser,
  Job as MongoJob,
  Client as MongoClient,
  FormSubmission as MongoFormSubmission,
  Form as MongoForm,
} from "../models";
import { Job, User, FormSubmission, Form } from "@shared/types";

// Jobs Data Access
export async function getAllJobsFromMongo(): Promise<Job[]> {
  try {
    await connectToDatabase();
    const jobs = await MongoJob.find({}).sort({ createdAt: -1 });
    return jobs.map((job) => job.toObject());
  } catch (error) {
    console.error("Error fetching jobs from MongoDB:", error);
    return [];
  }
}

export async function saveJobToMongo(job: Job): Promise<Job | null> {
  try {
    await connectToDatabase();
    const savedJob = await MongoJob.findOneAndUpdate(
      { id: job.id },
      { ...job, updatedAt: new Date() },
      { upsert: true, new: true },
    );
    return savedJob.toObject();
  } catch (error) {
    console.error("Error saving job to MongoDB:", error);
    return null;
  }
}

export async function deleteJobFromMongo(jobId: string): Promise<boolean> {
  try {
    await connectToDatabase();
    await MongoJob.deleteOne({ id: jobId });
    return true;
  } catch (error) {
    console.error("Error deleting job from MongoDB:", error);
    return false;
  }
}

// Users Data Access
export async function getAllUsersFromMongo(): Promise<User[]> {
  try {
    await connectToDatabase();
    const users = await MongoUser.find({}).sort({ createdAt: -1 });
    return users.map((user) => user.toObject());
  } catch (error) {
    console.error("Error fetching users from MongoDB:", error);
    return [];
  }
}

export async function saveUserToMongo(user: User): Promise<User | null> {
  try {
    await connectToDatabase();
    const savedUser = await MongoUser.findOneAndUpdate(
      { id: user.id },
      { ...user, updatedAt: new Date() },
      { upsert: true, new: true },
    );
    return savedUser.toObject();
  } catch (error) {
    console.error("Error saving user to MongoDB:", error);
    return null;
  }
}

// Clients Data Access
export async function getAllClientsFromMongo(): Promise<any[]> {
  try {
    await connectToDatabase();
    const clients = await MongoClient.find({}).sort({ createdAt: -1 });
    return clients.map((client) => client.toObject());
  } catch (error) {
    console.error("Error fetching clients from MongoDB:", error);
    return [];
  }
}

export async function saveClientToMongo(client: any): Promise<any | null> {
  try {
    await connectToDatabase();
    const savedClient = await MongoClient.findOneAndUpdate(
      { id: client.id },
      { ...client, updatedAt: new Date() },
      { upsert: true, new: true },
    );
    return savedClient.toObject();
  } catch (error) {
    console.error("Error saving client to MongoDB:", error);
    return null;
  }
}

// Form Submissions Data Access
export async function getAllFormSubmissionsFromMongo(): Promise<
  FormSubmission[]
> {
  try {
    await connectToDatabase();
    const submissions = await MongoFormSubmission.find({}).sort({
      submittedAt: -1,
    });
    return submissions.map((submission) => submission.toObject());
  } catch (error) {
    console.error("Error fetching form submissions from MongoDB:", error);
    return [];
  }
}

export async function saveFormSubmissionToMongo(
  submission: FormSubmission,
): Promise<FormSubmission | null> {
  try {
    await connectToDatabase();
    const savedSubmission = await MongoFormSubmission.findOneAndUpdate(
      { id: submission.id },
      { ...submission, updatedAt: new Date() },
      { upsert: true, new: true },
    );
    return savedSubmission.toObject();
  } catch (error) {
    console.error("Error saving form submission to MongoDB:", error);
    return null;
  }
}

// Forms Data Access
export async function getAllFormsFromMongo(): Promise<Form[]> {
  try {
    await connectToDatabase();
    const forms = await MongoForm.find({}).sort({ createdAt: -1 });
    return forms.map((form) => form.toObject());
  } catch (error) {
    console.error("Error fetching forms from MongoDB:", error);
    return [];
  }
}

export async function saveFormToMongo(form: Form): Promise<Form | null> {
  try {
    await connectToDatabase();
    const savedForm = await MongoForm.findOneAndUpdate(
      { id: form.id },
      { ...form, updatedAt: new Date() },
      { upsert: true, new: true },
    );
    return savedForm.toObject();
  } catch (error) {
    console.error("Error saving form to MongoDB:", error);
    return null;
  }
}

// Initialize data from MongoDB on server startup
export async function initializeDataFromMongo() {
  try {
    console.log("Initializing data from MongoDB...");

    // Import the in-memory arrays from routes
    const { jobs } = await import("../routes/jobs");
    const { users } = await import("../routes/auth");
    const { formSubmissions } = await import("../routes/forms");

    // Load data from MongoDB
    const mongoJobs = await getAllJobsFromMongo();
    const mongoUsers = await getAllUsersFromMongo();
    const mongoSubmissions = await getAllFormSubmissionsFromMongo();

    // Update in-memory arrays
    jobs.length = 0;
    jobs.push(...mongoJobs);

    users.length = 0;
    users.push(...mongoUsers);

    formSubmissions.length = 0;
    formSubmissions.push(...mongoSubmissions);

    console.log(
      `Loaded ${mongoJobs.length} jobs, ${mongoUsers.length} users, ${mongoSubmissions.length} form submissions from MongoDB`,
    );
  } catch (error) {
    console.error("Error initializing data from MongoDB:", error);
  }
}

// Sync data to MongoDB periodically
export async function syncDataToMongo() {
  try {
    // Import the in-memory arrays from routes
    const { jobs } = await import("../routes/jobs");
    const { users } = await import("../routes/auth");
    const { formSubmissions } = await import("../routes/forms");

    // Save all data to MongoDB
    await Promise.all([
      ...jobs.map((job) => saveJobToMongo(job)),
      ...users.map((user) => saveUserToMongo(user)),
      ...formSubmissions.map((submission) =>
        saveFormSubmissionToMongo(submission),
      ),
    ]);

    console.log("Data synced to MongoDB successfully");
  } catch (error) {
    console.error("Error syncing data to MongoDB:", error);
  }
}
