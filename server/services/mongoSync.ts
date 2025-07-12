import connectToDatabase from "../utils/mongodb";
import {
  User as MongoUser,
  Job as MongoJob,
  Schedule as MongoSchedule,
  Client as MongoClient,
  FormSubmission as MongoFormSubmission,
  Company as MongoCompany,
  Form as MongoForm,
} from "../models";

// Import local data
import { users } from "../routes/auth";
import { jobs } from "../routes/jobs";
import { companies } from "../routes/companies";
import { forms, formSubmissions } from "../routes/forms";

class MongoSyncService {
  private static instance: MongoSyncService;
  private syncInterval: NodeJS.Timeout | null = null;

  private constructor() {}

  public static getInstance(): MongoSyncService {
    if (!MongoSyncService.instance) {
      MongoSyncService.instance = new MongoSyncService();
    }
    return MongoSyncService.instance;
  }

  public async startSync(intervalMinutes: number = 5): Promise<void> {
    await this.initialSync();

    // Set up periodic sync
    this.syncInterval = setInterval(
      async () => {
        try {
          await this.syncAllData();
          console.log(`Data synced to MongoDB at ${new Date().toISOString()}`);
        } catch (error) {
          console.error("Error during periodic sync:", error);
        }
      },
      intervalMinutes * 60 * 1000,
    );

    console.log(
      `MongoDB sync service started with ${intervalMinutes} minute intervals`,
    );
  }

  public stopSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log("MongoDB sync service stopped");
    }
  }

  private async initialSync(): Promise<void> {
    try {
      await connectToDatabase();
      await this.syncAllData();
      console.log("Initial MongoDB sync completed");
    } catch (error) {
      console.error("Error during initial sync:", error);
    }
  }

  private async syncAllData(): Promise<void> {
    await Promise.all([
      this.syncUsers(),
      this.syncJobs(),
      this.syncCompanies(),
      this.syncForms(),
      this.syncFormSubmissions(),
      this.syncClients(),
      this.syncSchedules(),
    ]);
  }

  private async syncUsers(): Promise<void> {
    try {
      for (const user of users) {
        await MongoUser.findOneAndUpdate(
          { id: user.id },
          { ...user, updatedAt: new Date() },
          { upsert: true, new: true },
        );
      }
    } catch (error) {
      console.error("Error syncing users:", error);
    }
  }

  private async syncJobs(): Promise<void> {
    try {
      for (const job of jobs) {
        await MongoJob.findOneAndUpdate(
          { id: job.id },
          { ...job, updatedAt: new Date() },
          { upsert: true, new: true },
        );
      }
    } catch (error) {
      console.error("Error syncing jobs:", error);
    }
  }

  private async syncCompanies(): Promise<void> {
    try {
      for (const company of companies) {
        await MongoCompany.findOneAndUpdate(
          { id: company.id },
          { ...company, updatedAt: new Date() },
          { upsert: true, new: true },
        );
      }
    } catch (error) {
      console.error("Error syncing companies:", error);
    }
  }

  private async syncForms(): Promise<void> {
    try {
      for (const form of forms) {
        await MongoForm.findOneAndUpdate(
          { id: form.id },
          { ...form, updatedAt: new Date() },
          { upsert: true, new: true },
        );
      }
    } catch (error) {
      console.error("Error syncing forms:", error);
    }
  }

  private async syncFormSubmissions(): Promise<void> {
    try {
      for (const submission of formSubmissions) {
        await MongoFormSubmission.findOneAndUpdate(
          { id: submission.id },
          { ...submission, updatedAt: new Date() },
          { upsert: true, new: true },
        );
      }
    } catch (error) {
      console.error("Error syncing form submissions:", error);
    }
  }

  private async syncClients(): Promise<void> {
    try {
      // Extract unique clients from jobs
      const clientsMap = new Map();

      for (const job of jobs) {
        const clientName = job.insuredName || job.InsuredName;
        const clientPhone = job.insCell || job.InsCell;
        const clientAddress = job.riskAddress || job.RiskAddress;

        if (clientName) {
          const clientId = clientName.toLowerCase().replace(/\s+/g, "-");
          if (!clientsMap.has(clientId)) {
            clientsMap.set(clientId, {
              id: clientId,
              name: clientName,
              phone: clientPhone,
              address: clientAddress,
              insuranceName: job.underwriter || job.Underwriter,
              policyNumber: job.policyNo || job.PolicyNo,
              totalClaims: 1,
              comebacks: 0,
              riskLevel: "low",
              lastJobDate: new Date(job.dueDate || job.createdAt),
            });
          } else {
            const existing = clientsMap.get(clientId);
            existing.totalClaims += 1;
            const jobDate = new Date(job.dueDate || job.createdAt);
            if (jobDate > existing.lastJobDate) {
              existing.lastJobDate = jobDate;
            }
          }
        }
      }

      for (const client of clientsMap.values()) {
        await MongoClient.findOneAndUpdate(
          { id: client.id },
          { ...client, updatedAt: new Date() },
          { upsert: true, new: true },
        );
      }
    } catch (error) {
      console.error("Error syncing clients:", error);
    }
  }

  private async syncSchedules(): Promise<void> {
    try {
      // Generate schedules from user shift data and job assignments
      for (const user of users.filter((u) => u.role === "staff")) {
        const userJobs = jobs.filter((job) => job.assignedTo === user.id);

        // Group jobs by date
        const jobsByDate = new Map();
        for (const job of userJobs) {
          if (job.dueDate) {
            const date = new Date(job.dueDate).toISOString().split("T")[0];
            if (!jobsByDate.has(date)) {
              jobsByDate.set(date, []);
            }
            jobsByDate.get(date).push(job.id);
          }
        }

        // Create schedule entries
        for (const [dateStr, jobIds] of jobsByDate.entries()) {
          const scheduleId = `${user.id}-${dateStr}`;
          const schedule = {
            id: scheduleId,
            userId: user.id,
            date: new Date(dateStr),
            shiftType: user.schedule?.workingLateShift ? "late" : "normal",
            startTime: user.schedule?.shiftStartTime || "05:00",
            endTime: user.schedule?.shiftEndTime || "17:00",
            jobIds: jobIds,
            location: user.location?.city || "Unknown",
          };

          await MongoSchedule.findOneAndUpdate(
            { id: scheduleId },
            { ...schedule, updatedAt: new Date() },
            { upsert: true, new: true },
          );
        }
      }
    } catch (error) {
      console.error("Error syncing schedules:", error);
    }
  }

  // Method to manually trigger a sync
  public async manualSync(): Promise<void> {
    try {
      await connectToDatabase();
      await this.syncAllData();
      console.log("Manual sync completed successfully");
    } catch (error) {
      console.error("Error during manual sync:", error);
      throw error;
    }
  }

  // Method to get sync status
  public getSyncStatus(): { isRunning: boolean; lastSync: Date | null } {
    return {
      isRunning: this.syncInterval !== null,
      lastSync: new Date(), // You could track this more precisely
    };
  }
}

export default MongoSyncService;
