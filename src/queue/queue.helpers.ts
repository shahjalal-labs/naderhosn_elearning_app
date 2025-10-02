// queueHelpers.ts

import { notificationQueue } from "./notification.queue";


export const addJobToQueue = async (
  name: string,
  data: any,
  runAt: Date
) => {
  const delay = runAt.getTime() - Date.now();
  if (delay <= 0) return; // যদি past time হয়, skip করো

  await notificationQueue.add(name, data, {
    delay,
    attempts: 3,
    removeOnComplete: true,
  });
};
