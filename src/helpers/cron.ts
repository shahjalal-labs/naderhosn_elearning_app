import cron from "node-cron";
import prisma from "../shared/prisma";
import { sendGroupNotifications } from "../app/modules/notifications/notification.services";
import { AssignmentStatus } from "@prisma/client";

cron.schedule("0 0 * * *", async () => {
  console.log("😒 Cron is running");

  const now = new Date();
  const announcements = await prisma.announcments.findMany({
    where: { isPublished: false },
  });

  for (const announcement of announcements) {
    if (announcement.postdate <= now) {
      // Publish the announcement
      await prisma.announcments.update({
        where: { id: announcement.id },
        data: { isPublished: true },
      });

      // Fetch grade users
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

      // Send notifications
      if (userIds.length > 0) {
        try {
          await sendGroupNotifications(
            userIds,
            `New Announcement: "${announcement.title}"`,
            "Grade Announcement"
          );
        } catch (err) {
          console.error(
            "Failed to send scheduled announcement notifications:",
            err
          );
        }
      }
    }
  }

  // check is assignment left is 1 day . if left one day then notificaion send student whose in assignment.
  const assignments = await prisma.assignment.findMany({
    select: {
      id: true,
      title: true,
      dueDate: true,
      students: {
        select: { userId: true },
      },
    },
  });

  for (const assignment of assignments) {
    const diffInDays = Math.ceil(
      (assignment.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    // ✅ Send only if exactly 1 day is left
    if (diffInDays === 1) {
      const userIds = assignment.students.map((s) => s.userId);
      if (userIds.length > 0) {
        try {
          await sendGroupNotifications(
            userIds,
            `Assignment: "${assignment.title}"`,
            "Assignment is due tomorrow!"
          );
        } catch (err) {
          console.error(
            "Failed to send scheduled assignment notifications:",
            err,
            { assignmentId: assignment.id }
          );
        }
      }
    }
  }

  // Mark overdue assignments as "Missed"
  const overdueAssignments = await prisma.assignmentStudent.findMany({
    where: {
      assignmentStatus: AssignmentStatus.Pending, //  only pending ones
      assignment: {
        dueDate: { lt: now }, //  strictly before "now"
      },
    },
    include: {
      assignment: {
        select: { title: true },
      },
    },
  });

  for (const progress of overdueAssignments) {
    await prisma.assignmentStudent.update({
      where: { id: progress.id },
      data: { assignmentStatus: AssignmentStatus.Missed },
    });

    try {
      await sendGroupNotifications(
        [progress.userId],
        `Assignment: "${progress.assignment.title}"`,
        "You missed the assignment"
      );
    } catch (err) {
      console.error(
        "Failed to send missed assignment notification:",
        err,
        { assignmentId: progress.assignmentId, userId: progress.userId }
      );
    }
  }

});

export default cron;
