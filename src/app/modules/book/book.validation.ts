import { z } from "zod";

export const BookCategorySchema = z.object({
  name: z.string().min(1, "Book category name is required"),
  description: z.string().min(1, "Book category description is required"),
  image: z.string().optional(),
});

// ---------------- book creation function ------------------

export const ResourceTypeEnum = z.enum(["Pdf", "Video", "Audio"]);

// ---------- Sub Schemas ----------
const ResourceSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  file: z.string().url("Resource file must be a valid URL").optional(),
  type: ResourceTypeEnum.optional(),
});

const GradeSchema = z.object({
  schoolId: z.string().min(1, "School ID is required"),
  grade: z.array(z.string().min(1, "Grade ID is required")).nonempty(),
});

const BookDataSchema = z.object({
  bookName: z.string().optional(),
  author: z.string().optional(),
  description: z.string().optional(),
  ISBN: z.string().optional(),
  categoryId: z.string().min(1, "Category ID is required"),
});

// ---------- Main Body Schema ----------
export const CreateBookSchema = z.object({
  BookData: BookDataSchema,
  Resources: z.array(ResourceSchema).optional(),
  Grades: z.array(GradeSchema).optional(),
});

export const UpdateBookSchema = z.object({
  BookData: z.object({
    bookName: z.string().optional(),
    author: z.string().optional(),
    description: z.string().optional(),
    ISBN: z.string().optional(),
    RTL: z.boolean().optional(),
    categoryId: z.string().optional(),
  }).optional(),
  NewGradesAssign: z
    .array(
      z.object({
        schoolId: z.string().optional(),
        grade: z.array(z.string().regex(/^[a-f\d]{24}$/i, "Invalid grade id")).optional(),
      })
    )
    .optional(),
  deletedGrades: z
    .array(z.string().regex(/^[a-f\d]{24}$/i, "Invalid grade id"))
    .optional(),
});