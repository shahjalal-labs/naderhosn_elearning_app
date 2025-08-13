import express from 'express';
import { bookControllers } from "./book.controller";
 
const router = express.Router();
 
router.post('/', bookControllers.createBook);
router.get('/', bookControllers.getAllBooks);
router.get('/:id', bookControllers.getBookById);
router.patch('/:id', bookControllers.updateBook);
router.delete('/:id', bookControllers.deleteBook);
 
export const bookRoutes = router;
  