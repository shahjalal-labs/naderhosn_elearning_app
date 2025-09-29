import { Request, Response } from 'express';
import {announcementServices} from './announcement.service';
import sendResponse from '../../../shared/sendResponse';
import catchAsync from "../../../shared/catchAsync";
 
const createAnnouncement = catchAsync (async (req: Request, res: Response) => {
  const result = await announcementServices.createAnnouncement( req.params.gradeId,req.body , req.user);
  sendResponse(res, {
    success: true,
    statusCode: 201,
    message: "The announcement has been created successfully",
    data: result,
  });
})
const createAnnouncementByAdmin = catchAsync (async (req: Request, res: Response) => {
  const result = await announcementServices.createAnnouncementByAdmin(req.body , req.user);
  sendResponse(res, {
    success: true,
    statusCode: 201,
    message: "The announcement has been created successfully ",
    data: result,
  });
})

const getAllAnnouncements = catchAsync(async (_req: Request, res: Response) => {
  const result = await announcementServices.getAllAnnouncements();
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "All announcements has been retrived successfully",
    data: result,
  });
})

const getAnnouncementById = catchAsync(async (req: Request, res: Response) => {
  const result = await announcementServices.getAnnouncementById(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "announcement has been retrived successfully",
    data: result,
  });
})

const updateAnnouncement = catchAsync(async (req: Request, res: Response) => {
  const result = await announcementServices.updateAnnouncement(req.params.id, req.body);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "announcement has been updated successfully",
    data: result,
  });
})

const deleteAnnouncement = catchAsync(async (req: Request, res: Response) => {
  await announcementServices.deleteAnnouncement(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "announcement has been deleted successfully",
  });
})

export const announcementControllers = {
  createAnnouncement,
  getAllAnnouncements,
  getAnnouncementById,
  updateAnnouncement,
  deleteAnnouncement,
  createAnnouncementByAdmin
}
  