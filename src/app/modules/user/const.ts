import { UserRole } from "@prisma/client";
import prisma from "../../../shared/prisma";

export function generateStudentUserName(): string {
  const randomFiveDigits = Math.floor(10000 + Math.random() * 90000); // ensures 5 digits
  return `s-${randomFiveDigits}`;
}

export function generateTeacherUserName(): string {
  const randomFiveDigits = Math.floor(10000 + Math.random() * 90000); // ensures 5 digits
  return `teach-${randomFiveDigits}`;
}
export function randomPassword(): string {
  const randomPart = Math.random().toString(36).substr(2, 6);
  return randomPart;
}

export const bulkUploadStudent = async (
  users: { loginUserName: string; password: string }[],
  gradeId: string
) => {
  // Insert all users in a transaction
  return await prisma.$transaction(
    async (tx) => {
      for (const userData of users) {
        const user = await tx.user.create({
          data: {
            loginUserName: userData.loginUserName,
            password: userData.password,
            role: UserRole.Student,
          },
        });

        // Assign grade
        await tx.studentGrades.create({
          data: {
            studentId: user.id,
            gradeId,
          },
        });
      }

      return;
    },
    { maxWait: 10000, timeout: 60000 }
  );
};

export const bulkUploadTeacher = async (
  users: { loginUserName: string; password: string }[],
  gradeIds: string[]
) => {
  // Insert all users in a transaction
  return await prisma.$transaction(
    async (tx) => {
      for (const userData of users) {
        const user = await tx.user.create({
          data: {
            loginUserName: userData.loginUserName,
            password: userData.password,
            role: UserRole.Teacher,
          },
        });

        const teacherGradeLinks = gradeIds.map((gradeId) => ({
          teacherId: user.id,
          gradeId,
        }));

        // Assign grade
        await tx.teacherGrades.createMany({
          data: teacherGradeLinks,
        });
      }

      return;
    },
    { maxWait: 10000, timeout: 60000 }
  );
};