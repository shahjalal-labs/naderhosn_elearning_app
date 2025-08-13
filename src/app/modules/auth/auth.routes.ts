import express from "express";
import { authController } from "./auth.controller";
import auth from "../../middlewares/auth";
import { fileUploader } from "../../../helpers/fileUploadHelper";
import { parseBodyData } from "../../middlewares/parseBodyData";
import { UserRole } from "@prisma/client";

const router = express.Router();

router.post("/login", authController.loginUser);
router.post("/admin-login", authController.adminLogin);
router.get("/profile", auth(), authController.getProfile);
router.post("/send-otp", authController.sendForgotPasswordOtp);
router.post("/verify-otp", authController.verifyForgotPasswordOtpCode);
router.patch("/reset-password", auth(), authController.resetPassword);
router.put(
  "/set-profile",
  auth(),
  fileUploader.profileImage,
  parseBodyData,
  authController.updateProfile
);
router.patch("/change-password", auth(), authController.changePassword);

export const authRoute = router;
