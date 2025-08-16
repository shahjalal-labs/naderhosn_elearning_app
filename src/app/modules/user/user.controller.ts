import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { userService } from "./user.services";

const getStudents = catchAsync(async (req, res) => {
  const result = await userService.getStudents();
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "student  retireved successfully",
    data: result,
  });
});
const getTeachers = catchAsync(async (req, res) => {
  const result = await userService.getTeachers();
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: " Teacher   retrieved successfully",
    data: result,
  });
});

//get users
const getUsers = catchAsync(async (req, res) => {
  const users = await userService.getUsers(req.query);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Users retrived successfully",
    data: users,
  });
});

//get single user
const getSingleUser = catchAsync(async (req, res) => {
  const user = await userService.getSingleUserIntoDB(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "user retrived successfully",
    data: user,
  });
});

//delete user
const deleteUser = catchAsync(async (req, res) => {
  await userService.deleteUser(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "User deleted successfully",
  });
});

//update user
const updateUser = catchAsync(async (req, res) => {
  const file = req.file as Express.Multer.File;
  await userService.updateUser(req.body, req.params.userId, file);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "User updated successfully",
  });
});



const adminOverview = catchAsync(async (req, res) => {
  const results = await userService.adminOverview();
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Admin overview retrived successfully",
    data: results,
  });
});


export const UserControllers = {
  getUsers,
  getSingleUser,
  updateUser,
  deleteUser,
  adminOverview,
  getTeachers,
  getStudents
};
