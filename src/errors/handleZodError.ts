import { ZodError, ZodIssue } from "zod";
import { IGenericErrorResponse } from "../interfaces/common";
import { IGenericErrorMessage } from "../interfaces/error";

const handleZodError = (error: ZodError): IGenericErrorResponse => {
  const errors: IGenericErrorMessage[] = error.issues.map((issue: ZodIssue) => {
    const field = issue?.path[issue.path.length - 1];
    let msg = issue?.message;
    if (msg.toLowerCase() === "required" && field) {
      msg = `${field} is required`;
    }
    return {
      path: field,
      message: msg,
    };
  });

  const detailedMessage = errors.map((e) => e.message).join(". ");
  const statusCode = 400;

  return {
    statusCode,
    message: detailedMessage || "Validation Error",
    errorMessages: errors,
  };
};

export default handleZodError;
