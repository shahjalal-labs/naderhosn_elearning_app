import * as z from "zod";

export const createGradesSchema = z.object({
  name: z.string(),
});

export const GradesSchemaValidation = {
  createGradesSchema,
};

export const assignUserSchemaValidation = z.object({
  fullName: z.string({ required_error: "Full name is required" }),
  gender: z.enum(["Male", "Female", "Other"], {
    required_error: "Gender is required",
    invalid_type_error: "Gender must be one of 'Male', 'Female', or 'Other'",
  }),
  DOB: z
    .string({
      required_error: "Date of Birth is required",
    }),
  email: z
    .string({
      required_error: "Email is required",
    })
    .email("Please provide a valid email address"),
  phone: z
    .string({
      required_error: "Phone number is required",
    }),
  loginUserName: z
    .string({
      required_error: "Username is required",
    })
    .min(4, "Username must be at least 3 characters"),
  password: z
    .string({
      required_error: "Password is required",
    })
    .min(8, "Password must be at least 6 characters long"),
  schoolId: z.string({
    required_error: "School ID is required",
  }),
  gradeId: z.string({
    required_error: "Grade ID is required",
  }),
});

export const assaignExistingTeacherSchemaValidation = z.object({
    teacherId: z.string({
    required_error: "teacher ID is required",
  }),
    schoolId: z.string({
    required_error: "School ID is required",
  }),
  gradeId: z.string({
    required_error: "Grade ID is required",
  }),
})