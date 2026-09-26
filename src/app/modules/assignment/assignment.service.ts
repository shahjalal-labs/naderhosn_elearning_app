import { Assignment, AssignmentStatus, UserRole } from "@prisma/client";
import prisma from "../../../shared/prisma";
import ApiError from "../../../errors/ApiErrors";
import httpStatus from "http-status";
import { uploadToDigitalOceanAWS } from "../../../helpers/uploadToDigitalOceanAWS";
import { JwtPayload } from "jsonwebtoken";
import { z, string } from "zod";
import { gradedAssignmentSchema } from "./assignment.validation";
import {
  sendGroupNotifications,
  sendSingleNotification,
} from "../notifications/notification.services";
import { addJobToQueue } from "../../../queue/queue.helpers";

type AssignmentInput = Assignment & {
  studentIds?: string[];
  assignToAll?: boolean | string;
};

const createAssignment = async (
  data: AssignmentInput,
  file?: Express.Multer.File
) => {
  const grade = await prisma.grades.findUnique({
    where: { id: data.gradeId },
  });
  if (!grade) throw new Error("Grade not found");

  const book = await prisma.books.findUnique({ where: { id: data.bookId } });
  if (!book) throw new Error("Book not found");

  if (Number(data.startPage) >= Number(data.endPage)) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "End page must be greater than start page"
    );
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  if (new Date(data.dueDate) < todayStart) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Due date cannot be in the past"
    );
  }

  let attachament: string;
  if (file) {
    attachament = (await uploadToDigitalOceanAWS(file)).Location;
  }

  const { assignment, studentIds } = await prisma.$transaction(async (tx) => {
    const newAssignment = await tx.assignment.create({
      data: {
        title: data.title,
        startPage: data.startPage,
        endPage: data.endPage,
        instruction: data.instruction,
        attachament: (data as any).attachment || data.attachament || attachament,
        dueDate: new Date(data.dueDate),
        gradeId: data.gradeId,
        bookId: data.bookId,
      },
    });

    let assignedStudentIds: string[] = [];
    if (Boolean(data.assignToAll)) {
      const students = await tx.studentGrades.findMany({
        where: { gradeId: data.gradeId },
        select: { studentId: true },
      });
      assignedStudentIds = students.map((s) => s.studentId);
    } else {
      assignedStudentIds = data.studentIds || [];
    }

    if (assignedStudentIds.length > 0) {
      await tx.assignmentStudent.createMany({
        data: assignedStudentIds.map((id: string) => ({
          userId: id,
          assignmentId: newAssignment.id,
        })),
      });
    }

    return { assignment: newAssignment, studentIds: assignedStudentIds };
  });

  // Immediate notification (run safely outside of DB transaction)
  if (studentIds.length > 0) {
    try {
      await sendGroupNotifications(
        studentIds,
        "New Assignment",
        `New assignment "${data.title}" has been assigned to you.`
      );
    } catch (err) {
      console.error("Failed to send assignment notifications:", err);
    }
  }

  // Schedule Reminder (1 day before deadline)
  const reminderTime = new Date(
    assignment.dueDate.getTime() - 24 * 60 * 60 * 1000
  );
  await addJobToQueue(
    "assignmentReminder",
    { assignmentId: assignment.id, studentIds },
    reminderTime
  );

  // Schedule Missed Status (at dueDate)
  await addJobToQueue(
    "assignmentMissed",
    { assignmentId: assignment.id, studentIds },
    new Date(assignment.dueDate)
  );

  return assignment;
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
      const assignment = await prisma.assignment.findUnique({
        where: { id },
        include: {
          book: {
            select: { id: true, bookName: true, coverImg: true, file: true },
          },
          students: {
            include: {
              user: true,
            },
          },
        },
      });

      if (!assignment) {
        throw new ApiError(httpStatus.NOT_FOUND, "Assignment not found.");
      }

      const assignmentData = {
        id: assignment.id,
        title: assignment.title,
        instruction: assignment.instruction,
        startPage: assignment.startPage,
        endPage: assignment.endPage,
        assignDate: assignment.createdAt,
        dueDate: assignment.dueDate,
        attachment: assignment.attachament,
        attachament: assignment.attachament,
        bookData: assignment.book
          ? {
              ...assignment.book,
              bookPdf: assignment.book.file,
            }
          : null,
      };

      const totalSubmissions = assignment.students.filter(
        (s) => s.assignmentStatus === AssignmentStatus.Submitted
      ).length;

      const studentsArray = assignment.students.map((s) => ({
        assignmentProgressId: s.id,
        studentId: s.user?.id,
        fullName: s.user?.fullName,
        email: s.user?.email,
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
                select: { id: true, bookName: true, coverImg: true, file: true },
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
          attachment: myAssignment.assignment.attachament,
          attachament: myAssignment.assignment.attachament,
          bookData: myAssignment.assignment.book
            ? {
                ...myAssignment.assignment.book,
                bookPdf: myAssignment.assignment.book.file,
              }
            : null,
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
const getAssignmentByIdForTeacher = async (assignmentProgressId: string) => {
  const result = await prisma.assignmentStudent.findFirst({
    where: {
      id: assignmentProgressId,
    },
    include: {
      user: {
        omit: {
          password: true,
          loginUserName: true,
          fcmToken: true,
        },
      },
      assignment: {
        include: {
          book: {
            select: { id: true, bookName: true, coverImg: true, file: true },
          },
        },
      },
    },
  });
  if (!result) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Not Found ");
  }
  return {
    ...result,
    assignment: {
      ...result.assignment,
      attachment: result.assignment.attachament,
      bookData: result.assignment.book
        ? {
            ...result.assignment.book,
            bookPdf: result.assignment.book.file,
          }
        : null,
    },
  };
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
  if (isAssExist.assignmentStatus === AssignmentStatus.Graded) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      " already graded the assignment"
    );
  }
  if (isAssExist.assignmentStatus === AssignmentStatus.Missed) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      " already missed the assignment"
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
      "submit assignment",
      `"${user.fullName}" has been submit assignment - ${isAssExist.assignment.title}.`
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
      id,
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
  getAssignmentByIdForTeacher,
};
