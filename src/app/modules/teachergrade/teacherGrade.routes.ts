import express from 'express';
import { teacherGradeControllers } from "./teacherGrade.controller";
import auth from '../../middlewares/auth';
import { UserRole } from '@prisma/client';
 
const router = express.Router();
 
router.get("/teacher-overview", auth(UserRole.Teacher) , teacherGradeControllers.teacherOverview)
router.get('/grade-details/:gradeId',  auth(UserRole.Teacher) , teacherGradeControllers.getGradeDetilsByIdForTeacher);
 
// assignment check 
export const teacherGradeRoutes = router;
  