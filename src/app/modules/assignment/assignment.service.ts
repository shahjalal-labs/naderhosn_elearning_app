import { Assignment, PrismaClient } from '@prisma/client';
import prisma from '../../../shared/prisma';
import ApiError from '../../../errors/ApiErrors';
import httpStatus from 'http-status';
import { uploadToDigitalOceanAWS } from '../../../helpers/uploadToDigitalOceanAWS';
 
type AssignmentInput = Assignment & {
  studentIds?: string[];
  assignToAll?: boolean;
};

const createAssignment = async(data : AssignmentInput , file? : Express.Multer.File) => {
  const grade = await prisma.schoolGrades.findUnique({ where: { id: data.gradeId } });
  if (!grade) {
    throw new Error('Grade not found');
  }
  const book = await prisma.books.findUnique({where :{id :data.bookId}})
  if(!book){
    throw new Error('Book not found');
  }
  if (Number(data.startPage) >= Number(data.endPage)) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "End page must be greater than start page"
    )
  }
  let attachament : string 
  if(file){
    attachament = (await uploadToDigitalOceanAWS(file)).Location
  }
  return await prisma.$transaction(async (tx) => {
    // 1️⃣ Create Assignment
    const assignment = await tx.assignment.create({
      data: {
        title: data.title,
        startPage: data.startPage,
        endPage: data.endPage,
        instruction: data.instruction,
        attachament: data.attachament || attachament,
        dueDate: new Date(data.dueDate),
        gradeId: data.gradeId,
        bookId: data.bookId,
      },
    });
    // 2️⃣ Get list of students
    let studentIds = [];
    if (data.assignToAll) {
      // Fetch all students in the grade
      const students = await tx.studentGrades.findMany({
        where: { gradeId: data.gradeId },
        select: { studentId: true },
      });
      studentIds = students.map((s) => s.studentId);
    } else {
      studentIds = data.studentIds || [];
    }
    // 3️⃣ Create AssignmentStudent entries
    if (studentIds.length > 0) {
      await tx.assignmentStudent.createMany({
        data: studentIds.map((id : string) => ({
          userId: id,
          assignmentId: assignment.id,
        })),
      });
    }

    return assignment;
  });
}
const getAllAssignments = async () => {
  return await prisma.assignment.findMany();
};
 
const getAssignmentById = async (id: string) => {
  return await prisma.assignment.findUnique({ where: { id } });
};
 
const updateAssignment = async (id: string, data: any) => {
  return await prisma.assignment.update({ where: { id }, data });
};
 
const deleteAssignment = async (id: string) => {
  return await prisma.assignment.delete({ where: { id } });
};
 
export const assignmentServices = {
  createAssignment,
  getAllAssignments,
  getAssignmentById,
  updateAssignment,
  deleteAssignment,
}
  