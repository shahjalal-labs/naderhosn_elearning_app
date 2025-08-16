import express from "express";
import { gradesControllers } from "./grades.controller";
import { fileUploader } from "../../../helpers/fileUploadHelper";
import { parseBodyData } from "../../middlewares/parseBodyData";
import validateRequest from "../../middlewares/validateRequest";
import { assaignExistingTeacherSchemaValidation, assignUserSchemaValidation,  } from "./grades.validation";

const router = express.Router();

router.post("/new-assign", gradesControllers.createGrades);
router.get("/", gradesControllers.getAllGradess);
router.get("/:id/", gradesControllers.getGradesById);
router.patch("/:id", gradesControllers.updateGrades);
router.delete("/:id", gradesControllers.deleteGrades);

/// assign Teacher in Grades
router.post(
  "/teacher/assign-new-teacher",
  fileUploader.profileImage,
  parseBodyData,
  validateRequest(assignUserSchemaValidation),
  gradesControllers.assignTeacher
);
router.post(
  "/teacher/assign-teacher",
  validateRequest(assaignExistingTeacherSchemaValidation),
  gradesControllers.assignExistingTeacher
);
// ---------------Asign student in Specific Grade -------------------// 
router.post(
  "/student/assign-new-student",
  fileUploader.profileImage,
  parseBodyData,
  validateRequest(assignUserSchemaValidation),
  gradesControllers.assignNewStudent
);

export const gradesRoutes = router;
