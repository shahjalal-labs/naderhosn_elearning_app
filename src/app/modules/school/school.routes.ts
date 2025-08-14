import express from "express";
import { schoolControllers } from "./school.controller";
import { fileUploader } from "../../../helpers/fileUploadHelper";
import { parseBodyData } from "../../middlewares/parseBodyData";
import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";
import validateRequest from "../../middlewares/validateRequest";
import { CreateSchoolSchema } from "./school.validation";

const router = express.Router();

router.post(
  "/",
  auth(UserRole.Admin),
  fileUploader.uploadSchoolLogo,
  parseBodyData,
  validateRequest(CreateSchoolSchema),
  schoolControllers.createSchool
);
router.get("/", schoolControllers.getAllSchools);
router.get("/:id", schoolControllers.getSchoolById);
router.patch("/:id", schoolControllers.updateSchool);
router.delete("/:id", schoolControllers.deleteSchool);

export const schoolRoutes = router;
