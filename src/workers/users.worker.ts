import { Worker } from "bullmq";
import {
  bulkUploadStudent,
  bulkUploadTeacher,
} from "../app/modules/user/const";
import redisClient from "../helpers/radis";

export const userWorker = new Worker(
  "users",
  async (job) => {
    console.log(`✅ Processing job ${job.id} of type: ${job.data.type}`);

    try {
      if (job.data.type === "student") {
        const result = await bulkUploadStudent(job.data.payload);
        console.log(`✅ Student job ${job.id} completed`);
        return result;
      }

      if (job.data.type === "teacher") {
        const result = await bulkUploadTeacher(job.data.payload);
        console.log(`✅ Teacher job ${job.id} completed`);
        return result;
      }

      throw new Error(`Unknown job type: ${job.data.type}`);
    } catch (err) {
      console.error(`❌ Job ${job.id} failed:`, err);
      throw err;
    }
  },
  {
    connection: redisClient,
  }
);

// ✅ CRITICAL: Add error listeners
userWorker.on("failed", (job, err) => {
  console.error(`🚨 Job ${job?.id} failed permanently:`, err);
});

userWorker.on("error", (err) => {
  console.error("🔥 Worker global error:", err);
});

// ✅ Log when worker starts
userWorker.on("ready", () => {
  console.log("✅ User worker is READY and processing jobs");
});
