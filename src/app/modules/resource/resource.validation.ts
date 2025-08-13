import * as z from 'zod';
 
export const createResourceSchema = z.object({
  // Define fields
  name: z.string(),
});
 
export const ResourceSchemaValidation = {
createResourceSchema
};
  