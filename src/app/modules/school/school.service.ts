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
> & {
  grades: CreateGradeInput[];
};

const createSchool = async (
  data: CreateSchoolInput,
  file: Express.Multer.File
) => {
  const {
    name,
    location,
    activeStudents,
    activeTeachers,
    studentsCount,
    teacherCount,
    grades,
  } = data;

  const isExist = await prisma.school.findFirst({
    where: { name, location },
  });
  if (isExist) {
    throw new ApiError(httpStatus.BAD_REQUEST, "School already exists");
  }

  let schoolLogo: string;

  const seen = new Set();
  for (const g of grades) {
    const key = `${g.gradeLevel}`;
    if (seen.has(key)) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `Duplicate grade-section found: Grade ${g.gradeLevel}`
      );
    }
    seen.add(key);
  }

  try {
    schoolLogo = (await uploadToDigitalOceanAWS(file)).Location;
  } catch (error) {
    throw new ApiError(
      httpStatus.NOT_ACCEPTABLE,
      "Failed to upload school logo"
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
      schoolLogo,
      grades: {
        create: grades.map((g: any) => ({
          grade: g.gradeLevel,
        })),
      },
    },
  });
};

// const getAllSchools = async (query: any) => {
//   const keys = await getModelKeys("school");
//   const usersQuery = new QueryBuilder(prisma.school, query, keys);
//   const result = await usersQuery
//     .search(["name", "location"])
//     .filter()
//     .sort()
//     .fields()
//     .exclude()
//     .paginate()
//     .include({
//       grades : true
//       // grades: {
//       //   // include: {
//       //   //   GradeBooks: {
//       //   //     include : {
//       //   //       "book" : true
//       //   //     }
//       //   //   },
//       //   // },
//       // },
//     })
//     .execute();
//   const pagination = await usersQuery.countTotal();
//   return {
//     meta: pagination,
//     result,
//   };
// };

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
      0
    );
    const teacherCount = school.grades.reduce(
      (acc, grade) => acc + grade._count.TeacherGrades,
      0
    );

    return {
      id: school.id,
      name: school.name,
      location: school.location,
      teacherCount,
      studentsCount,
      schoolLogo: school.schoolLogo,
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
    schools : result,
  };
};


const getSchoolById = async (id: string) => {
  const school = await prisma.school.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      schoolLogo: true,
    },
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
  data: { schoolData: any; DeleteGrades: string[]; grades: any[] },
  file?: Express.Multer.File
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
        "Failed to upload school logo"
      );
    }
  }

  // 3. Update school basic info
  await prisma.school.update({
    where: { id },
    data: {
      name: data.schoolData.name,
      location: data.schoolData.location,
      teacherCount: data.schoolData.teacherCount,
      studentsCount: data.schoolData.studentsCount,
      activeStudents: data.schoolData.activeStudents,
      activeTeachers: data.schoolData.activeTeachers,
      schoolLogo: data.schoolData.schoolLogo,
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

export const schoolServices = {
  createSchool,
  getAllSchools,
  getSchoolById,
  updateSchool,
  deleteSchool,
  getDownloadSchoolData,
  getAllSchoolsForForms,
};
