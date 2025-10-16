import { PrismaClient } from "@prisma/client";
import { JwtPayload } from "jsonwebtoken";
import {
  gradeQueryFilterForTeacher,
  GradeQueryFilterTypeForTeacher,
} from "./teacherGradeConst";
import ApiError from "../../../errors/ApiErrors";
import httpStatus from "http-status";
const prisma = new PrismaClient();

// ------------------------ Teacher Flow in grade ------------------ //
const teacherOverview = async (user: JwtPayload, serchTerm: string) => {
  const [assignedClassesAgg, totalBooksAgg, totalStudentsAgg] =
    await prisma.$transaction([
      // total assigned classes
      prisma.grades.count({
        where: { TeacherGrades: { some: { teacherId: user.id } } },
      }),
      // total books for all teacher grades
      prisma.books.count({
        where: {
          GradeBooks: {
            some: {
              grade: { TeacherGrades: { some: { teacherId: user.id } } },
            },
          },
        },
      }),
      // total students for all teacher grades
      prisma.studentGrades.count({
        where: { grade: { TeacherGrades: { some: { teacherId: user.id } } } },
      }),
    ]);

  const grades = await prisma.grades.findMany({
    where: {
      TeacherGrades: { some: { teacherId: user.id } },
      ...(serchTerm && {
        OR: [{ grade: { contains: serchTerm } }],
      }),
    },
    include: { _count: { select: { GradeBooks: true, StudentGrades: true } } },
  });

  return {
    assignedGrades: assignedClassesAgg,
    assignBooks: totalBooksAgg,
    activeStudents: totalStudentsAgg,
    grades: grades.map((g) => ({
      id: g.id,
      grade: g.grade,
      totalBooks: g._count.GradeBooks,
      totalStudents: g._count.StudentGrades,
    })),
  };
};

const getGradesByIdForTeacher = async (
  id: string,
  query: { queryField: GradeQueryFilterTypeForTeacher; searchTerm: string }
) => {
  // Check grade exists
  const gradeData = await prisma.grades.findUnique({
    where: { id },
    include: { school: true },
  });
  if (!gradeData) {
    throw new ApiError(httpStatus.NOT_FOUND, "Grade not found");
  }

  // count for header
  const [
    studentCount,
    bookCount,
    totalResources,
    totalAssignment,
    totalAnnouncment,
  ] = await Promise.all([
    // 1. Count students in this grade
    prisma.studentGrades.count({
      where: { gradeId: id },
    }),

    // 2. Count books linked to this grade
    prisma.books.count({
      where: {
        GradeBooks: {
          some: { gradeId: id },
        },
      },
    }),

    // 3. Count resources linked to books of this grade
    prisma.resources.count({
      where: {
        book: {
          GradeBooks: {
            some: { gradeId: id },
          },
        },
      },
    }),
    prisma.assignment.count({
      where: {
        gradeId: id,
      },
    }),
    prisma.announcments.count({
      where: {
        OR: [
          {
            gradeId: id,
          },
          {
            publishBy: "Admin",
          },
        ],
        isPublished: true,
        title: { contains: query.searchTerm, mode: "insensitive" },
      },
    }),
  ]);

  let extraData: any[] = [];

  // Switch case by queryField
  switch (query.queryField) {
    case gradeQueryFilterForTeacher.STUDENT:
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
      extraData = studentData.map((s) => s.student);
      break;

    case gradeQueryFilterForTeacher.BOOKS:
      extraData = await prisma.books.findMany({
        where: {
          GradeBooks: {
            some: {
              gradeId: id,
            },
          },
          bookName: { contains: query.searchTerm, mode: "insensitive" },
        },
      });
      break;

    case gradeQueryFilterForTeacher.RESOURCES:
      extraData = await prisma.resources.findMany({
        where: {
          book: {
            GradeBooks: {
              some: {
                gradeId: id,
              },
            },
          },
          title: { contains: query.searchTerm, mode: "insensitive" },
        },
      });
      break;

    case gradeQueryFilterForTeacher.ASSIGNMENT:
      extraData = await prisma.assignment.findMany({
        where: {
          gradeId: id,
          title: { contains: query.searchTerm, mode: "insensitive" },
        },
      });
      break;

    case gradeQueryFilterForTeacher.ANNOUNCMENT:
      extraData = await prisma.announcments.findMany({
        where: {
          OR: [
            {
              gradeId: id,
            },
            {
              publishBy: "Admin",
            },
          ],
          isPublished: true,
          title: { contains: query.searchTerm, mode: "insensitive" },
        },
      });
      break;

    default:
      extraData = [];
      break;
  }
  return {
    totalStudent: studentCount,
    assignBook: bookCount,
    totalResources: totalResources,
    totalAssignment,
    totalAnnouncment,
    gradeData,
    [query.queryField]: extraData,
  };
};

export const teacherGradeServices = {
  teacherOverview,
  getGradesByIdForTeacher,
};
