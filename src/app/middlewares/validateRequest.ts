import { NextFunction, Request, Response } from "express";
import { AnyZodObject, ZodError } from "zod";

const validateRequest =
  (schema: AnyZodObject) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync(req.body);
      return next();
    } catch (err) {
      if (err instanceof ZodError) {
        const errorDetails = err.errors.map((error) => {
          const field = error.path.join(".");
          let msg = error.message;
          if (msg.toLowerCase() === "required" && field) {
            msg = `${field} is required`;
          }
          return {
            path: field,
            message: msg,
          };
        });

        const detailedMessage = errorDetails.map((e) => e.message).join(". ");

        return res.status(400).json({
          success: false,
          message: detailedMessage || "Validation failed",
          errors: errorDetails,
        });
      }
      return next(err);
    }
  };

export default validateRequest;
