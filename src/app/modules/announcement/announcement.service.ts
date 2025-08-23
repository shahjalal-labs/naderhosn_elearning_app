import { Announcments, PrismaClient } from "@prisma/client";
import ApiError from "../../../errors/ApiErrors";
import httpStatus from "http-status";
import { sendGroupNotifications } from "../notifications/notification.services";
const prisma = new PrismaClient();

const createAnnouncement = async (gradeId: string, data: Announcments) => {
  const isGradeExist = await prisma.schoolGrades.findUnique({
    where :{
      id : gradeId
    }
  })
  if(!isGradeExist){
    throw new ApiError(httpStatus.NOT_FOUND, "Grade not Found");
  }
  const today = new Date();
  const postDate = new Date(data.postdate);

  // Validate postDate
  if (postDate.getTime() < today.setHours(0, 0, 0, 0)) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Post date must be today or a future date"
    );
  }

  const isToday = postDate.toDateString() === new Date().toDateString();

  // Fetch grade users
  const gradeStudents = await prisma.studentGrades.findMany({
    where: { gradeId },
    select: { studentId: true },
  });
  const gradeTeachers = await prisma.teacherGrades.findMany({
    where: { gradeId },
    select: { teacherId: true },
  });

  const userIds = [
    ...gradeStudents.map((s) => s.studentId),
    ...gradeTeachers.map((t) => t.teacherId),
  ];

  // Create Announcement
  const announcement = await prisma.announcments.create({
    data: {
      ...data,
      gradeId,
      isPublished: isToday ? true : false,
    },
  });

  // Send notifications if published today
  if (isToday) {
    try {
      await sendGroupNotifications(
        userIds,
        `New Announcement: "${data.title}"`,
        data.anouncement
      );
    } catch (err) {
      console.error("Failed to send announcement notifications:", err);
    }
  }

  return announcement;
};


const getAllAnnouncements = async () => {
  return await prisma.announcments.findMany();
};

const getAnnouncementById = async (id: string) => {
  const res = await prisma.announcments.findUnique({ where: { id } });
  if (!res) {
    throw new ApiError(httpStatus.NOT_FOUND, "Announcment not Found ");
  }
  return res;
};

const updateAnnouncement = async (id: string, data: any) => {
  const isExist = await prisma.announcments.findUnique({
    where: {
      id,
    },
  });
  if (!isExist) {
    throw new ApiError(httpStatus.NOT_FOUND, "Announcment Not Found");
  }
  if (isExist.isPublished) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Announcment already published");
  }
  await prisma.announcments.update({ where: { id }, data });
  return;
};

const deleteAnnouncement = async (id: string) => {
  return await prisma.announcments.delete({ where: { id } });
};

export const announcementServices = {
  createAnnouncement,
  getAllAnnouncements,
  getAnnouncementById,
  updateAnnouncement,
  deleteAnnouncement,
};
