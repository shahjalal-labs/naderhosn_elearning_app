import { Prisma, User, UserRole } from "@prisma/client";
import ApiError from "../../../errors/ApiErrors";
import prisma from "../../../shared/prisma";

import { paginationHelper } from "../../../shared/pagination";
import { uploadInSpace } from "../../../shared/UploadHelper";

const getStudents = async () => {
  return await prisma.user.findMany({
    where: {
      role: "Student",
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      DOB: true,
      gender: true,
      phone: true,
      profileImage: true,
    },
  });
};

const getTeachers = async () => {
  return await prisma.user.findMany({
    where: {
      role: "Teacher",
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      DOB: true,
      gender: true,
      phone: true,
      profileImage: true,
    },
  });
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
      fullName: true,
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
  const totalRegisterSchool = await prisma.school.count();
  const totalTeacher = await prisma.user.count({
    where: {
      role: "Teacher",
    },
  });
  const totalStudent = await prisma.user.count({
    where: {
      role: "Student",
    },
  });
  const totalBooks = await prisma.books.count();
  return {
    totalRegisterSchool,
    totalTeacher,
    totalStudent,
    totalBooks,
  };
};
/// ---------- downalod --------
const getDownloadStudents = async (query: {
  school: boolean;
  grade: boolean;
}) => {
  const students = await prisma.user.findMany({
    where: { role: UserRole.Student },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      status: true,
      profileImage: true,
      DOB: true,
      StudentGrades: {
        select: {
          ...(query.grade && {
            grade: {
              select: {
                id: true,
                grade: true,
                section: true,
                TeacherGrades :true,
              },
            },
          }),
          ...(query.school && {
            School: {
              select: {
                id: true,
                name: true,
                location: true,
                schoolLogo: true,
              },
            },
          }),
        },
      },
    },
  });

  return students.map((student) => {
    const sg = student.StudentGrades?.[0] ?? null;
    const gradeData = sg?.grade ?? null;
    const schoolData = sg?.School ?? null;

    return {
      id: student.id,
      fullName: student.fullName,
      email: student.email,
      phone: student.phone,
      status: student.status,
      profileImage: student.profileImage,
      DOB: student.DOB,

      ...(query.grade &&
        gradeData && {
          grade: {
            id: gradeData.id,
            grade: gradeData.grade,
            section: gradeData.section,
          },
        }),
      ...(query.school &&
        schoolData && {
          school: schoolData,
        }),
    };
  });
};


const getDownloadTeachers = async (query: {
  school: boolean;
  details: boolean;
}) => {
  const teachers = await prisma.teacherGrades.findMany({
    select: {
      teacher: {
        select: query.details
          ? {
              id: true,
              fullName: true,
              email: true,
              DOB: true,
              phone: true,
              status: true,
              profileImage: true,
            }
          : {
              id: true,
              fullName: true,
              email: true,
            },
      },
      ...(query.school && {
        School: {
          select: {
            id: true,
            name: true,
            location: true,
            schoolLogo: true,
          },
        },
      }),
    },
  });

  // flatten teacher and school to top level
  return teachers.map((tg) => ({
    ...(tg.teacher && { ...tg.teacher }),
    ...(query.school && tg.School && { school: tg.School }),
  }));
};


export const userService = {
  getUsers,
  getSingleUserIntoDB,
  updateUser,
  adminOverview,
  deleteUser,
  getStudents,
  getTeachers,
  getDownloadTeachers,
  getDownloadStudents,
};
