import { PrismaClient } from "@prisma/client";
import { gradeQueryFilter, GradeQueryFilterType } from "./grade.const";
import ApiError from "../../../errors/ApiErrors";
import httpStatus from "http-status";
const prisma = new PrismaClient();

const createGrades = async (data: any) => {
  return await prisma.grades.create({ data });
};

const getAllGradess = async () => {
  return await prisma.grades.findMany();
};

const getGradesById = async (
  id: string,
  query: { queryField: GradeQueryFilterType; searchTerm: string }
) => {
  console.log("first");
  // Check grade exists
  const gradeData = await prisma.grades.findUnique({
    where: { id },
    include: { school: true },
  });
  if (!gradeData) {
    throw new ApiError(httpStatus.NOT_FOUND, "Grade not found");
  }

  // count for header
  const [teacherCount, studentCount, bookCount] = await Promise.all([
    prisma.teacherGrades.count({ where: { gradeId: id } }),
    prisma.studentGrades.count({ where: { gradeId: id } }),
    prisma.gradeBooks.count({ where: { gradeId: id } }),
  ]);

  let extraData: any[] = [];

  // Switch case by queryField
  switch (query.queryField) {
    case gradeQueryFilter.TEACHER:
      console.log("asasdasdas");
      const test = await prisma.teacherGrades.findMany({
        where: {
          gradeId: id,
        },
      });
      console.log("here is a test data -/", test);
      const teacherData = await prisma.teacherGrades.findMany({
        where: {
          gradeId: id,
          teacher: query.searchTerm
            ? {
                fullName: {
                  contains: query.searchTerm,
                  mode: "insensitive",
                },
              }
            : {},
        },
        select: {
          teacher: {
            select: {
              id: true,
              fullName: true,
              profileImage: true,
              email: true,
              phone: true,
              gender: true,
              DOB: true,
            },
          },
        },
      });
      console.log("teacherData", teacherData);
      extraData = teacherData.map((t) => t.teacher);
      break;

    case gradeQueryFilter.STUDENT:
      const studentData = await prisma.studentGrades.findMany({
        where: {
          gradeId: id,
          student: query.searchTerm
            ? {
                fullName: {
                  contains: query.searchTerm,
                  mode: "insensitive",
                },
              }
            : {},
        },
        select: {
          student: {
            select: {
              id: true,
              fullName: true,
              profileImage: true,
              email: true,
              phone: true,
              gender: true,
              DOB: true,
            },
          },
        },
      });
      console.log("studentData");
      extraData = studentData.map((s) => s.student);
      break;

    case gradeQueryFilter.BOOKS:
      extraData = await prisma.gradeBooks.findMany({
        where: {
          gradeId: id,
          book: {
            bookName: { contains: query.searchTerm, mode: "insensitive" },
          },
        },
        include: {
          book: true,
        },
      });
      break;

    case gradeQueryFilter.RESOURCES:
      const data = await prisma.gradeBooks.findMany({
        where: {
          gradeId: id,
          book: {
            Resources: {
              some: {
                title: { contains: query.searchTerm, mode: "insensitive" },
              },
            },
          },
        },
        include: {
          book: {
            include: {
              Resources: true,
            },
          },
        },
      });
      extraData = data.map((d) => d.book.Resources);
      break;

    case gradeQueryFilter.ASSIGNMENT:
      extraData = await prisma.assignment.findMany({
        where: {
          gradeId: id,
          title: { contains: query.searchTerm, mode: "insensitive" },
        },
      });
      break;

    case gradeQueryFilter.ANNOUNCMENT:
      extraData = await prisma.announcments.findMany({
        where: {
          gradeId: id,
          isPublished: true,
          title: { contains: query.searchTerm, mode: "insensitive" },
        },
      });
      break;

    default:
      const defaultTeacher = await prisma.teacherGrades.findMany({
        where: {
          gradeId: id,
          teacher: query.searchTerm
            ? {
                fullName: {
                  contains: query.searchTerm,
                  mode: "insensitive",
                },
              }
            : {},
        },
        select: {
          teacher: {
            select: {
              id: true,
              fullName: true,
              profileImage: true,
              email: true,
              phone: true,
              gender: true,
              DOB: true,
            },
          },
        },
      });
      extraData = defaultTeacher.map((t) => t.teacher);
      break;
  }

  return {
    teacherCount,
    studentCount,
    bookCount,
    gradeData,
    [query.queryField]: extraData,
  };
};

const updateGrades = async (id: string, data: any) => {
  return await prisma.grades.update({ where: { id }, data });
};

const deleteGrades = async (id: string) => {
  return await prisma.grades.delete({ where: { id } });
};

// ----------------- Assign Teacher into Grades --------------//
// const assignTeacherIntoDB = async (payload: any, file: Express.Multer.File) => {
//   let profileImage: string;
//   try {
//     profileImage = (await uploadToDigitalOceanAWS(file)).Location;
//   } catch (error) {
//     throw new ApiError(
//       httpStatus.NOT_ACCEPTABLE,
//       "Failed to upload profile image"
//     );
//   }
//   const { gradeId, schoolId, password, ...userCreateData } = payload;

//   const [isSchoolExist, isGradeExist] = await Promise.all([
//     prisma.school.findUnique({ where: { id: schoolId } }),
//     prisma.Grades.findUnique({ where: { id: gradeId } }),
//   ]);

//   if (!isSchoolExist) {
//     throw new ApiError(httpStatus.NOT_FOUND, "School isn't found");
//   }
//   if (!isGradeExist) {
//     throw new ApiError(httpStatus.NOT_FOUND, "School grade isn't found");
//   }
//   const hashedPass = await bcrypt.hash(password, 10);

//   const isExist = await prisma.teacherGrades.findFirst({
//     where: {
//       teacher: {
//         email: userCreateData.email,
//       },
//       gradeId,
//       schoolId,
//     },
//   });
//   if (isExist) {
//     throw new ApiError(httpStatus.BAD_REQUEST, "The Teacher already exist");
//   }

//   // Create teacher & teacherGrades in one transaction
//   const result = await prisma.$transaction(async (tx) => {
//     // Create teacher
//     const createTeacher = await tx.user.create({
//       data: {
//         ...userCreateData,
//         profileImage,
//         role: "Teacher",
//         password: hashedPass,
//       },
//     });

//     await tx.teacherGrades.create({
//       data: {
//         teacherId: createTeacher.id,
//         gradeId,
//         schoolId,
//       },
//     });

//     return createTeacher;
//   });

//   return result;
// };

// const assignExistingTeacherIntoDB = async ({
//   teacherId,
//   gradeId,
//   schoolId,
// }: {
//   teacherId: string;
//   gradeId: string;
//   schoolId: string;
// }) => {
//   const [schoolExists, gradeExists, teacherExists] = await Promise.all([
//     prisma.school.count({ where: { id: schoolId } }),
//     prisma.Grades.count({ where: { id: gradeId } }),
//     prisma.user.count({ where: { id: teacherId, role: "Teacher" } }),
//   ]);

//   if (!schoolExists)
//     throw new ApiError(httpStatus.NOT_FOUND, "School isn't found");
//   if (!gradeExists)
//     throw new ApiError(httpStatus.NOT_FOUND, "School grade isn't found");
//   if (!teacherExists)
//     throw new ApiError(httpStatus.NOT_FOUND, "Teacher isn't found");

//   // Check if already assigned
//   const alreadyAssigned = await prisma.teacherGrades.count({
//     where: { teacherId, gradeId, schoolId },
//   });

//   if (alreadyAssigned) {
//     throw new ApiError(
//       httpStatus.BAD_REQUEST,
//       "The Teacher already assigned into this grade"
//     );
//   }

//   // Create relation
//   return prisma.teacherGrades.create({
//     data: { teacherId, gradeId, schoolId },
//   });
// };

// const assignNewStudentIntoDB = async (
//   payload: any,
//   file: Express.Multer.File
// ) => {
//   let profileImage: string;
//   try {
//     profileImage = (await uploadToDigitalOceanAWS(file)).Location;
//   } catch (error) {
//     throw new ApiError(
//       httpStatus.NOT_ACCEPTABLE,
//       "Failed to upload profile image"
//     );
//   }
//   const { gradeId, schoolId, password, ...userCreateData } = payload;

//   const [isSchoolExist, isGradeExist] = await Promise.all([
//     prisma.school.findUnique({ where: { id: schoolId } }),
//     prisma.Grades.findUnique({ where: { id: gradeId } }),
//   ]);

//   if (!isSchoolExist) {
//     throw new ApiError(httpStatus.NOT_FOUND, "School isn't found");
//   }
//   if (!isGradeExist) {
//     throw new ApiError(httpStatus.NOT_FOUND, "School grade isn't found");
//   }

//   const isExist = await prisma.studentGrades.findFirst({
//     where: {
//       student: {
//         email: userCreateData.email,
//       },
//       gradeId,
//       schoolId,
//     },
//     include: {
//       grade: true,
//     },
//   });
//   if (isExist) {
//     throw new ApiError(
//       httpStatus.BAD_REQUEST,
//       `The student already exist in  Grade ${isExist.grade.grade} section ${isExist.grade.section} `
//     );
//   }
//   const hashedPass = await bcrypt.hash(password, 10);
//   // Create teacher & teacherGrades in one transaction
//   const result = await prisma.$transaction(async (tx) => {
//     // Create teacher
//     const createStudent = await tx.user.create({
//       data: {
//         ...userCreateData,
//         profileImage,
//         role: "Student",
//         password: hashedPass,
//       },
//     });

//     await tx.studentGrades.create({
//       data: {
//         studentId: createStudent.id,
//         gradeId,
//         schoolId,
//       },
//     });

//     return createStudent;
//   });

//   return result;
// };

export const gradesServices = {
  createGrades,
  getAllGradess,
  getGradesById,
  updateGrades,
  deleteGrades,
  // assignTeacherIntoDB,
  // assignExistingTeacherIntoDB,
  // assignNewStudentIntoDB,
};
