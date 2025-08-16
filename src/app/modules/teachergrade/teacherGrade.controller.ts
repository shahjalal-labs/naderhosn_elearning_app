import { Request, Response } from 'express';
import {teacherGradeServices} from './teacherGrade.service';
import sendResponse from '../../../shared/sendResponse';
import catchAsync from "../../../shared/catchAsync";
import { GradeQueryFilterTypeForTeacher } from './teacherGradeConst';
 
// ------------------ Tacher Flow in Grade --------------------//
const teacherOverview = catchAsync(async (req: Request, res: Response) => {
  const searchTerm = (req.query.searchTerm as string) || "";
  const result = await teacherGradeServices.teacherOverview(req.user , searchTerm);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "teacher overview retrieved successfully",
    data : result
  });
})
 
const getGradeDetilsByIdForTeacher = catchAsync(async (req: Request, res: Response) => {
  const gradeId = req.params.gradeId;
  const queryField = req.query.queryField as GradeQueryFilterTypeForTeacher || "students";
  const searchTerm = req.query.searchTerm as string || "";
  const query = { queryField, searchTerm };
  const result = await teacherGradeServices.getGradesByIdForTeacher(gradeId, query);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "grades has been retrived successfully",
    data: result,
  });
})
export const teacherGradeControllers = {
  teacherOverview,
  getGradeDetilsByIdForTeacher,
}
  