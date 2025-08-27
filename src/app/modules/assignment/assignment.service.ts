import {
  Assignment,
  AssignmentStatus,
  UserRole,
} from "@prisma/client";
import prisma from "../../../shared/prisma";
import ApiError from "../../../errors/ApiErrors";
import httpStatus from "http-status";
import { uploadToDigitalOceanAWS } from "../../../helpers/uploadToDigitalOceanAWS";
import { JwtPayload } from "jsonwebtoken";
import { z } from "zod";
import { gradedAssignmentSchema } from "./assignment.validation";
import {
  sendGroupNotifications,
  sendSingleNotification,
} from "../notifications/notification.services";

type AssignmentInput = Assignment & {
  studentIds?: string[];
  assignToAll?: boolean;
};

const createAssignment = async (
  data: AssignmentInput,
  file?: Express.Multer.File
) => {
  const grade = await prisma.schoolGrades.findUnique({
    where: { id: data.gradeId },
  });
  if (!grade) {
    throw new Error("Grade not found");
  }
  const book = await prisma.books.findUnique({ where: { id: data.bookId } });
  if (!book) {
    throw new Error("Book not found");
  }
  if (Number(data.startPage) >= Number(data.endPage)) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "End page must be greater than start page"
    );
  }
  let attachament: string;
  if (file) {
    attachament = (await uploadToDigitalOceanAWS(file)).Location;
  }
  return await prisma.$transaction(async (tx) => {
    // 1️⃣ Create Assignment
    const assignment = await tx.assignment.create({
      data: {
        title: data.title,
        startPage: data.startPage,
        endPage: data.endPage,
        instruction: data.instruction,
        attachament: data.attachament || attachament,
        dueDate: new Date(data.dueDate),
        gradeId: data.gradeId,
        bookId: data.bookId,
      },
    });
    // 2️⃣ Get list of students
    let studentIds = [];
    if (data.assignToAll) {
      // Fetch all students in the grade
      const students = await tx.studentGrades.findMany({
        where: { gradeId: data.gradeId },
        select: { studentId: true },
      });
      studentIds = students.map((s) => s.studentId);
    } else {
      studentIds = data.studentIds || [];
    }
    // 3️⃣ Create AssignmentStudent entries
    if (studentIds.length > 0) {
      await tx.assignmentStudent.createMany({
        data: studentIds.map((id: string) => ({
          userId: id,
          assignmentId: assignment.id,
        })),
      });
    }

    try {
      await sendGroupNotifications(
        studentIds,
        `New assignment "${data.title}" has been assigned to you.`,
        "New Assignment"
      );
    } catch (err) {
      console.error("Failed to send assignment notifications:", err);
    }

    return assignment;
  });
};
const getAllAssignments = async () => {
  return await prisma.assignment.findMany();
};

const getAssignmentById = async (id: string, user: JwtPayload) => {
  let result;

  switch (user.role) {
    //  Admin + Teacher (common logic)
    case UserRole.Admin:
    case UserRole.Teacher: {
      const students = await prisma.assignmentStudent.findMany({
        where: { assignmentId: id },
        include: {
          assignment: {
            include: {
              book: {
                select: { id: true, bookName: true, coverImg: true },
              },
            },
          },
          user: true,
        },
      });

      if (!students.length) {
        throw new ApiError(httpStatus.NOT_FOUND, "No students assigned.");
      }

      const assignmentData = {
        id: students[0].assignment.id,
        title: students[0].assignment.title,
        instruction: students[0].assignment.instruction,
        startPage: students[0].assignment.startPage,
        endPage: students[0].assignment.endPage,
        assignDate: students[0].assignment.createdAt,
        dueDate: students[0].assignment.dueDate,
        bookData: students[0].assignment.book,
      };

      // count submissions (option A: DB query, option B: filter)
      const totalSubmissions = await prisma.assignmentStudent.count({
        where: {
          assignmentId: id,
          assignmentStatus: AssignmentStatus.Submitted,
        },
      });

      const studentsArray = students.map((s) => ({
        assignmentProgressId: s.id,
        studentId: s.user.id,
        fullName: s.user.fullName,
        email: s.user.email,
        grade: s.assignmentGrade,
        gradeBy: s.gradedBy,
        submittedAt: s.submittedAt,
        studentAnswer: s.studentAnswer,
        studentAttachment: s.studentAttachement,
        feedBack: s.FeedBack,
        status: s.assignmentStatus,
      }));

      result = {
        totalSubmissions,
        assignment: assignmentData,
        students: studentsArray,
      };
      break;
    }

    //  Student
    case UserRole.Student: {
      const myAssignment = await prisma.assignmentStudent.findFirst({
        where: { assignmentId: id, userId: user.id },
        include: {
          assignment: {
            include: {
              book: {
                select: { id: true, bookName: true, coverImg: true },
              },
            },
          },
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
              profileImage: true,
            },
          },
        },
      });

      if (!myAssignment) {
        throw new ApiError(httpStatus.NOT_FOUND, "No Assignment assigned.");
      }

      result = {
        assignment: {
          id: myAssignment.assignment.id,
          title: myAssignment.assignment.title,
          instruction: myAssignment.assignment.instruction,
          startPage: myAssignment.assignment.startPage,
          endPage: myAssignment.assignment.endPage,
          assignDate: myAssignment.assignment.createdAt,
          dueDate: myAssignment.assignment.dueDate,
          bookData: myAssignment.assignment.book,
        },
        student: myAssignment.user,
        answer: {
          grade: myAssignment.assignmentGrade,
          gradeBy: myAssignment.gradedBy,
          submittedAt: myAssignment.submittedAt,
          studentAnswer: myAssignment.studentAnswer,
          studentAttachment: myAssignment.studentAttachement,
          feedBack: myAssignment.FeedBack,
          status: myAssignment.assignmentStatus,
        },
      };
      break;
    }

    default:
      throw new ApiError(httpStatus.FORBIDDEN, "Unauthorized access.");
  }

  return result;
};

const updateAssignment = async (
  id: string,
  data: any,
  file?: Express.Multer.File
) => {
  const isAssExist = await prisma.assignment.findUnique({
    where: {
      id,
    },
  });
  if (!isAssExist) {
    throw new ApiError(httpStatus.NOT_FOUND, "Assignment Not Found");
  }
  let attachament: string = "";
  if (file) {
    attachament = (await uploadToDigitalOceanAWS(file)).Location;
  }
  return await prisma.assignment.update({
    where: { id },
    data: {
      ...data,
      ...(data.attachament || attachament
        ? { attachament: data.attachament || attachament }
        : {}),
    },
  });
};
const submitAssignmentIntoDB = async (
  id: string,
  data: { answer: string },
  user: JwtPayload,
  file?: Express.Multer.File
) => {
  const isAssExist = await prisma.assignmentStudent.findFirst({
    where: {
      assignmentId: id,
      userId: user.id,
    },
    include: {
      assignment: {
        select: {
          title: true,
          grade: {
            select: {
              TeacherGrades: {
                select: {
                  teacherId: true,
                },
              },
            },
          },
        },
      },
    },
  });
  if (!isAssExist) {
    throw new ApiError(httpStatus.NOT_FOUND, "You have No assignment .");
  }
  if (isAssExist.assignmentStatus === AssignmentStatus.Submitted) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      " already submitted the assignment"
    );
  }
  let attachament: string = "";
  if (file) {
    attachament = (await uploadToDigitalOceanAWS(file)).Location;
  }
  await prisma.assignmentStudent.update({
    where: {
      id: isAssExist.id,
    },
    data: {
      studentAnswer: data.answer,
      assignmentStatus: AssignmentStatus.Submitted,
      studentAttachement: attachament,
      submittedAt: new Date().toISOString(),
    },
  });
  try {
    await sendGroupNotifications(
      isAssExist.assignment.grade.TeacherGrades.map((t) => t.teacherId),
      `"${user.fullName}" has been submit assignment - ${isAssExist.assignment.title}.`,
      "submit assignment"
    );
  } catch (err) {
    console.error("Failed to send assignment notifications:", err);
  }
  return;
};
const gradedAssignmentIntoDB = async (
  id: string,
  data: z.infer<typeof gradedAssignmentSchema>,
  user: JwtPayload
) => {
  const isAssExist = await prisma.assignmentStudent.findFirst({
    where: {
      id
    },
  });
  if (!isAssExist) {
    throw new ApiError(httpStatus.NOT_FOUND, "The Assignment Not Found .");
  }
  await prisma.assignmentStudent.update({
    where: {
      id: isAssExist.id,
    },
    data: {
      assignmentGrade: data.grade,
      FeedBack: data.feedback,
      gradedBy: user.fullName,
    },
  });
  try {
    await sendSingleNotification(
      isAssExist.userId,
      `Got Assignment Grade ${data.grade} ,gradby - ${user.fullName} feedback - ${data.feedback}`,
      user.id,
      `congratulations , You got assignment result ${data.grade} Grade !}`
    );
  } catch (err) {
    console.error("Failed to send assignment notifications:", err);
  }
};

const deleteAssignment = async (id: string) => {
  return await prisma.assignment.delete({ where: { id } });
};

export const assignmentServices = {
  createAssignment,
  getAllAssignments,
  getAssignmentById,
  updateAssignment,
  deleteAssignment,
  submitAssignmentIntoDB,
  gradedAssignmentIntoDB,
};
