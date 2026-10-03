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
  user: JwtPayload,
  file?: Express.Multer.File,
) => {
  const isBookExist = await prisma.books.findFirst({
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
  const fileUpload = file ? (await uploadToDigitalOceanAWS(file)).Location : undefined;

  let uploaderName = user?.fullName;
  if (!uploaderName || uploaderName.trim() === "") {
    if (user?.id) {
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { fullName: true, loginUserName: true, role: true },
      });
      uploaderName = dbUser?.fullName?.trim() || dbUser?.loginUserName || user?.role || "Admin";
    } else {
      uploaderName = user?.role || "Admin";
    }
  }

  const res = await prisma.resources.create({
    data: {
      ...data,
      bookId,
      file: fileUpload ? fileUpload : data.file,
      uploderName: uploaderName,
      uplodedBy: user?.role || "Admin",
    },
  });
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
  return res
};

const getAllResources = async () => {
  const list = await prisma.resources.findMany();
  return list.map((item) => {
    if (!item.uploderName || item.uploderName.trim() === "" || item.uploderName.toLowerCase() === "unknown") {
      item.uploderName = item.uplodedBy && item.uplodedBy.trim() !== "" && item.uplodedBy.toLowerCase() !== "unknown"
        ? item.uplodedBy
        : "Admin";
    }
    return item;
  });
};

const getResourceById = async (id: string) => {
  const res = await prisma.resources.findUnique({ where: { id } });
  if (!res) throw new ApiError(httpStatus.NOT_FOUND, "Resource not found");
  if (!res.uploderName || res.uploderName.trim() === "" || res.uploderName.toLowerCase() === "unknown") {
    res.uploderName = res.uplodedBy && res.uplodedBy.trim() !== "" && res.uplodedBy.toLowerCase() !== "unknown"
      ? res.uplodedBy
      : "Admin";
  }
  return res;
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
