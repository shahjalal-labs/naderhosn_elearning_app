import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
 
const createResource = async (data: any) => {
  return await prisma.resource.create({ data });
};
 
const getAllResources = async () => {
  return await prisma.resource.findMany();
};
 
const getResourceById = async (id: string) => {
  return await prisma.resource.findUnique({ where: { id } });
};
 
const updateResource = async (id: string, data: any) => {
  return await prisma.resource.update({ where: { id }, data });
};
 
const deleteResource = async (id: string) => {
  return await prisma.resource.delete({ where: { id } });
};
 
export const resourceServices = {
  createResource,
  getAllResources,
  getResourceById,
  updateResource,
  deleteResource,
}
  