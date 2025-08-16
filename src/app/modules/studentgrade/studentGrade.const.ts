export const gradeQueryFilterForStudent = {
  BOOKS: "books",
  RESOURCES : "resources",
  ASSIGNMENT : "assignments",
  ANNOUNCMENT : "announcments"
} as const;

export type GradeQueryFilterTypeForStudent =
  (typeof gradeQueryFilterForStudent)[keyof typeof gradeQueryFilterForStudent];