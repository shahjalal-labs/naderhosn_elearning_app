import express from 'express';
import auth from '../../middlewares/auth';
import { UserRole } from '@prisma/client';
import { studentGradeControllers } from './studentGrade.controller';
 
const router = express.Router();
 
router.get("/student-overview", auth(UserRole.Student) , studentGradeControllers.studentOverview)
router.get('/grade-details',  auth(UserRole.Student) , studentGradeControllers.getGradesByIdForstudent);
 
export const studentGradeRoutes = router;
  