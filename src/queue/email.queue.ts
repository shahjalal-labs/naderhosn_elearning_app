import { Queue } from "bullmq";
import redisClient from "../helpers/radis";
export const emailQueue = new Queue("email", {
  connection: redisClient,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
  },
});