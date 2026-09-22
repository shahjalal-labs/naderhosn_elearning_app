import z from "zod";
import { AssignmentGrade as PrismaAssignmentGrade } from "@prisma/client";

export const createAssignmentSchema = z.object({
  title: z.string().min(1, "Title is required"),
  startPage: z.string(),
  endPage: z.string(),
  instruction: z.string().min(1, "Instruction is required"),
  attachament: z.string().url("Attachment must be a valid URL").optional(),
  dueDate: z
    .string()
    .datetime({ message: "Invalid date format" })
    .refine(
      (val) => {
        const d = new Date(val);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return d >= today;
      },
      { message: "Due date cannot be in the past" }
    ),
  gradeId: z.string().min(1, "Grade ID is required"),
  bookId: z.string().min(1, "Book ID is required"),
  assignToAll: z.boolean().or(z.string()),
  studentIds: z.array(z.string()).optional(),
});

export const updateAssignmentSchema = z.object({
  title: z.string().min(1, "Title is required").optional(),
  startPage: z.string().optional(),
  endPage: z.string().optional(),
  instruction: z.string().min(1, "Instruction is required").optional(),
  attachament: z.string().url("Attachment must be a valid URL").optional(),
  dueDate: z.string().datetime({ message: "Invalid date format" }).optional(),
})

export const submitAssignmentSchema = z.object({
  answer : z.string({required_error : "Answer is required "})
})

export const gradedAssignmentSchema = z.object({
  grade: z.nativeEnum(PrismaAssignmentGrade),
  feedback: z.string().trim().min(1, "Feedback is required"),
});

// Type helper
export type GradedAssignmentInput = z.infer<typeof gradedAssignmentSchema>;