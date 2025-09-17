import { Request, Response } from "express";
import { bookServices } from "./book.service";
import sendResponse from "../../../shared/sendResponse";
import catchAsync from "../../../shared/catchAsync";


// ------------ product category controllers -------------
const createBooksCategory = catchAsync(
  async (req: Request, res: Response) => {
    const result = await bookServices.createBookCategory(req.body);
    sendResponse(res, {
      success: true,
      statusCode: 201,
      message: "The Books category has been created successfully",
      data: result,
    });
  }
);
const deleteBooksCategory = catchAsync(
  async (req: Request, res: Response) => {
    await bookServices.deleteBookCategory(req.params.id);
    sendResponse(res, {
      success: true,
      statusCode: 201,
      message: "The Books category has been deleted successfully",
    });
  }
);
const getAllBooksCategories = catchAsync(
  async (req: Request, res: Response) => {
    const result = await bookServices.getAllBookCategories();
    sendResponse(res, {
      success: true,
      statusCode: 201,
      message: "Books has been retrieved successfully",
      data: result,
    });
  }
);
const getBooksCategoryById = catchAsync(
  async (req: Request, res: Response) => {
    const result = await bookServices.getBookCategoryById(req.params.id);
    sendResponse(res, {
      success: true,
      statusCode: 201,
      message: "Books category has been retrieved successfully",
      data: result,
    });
  }
);
const updateBooksCategory = catchAsync(
  async (req: Request, res: Response) => {
    const result = await bookServices.updateBookCategory(
      req.params.id,
      req.body
    );
    sendResponse(res, {
      success: true,
      statusCode: 201,
      message: "The Books category has been updated successfully",
      data: result,
    });
  }
);

// ------------------ Books ------------------------///

const createBook = catchAsync(async (req: Request, res: Response) => {
  let coverImg: Express.Multer.File | undefined;
  let file: Express.Multer.File | undefined;
  const {gradeId} = req.params
  if(!gradeId){
    throw new Error("Grade id is required")
  }
  if (req.files && !Array.isArray(req.files)) {
    coverImg =
      (req.files["coverImage"]?.[0] as Express.Multer.File) || undefined;
    file = (req.files["file"]?.[0] as Express.Multer.File) || undefined;
  }
  if (!coverImg) {
    throw new Error("Cover image are required");
  }
  if (!file) {
    throw new Error("Book file  are required");
  }
  const result = await bookServices.createBook(gradeId ,req.body, coverImg, file);
  sendResponse(res, {
    success: true,
    statusCode: 201,
    message: "The book has been created successfully",
    data: result,
  });
});

const getAllBooks = catchAsync(async (_req: Request, res: Response) => {
  const result = await bookServices.getAllBooks();
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "All books has been retrived successfully",
    data: result,
  });
});

const getBookById = catchAsync(async (req: Request, res: Response) => {
  const result = await bookServices.getBookById(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "book has been retrived successfully",
    data: result,
  });
});

const updateBook = catchAsync(async (req: Request, res: Response) => {
  let coverImg: Express.Multer.File | undefined;
  let file: Express.Multer.File | undefined;
  const {bookId} = req.params
  const result = await bookServices.updateBook(bookId, req.body , coverImg , file);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "book has been updated successfully",
    data: result,
  });
});

const deleteBook = catchAsync(async (req: Request, res: Response) => {
  await bookServices.deleteBook(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "book has been deleted successfully",
  });
});

export const bookControllers = {
  createBook,
  getAllBooks,
  getBookById,
  updateBook,
  deleteBook,
  createBooksCategory,
  getAllBooksCategories,
  getBooksCategoryById,
  updateBooksCategory,
  deleteBooksCategory
};
