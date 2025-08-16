import * as z from 'zod';

export const createAnnouncementSchema = z.object({
  title: z.string().min(1, "Title is required"),
  anouncement: z.string().min(1, "Announcement content is required"),
  postdate: z.string(),
  isPublished: z.boolean().optional(),
  gradeId: z.string().min(1, "Grade ID is required"),
});

export const AnnouncementSchemaValidation = {
  createAnnouncementSchema
};
