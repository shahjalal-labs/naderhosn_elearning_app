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
    throw new ApiError(
      httpStatus.NOT_FOUND,
      "You have'nt any garde! contact admin."
    );
  }
  const totalBooksCount = await prisma.books.count({
    where: {
      GradeBooks: {
        some: {
          gradeId: studentGrade?.gradeId,
        },
      },
    },
  });

  const totalResources = await prisma.resources.count({
    where: {
      book: {
        GradeBooks: {
          some: {
            gradeId: studentGrade.gradeId,
          },
        },
      },
    },
  });
  const studentAssignment = await prisma.assignmentStudent.count({
    where: {
      userId: user.id,
    },
  });
  const totalAnnouncment = await prisma.announcments.count({
    where: {
     OR :[
      { gradeId: studentGrade.gradeId},
      {
        publishBy : "Admin"
      }
     ],
      isPublished: true,
    },
  });
  return {
    TotalBooks: totalBooksCount,
    TotalAssignment: studentAssignment,
    TotalAnnouncment: totalAnnouncment,
    TotalResources: totalResources,
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
    include: {
      grade: {
        include: {
          school: true,
        },
      },
    },
  });
  if (!studentGrade) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      "You have no Class , please contact admin"
    );
  }
  // count for header
  const bookCount = await prisma.books.count({
    where: {
      GradeBooks: {
        some: {
          gradeId: studentGrade.gradeId,
        },
      },
    },
  });

  let extraData: any[] = [];

  // Switch case by queryField
  switch (query.queryField) {
    case gradeQueryFilterForStudent.BOOKS:
      extraData = await prisma.books.findMany({
        where: {
          GradeBooks: {
            some: {
              gradeId: studentGrade.gradeId,
            },
          },
          bookName: { contains: query.searchTerm, mode: "insensitive" },
        },
        include: {
          category: true,
          Resources: true,
        },
        orderBy: {
          bookName: "asc",
        },
      });
      break;

    case gradeQueryFilterForStudent.ASSIGNMENT:
      const assignmentData = await prisma.assignmentStudent.findMany({
        where: {
          userId: studentGrade.studentId,
          assignment: {
            title: { contains: query.searchTerm, mode: "insensitive" },
          },
        },
        select: {
          assignmentStatus: true,
          assignment: true,
        },
      });
      extraData = assignmentData.map((a) => ({
        ...a.assignment,
        status: a.assignmentStatus,
      }));
      break;

    case gradeQueryFilterForStudent.ANNOUNCMENT:
      extraData = await prisma.announcments.findMany({
        where: {
          OR : [
            {
              gradeId: studentGrade.gradeId
            },
            {
                publishBy : "Admin"
            }
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
    assignBook: bookCount,
    schoolData: studentGrade.grade.school,
    [query.queryField]: extraData,
  };
};

export const studentGradeServices = {
  studentOverview,
  getGradesByIdForstudent,
};
