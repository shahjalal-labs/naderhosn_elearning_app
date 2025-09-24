import { ExpressAdapter } from "@bull-board/express";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { createBullBoard } from "@bull-board/api";
import { emailQueue } from "./queue/email.queue";
import { usersQueue } from "./queue/users.queue";

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath("/admin/queues");

createBullBoard({
  queues: [new BullMQAdapter(emailQueue) , new BullMQAdapter(usersQueue)], 
  serverAdapter,
});

export const bullBoardRouter = serverAdapter.getRouter();
