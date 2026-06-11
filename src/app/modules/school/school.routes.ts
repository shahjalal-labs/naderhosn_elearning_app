import express from "express";
import { schoolControllers } from "./school.controller";
import { fileUploader } from "../../../helpers/fileUploadHelper";
import { parseBodyData } from "../../middlewares/parseBodyData";
import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";
import validateRequest from "../../middlewares/validateRequest";
import { AssignBooksToSchoolSchema, CreateSchoolSchema, UpdateSchoolSchema } from "./school.validation";

const router = express.Router();

router.post(
  "/",
  auth(UserRole.Admin),
  fileUploader.uploadSchoolLogo,
  parseBodyData,
  validateRequest(CreateSchoolSchema),
  schoolControllers.createSchool
);
router.get("/",auth(UserRole.Admin), schoolControllers.getAllSchools);
router.get("/books-for-forms",auth(UserRole.Admin), schoolControllers.getAllSchoolsForForms);
router.get("/download-schools",auth(UserRole.Admin), schoolControllers.getDownloadSchoolData);
router.get("/:id", auth(), schoolControllers.getSchoolById);
router.patch(
  "/:id",
  auth(UserRole.Admin),
  fileUploader.uploadSchoolLogo,
  parseBodyData,
  validateRequest(UpdateSchoolSchema),
  schoolControllers.updateSchool
);
router.delete("/:id", auth(UserRole.Admin), schoolControllers.deleteSchool);
router.post("/upload-file", auth(UserRole.Admin) , fileUploader.uploadFiles , schoolControllers.uploadSchoolDocuments)
router.post(
  "/assign-books",
  // auth(UserRole.Admin),
  validateRequest(AssignBooksToSchoolSchema),
  schoolControllers.assignBooksToSchool
);
router.get("/not-assigned-books/:id", schoolControllers.getNotAssignedBooksForSchool);



export const schoolRoutes = router;
