import express from "express";
import { assignmentControllers } from "./assignment.controller";
import { fileUploader } from "../../../helpers/fileUploadHelper";
import { parseBodyData } from "../../middlewares/parseBodyData";
import validateRequest from "../../middlewares/validateRequest";
import {createAssignmentSchema } from "./assignment.validation";
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
router.get("/",auth(), assignmentControllers.getAllAssignments);
router.get("/:id",auth(), assignmentControllers.getAssignmentById);
router.patch("/:id", assignmentControllers.updateAssignment);
router.delete("/:id", assignmentControllers.deleteAssignment);

export const assignmentRoutes = router;