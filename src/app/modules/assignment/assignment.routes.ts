import express from "express";
import { assignmentControllers } from "./assignment.controller";
import { fileUploader } from "../../../helpers/fileUploadHelper";
import { parseBodyData } from "../../middlewares/parseBodyData";
import validateRequest from "../../middlewares/validateRequest";
import {createAssignmentSchema } from "./assignment.validation";

const router = express.Router();

router.post(
  "/",
  fileUploader.uploadSingle,
  parseBodyData,
  validateRequest(createAssignmentSchema),
  assignmentControllers.createAssignment
);
router.get("/", assignmentControllers.getAllAssignments);
router.get("/:id", assignmentControllers.getAssignmentById);
router.patch("/:id", assignmentControllers.updateAssignment);
router.delete("/:id", assignmentControllers.deleteAssignment);

export const assignmentRoutes = router;