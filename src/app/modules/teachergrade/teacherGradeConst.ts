export const gradeQueryFilterForTeacher = {
  BOOKS: "books",
  STUDENT: "students",
  RESOURCES : "resources",
  ASSIGNMENT : "assignments",
  ANNOUNCMENT : "announcments"
} as const;

export type GradeQueryFilterTypeForTeacher =
  (typeof gradeQueryFilterForTeacher)[keyof typeof gradeQueryFilterForTeacher];