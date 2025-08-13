import { Prisma, User, UserRole } from "@prisma/client";
import ApiError from "../../../errors/ApiErrors";
import prisma from "../../../shared/prisma";

import { paginationHelper } from "../../../shared/pagination";
import { uploadInSpace } from "../../../shared/UploadHelper";

const createStudent = async (payload: User) => {
  return "";
};

const createTeacher = async (payload: User) => {
  return "";
};

const getSingleUserIntoDB = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: { id },
  });
  if (!user) {
    throw new ApiError(404, "user not found!");
  }

  const { password, ...sanitizedUser } = user;
  return sanitizedUser;
};

const deleteUser = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: {
      id: id,
    },
  });
  if (!user) {
    throw new ApiError(404, "User not found for delete");
  }

  await prisma.user.update({
    where: { id },
    data: {
      status: "Deleted",
    },
  });

  return;
};

const getUsers = async (query: any) => {
  const { page, limit, skip } = paginationHelper(query);
  const users = await prisma.user.findMany({
    where: {},
    select: {
      id: true,
      name: true,
      profileImage: true,
    },
    take: limit,
    skip,
    orderBy: {
      joinedAt: "desc",
    },
  });

  const totalCount = await prisma.user.count({
    where: {},
  });
  const totalPages = Math.ceil(totalCount / limit);

  return { totalCount, totalPages, currentPage: page, users };
};

const updateUser = async (
  payload: User,
  userId: string,
  file: Express.Multer.File
) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new ApiError(404, "user not found for edit user");
  }

  let profileImage;

  if (file) {
    profileImage = await uploadInSpace(file, "users/profileImage");
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      ...payload,
      profileImage: file ? profileImage : user.profileImage,
    },
  });
  return;
};

const adminOverview = async () => {
  return {};
};

export const userService = {
  getUsers,
  getSingleUserIntoDB,
  updateUser,
  adminOverview,
  deleteUser,
  createStudent,
  createTeacher,
};
