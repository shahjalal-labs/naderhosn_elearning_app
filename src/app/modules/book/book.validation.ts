import * as z from 'zod';
 
export const createBookSchema = z.object({
  // Define fields
  name: z.string(),
});
 
export const BookSchemaValidation = {
createBookSchema
};
  