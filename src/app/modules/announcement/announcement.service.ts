import { Announcments, PrismaClient } from "@prisma/client";
import ApiError from "../../../errors/ApiErrors";
import httpStatus from "http-status";
const prisma = new PrismaClient();

const createAnnouncement = async (gradeId: string, data: Announcments) => {
  const today = new Date();
  const postDate = new Date(data.postdate);

  // Check date is future or today , or throw
  if (postDate.getTime() < today.setHours(0, 0, 0, 0)) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Post date must be today or a future date"
    );
  }

  //  check isPublished
  const isToday = postDate.toDateString() === new Date().toDateString();

  return await prisma.announcments.create({
    data: {
      ...data,
      gradeId,
      isPublished: isToday ? true : false,
    },
  });
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
