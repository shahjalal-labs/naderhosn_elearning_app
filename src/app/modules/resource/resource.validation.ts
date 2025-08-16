import { z } from "zod";

export const ResoucresTypeEnum = z.enum(["Audio", "Video", "Pdf"]);

export const CreateResourceSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  Type: ResoucresTypeEnum.optional(),
});

export const UpdateResourceSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  Type: ResoucresTypeEnum.optional(),
});
