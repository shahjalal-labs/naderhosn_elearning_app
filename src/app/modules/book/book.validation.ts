import { z } from "zod";

export const BooklanguageEnum = z.enum(["English", "Spanish", "French"]);

export const CreateBookSchema = z.object({
  bookName: z.string().min(1, "Book name is required"),
  author: z.string().min(1, "Author name is required"),
  Edition: z.string().min(1, "Edition is required"),
  language: BooklanguageEnum,
});

export const UpdateBookSchema = z.object({
  bookName: z.string().optional(),
  author: z.string().optional(),
  Edition: z.string().optional(),
  language: BooklanguageEnum.optional(),
});


export const BookCategorySchema = z.object({
  name : z.string().min(1, "Book category name is required"),
  description : z.string().min(1, "Book category description is required"),
  image : z.string().optional()
})