import express from "express";
import { gradesControllers } from "./grades.controller";
import { fileUploader } from "../../../helpers/fileUploadHelper";
import { parseBodyData } from "../../middlewares/parseBodyData";
import validateRequest from "../../middlewares/validateRequest";
import { assignUserSchemaValidation } from "./grades.validation";
import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";

const router = express.Router();

router.post(
  "/new-assign",
  auth(UserRole.Admin),
  gradesControllers.createGrades,
);
router.get("/", auth(), gradesControllers.getAllGradess);
router.get("/:id/", auth(), gradesControllers.getGradesById);
router.patch("/:id", auth(UserRole.Admin), gradesControllers.updateGrades);
router.delete("/:id", auth(UserRole.Admin), gradesControllers.deleteGrades);

/// assign Teacher in Grades
// router.post(
//   "/teacher/assign-new-teacher",
//   auth(UserRole.Admin),
//   fileUploader.profileImage,
//   parseBodyData,
//   validateRequest(assignUserSchemaValidation),
//   gradesControllers.assignTeacher
// );
// router.post(
//   "/teacher/assign-teacher",
//   auth(UserRole.Admin),
//   validateRequest(assaignExistingTeacherSchemaValidation),
//   gradesControllers.assignExistingTeacher
// );
// // ---------------Asign student in Specific Grade -------------------//
// router.post(
// "/student/assign-new-student",
// auth(UserRole.Admin),
// fileUploader.profileImage,
// parseBodyData,
// validateRequest(assignUserSchemaValidation),
// gradesControllers.assignNewStudent
// );

export const gradesRoutes = router;
