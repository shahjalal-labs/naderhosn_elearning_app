import { string, z } from "zod";

const userRegisterValidationSchema = z.object({
  userName: z.string().min(1, "User name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const userValidation = {
  userRegisterValidationSchema,
};

// enum UserRole {
//   Admin
//   Worker
//   User
//   Guest
// }

export const createNewTeacher = z.object({
  name: z.string({
    required_error: "Name is required",
  }),
  userName: z.string({
    required_error: "userName is required . this username for login.",
  }),
  password: z.string({
    required_error: "password is required",
  }),
  email: z.string().optional(),
  schoolId: z.string({ required_error: "please give the schoolId" }),
  gradeIds: z.array(
    string({
      required_error: "Grade Ids is Required!",
    })
  ),
});
export const createStudent = z.object({
  name: z.string({
    required_error: "Name is required",
  }),
  userName: z.string({
    required_error: "userName is required . this username for login.",
  }),
  password: z.string({
    required_error: "password is required",
  }),
  email: z.string().optional(),
  schoolId: z.string({ required_error: "please give the schoolId" }),
  gradeId: z.string({
    required_error:
      "Grade Id is Required and student can assign only one Grade.",
  }),
});

// createNewTeacher.type.ts

export interface CreateNewTeacherType {
  name: string;
  userName: string;
  password: string;
  email?: string; // optional
  schoolId: string;
  gradeIds: string[];
}
export interface CreateNewStudentType {
  name: string;
  userName: string;
  password: string;
  email?: string; // optional
  schoolId: string;
  gradeId: string;
}

export const StudentBulkUploadValidation = z.object({
  schoolId: z.string(),
  gradeId: z.string(),
  numberOfStudent: z
    .number()
    .max(20, { message: "you can create maximum 20 at a time!" }),
});

export const TeacherBulkUploadValidation = z.object({
  schoolId: z.string(),
  gradeIds: z.array(string()),
  numberOfTeacher: z
    .number()
    .max(20, { message: "you can create maximum 20 at a time!" }),
});
