import { Resources } from "@prisma/client";
import prisma from "../../../shared/prisma";
import ApiError from "../../../errors/ApiErrors";
import httpStatus from "http-status";
import { uploadToDigitalOceanAWS } from "../../../helpers/uploadToDigitalOceanAWS";
import { JwtPayload } from "jsonwebtoken";
import { sendGroupNotifications } from "../notifications/notification.services";

const createResource = async (
  data: Resources,
  bookId: string,
  file: Express.Multer.File,
  user: JwtPayload
) => {
  const isBookExist = await prisma.books.findUnique({
    where: { id: bookId },
    include: {
      GradeBooks : {
        include :{
          grade : {
            include :{
              StudentGrades : true
            }
          }
        }
      }
    },
  });
  if (!isBookExist) {
    throw new ApiError(httpStatus.NOT_FOUND, "Book not found");
  }
  const fileUpload = (await uploadToDigitalOceanAWS(file)).Location;
  await prisma.resources.create({
    data: {
      ...data,
      bookId,
      file: fileUpload,
      uploderName: user.fullName ?? "",
      uplodedBy: user.role,
    },
  });
  console.log("first" , isBookExist.GradeBooks[0].grade.StudentGrades)
  const userIds = isBookExist.GradeBooks.flatMap(s => s.grade.StudentGrades.map(s => s.studentId));
  try {
    await sendGroupNotifications(
      userIds,
      `New resources Added: "${data.title}"`,
      data.description ?? "",
    );
  } catch (err) {
    console.error("Failed to send announcement notifications:", err);
  }
  return 
};

const getAllResources = async () => {
  return await prisma.resources.findMany();
};

const getResourceById = async (id: string) => {
  const res = await prisma.resources.findUnique({ where: { id } });
  if (!res) throw new ApiError(httpStatus.NOT_FOUND, "Resource not found");
  return res
};

const updateResource = async (
  id: string,
  data: Partial<Resources>,
  file?: Express.Multer.File
) => {
  const isRecourseExist = await prisma.resources.findUnique({
    where: { id },
  });
  if (!isRecourseExist)
    throw new ApiError(httpStatus.NOT_FOUND, "Recourse not found");
  let fileUpload: string | undefined;
  if (file) {
    fileUpload = (await uploadToDigitalOceanAWS(file)).Location;
  }
  return await prisma.resources.update({
    where: {
      id,
    },
    data: {
      ...data,
      ...(fileUpload && { file: fileUpload }),
    },
  });
};

const deleteResource = async (id: string) => {
  return await prisma.resources.delete({ where: { id } });
};

export const resourceServices = {
  createResource,
  getAllResources,
  getResourceById,
  updateResource,
  deleteResource,
};
