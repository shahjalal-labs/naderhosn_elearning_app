import express, { Request, Response } from "express";
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
import prisma from "../../../shared/prisma";
import https from "https";
import http from "http";
import { URL } from "url";

const router = express.Router();

// --------- Books Category Routes --------- //

router.post(
  "/categories",
  auth(UserRole.Admin),
  fileUploader.uploadSingle,
  parseBodyData,
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
  fileUploader.uploadSingle,
  parseBodyData,
  bookControllers.updateBooksCategory
);
router.delete(
  "/categories/:id",
  auth(UserRole.Admin),
  bookControllers.deleteBooksCategory
);

// ---------- Books -------------------//

router.post(
  "/upload-file",
  auth(UserRole.Admin),
  fileUploader.uploadSingle,
  bookControllers.uploadResourcesFile
);


////####           Test PDF Reader Route - Optimized for Large Files         ####////

router.get(
  "/test-pdf-reader/:pdfUrl",
  (req: Request, res: Response) => {
    try {
      const pdfUrl = decodeURIComponent(req.params.pdfUrl);
      const range = req.headers.range;
      
      const parsedUrl = new URL(pdfUrl);
      const protocol = parsedUrl.protocol === 'https:' ? https : http;

      const options = {
        hostname: parsedUrl.hostname,
        path: parsedUrl.pathname + parsedUrl.search,
        method: 'GET',
        headers: range ? { Range: range } : {},
      };

      const proxyRequest = protocol.request(options, (proxyResponse) => {
        const statusCode = proxyResponse.statusCode || 200;
        
        // Set response status
        res.status(statusCode);
        
        // Essential CORS headers for PDF streaming
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Range');
        res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges');
        
        // PDF-specific headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
        
        // Forward content headers from source
        if (proxyResponse.headers['content-length']) {
          res.setHeader('Content-Length', proxyResponse.headers['content-length']);
        }
        if (proxyResponse.headers['content-range']) {
          res.setHeader('Content-Range', proxyResponse.headers['content-range']);
        }
        
        // Pipe the response with error handling
        proxyResponse.on('error', (err) => {
          console.error('Proxy response error:', err);
          if (!res.headersSent) {
            res.status(500).json({ error: "PDF Streaming Failed" });
          }
        });
        
        proxyResponse.pipe(res);
      });

      proxyRequest.on('error', (err) => {
        console.error('PDF streaming error:', err);
        if (!res.headersSent) {
          res.status(500).json({ error: "PDF Streaming Failed" });
        }
      });

      // Set timeout for large files (30 seconds)
      proxyRequest.setTimeout(30000);
      proxyRequest.end();
    } catch (err) {
      console.error(err);
      if (!res.headersSent) {
        res.status(500).json({ error: "PDF Streaming Failed" });
      }
    }
  }
);

// Handle OPTIONS preflight for CORS
router.options("/test-pdf-reader/:pdfUrl", (req: Request, res: Response) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Range');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges');
  res.status(200).end();
});

router.get(
  "/test-all-book-fecth",
  async (req: Request, res: Response) => {
    const data = await prisma.books.findMany({
      include: {
        category: true,
      },
    });
    return res.status(200).json({ data });
  }
);

/////####     End of PDF Reader Route         ###/////



router.post(
  "/create-book",
  auth(UserRole.Admin),
  fileUploader.uploadBooks,
  parseBodyData,
  validateRequest(CreateBookSchema),
  bookControllers.createBook
);
router.get("/", auth(UserRole.Admin), bookControllers.getAllBooks);
router.get(
  "/for-teacher",
  auth(UserRole.Teacher),
  bookControllers.getAllBooksForTeacher
);
router.get("/books-for-forms", auth(), bookControllers.getAllBooksForForms);
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
