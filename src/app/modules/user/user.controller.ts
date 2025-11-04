import { query, Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { userService } from "./user.services";

const getStudents = catchAsync(async (req, res) => {
  const result = await userService.getStudents(req.query);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "student  retireved successfully",
    data: result,
  });
});
const getTeachers = catchAsync(async (req, res) => {
  const result = await userService.getTeachers(req.query);
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
const deleteStudentsByAdmin = catchAsync(async (req, res) => {
  await userService.deleteStudentsByAdmin();
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Student deleted successfully",
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
  const { type } = req.query;
  const overviewType = (type as string) || "daily"; // default to "daily" if not provided
  const results = await userService.adminOverViewData(
    overviewType as "daily" | "weekly" | "monthly" | "yearly"
  );
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Admin overview retrived successfully",
    data: results,
  });
});
const adminOverviewStatisticsData = catchAsync(async (req, res) => {
  const results = await userService.adminOverviewStatisticsData();
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "admin Overview Statistics Data retrived successfully",
    data: results,
  });
});

// -------- downlaod ------------
// controller
const downloadStudents = catchAsync(async (req, res) => {
  const { school, grade, teacher } = req.query as { [key: string]: any };
  const query = {
    school: school === "true",
    grade: grade === "true",
    teacher: teacher === "true",
  };

  const result = await userService.getDownloadStudents(query);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "student download data retrieved successfully",
    data: result,
  });
});

//get users
const downloadTeachers = catchAsync(async (req, res) => {
  const { school, grade, teacher, details } = req.query as {
    [key: string]: any;
  };
  const query = {
    school: school === "true",
    grade: grade === "true",
    teacher: teacher === "true",
    details: details === "true",
  };
  const users = await userService.getDownloadTeachers(query);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "teacher download retrived successfully",
    data: users,
  });
});

// Add new student
const createStudent = catchAsync(async (req, res) => {
  const file = req.file as Express.Multer.File;
  const result = await userService.createStudent(req.body, file);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "stucent created  successfully",
    data: result,
  });
});

const createTeacher = catchAsync(async (req, res) => {
  const file = req.file as Express.Multer.File;
  const result = await userService.createTeacher(req.body, file);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Teacher created  successfully",
    data: result,
  });
});

// bulk uploads

const bulkUploadStudentIntoDB = catchAsync(async (req, res) => {
  const result = await userService.bulkUploadStudentIntoDB(req.body);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: result.message,
    data: result.students,
  });
});
const bulkUploadTeacherIntoDB = catchAsync(async (req, res) => {
  const result = await userService.bulkUploadTeacherIntoDB(req.body);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "teachers created  successfully",
    data: result,
  });
});
const updateTeacherByAdmin = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await userService.updateTeacherByAdminIntoDB(id, req.body);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "teacher updated successfully",
    data: result,
  });
});
const updateStudentByAdmin = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await userService.updateStudentByAdminIntoDB(id, req.body);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "student updated  successfully",
    data: result,
  });
});

export const UserControllers = {
  getUsers,
  getSingleUser,
  updateUser,
  deleteUser,
  adminOverview,
  getTeachers,
  getStudents,
  downloadStudents,
  downloadTeachers,
  createStudent,
  createTeacher,
  bulkUploadTeacherIntoDB,
  bulkUploadStudentIntoDB,
  updateTeacherByAdmin,
  updateStudentByAdmin,
  adminOverviewStatisticsData,
  deleteStudentsByAdmin
};
