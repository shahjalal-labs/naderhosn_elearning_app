import { Request, Response } from 'express';
import {gradesServices} from './grades.service';
import sendResponse from '../../../shared/sendResponse';
import catchAsync from "../../../shared/catchAsync";
import { GradeQueryFilterType } from './grade.const';
import ApiError from '../../../errors/ApiErrors';
import httpStatus from 'http-status';
 
const createGrades = catchAsync (async (req: Request, res: Response) => {
  const result = await gradesServices.createGrades(req.body);
  sendResponse(res, {
    success: true,
    statusCode: 201,
    message: "The grades has been created successfully",
    data: result,
  });
})
 
const getAllGradess = catchAsync(async (_req: Request, res: Response) => {
  const result = await gradesServices.getAllGradess();
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "All gradess has been retrived successfully",
    data: result,
  });
})
 
const getGradesById = catchAsync(async (req: Request, res: Response) => {
  const gradeId = req.params.id;
  const queryField = req.query.queryField as GradeQueryFilterType || "teacher";
  const searchTerm = req.query.searchTerm as string || "";
  const query = { queryField, searchTerm };
  const result = await gradesServices.getGradesById(gradeId, query);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "grades has been retrived successfully",
    data: result,
  });
})

const updateGrades = catchAsync(async (req: Request, res: Response) => {
  const result = await gradesServices.updateGrades(req.params.id, req.body);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "grades has been updated successfully",
    data: result,
  });
})
 
const deleteGrades = catchAsync(async (req: Request, res: Response) => {
  await gradesServices.deleteGrades(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "grades has been deleted successfully",
  });
})

// ------------------------ Asign Teacher ------------// 
const assignTeacher = catchAsync(async (req: Request, res: Response) => {
  const file = req.file
  if(!file){
    throw new ApiError(httpStatus.BAD_REQUEST , "Teacher Profile photo is required ")
  }
  await gradesServices.assignTeacherIntoDB(req.body , file);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Teacher has been assing successfully",
  });
})
const assignExistingTeacher = catchAsync(async (req: Request, res: Response) => {
  await gradesServices.assignExistingTeacherIntoDB(req.body);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Teacher has been assing successfully",
  });
})

// --------------- assign Student in Grade -----------------//
const assignNewStudent = catchAsync(async (req: Request, res: Response) => {
  const file = req.file
  if(!file){
    throw new ApiError(httpStatus.BAD_REQUEST , "student Profile photo is required ")
  }
  await gradesServices.assignNewStudentIntoDB(req.body , file);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "student has been assing successfully",
  });
})

export const gradesControllers = {
  createGrades,
  getAllGradess,
  getGradesById,
  updateGrades,
  deleteGrades,
  assignTeacher,
  assignExistingTeacher,
  assignNewStudent
}
  