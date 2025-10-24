import { Queue } from "bullmq";
import redisClient from "../helpers/radis";

export const usersQueue = new Queue("users", {
  connection: redisClient,
  defaultJobOptions: {
    backoff: { type: "exponential", delay: 5000 },
  },
});
