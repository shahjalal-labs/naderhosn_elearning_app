import { User, UserRole } from "@prisma/client";
import ApiError from "../../../errors/ApiErrors";
import prisma from "../../../shared/prisma";
import { paginationHelper } from "../../../shared/pagination";
import { uploadInSpace } from "../../../shared/UploadHelper";
import { uploadToDigitalOceanAWS } from "../../../helpers/uploadToDigitalOceanAWS";
import bcrypt from "bcryptjs";
import { CreateNewStudentType, CreateNewTeacherType } from "./user.validation";
import { usersQueue } from "../../../queue/users.queue";

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
                TeacherGrades: true,
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
          },
        }),
      ...(query.school && schoolData ? { school: schoolData } : {}),
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
    ...(query.school && tg.School ? { school: tg.School } : {}),
  }));
};

const createStudent = async (
  payload: CreateNewStudentType,
  file?: Express.Multer.File
) => {
  const { gradeId, schoolId, userName, email, password, ...rest } = payload;

  const isAlreadyTakenUserName = await prisma.user.findFirst({
    where: {
      loginUserName: payload.userName,
    },
  });
  if (isAlreadyTakenUserName) {
    throw new ApiError(409, "User name already taken");
  }

  // parallel school + grade check
  const [school, grade] = await Promise.all([
    prisma.school.findUnique({ where: { id: schoolId } }),
    prisma.grades.findUnique({ where: { id: gradeId } }),
  ]);

  if (!school) throw new ApiError(404, "School not found");
  if (!grade) throw new ApiError(404, "Grade not found");

  const isAlreadyExist = await prisma.studentGrades.findFirst({
    where: {
      grade: { schoolId },
      student: { loginUserName: userName },
    },
  });
  if (isAlreadyExist) {
    throw new ApiError(409, "Student already exists in this school");
  }

  const profileImage = file
    ? (await uploadToDigitalOceanAWS(file)).Location
    : "https://i.ibb.co.com/nrs3FjM/images.png";

  let hasherdpass;
  try {
    hasherdpass = await bcrypt.hash(payload.password, 8);
  } catch (error: any) {
    throw new ApiError(500, error?.message);
  }

  // transaction
  const [user] = await prisma.$transaction([
    prisma.user.create({
      data: {
        fullName: payload.name, // only include fields that exist in User model
        email,
        password: hasherdpass,
        loginUserName: userName,
        role: UserRole.Student,
        profileImage,
      },
    }),
  ]);

  await prisma.studentGrades.create({
    data: {
      gradeId,
      studentId: user.id,
    },
  });

  return user;
};

const createTeacher = async (
  payload: CreateNewTeacherType,
  file?: Express.Multer.File
) => {
  const { gradeIds, schoolId, name, userName, email, password, ...rest } =
    payload;

  const isAlreadyTakenUserName = await prisma.user.findFirst({
    where: {
      loginUserName: payload.userName,
    },
  });
  if (isAlreadyTakenUserName) {
    throw new ApiError(409, "User name already taken");
  }
  // parallel school + grade check
  const [school, grades] = await Promise.all([
    prisma.school.findUnique({ where: { id: schoolId } }),
    prisma.grades.findMany({ where: { id: { in: gradeIds } } }),
  ]);

  if (!school) throw new ApiError(404, "School not found");
  if (!grades || grades.length === 0)
    throw new ApiError(404, "Grades not found");

  const isAlreadyExist = await prisma.teacherGrades.findFirst({
    where: {
      grade: { schoolId },
      teacher: { loginUserName: userName },
    },
  });

  if (isAlreadyExist) {
    throw new ApiError(409, "Teacher already exists in this school");
  }

  const profileImage = file
    ? (await uploadToDigitalOceanAWS(file)).Location
    : "https://i.ibb.co/nrs3FjM/images.png";
  let hasherdpass;
  try {
    hasherdpass = await bcrypt.hash(payload.password, 8);
  } catch (error: any) {
    throw new ApiError(500, error?.message);
  }

  // create user (teacher)
  const user = await prisma.user.create({
    data: {
      fullName: name,
      email,
      password: hasherdpass,
      loginUserName: userName,
      role: UserRole.Teacher,
      profileImage,
    },
  });

  // assign teacher to grades
  const teacherGradesData = gradeIds.map((gradeId) => ({
    gradeId,
    teacherId: user.id,
  }));

  await prisma.teacherGrades.createMany({
    data: teacherGradesData,
  });

  return user;
};

// ------ bulk upload
// For students
const bulkUploadStudentIntoDB = async (payload: {
  schoolId: string;
  gradeId: string;
  numberOfStudent: number;
}) => {
  const [school, grade] = await Promise.all([
    prisma.school.findUnique({ where: { id: payload.schoolId } }),
    prisma.grades.findUnique({ where: { id: payload.gradeId } }),
  ]);

  if (!school) throw new ApiError(404, "School not found");
  if (!grade) throw new ApiError(404, "Grade not found");
  await usersQueue.add("uploadStudents", {
    type: "student",
    payload,
  });

  return "Student bulk upload job has been queued successfully";
};

// For teachers
const bulkUploadTeacherIntoDB = async (payload: {
  schoolId: string;
  gradeIds: string[];
  numberOfTeacher: number;
}) => {
  const [school, grades] = await Promise.all([
    prisma.school.findUnique({ where: { id: payload.schoolId } }),
    prisma.grades.findMany({ where: { id: { in: payload.gradeIds } } }),
  ]);

  if (!school) throw new ApiError(404, "School not found");
  if (grades.length !== payload.gradeIds.length) {
    throw new ApiError(404, "Some grades not found");
  }
  await usersQueue.add("uploadTeachers", {
    type: "teacher",
    payload,
  });

  return "Teacher bulk upload job has been queued successfully";
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
  createStudent,
  createTeacher,
  bulkUploadTeacherIntoDB,
  bulkUploadStudentIntoDB,
};
