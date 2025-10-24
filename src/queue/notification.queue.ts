import { Queue } from "bullmq";
import redisClient from "../helpers/radis";

export const notificationQueue = new Queue("notification", {
  connection: redisClient,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
  },
});