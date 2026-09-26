// queueHelpers.ts
import redisClient from "../helpers/radis";
import { notificationQueue } from "./notification.queue";

export const addJobToQueue = async (
  name: string,
  data: any,
  runAt: Date
) => {
  try {
    const delay = runAt.getTime() - Date.now();
    if (delay <= 0) return;

    if (redisClient.status !== "ready") {
      console.warn(
        `[Redis Queue] Skipping job "${name}" because Redis is not connected (status: ${redisClient.status})`
      );
      return;
    }

    await Promise.race([
      notificationQueue.add(name, data, {
        delay,
        attempts: 3,
        removeOnComplete: true,
      }),
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error("Queue add timed out (Redis unresponsive)")),
          2000
        )
      ),
    ]);
  } catch (err: any) {
    console.warn(`[Redis Queue] Failed to add job "${name}":`, err?.message || err);
  }
};

