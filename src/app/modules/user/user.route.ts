import express from "express";
import { UserControllers } from "./user.controller";
import { UserRole } from "@prisma/client";
import auth from "../../middlewares/auth";
import { fileUploader } from "../../../helpers/fileUploadHelper";
import { parseBodyData } from "../../middlewares/parseBodyData";

const router = express.Router();

router.get("/get-teachers", auth(UserRole.Admin), UserControllers.getTeachers);
router.get("/get-students", auth(UserRole.Admin), UserControllers.getStudents);
router.get("/download-teachers", auth(UserRole.Admin), UserControllers.downloadTeachers);
router.get("/download-students",auth(UserRole.Admin), UserControllers.downloadStudents);
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