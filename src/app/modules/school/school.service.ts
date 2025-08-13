import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
 
const createSchool = async (data: any) => {
  return await prisma.school.create({ data });
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
}
  