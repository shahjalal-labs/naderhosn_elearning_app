import { Prisma, PrismaClient, School } from "@prisma/client";
import { uploadToDigitalOceanAWS } from "../../../helpers/uploadToDigitalOceanAWS";
import ApiError from "../../../errors/ApiErrors";
import httpStatus from "http-status";
import prisma from "../../../shared/prisma";

const createSchool = async (data: any, file: Express.Multer.File) => {
   const { grades, name, location, expectedTeachers, expectedStudents } = data;
  let schoolLogo: string;
  try {
     schoolLogo  = (await uploadToDigitalOceanAWS(file)).Location;
  } catch (error) {
    throw new ApiError(httpStatus.NOT_ACCEPTABLE , "Failed to upload school logo");
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
        include :{
          gradeSubject : true
        }
      },
    },
  });
};

const getAllSchools = async () => {
  return await prisma.school.findMany();
};

const getSchoolById = async (id: string) => {
  return await prisma.school.findUnique({ where: { id } });
};

const updateSchool = async (id: string, data: any) => {
  return await prisma.school.update({ where: { id }, data });
};

const deleteSchool = async (id: string) => {
  return await prisma.school.delete({ where: { id } });
};

export const schoolServices = {
  createSchool,
  getAllSchools,
  getSchoolById,
  updateSchool,
  deleteSchool,
};
