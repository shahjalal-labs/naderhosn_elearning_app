import { Request, Response } from 'express';
import {assignmentServices} from './assignment.service';
import sendResponse from '../../../shared/sendResponse';
import catchAsync from "../../../shared/catchAsync";
import ApiError from '../../../errors/ApiErrors';
import httpStatus from 'http-status';
 
const createAssignment = catchAsync (async (req: Request, res: Response) => {
  const file = req.file
  const result = await assignmentServices.createAssignment(req.body , file);
  sendResponse(res, {
    success: true,
    statusCode: 201,
    message: "The assignment has been created successfully",
    data: result,
  });
})
 
const getAllAssignments = catchAsync(async (_req: Request, res: Response) => {
  const result = await assignmentServices.getAllAssignments();
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "All assignments has been retrived successfully",
    data: result,
  });
})
 
const getAssignmentById = catchAsync(async (req: Request, res: Response) => {
  const result = await assignmentServices.getAssignmentById(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "assignment has been retrived successfully",
    data: result,
  });
})
 
const updateAssignment = catchAsync(async (req: Request, res: Response) => {
  const result = await assignmentServices.updateAssignment(req.params.id, req.body);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "assignment has been updated successfully",
    data: result,
  });
})
 
const deleteAssignment = catchAsync(async (req: Request, res: Response) => {
  await assignmentServices.deleteAssignment(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "assignment has been deleted successfully",
  });
})
 
export const assignmentControllers = {
  createAssignment,
  getAllAssignments,
  getAssignmentById,
  updateAssignment,
  deleteAssignment,
}
  