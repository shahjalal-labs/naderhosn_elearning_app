import { PrismaClient, SchoolSectionEnum } from "@prisma/client";
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
      prisma.schoolGrades.count({
        where: { TeacherGrades: { some: { teacherId: user.id } } },
      }),
      // total books for all teacher grades
      prisma.books.count({
        where: { grade: { TeacherGrades: { some: { teacherId: user.id } } } },
      }),
      // total students for all teacher grades
      prisma.studentGrades.count({
        where: { grade: { TeacherGrades: { some: { teacherId: user.id } } } },
      }),
    ]);

  const grades = await prisma.schoolGrades.findMany({
    where: {
      TeacherGrades: { some: { teacherId: user.id } },
      ...(serchTerm && {
        OR: [
          { grade: { equals: serchTerm } },
          {
            section: {
              equals: serchTerm.toUpperCase() as keyof typeof SchoolSectionEnum,
            },
          },
        ],
      }),
    },
    include: { _count: { select: { Books: true, StudentGrades: true } } },
  });

  return {
    assignedClasses: assignedClassesAgg,
    totalBooks: totalBooksAgg,
    totalStudents: totalStudentsAgg,
    grades: grades.map((g) => ({
      id: g.id,
      grade: g.grade,
      section: g.section,
      totalBooks: g._count.Books,
      totalStudents: g._count.StudentGrades,
    })),
  };
};

const getGradesByIdForTeacher = async (
  id: string,
  query: { queryField: GradeQueryFilterTypeForTeacher; searchTerm: string }
) => {
  // Check grade exists
  const gradeData = await prisma.schoolGrades.findUnique({
    where: { id },
    include: { school: true },
  });
  if (!gradeData) {
    throw new ApiError(httpStatus.NOT_FOUND, "Grade not found");
  }

  // count for header
  const [studentCount, bookCount] = await Promise.all([
    prisma.studentGrades.count({ where: { gradeId: id } }),
    prisma.books.count({ where: { gradeId: id } }),
  ]);

  let extraData: any[] = [];

  // Switch case by queryField
  switch (query.queryField) {
    case gradeQueryFilterForTeacher.STUDENT:
      const studentData = await prisma.studentGrades.findMany({
        where: {
          gradeId: id,
          student: {
            fullName: { contains: query.searchTerm, mode: "insensitive" },
          },
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
          gradeId: id,
          bookName: { contains: query.searchTerm, mode: "insensitive" },
        },
      });
      break;

    case gradeQueryFilterForTeacher.RESOURCES:
      extraData = await prisma.resources.findMany({
        where: {
          gradeId: id,
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
          gradeId: id,
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
    gradeData,
    [query.queryField]: extraData,
  };
};

export const teacherGradeServices = {
  teacherOverview,
  getGradesByIdForTeacher,
};
