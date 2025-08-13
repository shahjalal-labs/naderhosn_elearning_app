import { Request, Response } from 'express';
import {bookServices} from './book.service';
import sendResponse from '../../../shared/sendResponse';
import catchAsync from "../../../shared/catchAsync";
 
const createBook = catchAsync (async (req: Request, res: Response) => {
  const result = await bookServices.createBook(req.body);
  sendResponse(res, {
    success: true,
    statusCode: 201,
    message: "The book has been created successfully",
    data: result,
  });
})
 
const getAllBooks = catchAsync(async (_req: Request, res: Response) => {
  const result = await bookServices.getAllBooks();
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "All books has been retrived successfully",
    data: result,
  });
})
 
const getBookById = catchAsync(async (req: Request, res: Response) => {
  const result = await bookServices.getBookById(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "book has been retrived successfully",
    data: result,
  });
})
 
const updateBook = catchAsync(async (req: Request, res: Response) => {
  const result = await bookServices.updateBook(req.params.id, req.body);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "book has been updated successfully",
    data: result,
  });
})
 
const deleteBook = catchAsync(async (req: Request, res: Response) => {
  await bookServices.deleteBook(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "book has been deleted successfully",
  });
})
 
export const bookControllers = {
  createBook,
  getAllBooks,
  getBookById,
  updateBook,
  deleteBook,
}
  