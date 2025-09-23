import express from "express";
import { UserControllers } from "./user.controller";
import { UserRole } from "@prisma/client";
import auth from "../../middlewares/auth";
import { fileUploader } from "../../../helpers/fileUploadHelper";
import { parseBodyData } from "../../middlewares/parseBodyData";
import validateRequest from "../../middlewares/validateRequest";
import { createNewTeacher, createStudent, StudentBulkUploadValidation, TeacherBulkUploadValidation } from "./user.validation";

const router = express.Router();

router.get("/get-teachers", auth(UserRole.Admin), UserControllers.getTeachers);
router.get("/get-students", auth(UserRole.Admin), UserControllers.getStudents);
// add query
router.get(
  "/download-teachers",
  auth(UserRole.Admin),
  UserControllers.downloadTeachers
);
router.get(
  "/download-students",
  auth(UserRole.Admin),
  UserControllers.downloadStudents
);

router.get("/single/:id", UserControllers.getSingleUser);
router.delete(
  "/delete-user/:id",
  auth(UserRole.Admin),
  UserControllers.deleteUser
);
router.patch(
  "/update-user/:userId",
  auth(UserRole.Admin),
  fileUploader.profileImage,
  parseBodyData,
  UserControllers.updateUser
);
router.get(
  "/admin-overview",
  auth(UserRole.Admin),
  UserControllers.adminOverview
);
export const userRoutes = router;

router.post(
  "/create-single-student",
  auth(UserRole.Admin),
  fileUploader.profileImage,
  parseBodyData,
  validateRequest(createStudent),
  UserControllers.createStudent
);

router.post(
  "/create-single-teacher",
  auth(UserRole.Admin),
  fileUploader.profileImage,
  parseBodyData,
  validateRequest(createNewTeacher),
  UserControllers.createTeacher
);

// ----------- BULK uploads ----------
router.post(
  "/bulk-upload-student",
  validateRequest(StudentBulkUploadValidation),
  UserControllers.bulkUploadStudentIntoDB
);

router.post(
  "/bulk-upload-teacher",
  validateRequest(TeacherBulkUploadValidation),
  UserControllers.bulkUploadTeacherIntoDB
);
