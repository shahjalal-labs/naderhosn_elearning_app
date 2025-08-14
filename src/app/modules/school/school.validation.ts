import { z } from "zod";

export const SchoolSectionEnum = z.enum(["A", "B", "C"]);

export const SchoolGradeSchema = z.object({
  grade: z.number().min(1, "Grade must be at least 1"),
  section: SchoolSectionEnum,
});

export const CreateSchoolSchema = z.object({
  name: z.string().min(1, "School name is required"),
  location: z.string().min(1, "Location is required"),
  expectedTeachers: z.number().int().nonnegative(),
  expectedStudents: z.number().int().nonnegative(),
  grades: z.array(SchoolGradeSchema).min(1, "At least one grade is required"),
});

export const UpdateSchoolSchema = z.object({
  name: z.string().min(1).optional(),
  location: z.string().min(1).optional(),
  expectedTeachers: z.number().int().nonnegative().optional(),
  expectedStudents: z.number().int().nonnegative().optional(),
  grades: z.array(SchoolGradeSchema).optional(),
});
