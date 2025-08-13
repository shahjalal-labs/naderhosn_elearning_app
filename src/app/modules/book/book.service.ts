import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
 
const createBook = async (data: any) => {
  return await prisma.book.create({ data });
};
 
const getAllBooks = async () => {
  return await prisma.book.findMany();
};
 
const getBookById = async (id: string) => {
  return await prisma.book.findUnique({ where: { id } });
};
 
const updateBook = async (id: string, data: any) => {
  return await prisma.book.update({ where: { id }, data });
};
 
const deleteBook = async (id: string) => {
  return await prisma.book.delete({ where: { id } });
};
 
export const bookServices = {
  createBook,
  getAllBooks,
  getBookById,
  updateBook,
  deleteBook,
}
  