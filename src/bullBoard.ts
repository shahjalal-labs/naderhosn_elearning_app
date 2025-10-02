import { ExpressAdapter } from "@bull-board/express";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { createBullBoard } from "@bull-board/api";
import { emailQueue } from "./queue/email.queue";
import { usersQueue } from "./queue/users.queue";
import { notificationQueue } from "./queue/notification.queue";

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath("/admin/queues");

createBullBoard({
  queues: [
    new BullMQAdapter(emailQueue),
    new BullMQAdapter(usersQueue),
    new BullMQAdapter(notificationQueue),
  ],
  serverAdapter,
});

export const bullBoardRouter = serverAdapter.getRouter();
