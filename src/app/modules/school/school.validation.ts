import { z } from "zod";

export const SchoolSectionEnum = z.enum(["A", "B", "C"]);

export const SchoolGradeSchema = z.object({
  gradeLevel: z.string(),
});

export const CreateSchoolSchema = z.object({
  name: z.string().min(1, "School name is required"),
  location: z.string().min(1, "Location is required"),
  teacherCount: z.number().int().nonnegative().optional(),
  studentsCount: z.number().int().nonnegative().optional(),
  activeTeachers: z.number().int().nonnegative().optional(),
  activeStudents: z.number().int().nonnegative().optional(),
  grades: z.array(SchoolGradeSchema).min(1, "At least one grade is required"),
});

export const UpdateSchoolSchema = z.object({
  schoolData: z.object({
    name: z.string().min(1).optional(),
    location: z.string().min(1).optional(),
    teacherCount: z.number().int().nonnegative().optional(),
    studentsCount: z.number().int().nonnegative().optional(),
    activeStudents: z.number().int().nonnegative().optional(),
    activeTeachers: z.number().int().nonnegative().optional(),
    schoolLogo: z.string().url().optional(),
  }).optional(),
  DeleteGrades: z.array(z.string().regex(/^[a-f\d]{24}$/i, "Invalid grade id")).optional(),
  grades: z.array(SchoolGradeSchema).optional(),
});
