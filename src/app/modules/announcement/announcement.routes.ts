import express from "express";
import { announcementControllers } from "./announcement.controller";
import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";

const router = express.Router();

router.post(
  "/",
  auth(UserRole.Admin),
  announcementControllers.createAnnouncementByAdmin
);
router.post(
  "/:gradeId",
  auth(UserRole.Admin, UserRole.Teacher),
  announcementControllers.createAnnouncement
);
router.get("/", auth(), announcementControllers.getAllAnnouncements);
router.get("/:id", auth(), announcementControllers.getAnnouncementById);
router.patch(
  "/:id",
  auth(UserRole.Admin, UserRole.Teacher),
  announcementControllers.updateAnnouncement
);
router.delete(
  "/:id",
  auth(UserRole.Admin, UserRole.Teacher),
  announcementControllers.deleteAnnouncement
);

export const announcementRoutes = router;
