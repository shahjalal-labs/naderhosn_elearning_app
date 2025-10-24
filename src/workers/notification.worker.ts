import { Worker } from "bullmq";
import prisma from "../shared/prisma";
import { sendGroupNotifications } from "../app/modules/notifications/notification.services";
import { AssignmentStatus, UserRole } from "@prisma/client";
import redisClient from "../helpers/radis";

export const notificationWorker = new Worker(
  "notificationQueue",
  async (job) => {

    if (job.name === "publishAnnouncements") {
      const { announcementId } = job.data;
      const now = new Date();
      const announcement = await prisma.announcments.findUnique({
        where: { id: announcementId },
      });
      if (!announcement) return;

      if (announcement.postdate <= now && !announcement.isPublished) {
        await prisma.announcments.update({
          where: { id: announcement.id },
          data: { isPublished: true },
        });

        if (announcement.gradeId) {
          const gradeStudents = await prisma.studentGrades.findMany({
            where: { gradeId: announcement.gradeId },
            select: { studentId: true },
          });
          const gradeTeachers = await prisma.teacherGrades.findMany({
            where: { gradeId: announcement.gradeId },
            select: { teacherId: true },
          });

          const userIds = [
            ...gradeStudents.map((s) => s.studentId),
            ...gradeTeachers.map((t) => t.teacherId),
          ];

          if (userIds.length > 0) {
            await sendGroupNotifications(
              userIds,
              "Grade Announcement",
              `New Announcement: "${announcement.title}"`,
            );
          }
        }

        if (
          !announcement.gradeId ||
          announcement.publishBy === UserRole.Admin
        ) {
          const users = await prisma.user.findMany({
            where: { NOT: { role: "Admin" } },
            select: { id: true },
          });
          const userIds = users.map((u) => u.id);
          await sendGroupNotifications(
            userIds,
            "Admin-Announcement",
            `New Announcement: "${announcement.anouncement}"`,
          );
        }
      }
    }

    if (job.name === "assignmentReminder") {
      const { assignmentId, studentIds } = job.data;
      const assignment = await prisma.assignment.findUnique({
        where: { id: assignmentId },
      });
      if (!assignment) return;

      await sendGroupNotifications(
        studentIds,
        "Assignment Reminder",
        `Assignment: "${assignment.title}" is due tomorrow!`,
      );
    }

    if (job.name === "assignmentMissed") {
      const { assignmentId, studentIds } = job.data;
      const progresses = await prisma.assignmentStudent.findMany({
        where: { assignmentId, assignmentStatus: AssignmentStatus.Pending },
        include: { assignment: { select: { title: true } } },
      });

      for (const progress of progresses) {
        await prisma.assignmentStudent.update({
          where: { id: progress.id },
          data: { assignmentStatus: AssignmentStatus.Missed },
        });

        await sendGroupNotifications(
          [progress.userId],
          `Assignment: "${progress.assignment.title}"`,
          "You missed the assignment"
        );
      }
    }
  },
  {
    connection: redisClient,
  }
);

notificationWorker.on("failed", (job, err) => {
  console.error(`🚨 Job ${job?.id} failed permanently:`, err);
});

notificationWorker.on("error", (err) => {
  console.error("🔥 Worker global error:", err);
});

// ✅ Log when worker starts
notificationWorker.on("ready", () => {
  console.log("✅ notification worker is READY and processing jobs");
});
