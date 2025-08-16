import express from "express";
import { resourceControllers } from "./resource.controller";
import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";
import { fileUploader } from "../../../helpers/fileUploadHelper";
import { parseBodyData } from "../../middlewares/parseBodyData";
import validateRequest from "../../middlewares/validateRequest";
import {
  CreateResourceSchema,
  UpdateResourceSchema,
} from "./resource.validation";

const router = express.Router();

router.post(
  "/create/:gradeId",
  auth(UserRole.Admin, UserRole.Teacher),
  fileUploader.uploadSingle,
  parseBodyData,
  validateRequest(CreateResourceSchema),
  resourceControllers.createResource
);
router.get("/", resourceControllers.getAllResources);
router.get("/:id", resourceControllers.getResourceById);
router.patch(
  "/update/:id",
  auth(UserRole.Admin, UserRole.Teacher),
  fileUploader.uploadSingle,
  parseBodyData,
  validateRequest(UpdateResourceSchema),
  resourceControllers.updateResource
);
router.delete("/:id", resourceControllers.deleteResource);

export const resourceRoutes = router;
