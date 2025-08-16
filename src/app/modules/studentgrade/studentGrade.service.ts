import { PrismaClient, SchoolSectionEnum } from "@prisma/client";
import { JwtPayload } from "jsonwebtoken";
import ApiError from "../../../errors/ApiErrors";
import httpStatus from "http-status";
import prisma from "../../../shared/prisma";
import {
  gradeQueryFilterForStudent,
  GradeQueryFilterTypeForStudent,
} from "./studentGrade.const";

// ------------------------ student Flow in grade ------------------ //
const studentOverview = async (user: JwtPayload) => {
  const studentGrade = await prisma.studentGrades.findFirst({
    where: {
      studentId: user.id,
    },
  });
  if (!studentGrade) {
    throw new ApiError(httpStatus.NOT_FOUND, "Grade not found");
  }
  const totalBooksCount = await prisma.books.count({
    where: {
      gradeId: studentGrade?.gradeId,
    },
  });
  const totalBooks = await prisma.books.findMany({
    where: {
      gradeId: studentGrade?.gradeId,
    },
  });
  const studentAssignment = await prisma.assignmentStudent.findMany({
    where: {
      userId: user.id,
    },
    select: {
      assignment: {
        select: {
          id: true,
          title: true,
          dueDate: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  });
  return {
    bookCount: totalBooksCount,
    totalBook: totalBooks,
    assignments: studentAssignment.map((s) => s.assignment),
  };
};

const getGradesByIdForstudent = async (
  user: JwtPayload,
  query: { queryField: GradeQueryFilterTypeForStudent; searchTerm: string }
) => {
  // Check grade exists
  const studentGrade = await prisma.studentGrades.findFirst({
    where: {
      studentId: user.id,
    },
    include :{
      School : {
        select :{
          id : true,
          name : true,
          schoolLogo :true,
          location : true
        }
      }
    }
  });
  if (!studentGrade) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      "You have no Class , please contact admin"
    );
  }
  // count for header
  const bookCount = await prisma.books.count({
    where: { gradeId: studentGrade.gradeId },
  });

  let extraData: any[] = [];

  // Switch case by queryField
  switch (query.queryField) {
    case gradeQueryFilterForStudent.BOOKS:
      extraData = await prisma.books.findMany({
        where: {
          gradeId: studentGrade.gradeId,
          bookName: { contains: query.searchTerm, mode: "insensitive" },
        },
      });
      break;

    case gradeQueryFilterForStudent.RESOURCES:
      extraData = await prisma.resources.findMany({
        where: {
          gradeId: studentGrade.gradeId,
          title: { contains: query.searchTerm, mode: "insensitive" },
        },
      });
      break;

    case gradeQueryFilterForStudent.ASSIGNMENT:
      extraData = await prisma.assignment.findMany({
        where: {
          gradeId: studentGrade.gradeId,
          title: { contains: query.searchTerm, mode: "insensitive" },
        },
      });
      break;

    case gradeQueryFilterForStudent.ANNOUNCMENT:
      extraData = await prisma.announcments.findMany({
        where: {
          gradeId: studentGrade.gradeId,
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
    assignBook: bookCount,
    schoolData : studentGrade.School,
    [query.queryField]: extraData,
  };
};

export const studentGradeServices = {
  studentOverview,
  getGradesByIdForstudent,
};
