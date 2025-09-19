import { Request, Response } from 'express';
import {schoolServices} from './school.service';
import sendResponse from '../../../shared/sendResponse';
import catchAsync from "../../../shared/catchAsync";
import ApiError from '../../../errors/ApiErrors';
import httpStatus from 'http-status';
 
const createSchool = catchAsync (async (req: Request, res: Response) => {
  const file = req.file
  if (!file) {
    throw new ApiError(httpStatus.BAD_REQUEST, "School Photo is missing");
  }
  const result = await schoolServices.createSchool(req.body , file);
  sendResponse(res, {
    success: true,
    statusCode: 201,
    message: "The school has been created successfully",
    data: result,
  });
})
 
const getAllSchools = catchAsync(async (_req: Request, res: Response) => {
  const result = await schoolServices.getAllSchools(_req.query); 
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "All schools has been retrived successfully",
    data: result,
  });
})
const getAllSchoolsForForms = catchAsync(async (_req: Request, res: Response) => {
  const result = await schoolServices.getAllSchoolsForForms(); 
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "All schools has been retrived successfully",
    data: result,
  });
})

const getDownloadSchoolData = catchAsync(async (_req: Request, res: Response) => {
  const { location, gradeRange, count } = _req.query as { [key: string]: any };
  const query = {
    location: location === "true",
    gradeRange: gradeRange === "true",
    count: count === "true",
  };
  const result = await schoolServices.getDownloadSchoolData(query);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "schools has been retrived for downlod successfully",
    data: result,
  });
})
 
const getSchoolById = catchAsync(async (req: Request, res: Response) => { 
  // TODO
  const result = await schoolServices.getSchoolById(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "school has been retrived successfully",
    data: result,
  });
})
 
const updateSchool = catchAsync(async (req: Request, res: Response) => {
  const result = await schoolServices.updateSchool(req.params.id, req.body , req.file);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "school has been updated successfully",
    data: result,
  });
})
 
const deleteSchool = catchAsync(async (req: Request, res: Response) => {
  await schoolServices.deleteSchool(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "school has been deleted successfully",
  });
})
 
export const schoolControllers = {
  createSchool,
  getAllSchools,
  getSchoolById,
  updateSchool,
  deleteSchool,
  getDownloadSchoolData,
  getAllSchoolsForForms
}
  