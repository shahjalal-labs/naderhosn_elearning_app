export const gradeQueryFilter = {
  BOOKS: "books",
  TEACHER: "teachers",
  STUDENT: "students",
  RESOURCES : "resources",
  ASSIGNMENT : "assignments",
  ANNOUNCMENT : "announcments"
} as const;

export type GradeQueryFilterType =
  (typeof gradeQueryFilter)[keyof typeof gradeQueryFilter];