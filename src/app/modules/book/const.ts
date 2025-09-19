export interface bookData {
  BookData: {
    bookName: string;
    description: string;
    ISBN: string;
    author: string;
    categoryId: string;
  };
  Resources?: {
    title: string;
    description: string;
    file: string;
    type: "Pdf" | "Video" | "Audio";
  }[];
  Grades?: {
    schoolId: string;
    grade: string[];
  }[];
}
