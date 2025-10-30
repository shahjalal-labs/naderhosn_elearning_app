import { string, z } from "zod";

const userRegisterValidationSchema = z.object({
  userName: z.string().min(1, "User name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const userValidation = {
  userRegisterValidationSchema,
};

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
  bookCategoryIds: z
    .array(string({ required_error: "Book Category Ids is Required!" }))
    .optional(),
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
  bookCategoryIds: z
    .array(string({ required_error: "Book Category Ids is Required!" }))
    .optional(),
  numberOfTeacher: z
    .number()
    .max(20, { message: "you can create maximum 20 at a time!" }),
});

export const UserUpdateValidations = z.object({
  fullName: z.string().optional(),
  loginUserName: z.string().optional(),
  email: z.string().optional(),
  password: z.string().optional(),
  gender: z.string(),
  DOB: z.string(),
  phone: z.string(),
  status: z.string(),
});

export const userGradePayloadSchema = z.object({
  userData: z.object({
    loginUserName: z.string().min(3).optional(),
    fullName: z.string().optional(),
    email: z.string().email().optional(),
    password: z.string().min(6).optional(),
    gender: z.enum(["Male", "Female"]).optional(),
    DOB: z.union([z.string().datetime(), z.date()]).optional(),
    phone: z.string().optional(),
    status: z.enum(["Active", "Deleted", "Blocked"]).optional(),
  }),
  gradeData: z.object({
    deletedGrade: z.array(z.string()).default([]),
    newGradeAssign: z.array(z.string()).default([]),
  }),
});
