import { Books, PrismaClient } from "@prisma/client";
import { uploadToDigitalOceanAWS } from "../../../helpers/uploadToDigitalOceanAWS";
const prisma = new PrismaClient();

const createBook = async (
  gradeId: string,
  data: Books,
  coverImage: Express.Multer.File,
  BookFile: Express.Multer.File
) => {
  const coverImg = (await uploadToDigitalOceanAWS(coverImage)).Location;
  const file = (await uploadToDigitalOceanAWS(BookFile)).Location;
  return await prisma.books.create({
    data: {
      ...data,
      coverImg,
      file,
      gradeId,
    },
  });
};

const getAllBooks = async () => {
  return await prisma.books.findMany();
};

const getBookById = async (id: string) => {
  const res =  await prisma.books.findUnique({ where: { id } });
  if(!res){
    throw new Error("Book not found");
  }
  return res
};

const updateBook = async (
  bookId: string,
  data: Partial<Books>,
  coverImage?: Express.Multer.File,
  BookFile?: Express.Multer.File
) => {
  const coverImg = coverImage ? (await uploadToDigitalOceanAWS(coverImage)).Location : undefined;
  const file = BookFile ? (await uploadToDigitalOceanAWS(BookFile)).Location : undefined;
  return await prisma.books.update({
    where : {id : bookId},
    data: {
      ...data,
      ...(coverImg && { coverImg }),
      ...(file && { file }),
    },
  });
};

const deleteBook = async (id: string) => {
  return await prisma.books.delete({ where: { id } });
};

export const bookServices = {
  createBook,
  getAllBooks,
  getBookById,
  updateBook,
  deleteBook,
};
