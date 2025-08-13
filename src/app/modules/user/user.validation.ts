import { z } from "zod";

const userRegisterValidationSchema = z.object({
  userName: z.string().min(1, "User name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const userValidation = {
  userRegisterValidationSchema,
};

// enum UserRole {
//   Admin
//   Worker
//   User
//   Guest
// }
