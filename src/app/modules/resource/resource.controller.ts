import { Request, Response } from 'express';
import {resourceServices} from './resource.service';
import sendResponse from '../../../shared/sendResponse';
import catchAsync from "../../../shared/catchAsync";
 
const createResource = catchAsync (async (req: Request, res: Response) => {
  const result = await resourceServices.createResource(req.body);
  sendResponse(res, {
    success: true,
    statusCode: 201,
    message: "The resource has been created successfully",
    data: result,
  });
})
 
const getAllResources = catchAsync(async (_req: Request, res: Response) => {
  const result = await resourceServices.getAllResources();
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "All resources has been retrived successfully",
    data: result,
  });
})
 
const getResourceById = catchAsync(async (req: Request, res: Response) => {
  const result = await resourceServices.getResourceById(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "resource has been retrived successfully",
    data: result,
  });
})
 
const updateResource = catchAsync(async (req: Request, res: Response) => {
  const result = await resourceServices.updateResource(req.params.id, req.body);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "resource has been updated successfully",
    data: result,
  });
})
 
const deleteResource = catchAsync(async (req: Request, res: Response) => {
  await resourceServices.deleteResource(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "resource has been deleted successfully",
  });
})
 
export const resourceControllers = {
  createResource,
  getAllResources,
  getResourceById,
  updateResource,
  deleteResource,
}
  