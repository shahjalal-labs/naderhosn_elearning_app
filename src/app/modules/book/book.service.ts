import { BookCategory, Books, ResoucresType } from "@prisma/client";
import { uploadToDigitalOceanAWS } from "../../../helpers/uploadToDigitalOceanAWS";
import ApiError from "../../../errors/ApiErrors";
import httpStatus from "http-status";
import prisma from "../../../shared/prisma";
import getModelKeys from "../../../helpers/getModelKeys";
import QueryBuilder from "../../builder/QueryBuilder";
import { bookData } from "./const";
import { JwtPayload } from "jsonwebtoken";

// ---------------------- Book category Services ------------------ //
const createBookCategory = async (
  data: BookCategory,
  file: Express.Multer.File
) => {
  const isExist = await prisma.bookCategory.findFirst({
    where: { name: data.name },
  });
  if (isExist) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Book category already exist");
  }
  const { Location } = await uploadToDigitalOceanAWS(file);
  return await prisma.bookCategory.create({
    data: { ...data, image: Location },
  });
};

const getAllBookCategories = async (query: any) => {
  const keys = await getModelKeys("bookCategory");
  const bookCategoryQuery = new QueryBuilder(prisma.bookCategory, query, keys);
  const result = await bookCategoryQuery
    .search(["name", "description"])
    .filter()
    .sort()
    .fields()
    .exclude()
    .paginate()
    .include()
    .execute();
  const pagination = await bookCategoryQuery.countTotal();
  return {
    meta: pagination,
    result,
  };
};

const getBookCategoryById = async (id: string) => {
  return await prisma.bookCategory.findUnique({ where: { id } });
};

const updateBookCategory = async (
  id: string,
  data: any,
  file?: Express.Multer.File
) => {
  const isExist = await prisma.bookCategory.findUnique({ where: { id } });
  if (!isExist) {
    throw new ApiError(httpStatus.NOT_FOUND, "Book category not found");
  }
  let image = isExist.image;
  if (file) {
    image = (await uploadToDigitalOceanAWS(file)).Location;
  }
  const res = await prisma.bookCategory.update({
    where: { id },
    data: {
      ...data,
      image,
    },
  });
  return res;
};

const deleteBookCategory = async (id: string) => {
  const isExist = await prisma.bookCategory.findUnique({ where: { id } });
  if (!isExist) {
    throw new ApiError(httpStatus.NOT_FOUND, "Book category not found");
  }
  await prisma.bookCategory.delete({ where: { id } });
};

// ----------------- Books ------------------------------//

const createBook = async (
  bodyData: bookData,
  coverImage: Express.Multer.File,
  bookPdf: Express.Multer.File,
  user: JwtPayload
) => {
  const { BookData, Resources, Grades } = bodyData;

  // 1. Upload cover & pdf files
  let coverImg;
  let file;
  try {
    coverImg = (await uploadToDigitalOceanAWS(coverImage)).Location;
    file = (await uploadToDigitalOceanAWS(bookPdf)).Location;
  } catch (error: any) {
    throw new ApiError(httpStatus.BAD_REQUEST, "File upload failed");
  }

  // check is category exist
  const isCategoryExist = await prisma.bookCategory.findUnique({
    where: { id: BookData.categoryId },
  });
  if (!isCategoryExist) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Book Category not found");
  }

  // 2. Create Book
  const book = await prisma.books.create({
    data: {
      bookName: BookData.bookName,
      author: BookData.author,
      description: BookData.description ?? "",
      ISBN: BookData.ISBN ?? "",
      coverImg,
      file,
      categoryId: BookData.categoryId,
    },
  });

  // 3. Insert Resources
  if (Resources?.length) {
    await prisma.resources.createMany({
      data: Resources.map((r) => ({
        title: r.title,
        description: r.description,
        file: r.file,
        Type: r.type as ResoucresType,
        bookId: book.id,
        uplodedBy: user.role,
        uploderName: user.fullName,
      })),
    });
  }

  // 4. Attach Grades
  if (Grades?.length) {
    const gradeIds = Grades.flatMap((g) => g.grade);

    // validate
    const validGrades = await prisma.grades.findMany({
      where: { id: { in: gradeIds } },
      select: { id: true },
    });
    const validGradeIds = validGrades.map((g) => g.id);

    // invalid হলে error
    const invalid = gradeIds.filter((gid) => !validGradeIds.includes(gid));
    if (invalid.length > 0) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `Invalid grade IDs: ${invalid.join(", ")}`
      );
    }

    await prisma.gradeBooks.createMany({
      data: validGradeIds.map((gid) => ({
        bookId: book.id,
        gradeId: gid,
      })),
    });
  }

  return book;
};

const getAllBooks = async (query: any) => {
  const keys = await getModelKeys("books");
  const booksQuery = new QueryBuilder(prisma.books, query, keys);
  const result = await booksQuery
    .search(["bookName"])
    .filter()
    .sort()
    .fields()
    .exclude()
    .paginate()
    .include({
      category : true,
      Resources : true
    })
    .execute();
  const pagination = await booksQuery.countTotal();
  return {
    meta: pagination,
    result,
  };
};

const getAllBooksForForm = async () => {
  return await prisma.books.findMany();
};

// const getBookById = async (id: string) => {
//   const res = await prisma.books.findUnique({
//     where: { id },
//     include: {
//       category: {
//         select: {
//           id: true,
//           name: true,
//           image: true,
//           description: true,
//         },
//       },
//       Resources: true,
//       GradeBooks : {
//         select :{
//           grade : true
//         }
//       }
//     },
//   });
//   if (!res) {
//     throw new Error("Book not found");
//   }
//   return {
    
//   };
// };


const getBookById = async (id: string) => {
  const res = await prisma.books.findUnique({
    where: { id },
    include: {
      category: {
        select: {
          id: true,
          name: true,
          image: true,
          description: true,
        },
      },
      Resources: true,
      GradeBooks: {
        select: {
          grade: {
            select: {
              id: true,
              grade: true,
              schoolId: true,
            },
          },
        },
      },
    },
  });

  if (!res) {
    throw new Error("Book not found");
  }

  // ---- Group grades by schoolId ----
  const groupedGrades: Record<string, any[]> = {};

  res.GradeBooks.forEach((gb) => {
    const g = gb.grade;
    if (!g) return;
    if (!groupedGrades[g.schoolId]) {
      groupedGrades[g.schoolId] = [];
    }
    groupedGrades[g.schoolId].push({
      id: g.id,
      grade: g.grade,
    });
  });

  // Convert object into array format
  const grades = Object.entries(groupedGrades).map(([schoolId, gradesinthisSchool]) => ({
    schoolId,
    gradesinthisSchool,
  }));

  return {
    id: res.id,
    bookName: res.bookName,
    description: res.description,
    ISBN: res.ISBN,
    author: res.author,
    coverImg: res.coverImg,
    file: res.file,
    createdAt: res.createdAt,
    updatedAt: res.updatedAt,
    category: res.category,
    Resources: res.Resources,
    grades, // ✅ your new grouped data
  };
};


const updateBook = async (
  bookId: string,
  bodyData: {
    BookData: Partial<Books>;
    NewGradesAssign?: { schoolId: string; grade: string[] }[];
    deletedGrades?: string[];
  },
  coverImage?: Express.Multer.File,
  BookFile?: Express.Multer.File
) => {
  const { BookData, NewGradesAssign, deletedGrades } = bodyData;

  const isExist = await prisma.books.findUnique({ where: { id: bookId } });
  if (!isExist) {
    throw new ApiError(httpStatus.NOT_FOUND, "Book not found");
  }

  // Upload files if provided
  const coverImg = coverImage
    ? (await uploadToDigitalOceanAWS(coverImage)).Location
    : undefined;
  const file = BookFile
    ? (await uploadToDigitalOceanAWS(BookFile)).Location
    : undefined;

  // Unassign deleted grades
  if (deletedGrades?.length) {
    await prisma.gradeBooks.deleteMany({
      where: { bookId, gradeId: { in: deletedGrades } },
    });
  }

  // Assign new grades
  if (NewGradesAssign?.length) {
    const gradeIds = NewGradesAssign.flatMap((g) => g.grade);

    const validGrades = await prisma.grades.findMany({
      where: { id: { in: gradeIds } },
      select: { id: true },
    });
    const validGradeIds = validGrades.map((g) => g.id);

    const invalid = gradeIds.filter((id) => !validGradeIds.includes(id));
    if (invalid.length > 0) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `Invalid grade IDs: ${invalid.join(", ")}`
      );
    }

    // Remove duplicates if any
    await prisma.gradeBooks.deleteMany({
      where: { bookId, gradeId: { in: validGradeIds } },
    });

    await prisma.gradeBooks.createMany({
      data: validGradeIds.map((gradeId) => ({ bookId, gradeId })),
    });
  }

  // Update book fields
  return await prisma.books.update({
    where: { id: bookId },
    data: {
      ...BookData, // Only the actual fields of books
      ...(coverImg && { coverImg }),
      ...(file && { file }),
    },
  });
};

const deleteBook = async (id: string) => {
  return await prisma.books.delete({ where: { id } });
};
const uploadResourcesFile = async (file: Express.Multer.File) => {
  console.log(file);
  try {
    const uploadeFile = (await uploadToDigitalOceanAWS(file)).Location;
    return { url: uploadeFile };
  } catch (error) {
    throw new ApiError(httpStatus.BAD_REQUEST, "File uploading issue ");
  }
};

export const bookServices = {
  createBook,
  getAllBooks,
  getBookById,
  updateBook,
  deleteBook,
  createBookCategory,
  getAllBookCategories,
  getBookCategoryById,
  updateBookCategory,
  deleteBookCategory,
  uploadResourcesFile,
  getAllBooksForForm,
};
