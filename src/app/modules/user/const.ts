import { UserRole } from "@prisma/client";
import prisma from "../../../shared/prisma";
import bcrypt from "bcryptjs";

export interface IUserGradePayload {
  userData: {
    loginUserName?: string;
    fullName?: string;
    email?: string;
    password?: string;
    gender?: "Male" | "Female";
    DOB?: Date | string;
    phone?: string;
    status?: "Active" | "Deleted" | "Blocked";
  };
  gradeData: {
    deletedGrade: string[];
    newGradeAssign: string[];
  };
  newBookCategoryIds : string[] | undefined;
  deletedBookCategoryIds : string[] | undefined;
}
export interface CreateNewTeacherType {
  name: string;
  userName: string;
  password: string;
  email?: string; // optional
  schoolId: string;
  gradeIds: string[];
  bookCategoryIds?: string[]; // optional
}
export interface CreateNewStudentType {
  name: string;
  userName: string;
  password: string;
  email?: string; // optional
  schoolId: string;
  gradeId: string;
}
export interface usersQuery {
  searchTerm?: string;
  schoolId?: string;
  gradeIds?: string[];
  startDate?: string; 
  endDate?: string; 
}


export function generateStudentUserName(): string {
  const randomFiveDigits = Math.floor(10000 + Math.random() * 90000); // ensures 5 digits
  return `S-${randomFiveDigits}`;
} 

export function generateTeacherUserName(): string {
  const randomFiveDigits = Math.floor(10000 + Math.random() * 90000); // ensures 5 digits
  return `Teach-${randomFiveDigits}`;
}
export function randomPassword(): string {
  const randomPart = Math.random().toFixed(4); // Generate a random alphanumeric string of length 4
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
            password: await bcrypt.hash(userData.password, 8),
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
  gradeIds: string[],
  bookCategoryIds?: string[]
) => {
  // Insert all users in a transaction
  return await prisma.$transaction(
    async (tx) => {
      for (const userData of users) {
        const user = await tx.user.create({
          data: {
            loginUserName: userData.loginUserName,
            password:  await bcrypt.hash(userData.password, 8),
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
        // asign book category if provided
        if (bookCategoryIds && bookCategoryIds.length > 0) {
          const teacherBookCategoryLinks = bookCategoryIds.map(
            (bookCategoryId) => ({
              teacherId: user.id,
              categoryId: bookCategoryId,
            })
          );
          await tx.teachersBookCategories.createMany({
            data: teacherBookCategoryLinks,
          });
        }
      }
      return;
    },
    { maxWait: 10000, timeout: 60000 }
  );
};
