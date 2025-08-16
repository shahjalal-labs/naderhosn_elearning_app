import { Request, Response } from 'express';
import sendResponse from '../../../shared/sendResponse';
import catchAsync from "../../../shared/catchAsync";
import { studentGradeServices } from './studentGrade.service';
import { gradeQueryFilterForStudent, GradeQueryFilterTypeForStudent } from './studentGrade.const';
 
// ------------------ Tacher Flow in Grade --------------------//
const studentOverview = catchAsync(async (req: Request, res: Response) => {
  const result = await studentGradeServices.studentOverview(req.user);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "student overview retrieved successfully",
    data : result
  });
})
 
const getGradesByIdForstudent = catchAsync(async (req: Request, res: Response) => {
  const queryField = req.query.queryField as GradeQueryFilterTypeForStudent || "books";
  const searchTerm = req.query.searchTerm as string || "";
  const query = { queryField, searchTerm };
  const result = await studentGradeServices.getGradesByIdForstudent(req.user, query);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "grades has been retrived successfully",
    data: result,
  });
})
export const studentGradeControllers = {
  studentOverview,
  getGradesByIdForstudent,
}
  