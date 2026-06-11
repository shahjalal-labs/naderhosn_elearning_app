import { Prisma, School } from "@prisma/client";
import { uploadToDigitalOceanAWS } from "../../../helpers/uploadToDigitalOceanAWS";
import ApiError from "../../../errors/ApiErrors";
import httpStatus from "http-status";
import prisma from "../../../shared/prisma";

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

  // 3. Update school basic info
  const res = await prisma.school.update({
    where: { id },
    data: {
      name: data.schoolData.name,
      location: data.schoolData.location,
      teacherCount: data.schoolData.teacherCount,
      studentsCount: data.schoolData.studentsCount,
      activeStudents: data.schoolData.activeStudents,
      activeTeachers: data.schoolData.activeTeachers,
      schoolLogo: data.schoolData.schoolLogo,
      schoolDocuments: data.schoolDocuments,
    },
  });

  // 4. Delete grades
  if (data.DeleteGrades && data.DeleteGrades.length > 0) {
    await prisma.grades.deleteMany({
      where: {
        id: { in: data.DeleteGrades },
        schoolId: id,
      },
    });
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
  
  let targetGradeIds: string[] = [];
  if (gradeIds && gradeIds.length > 0) {
    // Validate that the specified grade IDs belong to this school
    const schoolGradeIds = school.grades.map((g) => g.id);
    const invalidGrades = gradeIds.filter((id) => !schoolGradeIds.includes(id));
    if (invalidGrades.length > 0) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `Invalid grade IDs for this school: ${invalidGrades.join(", ")}`,
      );
    }
    targetGradeIds = gradeIds;
  } else {
    // Default to assigning to all grades registered to the school
    targetGradeIds = school.grades.map((g) => g.id);
    if (targetGradeIds.length === 0) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "School has no grades registered. Cannot assign books.",
      );
    }
  }

  // 3. Verify that all specified book IDs actually exist
  const existingBooks = await prisma.books.findMany({
    where: { id: { in: bookIds } },
    select: { id: true },
  });
  const validBookIds = existingBooks.map((b) => b.id);
  const invalidBooks = bookIds.filter((id) => !validBookIds.includes(id));
  if (invalidBooks.length > 0) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Invalid book IDs: ${invalidBooks.join(", ")}`,
    );
  }

  // 4. Construct combination mappings
  const assignmentData: { bookId: string; gradeId: string }[] = [];
  for (const bookId of validBookIds) {
    for (const gradeId of targetGradeIds) {
      assignmentData.push({ bookId, gradeId });
    }
  }

  // 5. Execute transaction (avoids unique constraint errors by removing duplicates first)
  return await prisma.$transaction(async (tx) => {
    // Delete duplicate matches to prevent unique constraint failures
    await tx.gradeBooks.deleteMany({
      where: {
        bookId: { in: validBookIds },
        gradeId: { in: targetGradeIds },
      },
    });

    // Bulk assign
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
  // Implementation for fetching not assigned books would go here

  const assignedBookIds = await prisma.gradeBooks.findMany({
    where: { gradeId: { in: school.grades.map((g) => g.id) } },
    select: { bookId: true },
  }).then((res) => res.map((b) => b.bookId));

  const notAssignedBooks = await prisma.books.findMany({
    where: { id: { notIn: assignedBookIds } },
    select : {
      id:true,
      bookName:true
    }
  });
  return notAssignedBooks;
}

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
};
