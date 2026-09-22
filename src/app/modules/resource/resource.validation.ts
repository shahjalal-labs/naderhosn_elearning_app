import { z } from "zod";

export const ResoucresTypeEnum = z.enum(["Audio", "Video", "Pdf", "Image", "Link"]);

export const CreateResourceSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  file : z.string().url("Invalid URL format").optional(),
  Type: ResoucresTypeEnum.optional(),
});

export const UpdateResourceSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  file : z.string().url("Invalid URL format").optional(),
  Type: ResoucresTypeEnum.optional(),
});
