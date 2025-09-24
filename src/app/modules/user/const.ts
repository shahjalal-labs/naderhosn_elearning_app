import { UserRole } from "@prisma/client";
import ApiError from "../../../errors/ApiErrors";
import prisma from "../../../shared/prisma";
import bcrypt from "bcryptjs";

export function generateStudentUserName(): string {
  const timestamp = Date.now().toString(36); // base36 makes it shorter
  const randomPart = Math.random().toString(36).substr(2, 4); // 4 random chars
  return `stu-${timestamp}-${randomPart}`;
}
export function generateTeacherUserName(): string {
  const timestamp = Date.now().toString(36); // base36 makes it shorter
  const randomPart = Math.random().toString(36).substr(2, 4); // 4 random chars
  return `teach-${timestamp}-${randomPart}`;
}
export function randomPassword(): string {
  const randomPart = Math.random().toString(36).substr(2, 6);
  return randomPart;
}

export const bulkUploadStudent = async (payload: {
  schoolId: string;
  gradeId: string;
  numberOfStudent: number;
}) => {
  return await prisma.$transaction(
    async (tx) => {
      const users = await Promise.all(
        Array.from({ length: payload.numberOfStudent }, async (_, index) =>
          tx.user.create({
            data: {
              loginUserName: generateStudentUserName(),
              password: await bcrypt.hash(randomPassword(), 8),
              role: UserRole.Student,
            },
          })
        )
      );

      await Promise.all(
        users.map((user) =>
          tx.studentGrades.create({
            data: {
              studentId: user.id,
              gradeId: payload.gradeId,
            },
          })
        )
      );

      return {
        students: users.map((user) => {
          return {
            loginUserName: user.loginUserName,
            password: user.password,
          };
        }),
      };
    },
    {
      maxWait: 10000,
      timeout: 60000,
    }
  );
};

export const bulkUploadTeacher = async (payload: {
  schoolId: string;
  gradeIds: string[];
  numberOfTeacher: number;
}) => {
  // Validate school + grades in parallel
  return await prisma.$transaction(async (tx) => {
    // Create teachers in parallel
    const teachers = await Promise.all(
      Array.from({ length: payload.numberOfTeacher }, async (_, index) =>
        tx.user.create({
          data: {
            loginUserName: generateTeacherUserName(),
            password: await bcrypt.hash(randomPassword(), 8),
            role: UserRole.Teacher,
          },
        })
      )
    );

    // Assign each teacher to all provided grades
    const teacherGradeLinks = teachers.flatMap((teacher) =>
      payload.gradeIds.map((gradeId) => ({
        teacherId: teacher.id,
        gradeId,
      }))
    );

    if (teacherGradeLinks.length > 0) {
      await tx.teacherGrades.createMany({
        data: teacherGradeLinks,
      });
    }

    return {
      Teachers: teachers.map((teacher) => ({
        loginUserName: teacher.loginUserName,
        password: teacher.password,
      })),
    };
  });
};
