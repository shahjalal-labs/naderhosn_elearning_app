import { Books, PrismaClient } from "@prisma/client";
import { uploadToDigitalOceanAWS } from "../../../helpers/uploadToDigitalOceanAWS";
import ApiError from "../../../errors/ApiErrors";
import httpStatus from "http-status";
import { sendGroupNotifications } from "../notifications/notification.services";
const prisma = new PrismaClient();

const createBook = async (
  gradeId: string,
  data: Books,
  coverImage: Express.Multer.File,
  BookFile: Express.Multer.File
) => {
  const isGradeExist = await prisma.schoolGrades.findUnique({
    where: { id: gradeId },
    include: {
      StudentGrades: { select: { studentId: true } },
      TeacherGrades: { select: { teacherId: true } },
    },
  });

  if (!isGradeExist) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Grade does not exist, please provide valid grade id");
  }

  const coverImg = (await uploadToDigitalOceanAWS(coverImage)).Location;
  const file = (await uploadToDigitalOceanAWS(BookFile)).Location;

  await prisma.books.create({
    data: {
      ...data,
      coverImg,
      file,
      gradeId,
    },
  });

  // Collect student + teacher ids
  const userIds = [
    ...isGradeExist.StudentGrades.map((s) => s.studentId),
    ...isGradeExist.TeacherGrades.map((t) => t.teacherId),
  ];

  // Send notifications
  try {
    await sendGroupNotifications(
      userIds,
      `A new book "${data.bookName}" has been added.`,
      "New Book Added"
    );
  } catch (err) {
    console.error("Notification failed:", err);
  }
};

const getAllBooks = async () => {
  return await prisma.books.findMany();
};

const getBookById = async (id: string) => {
  const res =  await prisma.books.findUnique({ where: { id }, include:{
    grade: {
      select: {
        grade:true
      }
    }
  } });
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
