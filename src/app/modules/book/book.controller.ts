import { query, Request, Response } from "express";
import { bookServices } from "./book.service";
import sendResponse from "../../../shared/sendResponse";
import catchAsync from "../../../shared/catchAsync";
import ApiError from "../../../errors/ApiErrors";
import httpStatus from "http-status";

// ------------ product category controllers -------------
const createBooksCategory = catchAsync(async (req: Request, res: Response) => {
  const file = req.file;
  const result = await bookServices.createBookCategory(req.body, file);
  sendResponse(res, {
    success: true,
    statusCode: 201,
    message: "The Books category has been created successfully",
    data: result,
  });
});
const deleteBooksCategory = catchAsync(async (req: Request, res: Response) => {
  await bookServices.deleteBookCategory(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: 201,
    message: "The Books category has been deleted successfully",
  });
});
const getAllBooksCategories = catchAsync(
  async (req: Request, res: Response) => {
    const result = await bookServices.getAllBookCategories(req.query);
    sendResponse(res, {
      success: true,
      statusCode: 201,
      message: "Books has been retrieved successfully",
      data: result,
    });
  },
);
const getBooksCategoryById = catchAsync(async (req: Request, res: Response) => {
  const result = await bookServices.getBookCategoryById(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: 201,
    message: "Books category has been retrieved successfully",
    data: result,
  });
});
const updateBooksCategory = catchAsync(async (req: Request, res: Response) => {
  const file = req.file;
  if (file) {
    req.body.icon = file.path;
  }
  const result = await bookServices.updateBookCategory(
    req.params.id,
    req.body,
    file,
  );
  sendResponse(res, {
    success: true,
    statusCode: 201,
    message: "The Books category has been updated successfully",
    data: result,
  });
});

// ------------------ Books ------------------------///

const createBook = catchAsync(async (req: Request, res: Response) => {
  let coverImg: Express.Multer.File | undefined;
  let file: Express.Multer.File | undefined;
  if (req.files && !Array.isArray(req.files)) {
    coverImg =
      (req.files["coverImage"]?.[0] as Express.Multer.File) || undefined;
    file = (req.files["bookPdf"]?.[0] as Express.Multer.File) || undefined;
  }
  if (!file) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Book file is required");
  }
  const result = await bookServices.createBook(
    req.body,
    file,
    req.user,
    coverImg,
  );
  sendResponse(res, {
    success: true,
    statusCode: 201,
    message: "The book has been created successfully",
    data: result,
  });
});

const getAllBooks = catchAsync(async (_req: Request, res: Response) => {
  const result = await bookServices.getAllBooks(_req.query);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "All books has been retrived successfully",
    data: result,
  });
});
const getAllBooksForTeacher = catchAsync(
  async (req: Request, res: Response) => {
    const result = await bookServices.getAllBooksForTeacher(
      req.query,
      req.user,
    );
    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "All books has been retrived successfully",
      data: result,
    });
  },
);

const getAllBooksForForms = catchAsync(async (_req: Request, res: Response) => {
  const result = await bookServices.getAllBooksForForm();
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "All books for form has been retrived successfully",
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
  if (req.files && !Array.isArray(req.files)) {
    coverImg =
      (req.files["coverImage"]?.[0] as Express.Multer.File) || undefined;
    file = (req.files["bookPdf"]?.[0] as Express.Multer.File) || undefined;
  }
  const { bookId } = req.params;
  const result = await bookServices.updateBook(
    bookId,
    req.body,
    coverImg,
    file,
  );
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

const uploadResourcesFile = catchAsync(async (_req: Request, res: Response) => {
  const file = _req.file;
  if (!file) {
    throw new ApiError(httpStatus.BAD_REQUEST, "File is missing");
  }
  const result = await bookServices.uploadResourcesFile(file);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "file has been uploaded successfully",
    data: result,
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
  deleteBooksCategory,
  uploadResourcesFile,
  getAllBooksForForms,
  getAllBooksForTeacher,
};
