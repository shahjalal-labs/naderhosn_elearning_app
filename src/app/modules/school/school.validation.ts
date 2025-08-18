import { z } from "zod";

export const SchoolSectionEnum = z.enum(["A", "B", "C"]);

export const SchoolGradeSchema = z.object({
  grade: z.string(),
  section: SchoolSectionEnum,
});

export const CreateSchoolSchema = z.object({
  name: z.string().min(1, "School name is required"),
  location: z.string().min(1, "Location is required"),
  expectedTeachers: z.string(),
  expectedStudents: z.string(),
  grades: z.array(SchoolGradeSchema).min(1, "At least one grade is required"),
});

export const UpdateSchoolSchema = z.object({
  name: z.string().min(1).optional(),
  location: z.string().min(1).optional(),
  expectedTeachers: z.string(),
  expectedStudents: z.string(),
  grades: z.array(SchoolGradeSchema).optional(),
});
