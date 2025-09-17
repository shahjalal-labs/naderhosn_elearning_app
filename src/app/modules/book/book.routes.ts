import express from "express";
import { bookControllers } from "./book.controller";
import { fileUploader } from "../../../helpers/fileUploadHelper";
import { parseBodyData } from "../../middlewares/parseBodyData";
import validateRequest from "../../middlewares/validateRequest";
import {
  BookCategorySchema,
  CreateBookSchema,
  UpdateBookSchema,
} from "./book.validation";
import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";

const router = express.Router();

// --------- Books Category Routes --------- //

router.post(
  "/categories",
  auth(UserRole.Admin),
  validateRequest(BookCategorySchema),
  bookControllers.createBooksCategory
);
router.get(
  "/categories",
  auth(UserRole.Admin),
  bookControllers.getAllBooksCategories
);
router.get(
  "/categories/:id",
  auth(UserRole.Admin),
  bookControllers.getBooksCategoryById
);
router.patch(
  "/categories/:id",
  auth(UserRole.Admin),
  bookControllers.updateBooksCategory
);
router.delete(
  "/categories/:id",
  auth(UserRole.Admin),
  bookControllers.deleteBooksCategory
);

// ---------- Books -------------------//

router.post(
  "/create-book/:gradeId",
  auth(UserRole.Admin),
  fileUploader.uploadBooks,
  parseBodyData,
  validateRequest(CreateBookSchema),
  bookControllers.createBook
);
router.get("/", auth(UserRole.Admin), bookControllers.getAllBooks);
router.get("/:id", auth(), bookControllers.getBookById);
router.patch(
  "/update-book/:bookId",
  auth(UserRole.Admin),
  fileUploader.uploadBooks,
  parseBodyData,
  validateRequest(UpdateBookSchema),
  bookControllers.updateBook
);
router.delete("/:id", auth(UserRole.Admin), bookControllers.deleteBook);

export const bookRoutes = router;
