import { Queue } from "bullmq";
import redisClient from "../helpers/radis";

console.log("users queue is proccessing")
export const usersQueue = new Queue("users", {
  connection: redisClient,
  defaultJobOptions: {
    backoff: { type: "exponential", delay: 5000 },
  },
});
