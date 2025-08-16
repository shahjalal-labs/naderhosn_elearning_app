import express from "express";
import { userRoutes } from "../modules/user/user.route";
import { authRoute } from "../modules/auth/auth.routes";
import { schoolRoutes } from "../modules/school/school.routes";
import { bookRoutes } from "../modules/book/book.routes";
import { resourceRoutes } from "../modules/resource/resource.routes";
import { gradesRoutes } from "../modules/grades/grades.routes";
import { assignmentRoutes } from "../modules/assignment/assignment.routes";
import { announcementRoutes } from "../modules/announcement/announcement.routes";
import { teacherGradeRoutes } from "../modules/teachergrade/teacherGrade.routes";
import { studentGradeRoutes } from "../modules/studentgrade/studentGrade.routes";

const router = express.Router();

const moduleRoutes = [
  {
    path: "/users",
    route: userRoutes,
  },
  {
    path: "/auth",
    route: authRoute,
  },
  {
    path: "/school",
    route: schoolRoutes,
  },
  {
    path: "/book",
    route: bookRoutes,
  },
  {
    path: "/resource",
    route: resourceRoutes,
  },
  {
    path: "/grade",
    route: gradesRoutes,
  },
  {
    path: "/assignment",
    route: assignmentRoutes,
  },
  {
    path: "/announcement",
    route: announcementRoutes,
  },
  {
    path: "/teacher",
    route: teacherGradeRoutes,
  },
  {
    path: "/student",
    route: studentGradeRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
