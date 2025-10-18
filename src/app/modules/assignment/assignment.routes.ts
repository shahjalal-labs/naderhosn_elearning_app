import express from "express";
import { assignmentControllers } from "./assignment.controller";
import { fileUploader } from "../../../helpers/fileUploadHelper";
import { parseBodyData } from "../../middlewares/parseBodyData";
import validateRequest from "../../middlewares/validateRequest";
import { createAssignmentSchema, gradedAssignmentSchema, submitAssignmentSchema, updateAssignmentSchema } from "./assignment.validation";
import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";

const router = express.Router();

router.post(
  "/",
  auth(UserRole.Teacher),
  fileUploader.uploadSingle,
  parseBodyData,
  validateRequest(createAssignmentSchema),
  assignmentControllers.createAssignment
);
router.get("/", auth(), assignmentControllers.getAllAssignments);
router.get("/:id", auth(), assignmentControllers.getAssignmentById);
router.get("/teacher/:assignmentProgressId", auth(), assignmentControllers.getAssignmentByIdForTeacher);
router.patch(
  "/update/:id",
  auth(UserRole.Teacher),
  fileUploader.uploadSingle,
  parseBodyData,
  validateRequest(updateAssignmentSchema),
  assignmentControllers.updateAssignment
);
router.put(
  "/submit/:id",
  auth(UserRole.Student),
  fileUploader.uploadSingle,
  parseBodyData, 
  validateRequest(submitAssignmentSchema),
  assignmentControllers.submitAssignment
);
router.put(
  "/graded/:id",
  auth(UserRole.Teacher),
  validateRequest(gradedAssignmentSchema),
  assignmentControllers.gradedAssignment
);
router.delete("/:id", assignmentControllers.deleteAssignment);

export const assignmentRoutes = router;
