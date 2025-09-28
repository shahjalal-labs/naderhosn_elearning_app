import { Queue } from "bullmq";
import redisClient from "../helpers/radis";

console.log("👌Notification queue is running !");
export const notification = new Queue("notificationQueue", {
  connection: redisClient,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
  },
});


