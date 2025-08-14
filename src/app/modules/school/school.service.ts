import { Prisma, PrismaClient, School } from "@prisma/client";
import { uploadToDigitalOceanAWS } from "../../../helpers/uploadToDigitalOceanAWS";
import ApiError from "../../../errors/ApiErrors";
import httpStatus from "http-status";
import prisma from "../../../shared/prisma";
import getModelKeys from "../../../helpers/getModelKeys";
import QueryBuilder from "../../builder/QueryBuilder";

const createSchool = async (data: any, file: Express.Multer.File) => {
  const { grades, name, location, expectedTeachers, expectedStudents } = data;
  let schoolLogo: string;

  const seen = new Set();
  for (const g of grades) {
    const key = `${g.grade}-${g.section}`;
    if (seen.has(key)) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `Duplicate grade-section found: Grade ${g.grade} Section ${g.section}`
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
      expectedTeachers,
      expectedStudents,
      schoolLogo,
      grades: {
        create: grades.map((g: any) => ({
          grade: g.grade,
          section: g.section,
          gradeSubject: { create: [] },
        })),
      },
    },
    include: {
      grades: {
        include: {
          gradeSubject: true,
        },
      },
    },
  });
};

const getAllSchools = async (query: any) => {
  const keys = await getModelKeys("school");
  const usersQuery = new QueryBuilder(prisma.school, query, keys);
  const result = await usersQuery
    .search(["name", "location"])
    .filter()
    .sort()
    .fields()
    .exclude()
    .paginate()
    .include({ grades: true })
    .execute();
  const pagination = await usersQuery.countTotal();
  return {
    meta: pagination,
    result,
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

  const gradeStats = await prisma.schoolGrades.aggregate({
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

  const grades = await prisma.schoolGrades.findMany({
    where: { schoolId: id },
    select: {
      id: true,
      grade: true,
      section: true,
      _count :{
        select : {
          StudentGrades : true,
          TeacherGrades : true
        }
      }
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
  data: School,
  file?: Express.Multer.File
) => {
  //  Check if school exists
  const isExist = await prisma.school.findUnique({
    where: { id },
    include: { grades: { include: { gradeSubject: true } } },
  });

  if (!isExist) {
    throw new ApiError(httpStatus.NOT_FOUND, "School not found");
  }

  //  file upload
  if (file) {
    try {
      const schoolLogo = (await uploadToDigitalOceanAWS(file)).Location;
      data.schoolLogo = schoolLogo;
    } catch (error) {
      throw new ApiError(
        httpStatus.NOT_ACCEPTABLE,
        "Failed to upload school logo"
      );
    }
  }

  // Update school
  await prisma.school.update({
    where: { id },
    data: data,
    include: {
      grades: { include: { gradeSubject: true } },
    },
  });
  return;
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

export const schoolServices = {
  createSchool,
  getAllSchools,
  getSchoolById,
  updateSchool,
  deleteSchool,
};
