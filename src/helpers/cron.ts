import cron from "node-cron";
import prisma from "../shared/prisma";

cron.schedule("0 0 * * *", async () => {
    console.log("😒 Corn is Running ")
  const now = new Date();
  const allAnnouncement = await prisma.announcments.findMany({
    where: {
      isPublished: false,
    },
  });
  allAnnouncement.forEach(async (announcement) => {
    if (announcement.postdate <= now) {
      await prisma.announcments.update({
        where: { id: announcement.id },
        data: { isPublished: true },
      });
    }
  });
});

export default cron;
