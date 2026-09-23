import { Prisma, School } from "@prisma/client";
import { uploadToDigitalOceanAWS } from "../../../helpers/uploadToDigitalOceanAWS";
import ApiError from "../../../errors/ApiErrors";
import httpStatus from "http-status";
import prisma from "../../../shared/prisma";
import { normalizeGrade, gradesMatch } from "../../../helpers/gradeMatcher";

type CreateGradeInput = {
  gradeLevel: string;
};

// Extend School create input with grades
type CreateSchoolInput = Pick<
  Prisma.SchoolCreateInput,
  | "name"
  | "location"
  | "activeStudents"
  | "activeTeachers"
  | "studentsCount"
  | "teacherCount"
  | "schoolDocuments"
> & {
  grades: CreateGradeInput[];
};

const createSchool = async (
  data: CreateSchoolInput,
  file?: Express.Multer.File,
) => {
  const {
    name,
    location,
    activeStudents,
    activeTeachers,
    studentsCount,
    teacherCount,
    grades,
    schoolDocuments,
  } = data;

  const isExist = await prisma.school.findFirst({
    where: { name, location },
  });
  if (isExist) {
    throw new ApiError(httpStatus.BAD_REQUEST, "School already exists");
  }

  let schoolLogo: string | undefined = undefined;

  const seen = new Set();
  for (const g of grades) {
    const key = `${g.gradeLevel}`;
    if (seen.has(key)) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `Duplicate grade-section found: Grade ${g.gradeLevel}`,
      );
    }
    seen.add(key);
  }

  try {
    if (file) {
      schoolLogo = (await uploadToDigitalOceanAWS(file)).Location;
    }
  } catch (error) {
    throw new ApiError(
      httpStatus.NOT_ACCEPTABLE,
      "Failed to upload school logo",
    );
  }
  return await prisma.school.create({
    data: {
      name,
      location,
      activeStudents,
      activeTeachers,
      studentsCount,
      teacherCount,
      schoolLogo: schoolLogo ? schoolLogo : undefined,
      grades: {
        create: grades.map((g: any) => ({
          grade: g.gradeLevel,
        })),
      },
      schoolDocuments,
    },
  });
};

const getAllSchools = async (query: any) => {
  const { page = 1, limit = 10, searchTerm } = query;

  const where: Prisma.SchoolWhereInput = {};

  if (searchTerm) {
    where.OR = [
      { name: { contains: searchTerm, mode: "insensitive" } },
      { location: { contains: searchTerm, mode: "insensitive" } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  // Fetch schools with grades count
  const schools = await prisma.school.findMany({
    where,
    skip,
    take,
    orderBy: { createdAt: "desc" },
    include: {
      grades: {
        include: {
          _count: {
            select: {
              StudentGrades: true,
              TeacherGrades: true,
            },
          },
        },
      },
    },
  });

  // Calculate total students and teachers per school
  const result = schools.map((school) => {
    const studentsCount = school.grades.reduce(
      (acc, grade) => acc + grade._count.StudentGrades,
      0,
    );
    const teacherCount = school.grades.reduce(
      (acc, grade) => acc + grade._count.TeacherGrades,
      0,
    );

    return {
      id: school.id,
      name: school.name,
      location: school.location,
      teacherCount,
      studentsCount,
      schoolLogo: school.schoolLogo,
      schoolDocuments: school.schoolDocuments,
      createdAt: school.createdAt,
      updatedAt: school.updatedAt,
    };
  });

  const total = await prisma.school.count({ where });

  return {
    meta: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    },
    schools: result,
  };
};

const getSchoolById = async (id: string) => {
  const school = await prisma.school.findUnique({
    where: { id },
  });

  if (!school) {
    throw new ApiError(httpStatus.NOT_FOUND, "School not found");
  }

  const gradeStats = await prisma.grades.aggregate({
    where: { schoolId: id },
    _min: { grade: true },
    _max: { grade: true },
  });

  const teacherCount = await prisma.teacherGrades.count({
    where: { grade: { schoolId: id } },
  });

  const studentCount = await prisma.studentGrades.count({
    where: { grade: { schoolId: id } },
  });

  const grades = await prisma.grades.findMany({
    where: { schoolId: id },
    select: {
      id: true,
      grade: true,
      _count: {
        select: {
          StudentGrades: true,
          TeacherGrades: true,
        },
      },
    },
  });

  return {
    headerData: {
      totalTeacherInThisSchool: teacherCount,
      totalStudentInThisSchool: studentCount,
      gradeLevel: `${gradeStats._min.grade} to ${gradeStats._max.grade}`,
    },
    ...school,
    grades,
  };
};

const updateSchool = async (
  id: string,
  data: {
    schoolData: any;
    DeleteGrades: string[];
    grades: any[];
    schoolDocuments: string[];
  },
  file?: Express.Multer.File,
) => {
  // 1. Check if school exists
  const isExist = await prisma.school.findUnique({
    where: { id },
    include: { grades: true },
  });

  if (!isExist) {
    throw new ApiError(httpStatus.NOT_FOUND, "School not found");
  }

  // 2. File upload (if provided)
  if (file) {
    try {
      const schoolLogo = (await uploadToDigitalOceanAWS(file)).Location;
      data.schoolData.schoolLogo = schoolLogo;
    } catch (error) {
      throw new ApiError(
        httpStatus.NOT_ACCEPTABLE,
        "Failed to upload school logo",
      );
    }
  }

  // 3. Update school basic info (only if schoolData is provided and not empty)
  if (data.schoolData && Object.keys(data.schoolData).length > 0) {
    const updatePayload: any = {};
    if (data.schoolData.name !== undefined) updatePayload.name = data.schoolData.name;
    if (data.schoolData.location !== undefined) updatePayload.location = data.schoolData.location;
    if (data.schoolData.teacherCount !== undefined) updatePayload.teacherCount = data.schoolData.teacherCount;
    if (data.schoolData.studentsCount !== undefined) updatePayload.studentsCount = data.schoolData.studentsCount;
    if (data.schoolData.activeStudents !== undefined) updatePayload.activeStudents = data.schoolData.activeStudents;
    if (data.schoolData.activeTeachers !== undefined) updatePayload.activeTeachers = data.schoolData.activeTeachers;
    if (data.schoolData.schoolLogo !== undefined) updatePayload.schoolLogo = data.schoolData.schoolLogo;
    if (data.schoolDocuments !== undefined) updatePayload.schoolDocuments = data.schoolDocuments;

    if (Object.keys(updatePayload).length > 0) {
      await prisma.school.update({
        where: { id },
        data: updatePayload,
      });
    }
  }

  // 4. Delete grades cleanly from this school only
  if (data.DeleteGrades && data.DeleteGrades.length > 0) {
    const validGrades = await prisma.grades.findMany({
      where: {
        id: { in: data.DeleteGrades },
        schoolId: id,
      },
      select: { id: true },
    });

    const gradeIdsToDelete = validGrades.map((g) => g.id);

    if (gradeIdsToDelete.length > 0) {
      const assignments = await prisma.assignment.findMany({
        where: { gradeId: { in: gradeIdsToDelete } },
        select: { id: true },
      });
      const assignmentIds = assignments.map((a) => a.id);

      await prisma.$transaction([
        prisma.studentGrades.deleteMany({
          where: { gradeId: { in: gradeIdsToDelete } },
        }),
        prisma.teacherGrades.deleteMany({
          where: { gradeId: { in: gradeIdsToDelete } },
        }),
        prisma.gradeBooks.deleteMany({
          where: { gradeId: { in: gradeIdsToDelete } },
        }),
        prisma.announcments.deleteMany({
          where: { gradeId: { in: gradeIdsToDelete } },
        }),
        ...(assignmentIds.length > 0
          ? [
              prisma.assignmentStudent.deleteMany({
                where: { assignmentId: { in: assignmentIds } },
              }),
              prisma.assignment.deleteMany({
                where: { id: { in: assignmentIds } },
              }),
            ]
          : []),
        prisma.grades.deleteMany({
          where: {
            id: { in: gradeIdsToDelete },
            schoolId: id,
          },
        }),
      ]);
    }
  }

  // 5. Add new grades
  if (data.grades && data.grades.length > 0) {
    await prisma.grades.createMany({
      data: data.grades.map((g) => ({
        grade: g.gradeLevel,
        schoolId: id,
      })),
    });
  }

  // 6. Return updated school with grades
  return await prisma.school.findUnique({
    where: { id },
    include: { grades: true },
  });
};

const deleteSchool = async (id: string) => {
  const isExist = await prisma.school.findUnique({
    where: { id },
  });
  if (!isExist) {
    throw new ApiError(httpStatus.NOT_FOUND, "School not found");
  }
  await prisma.school.delete({ where: { id } });
  return;
};

// Download
const getDownloadSchoolData = async (query: {
  location: boolean;
  gradeRange: boolean;
  count: boolean;
}) => {
  return await prisma.school.findMany({
    select: {
      id: true,
      name: true,
      schoolLogo: true,
      ...(query.location && { location: true }),
      _count:
        query.gradeRange || query.count
          ? {
              select: {
                ...(query.gradeRange && { grades: true }),
                ...(query.count && { StudentGrades: true }),
                ...(query.count && { Teacher: true }),
              },
            }
          : undefined,
    },
  });
};

const getAllSchoolsForForms = async () => {
  return await prisma.school.findMany({
    select: {
      id: true,
      name: true,
      grades: {
        select: {
          id: true,
          grade: true,
        },
      },
    },
  });
};

const uploadSchoolDocuments = async (files: Express.Multer.File[]) => {
  const res = await Promise.all(
    files.map(async (file) => {
      const uploadResult = await uploadToDigitalOceanAWS(file);
      return {
        fileName: file.originalname,
        url: uploadResult.Location,
      };
    }),
  );
  return res;
};

const assignBooksToSchool = async (payload: {
  schoolId: string;
  bookIds: string[];
  gradeIds?: string[];
}) => {
  const { schoolId, bookIds, gradeIds } = payload;

  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    include: { grades: true },
  });
  if (!school) {
    throw new ApiError(httpStatus.NOT_FOUND, "School not found");
  }

  if (school.grades.length === 0) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "School has no grades registered. Cannot assign books.",
    );
  }

  // 1. Verify specified books exist
  const existingBooks = await prisma.books.findMany({
    where: { id: { in: bookIds } },
    select: { id: true, bookName: true },
  });
  const validBookIds = existingBooks.map((b) => b.id);
  const invalidBooks = bookIds.filter((id) => !validBookIds.includes(id));
  if (invalidBooks.length > 0) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Invalid book IDs: ${invalidBooks.join(", ")}`,
    );
  }

  // 2. Construct combination mappings
  const assignmentData: { bookId: string; gradeId: string }[] = [];

  if (gradeIds && gradeIds.length > 0) {
    // Validate specified grade IDs belong to this school
    const schoolGradeIds = school.grades.map((g) => g.id);
    const invalidGrades = gradeIds.filter((id) => !schoolGradeIds.includes(id));
    if (invalidGrades.length > 0) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `Invalid grade IDs for this school: ${invalidGrades.join(", ")}`,
      );
    }
    for (const book of existingBooks) {
      for (const gradeId of gradeIds) {
        assignmentData.push({ bookId: book.id, gradeId });
      }
    }
  } else {
    // Intelligently auto-match each book to the school's corresponding grades by grade level
    for (const book of existingBooks) {
      const bookLevels = normalizeGrade(book.bookName || "");
      const matchedGrades = school.grades.filter((g) =>
        gradesMatch(bookLevels, normalizeGrade(g.grade)),
      );

      const targetGrades = matchedGrades.length > 0 ? matchedGrades : school.grades;
      for (const grade of targetGrades) {
        assignmentData.push({ bookId: book.id, gradeId: grade.id });
      }
    }
  }

  // 3. Execute transaction (remove existing assignments for these books in this school to prevent duplicates)
  const targetGradeIdsToClear = Array.from(new Set(assignmentData.map((a) => a.gradeId)));

  return await prisma.$transaction(async (tx) => {
    await tx.gradeBooks.deleteMany({
      where: {
        bookId: { in: validBookIds },
        gradeId: { in: targetGradeIdsToClear },
      },
    });

    const createdCount = await tx.gradeBooks.createMany({
      data: assignmentData,
    });

    return createdCount;
  });
};

const getNotAssignedBooksForSchool = async (schoolId: string) => {
  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    include: { grades: true },
  });
  if (!school) {
    throw new ApiError(httpStatus.NOT_FOUND, "School not found");
  }

  const assignedBookIds = await prisma.gradeBooks
    .findMany({
      where: { gradeId: { in: school.grades.map((g) => g.id) } },
      select: { bookId: true },
    })
    .then((res) => res.map((b) => b.bookId));

  const notAssignedBooks = await prisma.books.findMany({
    where: { id: { notIn: assignedBookIds } },
    select: {
      id: true,
      bookName: true,
      coverImg: true,
      author: true,
    },
  });
  return notAssignedBooks;
};

const getAssignedBooksForSchool = async (schoolId: string) => {
  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    include: { grades: true },
  });
  if (!school) {
    throw new ApiError(httpStatus.NOT_FOUND, "School not found");
  }

  const gradeIds = school.grades.map((g) => g.id);

  const gradeBooks = await prisma.gradeBooks.findMany({
    where: { gradeId: { in: gradeIds } },
    include: {
      book: {
        select: {
          id: true,
          bookName: true,
          coverImg: true,
          author: true,
        },
      },
      grade: {
        select: {
          id: true,
          grade: true,
        },
      },
    },
  });

  // Group by book ID to show book details and its assigned grades
  const booksMap = new Map<
    string,
    {
      id: string;
      bookName: string;
      coverImg?: string | null;
      author?: string | null;
      grades: string[];
    }
  >();

  for (const gb of gradeBooks) {
    if (!gb.book) continue;
    if (!booksMap.has(gb.book.id)) {
      booksMap.set(gb.book.id, {
        id: gb.book.id,
        bookName: gb.book.bookName || "Untitled Book",
        coverImg: gb.book.coverImg,
        author: gb.book.author,
        grades: [],
      });
    }
    if (gb.grade?.grade && !booksMap.get(gb.book.id)!.grades.includes(gb.grade.grade)) {
      booksMap.get(gb.book.id)!.grades.push(gb.grade.grade);
    }
  }

  return Array.from(booksMap.values());
};

const unassignBooksFromSchool = async (payload: {
  schoolId: string;
  bookIds: string[];
}) => {
  const { schoolId, bookIds } = payload;
  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    include: { grades: true },
  });
  if (!school) {
    throw new ApiError(httpStatus.NOT_FOUND, "School not found");
  }

  const gradeIds = school.grades.map((g) => g.id);

  const deleted = await prisma.gradeBooks.deleteMany({
    where: {
      gradeId: { in: gradeIds },
      bookId: { in: bookIds },
    },
  });

  return deleted;
};

export const schoolServices = {
  createSchool,
  getAllSchools,
  getSchoolById,
  updateSchool,
  deleteSchool,
  getDownloadSchoolData,
  getAllSchoolsForForms,
  uploadSchoolDocuments,
  assignBooksToSchool,
  getNotAssignedBooksForSchool,
  getAssignedBooksForSchool,
  unassignBooksFromSchool,
};
