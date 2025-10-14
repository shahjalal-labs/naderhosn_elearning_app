import express from "express";
import { UserControllers } from "./user.controller";
import { UserRole } from "@prisma/client";
import auth from "../../middlewares/auth";
import { fileUploader } from "../../../helpers/fileUploadHelper";
import { parseBodyData } from "../../middlewares/parseBodyData";
import validateRequest from "../../middlewares/validateRequest";
import {
  createNewTeacher,
  createStudent,
  StudentBulkUploadValidation,
  TeacherBulkUploadValidation,
  userGradePayloadSchema,
} from "./user.validation";

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

router.get("/single-user/:id", auth(UserRole.Admin), UserControllers.getSingleUser);
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
  validateRequest(userGradePayloadSchema),
  UserControllers.updateUser
);
router.get(
  "/admin-overview",
  auth(UserRole.Admin),
  UserControllers.adminOverview
);
router.get(
  "/admin-overview-statistics",
  auth(UserRole.Admin),
  UserControllers.adminOverviewStatisticsData
);

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

// edit student and Teachers by admins
router.patch("/update-teacher/:id", UserControllers.updateTeacherByAdmin);
router.patch("/update-student/:id", UserControllers.updateStudentByAdmin);

export const userRoutes = router;
