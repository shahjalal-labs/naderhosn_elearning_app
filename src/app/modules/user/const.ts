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
  schoolName?: string;
  searchTerm?: string;
  schoolId?: string;
  gradeIds?: string[];
  startDate?: string; 
  endDate?: string; 
}


export function generateStudentUserName(): string {
  const randomFiveDigits = Math.floor(10000 + Math.random() * 90000); // ensures 5 digits
  return `s${randomFiveDigits}`;
} 

export function generateTeacherUserName(): string {
  const randomFiveDigits = Math.floor(10000 + Math.random() * 90000); // ensures 5 digits
  return `teach${randomFiveDigits}`;
}
export function randomPassword(): string {
  const random4Digit = Math.floor(1000 + Math.random() * 9000);
  return random4Digit.toString();
}


import { ObjectId } from "mongodb";

export const generateUniqueStudentUserNames = async (
  count: number
): Promise<string[]> => {
  const generated = new Set<string>();
  while (generated.size < count) {
    generated.add(generateStudentUserName());
  }

  const existing = await prisma.user.findMany({
    where: { loginUserName: { in: Array.from(generated) } },
    select: { loginUserName: true },
  });

  if (existing.length === 0) {
    return Array.from(generated);
  }

  const existingSet = new Set(existing.map((u) => u.loginUserName));
  const uniqueList = Array.from(generated).filter((u) => !existingSet.has(u));
  const finalSet = new Set(uniqueList);

  while (finalSet.size < count) {
    const candidate = generateStudentUserName();
    if (!existingSet.has(candidate)) {
      finalSet.add(candidate);
    }
  }

  return Array.from(finalSet);
};

export const generateUniqueTeacherUserNames = async (
  count: number
): Promise<string[]> => {
  const generated = new Set<string>();
  while (generated.size < count) {
    generated.add(generateTeacherUserName());
  }

  const existing = await prisma.user.findMany({
    where: { loginUserName: { in: Array.from(generated) } },
    select: { loginUserName: true },
  });

  if (existing.length === 0) {
    return Array.from(generated);
  }

  const existingSet = new Set(existing.map((u) => u.loginUserName));
  const uniqueList = Array.from(generated).filter((u) => !existingSet.has(u));
  const finalSet = new Set(uniqueList);

  while (finalSet.size < count) {
    const candidate = generateTeacherUserName();
    if (!existingSet.has(candidate)) {
      finalSet.add(candidate);
    }
  }

  return Array.from(finalSet);
};

export const bulkUploadStudent = async (
  users: { loginUserName: string; password: string }[],
  gradeId: string
) => {
  const usersData: {
    id: string;
    loginUserName: string;
    password: string;
    role: UserRole;
  }[] = [];

  const studentGradeLinks: {
    studentId: string;
    gradeId: string;
  }[] = [];

  for (const userData of users) {
    const userId = new ObjectId().toHexString();
    usersData.push({
      id: userId,
      loginUserName: userData.loginUserName,
      password: userData.password,
      role: UserRole.Student,
    });

    studentGradeLinks.push({
      studentId: userId,
      gradeId,
    });
  }

  await prisma.$transaction([
    prisma.user.createMany({ data: usersData }),
    prisma.studentGrades.createMany({ data: studentGradeLinks }),
  ]);

  return users;
};

export const bulkUploadTeacher = async (
  users: { loginUserName: string; password: string }[],
  gradeIds: string[],
  bookCategoryIds?: string[]
) => {
  const usersData: {
    id: string;
    loginUserName: string;
    password: string;
    role: UserRole;
  }[] = [];

  const teacherGradeLinks: {
    teacherId: string;
    gradeId: string;
  }[] = [];

  const teacherBookCategoryLinks: {
    teacherId: string;
    categoryId: string;
  }[] = [];

  for (const userData of users) {
    const userId = new ObjectId().toHexString();
    usersData.push({
      id: userId,
      loginUserName: userData.loginUserName,
      password: userData.password,
      role: UserRole.Teacher,
    });

    for (const gradeId of gradeIds) {
      teacherGradeLinks.push({
        teacherId: userId,
        gradeId,
      });
    }

    if (bookCategoryIds && bookCategoryIds.length > 0) {
      for (const categoryId of bookCategoryIds) {
        teacherBookCategoryLinks.push({
          teacherId: userId,
          categoryId,
        });
      }
    }
  }

  const operations: any[] = [
    prisma.user.createMany({ data: usersData }),
    prisma.teacherGrades.createMany({ data: teacherGradeLinks }),
  ];

  if (teacherBookCategoryLinks.length > 0) {
    operations.push(
      prisma.teachersBookCategories.createMany({
        data: teacherBookCategoryLinks,
      })
    );
  }

  await prisma.$transaction(operations);
  return users;
};
