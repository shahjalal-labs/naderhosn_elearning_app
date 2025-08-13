import * as z from 'zod';
 
export const createSchoolSchema = z.object({
  // Define fields
  name: z.string(),
});
 
export const SchoolSchemaValidation = {
createSchoolSchema
};
  