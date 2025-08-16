import z from "zod";

export const createAssignmentSchema = z.object({
  title: z.string().min(1, "Title is required"),
  startPage: z.number().int().min(1, "Start page must be at least 1"),
  endPage: z.number().int().min(1, "End page must be at least 1"),
  instruction: z.string().min(1, "Instruction is required"),
  attachament: z.string().url("Attachment must be a valid URL").optional(),
  dueDate: z.string().datetime({ message: "Invalid date format" }),
  gradeId: z.string().min(1, "Grade ID is required"),
  bookId: z.string().min(1, "Book ID is required"),
  assignToAll: z.boolean(),
  studentIds: z.array(z.string()).optional(),
});

export const updateAssignmentSchema = z.object({
  title: z.string().min(1, "Title is required").optional(),
  startPage: z.number().int().min(1, "Start page must be at least 1").optional(),
  endPage: z.number().int().min(1, "End page must be at least 1").optional(),
  instruction: z.string().min(1, "Instruction is required").optional(),
  attachament: z.string().url("Attachment must be a valid URL").optional(),
  dueDate: z.string().datetime({ message: "Invalid date format" }).optional(),
})

