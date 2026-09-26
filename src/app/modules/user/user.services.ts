import { UserRole, BookCategory } from "@prisma/client";
import ApiError from "../../../errors/ApiErrors";
import prisma from "../../../shared/prisma";
import { paginationHelper } from "../../../shared/pagination";
import { uploadToDigitalOceanAWS } from "../../../helpers/uploadToDigitalOceanAWS";
import bcrypt from "bcryptjs";
import {
  bulkUploadStudent,
  bulkUploadTeacher,
  CreateNewStudentType,
  CreateNewTeacherType,
  generateStudentUserName,
  generateTeacherUserName,
  generateUniqueStudentUserNames,
  generateUniqueTeacherUserNames,
  IUserGradePayload,
  randomPassword,
  usersQuery,
} from "./const";
import httpStatus from "http-status";
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
  isSameDay,
  isSameWeek,
  isSameMonth,
  format,
  subYears,
  eachYearOfInterval,
  isSameYear,
  startOfDay,
  endOfDay,
  subDays,
  subWeeks,
  subMonths,
} from "date-fns";

export const getStudents = async (query: usersQuery) => {
  const {
    searchTerm,
    startDate,
    endDate,
    schoolId,
    gradeIds: rawGradeIds,
  } = query;

  // Parse gradeIds if it's a string
  let gradeIds: string[] | undefined;
  if (rawGradeIds) {
    if (typeof rawGradeIds === "string") {
      try {
        gradeIds = JSON.parse(rawGradeIds);
      } catch {
        gradeIds = [rawGradeIds]; // If parsing fails, treat as single ID
      }
    } else {
      gradeIds = rawGradeIds;
    }
  }

  // Build where conditions
  const where: any = {
    role: "Student",
  };

  // Filter by school or grade through StudentGrades relation
  if (schoolId || (gradeIds && gradeIds.length > 0)) {
    where.StudentGrades = {
      some: {
        ...(gradeIds &&
          gradeIds.length > 0 && {
            gradeId: {
              in: gradeIds,
            },
          }),
        ...(schoolId && {
          grade: {
            schoolId: schoolId,
          },
        }),
      },
    };
  }

  if (searchTerm) {
    where.OR = [
      {
        fullName: {
          contains: searchTerm,
          mode: "insensitive",
        },
      },
      {
        loginUserName: {
          contains: searchTerm,
          mode: "insensitive",
        },
      },
      {
        StudentGrades: {
          some: {
            grade: {
              school: {
                name: {
                  contains: searchTerm,
                  mode: "insensitive",
                },
              },
            },
          },
        },
      },
    ];
  }

  if (startDate && endDate) {
    where.joinedAt = {
      gte: new Date(startDate),
      lte: new Date(endDate),
    };
  }

  // Fetch students with pagination
  const result = await prisma.user.findMany({
    where,
    include: {
      StudentGrades: {
        select: {
          grade: {
            select: {
              id: true,
              grade: true,
              school: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: {
      joinedAt: "desc",
    },
  });

  return {
    meta: {
      total: result.length,
      result,
    },
  };
};

export const getTeachers = async (query: usersQuery) => {
  const {
    searchTerm,
    startDate,
    endDate,
    schoolId,
    gradeIds: rawGradeIds,
  } = query;

  // Parse gradeIds if it's a string
  let gradeIds: string[] | undefined;
  if (rawGradeIds) {
    if (typeof rawGradeIds === "string") {
      try {
        gradeIds = JSON.parse(rawGradeIds);
      } catch {
        gradeIds = [rawGradeIds]; // If parsing fails, treat as single ID
      }
    } else {
      gradeIds = rawGradeIds;
    }
  }

  // Build where conditions
  const where: any = {
    role: "Teacher",
  };

  // Fix: Filter by school through the TeacherGrades relation
  if (schoolId || (gradeIds && gradeIds.length > 0)) {
    where.Teacher = {
      some: {
        ...(gradeIds &&
          gradeIds.length > 0 && {
            gradeId: {
              in: gradeIds,
            },
          }),
        ...(schoolId && {
          grade: {
            schoolId: schoolId,
          },
        }),
      },
    };
  }

  if (searchTerm) {
    where.OR = [
      {
        fullName: {
          contains: searchTerm,
          mode: "insensitive",
        },
      },
      {
        loginUserName: {
          contains: searchTerm,
          mode: "insensitive",
        },
      },
      {
        Teacher: {
          some: {
            grade: {
              school: {
                name: {
                  contains: searchTerm,
                  mode: "insensitive",
                },
              },
            },
          },
        },
      },
    ];
  }

  if (startDate && endDate) {
    where.joinedAt = {
      gte: new Date(startDate),
      lte: new Date(endDate),
    };
  }

  // i want to decrypt all password after sending response 

  // Fetch teachers with pagination
  const result = await prisma.user.findMany({
    where,
    include: {
      Teacher: {
        select: {
          grade: {
            select: {
              id: true,
              grade: true,
              school: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: {
      joinedAt: "desc",
    },
  });

  return {
    meta: {
      total: result.length,
      result,
    },
  };
};

const getSingleUserIntoDB = async (id: string) => {
  // Get user first
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      // include all possible relations, conditionally include nested
      StudentGrades: {
        include: {
          grade: {
            include: {
              school: true,
            },
          },
        },
      },
      assignments: true,
      Teacher: {
        select: {
          grade: {
            include: {
              school: true,
            },
          },
        },
      },
      teachersBookCategories: {
        select: {
          id: true,
          category: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      StudentBooks: {
        include: {
          book: true,
        },
      },
    },
  });

  if (!user) {
    throw new ApiError(404, "User not found!");
  }

  // Remove sensitive fields
  const { password, ...sanitizedUser } = user;

  // Optionally, remove irrelevant relations based on role
  if (sanitizedUser.role === "Student") {
    Reflect.deleteProperty(sanitizedUser, "Teacher");
    Reflect.deleteProperty(sanitizedUser, "teachersBookCategories");
  } else if (sanitizedUser.role === "Teacher") {
    Reflect.deleteProperty(sanitizedUser, "StudentGrades");
    Reflect.deleteProperty(sanitizedUser, "StudentBooks");
    Reflect.deleteProperty(sanitizedUser, "assignments");
  } else {
    // Admin: remove student/teacher relations
    Reflect.deleteProperty(sanitizedUser, "StudentGrades");
    Reflect.deleteProperty(sanitizedUser, "StudentBooks");
    Reflect.deleteProperty(sanitizedUser, "teachersBookCategories");
    Reflect.deleteProperty(sanitizedUser, "assignments");
    Reflect.deleteProperty(sanitizedUser, "Teacher");
  }

  return sanitizedUser;
};

const deleteUser = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: {
      id: id,
    },
  });
  if (!user) {
    throw new ApiError(404, "User not found for delete");
  }

  await prisma.user.delete({
    where: { id },
  });

  return;
};

const deleteMultipleUsersByAdmin = async (usersIds: string[]) => {
  await prisma.user.deleteMany({
    where: {
      id: { in: usersIds },
    },
  });
  return;
};

const deleteStudentsByAdmin = async () => {
  await prisma.user.deleteMany({
    where: {
      role: "Student",
    },
  });
  return;
};

// ONLY FOR APPLE SUBMISSION - Delete all manual/test signups
const deleteManualSignups = async () => {
  const result = await prisma.user.deleteMany({
    where: {
      isManualSignup: true,
    },
  });
  return result;
};

const getUsers = async (query: any) => {
  const { page, limit, skip } = paginationHelper(query);
  const users = await prisma.user.findMany({
    where: {},
    select: {
      id: true,
      fullName: true,
      profileImage: true,
    },
    take: limit,
    skip,
    orderBy: {
      joinedAt: "desc",
    },
  });

  const totalCount = await prisma.user.count({
    where: {},
  });
  const totalPages = Math.ceil(totalCount / limit);

  return { totalCount, totalPages, currentPage: page, users };
};

const updateUser = async (
  payload: IUserGradePayload,
  userId: string,
  file?: Express.Multer.File
) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new ApiError(404, "User not found for edit");
  }
  const { userData: userUpdatePayload, gradeData: userGradePayload } = payload;

  if (
    userUpdatePayload.loginUserName &&
    userUpdatePayload.loginUserName !== user.loginUserName
  ) {
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { loginUserName: userUpdatePayload.loginUserName },
          { email: userUpdatePayload.email },
        ],
      },
    });

    if (existingUser) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "loginUserName or email  already taken. Please choose another."
      );
    }
  }

  // Handle profile image upload (only if file is present)
  const profileImage = file
    ? (await uploadToDigitalOceanAWS(file)).Location
    : user.profileImage;

  // Prepare update object
  const updateData = {
    fullName: userUpdatePayload.fullName ?? user.fullName,
    email: userUpdatePayload.email ?? user.email,
    DOB: userUpdatePayload.DOB ?? user.DOB,
    gender: userUpdatePayload.gender ?? user.gender,
    phone: userUpdatePayload.phone ?? user.phone,
    password: userUpdatePayload.password
      ? bcrypt.hashSync(userUpdatePayload.password, 8)
      : user.password,
    status: userUpdatePayload.status ?? user.status,
    loginUserName: userUpdatePayload.loginUserName ?? user.loginUserName,
    profileImage,
  };

  // Update user basic info
  await prisma.user.update({
    where: { id: userId },
    data: updateData,
  });

  // ===== Handle Grade Logic with switch-case =====
  if (userGradePayload) {
    const { deletedGrade = [], newGradeAssign = [] } = userGradePayload;

    switch (user.role) {
      case "Student": {
        // Validate deleted grades in one query
        if (deletedGrade.length) {
          const existingGrades = await prisma.studentGrades.findMany({
            where: { gradeId: { in: deletedGrade }, studentId: userId },
          });

          const existingIds = existingGrades.map((g) => g.gradeId);
          const missing = deletedGrade.filter((g) => !existingIds.includes(g));
          if (missing.length > 0) {
            throw new ApiError(httpStatus.BAD_REQUEST, "Some grades not found");
          }

          await prisma.studentGrades.deleteMany({
            where: { studentId: userId, gradeId: { in: deletedGrade } },
          });
        }

        // Student can only have one grade
        if (newGradeAssign.length > 1) {
          throw new ApiError(
            httpStatus.BAD_REQUEST,
            "Student can only assign one Grade."
          );
        }

        const alreadyAssigned = await prisma.studentGrades.count({
          where: { studentId: user.id },
        });

        if (alreadyAssigned > 0 && newGradeAssign.length) {
          throw new ApiError(
            httpStatus.BAD_REQUEST,
            "Student already has a Grade. Please remove it first."
          );
        }

        if (newGradeAssign.length === 1) {
          await prisma.studentGrades.create({
            data: { studentId: user.id, gradeId: newGradeAssign[0] },
          });
        }
        break;
      }

      case "Teacher": {
        // Validate deleted grades in one query
        if (deletedGrade.length) {
          const existingGrades = await prisma.teacherGrades.findMany({
            where: { gradeId: { in: deletedGrade }, teacherId: userId },
          });

          const existingIds = existingGrades.map((g) => g.gradeId);
          const missing = deletedGrade.filter((g) => !existingIds.includes(g));
          if (missing.length > 0) {
            throw new ApiError(httpStatus.BAD_REQUEST, "Some grades not found");
          }

          await prisma.teacherGrades.deleteMany({
            where: { teacherId: userId, gradeId: { in: deletedGrade } },
          });
        }

        // Insert multiple grades at once
        if (newGradeAssign.length) {
          await prisma.teacherGrades.createMany({
            data: newGradeAssign.map((grade) => ({
              teacherId: user.id,
              gradeId: grade,
            })),
          });
        }
        break;
      }

      default:
        break;
    }
  }

  // handle book category for teacher

  if (user.role === "Teacher" && payload.deletedBookCategoryIds) {
    await prisma.teachersBookCategories.deleteMany({
      where: {
        teacherId: user.id,
        categoryId: { in: payload.deletedBookCategoryIds },
      },
    });
  }

  if (user.role === "Teacher" && payload.newBookCategoryIds) {
    const getAllBookCategory = await prisma.teachersBookCategories.findMany({
      where: {
        teacherId: user.id,
        categoryId: { in: payload.newBookCategoryIds },
      },
    });
    const existingCategoryIds = getAllBookCategory.map((bc) => bc.categoryId);
    const newCategoryIds = payload.newBookCategoryIds.filter(
      (id) => !existingCategoryIds.includes(id)
    );
    const isNewCategoriesvalid = await prisma.bookCategory.findMany({
      where: { id: { in: newCategoryIds } },
    });
    if (isNewCategoriesvalid.length !== newCategoryIds.length) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Some book categories not found"
      );
    }
    if (newCategoryIds.length > 0) {
      await prisma.teachersBookCategories.createMany({
        data: newCategoryIds.map((categoryId) => ({
          teacherId: user.id,
          categoryId,
        })),
      });
    }
  }

  // handle book assignment for student
  if (user.role === "Student") {
    if (Array.isArray(payload.bookIds)) {
      const currentAssigned = await prisma.studentBooks.findMany({
        where: { studentId: user.id },
        select: { bookId: true },
      });
      const currentIds = currentAssigned.map((b) => b.bookId);
      const targetIds = payload.bookIds;

      const toDelete = currentIds.filter((id) => !targetIds.includes(id));
      const toAdd = targetIds.filter((id) => !currentIds.includes(id));

      if (toDelete.length > 0) {
        await prisma.studentBooks.deleteMany({
          where: {
            studentId: user.id,
            bookId: { in: toDelete },
          },
        });
      }
      if (toAdd.length > 0) {
        await prisma.studentBooks.createMany({
          data: toAdd.map((bookId) => ({
            studentId: user.id,
            bookId,
          })),
        });
      }
    } else {
      const deletedBook = payload.deletedBook || [];
      const newBookAssign = payload.newBookAssign || [];

      if (deletedBook.length > 0) {
        await prisma.studentBooks.deleteMany({
          where: {
            studentId: user.id,
            bookId: { in: deletedBook },
          },
        });
      }
      if (newBookAssign.length > 0) {
        const existing = await prisma.studentBooks.findMany({
          where: {
            studentId: user.id,
            bookId: { in: newBookAssign },
          },
          select: { bookId: true },
        });
        const existingIds = new Set(existing.map((e) => e.bookId));
        const filteredNew = newBookAssign.filter((id) => !existingIds.has(id));
        if (filteredNew.length > 0) {
          await prisma.studentBooks.createMany({
            data: filteredNew.map((bookId) => ({
              studentId: user.id,
              bookId,
            })),
          });
        }
      }
    }
  }

  return { message: "User updated successfully" };
};

const adminOverviewStatisticsData = async () => {
  const [
    totalSchool,
    totalTeacher,
    totalStudent,
    totalBooks,
    activeTeacher,
    inActiveTeacher,
  ] = await Promise.all([
    prisma.school.count(),
    prisma.user.count({ where: { role: "Teacher" } }),
    prisma.user.count({ where: { role: "Student" } }),
    prisma.books.count(),
    prisma.user.count({ where: { role: "Teacher", status: "Active" } }),
    prisma.user.count({ where: { role: "Teacher", status: "Inactive" } }),
  ]);

  return {
    totalSchool,
    totalTeacher,
    totalStudent,
    totalBooks,
    TeacherRingChert: {
      activeTeacher,
      inActiveTeacher,
    },
  };
};

const adminOverViewData = async (
  filter: "daily" | "weekly" | "monthly" | "yearly"
) => {
  const now = new Date();
  let interval;

  if (filter === "daily") {
    // Last 7 days ending today
    interval = {
      start: subDays(startOfDay(now), 6), // 6 days before today
      end: endOfDay(now),
    };
  } else if (filter === "weekly") {
    // Last 5 weeks ending current week
    const currentWeekStart = startOfWeek(now, { weekStartsOn: 0 });
    interval = {
      start: subWeeks(currentWeekStart, 4), // 4 weeks before current week
      end: endOfWeek(now, { weekStartsOn: 0 }),
    };
  } else if (filter === "monthly") {
    // Last 12 months ending current month
    const currentMonthStart = startOfMonth(now);
    interval = {
      start: subMonths(currentMonthStart, 11), // 11 months before current month
      end: endOfMonth(now),
    };
  } else if (filter === "yearly") {
    // Last 5 years ending current year (already correct)
    interval = {
      start: subYears(startOfYear(now), 4),
      end: endOfYear(now),
    };
  } else {
    throw new Error("Invalid filter");
  }

  // Fetch all students within interval
  const students = await prisma.user.findMany({
    where: {
      role: "Student",
      joinedAt: {
        gte: interval.start,
        lte: interval.end,
      },
    },
    select: {
      joinedAt: true,
    },
  });

  let chartData: { label: string; value: number }[] = [];

  if (filter === "daily") {
    const days = eachDayOfInterval(interval);
    chartData = days.map((day) => ({
      label: format(day, "EEE dd"),
      value: students.filter((s) => isSameDay(s.joinedAt, day)).length,
    }));
  } else if (filter === "weekly") {
    const weeks = eachWeekOfInterval(interval, { weekStartsOn: 0 });
    chartData = weeks.map((weekStart, i) => ({
      label: `Week ${i + 1}`,
      value: students.filter((s) =>
        isSameWeek(s.joinedAt, weekStart, { weekStartsOn: 0 })
      ).length,
    }));
  } else if (filter === "monthly") {
    const months = eachMonthOfInterval(interval);
    chartData = months.map((month) => ({
      label: format(month, "MMMM"),
      value: students.filter((s) => isSameMonth(s.joinedAt, month)).length,
    }));
  } else if (filter === "yearly") {
    const years = eachYearOfInterval(interval);
    chartData = years.map((year) => ({
      label: format(year, "yyyy"),
      value: students.filter((s) => isSameYear(s.joinedAt, year)).length,
    }));
  }

  return {
    filter,
    chartData,
  };
};

const getDownloadStudents = async (query: {
  school: boolean;
  grade: boolean;
}) => {
  const students = await prisma.user.findMany({
    where: { role: UserRole.Student },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      status: true,
      profileImage: true,
      DOB: true,
      StudentGrades: {
        select: {
          ...(query.grade && {
            grade: {
              select: {
                id: true,
                grade: true,
                TeacherGrades: true,
              },
            },
          }),
          ...(query.school && {
            School: {
              select: {
                id: true,
                name: true,
                location: true,
                schoolLogo: true,
              },
            },
          }),
        },
      },
    },
  });

  return students.map((student) => {
    const sg = student.StudentGrades?.[0] ?? null;
    const gradeData = sg?.grade ?? null;
    const schoolData = sg?.School ?? null;

    return {
      id: student.id,
      fullName: student.fullName,
      email: student.email,
      phone: student.phone,
      status: student.status,
      profileImage: student.profileImage,
      DOB: student.DOB,

      ...(query.grade &&
        gradeData && {
          grade: {
            id: gradeData.id,
            grade: gradeData.grade,
          },
        }),
      ...(query.school && schoolData ? { school: schoolData } : {}),
    };
  });
};

const getDownloadTeachers = async (query: {
  school: boolean;
  details: boolean;
}) => {
  const teachers = await prisma.teacherGrades.findMany({
    select: {
      teacher: {
        select: query.details
          ? {
              id: true,
              fullName: true,
              email: true,
              DOB: true,
              phone: true,
              status: true,
              profileImage: true,
            }
          : {
              id: true,
              fullName: true,
              email: true,
            },
      },
      ...(query.school && {
        School: {
          select: {
            id: true,
            name: true,
            location: true,
            schoolLogo: true,
          },
        },
      }),
    },
  });

  // flatten teacher and school to top level
  return teachers.map((tg) => ({
    ...(tg.teacher && { ...tg.teacher }),
    ...(query.school && tg.School ? { school: tg.School } : {}),
  }));
};

const createStudent = async (
  payload: CreateNewStudentType,
  file?: Express.Multer.File
) => {
  const { gradeId, schoolId, userName, email, password, bookIds, ...rest } = payload;

  const isAlreadyTakenUserName = await prisma.user.findFirst({
    where: {
      loginUserName: payload.userName,
    },
  });
  if (isAlreadyTakenUserName) {
    throw new ApiError(409, "User name already taken");
  }

  // parallel school + grade check
  const [school, grade] = await Promise.all([
    prisma.school.findUnique({ where: { id: schoolId } }),
    prisma.grades.findUnique({ where: { id: gradeId } }),
  ]);

  if (!school) throw new ApiError(404, "School not found");
  if (!grade) throw new ApiError(404, "Grade not found");

  const isAlreadyExist = await prisma.studentGrades.findFirst({
    where: {
      grade: { schoolId },
      student: { loginUserName: userName },
    },
  });
  if (isAlreadyExist) {
    throw new ApiError(409, "Student already exists in this school");
  }

  const profileImage = file
    ? (await uploadToDigitalOceanAWS(file)).Location
    : "https://i.ibb.co.com/nrs3FjM/images.png";

  // transaction
  const [user] = await prisma.$transaction([
    prisma.user.create({
      data: {
        fullName: payload.name, // only include fields that exist in User model
        email,
        password: payload.password,
        loginUserName: userName,
        role: UserRole.Student,
        profileImage,
      },
    }),
  ]);

  await prisma.studentGrades.create({
    data: {
      gradeId,
      studentId: user.id,
    },
  });

  let booksToAssign: string[] = [];
  if (Array.isArray(bookIds)) {
    booksToAssign = bookIds;
  } else {
    // If not explicitly provided, auto-assign all books belonging to the student's grade
    const gradeBooks = await prisma.gradeBooks.findMany({
      where: { gradeId },
      select: { bookId: true },
    });
    booksToAssign = Array.from(new Set(gradeBooks.map((gb) => gb.bookId)));
  }

  if (booksToAssign.length > 0) {
    await prisma.studentBooks.createMany({
      data: booksToAssign.map((bId) => ({
        studentId: user.id,
        bookId: bId,
      })),
    });
  }

  return user;
};

const createTeacher = async (
  payload: CreateNewTeacherType,
  file?: Express.Multer.File
) => {
  const {
    bookCategoryIds,
    gradeIds,
    schoolId,
    name,
    userName,
    email,
    password,
    ...rest
  } = payload;

  const isAlreadyTakenUserName = await prisma.user.findFirst({
    where: {
      loginUserName: payload.userName,
    },
  });
  if (isAlreadyTakenUserName) {
    throw new ApiError(409, "User name already taken");
  }
  // parallel school + grade check
  const [school, grades, bookCategories] = await Promise.all([
    prisma.school.findUnique({ where: { id: schoolId } }),
    prisma.grades.findMany({ where: { id: { in: gradeIds } } }),
    prisma.bookCategory.findMany({ where: { id: { in: bookCategoryIds } } }),
  ]);

  if (!school) throw new ApiError(404, "School not found");
  if (!grades || grades.length === 0)
    throw new ApiError(404, "Grades not found");
  if (bookCategories.length !== bookCategoryIds?.length) {
    throw new ApiError(404, "Some book categories not found");
  }

  const isAlreadyExist = await prisma.teacherGrades.findFirst({
    where: {
      grade: { schoolId },
      teacher: { loginUserName: userName },
    },
  });

  if (isAlreadyExist) {
    throw new ApiError(409, "Teacher already exists in this school");
  }

  const profileImage = file
    ? (await uploadToDigitalOceanAWS(file)).Location
    : "https://i.ibb.co/nrs3FjM/images.png";

  // create user (teacher)
  const user = await prisma.user.create({
    data: {
      fullName: name,
      email,
      password: password,
      loginUserName: userName,
      role: UserRole.Teacher,
      profileImage,
    },
  });

  // assign teacher to grades
  const teacherGradesData = gradeIds.map((gradeId) => ({
    gradeId,
    teacherId: user.id,
  }));

  await prisma.teacherGrades.createMany({
    data: teacherGradesData,
  });
  // assign teacher to book categories
  if (bookCategoryIds && bookCategoryIds.length > 0) {
    const teacherBookCategoriesData = bookCategoryIds.map((bookCategoryId) => ({
      categoryId: bookCategoryId,
      teacherId: user.id,
    }));

    await prisma.teachersBookCategories.createMany({
      data: teacherBookCategoriesData,
    });
  }
  return user;
};

// ------ bulk upload
// For students

const bulkUploadStudentIntoDB = async (payload: {
  schoolId: string;
  gradeId: string;
  numberOfStudent: number;
}) => {
  const [school, grade] = await Promise.all([
    prisma.school.findUnique({ where: { id: payload.schoolId } }),
    prisma.grades.findUnique({ where: { id: payload.gradeId } }),
  ]);

  if (!school) throw new ApiError(404, "School not found");
  if (!grade) throw new ApiError(404, "Grade not found");

  // Generate unique usernames/passwords
  const usernames = await generateUniqueStudentUserNames(
    payload.numberOfStudent
  );
  const users = usernames.map((loginUserName) => ({
    loginUserName,
    password: randomPassword(),
  }));

  // Perform bulk upload in batch (no N+1 loop)
  await bulkUploadStudent(users, payload.gradeId);

  return {
    message: `${payload.numberOfStudent} students created successfully`,
    students: users,
  };
};

// For teachers
const bulkUploadTeacherIntoDB = async (payload: {
  schoolId: string;
  gradeIds: string[];
  bookCategoryIds: string[];
  numberOfTeacher: number;
}) => {
  const [school, grades, bookCategories] = await Promise.all([
    prisma.school.findUnique({ where: { id: payload.schoolId } }),
    prisma.grades.findMany({ where: { id: { in: payload.gradeIds } } }),
    prisma.bookCategory.findMany({
      where: { id: { in: payload.bookCategoryIds } },
    }),
  ]);

  if (!school) throw new ApiError(404, "School not found");
  if (grades.length !== payload.gradeIds.length) {
    throw new ApiError(404, "Some grades not found");
  }
  if (bookCategories.length !== payload.bookCategoryIds.length) {
    throw new ApiError(404, "Some book categories not found");
  }

  // Generate unique usernames/passwords
  const usernames = await generateUniqueTeacherUserNames(
    payload.numberOfTeacher
  );
  const users = usernames.map((loginUserName) => ({
    loginUserName,
    password: randomPassword(),
  }));

  // Perform bulk upload in batch (no N+1 loop)
  await bulkUploadTeacher(users, payload.gradeIds, payload.bookCategoryIds);

  return {
    message: `${payload.numberOfTeacher} teachers created successfully`,
    teachers: users,
  };
};

const updateTeacherByAdminIntoDB = async (id: string, payload: any) => {
  return;
};
const updateStudentByAdminIntoDB = async (id: string, payload: any) => {
  return;
};

export const userService = {
  getUsers,
  getSingleUserIntoDB,
  updateUser,
  adminOverviewStatisticsData,
  deleteUser,
  getStudents,
  getTeachers,
  getDownloadTeachers,
  getDownloadStudents,
  createStudent,
  createTeacher,
  bulkUploadTeacherIntoDB,
  bulkUploadStudentIntoDB,
  updateTeacherByAdminIntoDB,
  updateStudentByAdminIntoDB,
  adminOverViewData,
  deleteStudentsByAdmin,
  deleteMultipleUsersByAdmin,
  deleteManualSignups,
};
