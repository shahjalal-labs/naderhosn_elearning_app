import prisma from "../../../shared/prisma";
import bcrypt from "bcryptjs";
import ApiError from "../../../errors/ApiErrors";
import { jwtHelpers } from "../../../helpers/jwtHelpers";
import config from "../../../config";
import { User, UserRole } from "@prisma/client";
import generateOTP from "../../../helpers/generateOtp";
import { uploadInSpace } from "../../../shared/UploadHelper";
import httpStatus from "http-status";
import sendEmail from "../../../helpers/sendEmail";
import {
  generateStudentUserName,
  generateTeacherUserName,
} from "../user/const";

const loginUserIntoDB = async (payload: {
  userName: string;
  password: string;
  fcmToken: string;
}) => {
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { loginUserName: payload.userName },
        { email: payload.userName },
      ],
    },
    include: {
      Teacher: {
        select: {
          gradeId: true,
        },
      },
    },
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.status === "Deleted") {
    throw new ApiError(
      400,
      "Your account already deleted, please contact Admin"
    );
  }

  const isPasswordValid = payload.password === user.password;

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid credentials");
  }

  await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      fcmToken: payload.fcmToken,
    },
  });
  const accessToken = jwtHelpers.generateToken(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
    },
    config.jwt.jwt_secret as string,
    config.jwt.expires_in as string
  );

  return {
    accessToken,
    id: user.id,
    role: user.role,
    gradeId: user?.Teacher?.[0]?.gradeId || null,
  };
};

const adminLogin = async (payload: {
  userName: string;
  password: string;
  fcmToken: string;
}) => {
  const user = await prisma.user.findUnique({
    where: {
      loginUserName: payload.userName,
      role: "Admin",
    },
  });

  if (!user) {
    throw new ApiError(404, "Admin not found");
  }

  if (user.status === "Deleted") {
    throw new ApiError(
      400,
      "Your account already deleted, please contact Admin"
    );
  }

  const isPasswordValid = await bcrypt.compare(
    payload.password,
    user?.password
  );
  
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid credentials");
  }

  await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      fcmToken: payload.fcmToken,
    },
  });

  const accessToken = jwtHelpers.generateToken(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
    },
    config.jwt.jwt_secret as string,
    config.jwt.expires_in as string
  );

  return {
    accessToken,
    id: user.id,
    role: user.role,
  };
};

const sendForgotPasswordOtpDB = async (payload: string) => {
  const existringUser = await prisma.user.findFirst({
    where: {
      OR: [{ email: payload }, { loginUserName: payload }],
    },
  });
  if (!existringUser) {
    throw new ApiError(404, "User not found");
  }

  if (existringUser.status === "Deleted") {
    throw new ApiError(
      400,
      "Your account already deleted, please contact Admin"
    );
  }
  if (!existringUser.email) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Please add email from setup profile"
    );
  }
  // Generate OTP and expiry time
  const otp = generateOTP(); // 4-digit OTP
  const OTP_EXPIRATION_TIME = 5 * 60 * 1000; // 5 minute
  const expiresAt = Date.now() + OTP_EXPIRATION_TIME;
  const subject = "Your Password Reset OTP";
  const html = `
  <div style="font-family: Arial, sans-serif; color: #333;">
    <h2>Password Reset Request</h2>
    <p>Hi <b>${existringUser.fullName}</b>,</p>
    <p>Your OTP for password reset is:</p>
    <h1 style="color: #007BFF;">${otp}</h1>
    <p>This OTP is valid for <b>5 minutes</b>. If you did not request this, please ignore this email.</p>
    <p>Thanks, <br>The Support Team</p>
  </div>
`;

  await prisma.otp.upsert({
    where: {
      email: existringUser.email,
    },
    update: { otpCode: otp, expiresAt: new Date(expiresAt) },
    create: {
      email: existringUser.email,
      otpCode: otp,
      expiresAt: new Date(expiresAt),
    },
  });
  
    await sendEmail(existringUser.email, subject, html);

  return otp;
};

const verifyForgotPasswordOtpCodeDB = async (payload: any) => {
  const { email, otp } = payload;

  if (!email && !otp) {
    throw new ApiError(400, "Email and OTP are required.");
  }

  const user = await prisma.user.findFirst({ where: { email: email } });
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const userId = user.id;

  const verifyData = await prisma.otp.findUnique({
    where: {
      email: email,
    },
  });

  if (!verifyData) {
    throw new ApiError(400, "Invalid or expired OTP.");
  }

  const { otpCode: savedOtp, expiresAt } = verifyData;

  if (otp !== savedOtp) {
    throw new ApiError(401, "Invalid OTP.");
  }

  if (Date.now() > expiresAt.getTime()) {
    await prisma.otp.delete({
      where: {
        email: email,
      },
    }); // OTP has expired
    throw new ApiError(410, "OTP has expired. Please request a new OTP.");
  }

  // OTP is valid
  await prisma.otp.delete({
    where: {
      email: email,
    },
  });

  const forgetToken = jwtHelpers.generateToken(
    { id: userId, email },
    config.jwt.jwt_secret as string,
    config.jwt.expires_in as string
  );

  return { forgetToken: forgetToken };
};

const resetForgotPasswordDB = async (newPassword: string, userId: string) => {
  const existingUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!existingUser) {
    throw new ApiError(404, "user not found");
  }
  const loginUserName = existingUser.loginUserName as string;
  const hashedPassword = await bcrypt.hash(
    newPassword,
    Number(config.jwt.gen_salt)
  );

  await prisma.user.update({
    where: {
      loginUserName: loginUserName,
    },
    data: {
      password: hashedPassword,
    },
  });
  return;
};

const getProfileFromDB = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
     include: {
      Teacher: {
        select: {
          gradeId:true
        }
      }
    }
  });
  if (!user) {
    throw new ApiError(404, "user not found!");
  }

  const { password, joinedAt, updatedAt, ...sanitizedUser } = user;

  return {
    ...sanitizedUser,
    gradeId: user?.Teacher[0]?.gradeId || null
  };
};

const updateProfileIntoDB = async (
  payload: User,
  userId: string,
  file: Express.Multer.File
) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new ApiError(404, "user not found for edit user");
  }

  if (user.status === "Deleted") {
    throw new ApiError(
      400,
      "Your account already deleted, please contact Admin"
    );
  }

  let profileImage;

  if (file) {
    profileImage = await uploadInSpace(file, "users/profileImage");
  }
 
  await prisma.user.update({
    where: { id: userId },
    data: {
      ...payload,
      profileImage: file ? profileImage : user.profileImage,
    },
  });
  return;
};

const changePassword = async (
  userId: string,
  payload: {
    oldPassword: string;
    newPassword: string;
  }
) => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  if (user.status === "Deleted") {
    throw new ApiError(
      400,
      "Your account already deleted, please contact Admin"
    );
  }
  const isPasswordValid = await bcrypt.compare(
    payload.oldPassword,
    user?.password
  );

  if (!isPasswordValid) {
    throw new ApiError(400, "Invalid Password");
  }
  const hashedPassword = bcrypt.hashSync(payload.newPassword, 10);
  await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      password: hashedPassword,
    },
  });
  const accessToken = jwtHelpers.generateToken(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      userName: user.fullName,
    },
    config.jwt.jwt_secret as string,
    config.jwt.expires_in as string
  );

  return {
    accessToken,
    id: user.id,
    role: user.role,
  };
};

// ONLY FOR APPLE SUBMISSION - Step 1: Submit data, upload profile image, generate OTP, store in PendingUser
const signupIntoPendingDB = async (
  payload: {
    fullName?: string;
    email: string;
    password: string;
    gender?: "Male" | "Female";
    DOB?: string | Date;
    phone?: string;
    role?: UserRole;
  },
  file?: Express.Multer.File
) => {
  if (!payload.email) {
    throw new ApiError(400, "Email is required");
  }
  if (!payload.password) {
    throw new ApiError(400, "Password is required");
  }

  // Check if user already exists in permanent User collection
  const existingUser = await prisma.user.findFirst({
    where: {
      email: payload.email,
    },
  });

  if (existingUser) {
    throw new ApiError(409, "User with this email already exists");
  }

  // Handle raw profile image file upload if provided
  let profileImage = "https://i.ibb.co.com/nrs3FjM/images.png";
  if (file) {
    profileImage = await uploadInSpace(file, "profile");
  }

  // Generate 4-digit OTP and 5-minute expiry
  const otp = generateOTP();
  const OTP_EXPIRATION_TIME = 5 * 60 * 1000;
  const expiresAt = new Date(Date.now() + OTP_EXPIRATION_TIME);

  const role: UserRole =
    payload.role === UserRole.Teacher ? UserRole.Teacher : UserRole.Student;

  // Upsert into pending_users table (Only for Apple Submission)
  await prisma.pendingUser.upsert({
    where: {
      email: payload.email,
    },
    update: {
      fullName: payload.fullName || null,
      password: payload.password,
      gender: payload.gender || null,
      DOB: payload.DOB ? new Date(payload.DOB) : null,
      phone: payload.phone || null,
      profileImage,
      role,
      otpCode: otp,
      expiresAt,
    },
    create: {
      fullName: payload.fullName || null,
      email: payload.email,
      password: payload.password,
      gender: payload.gender || null,
      DOB: payload.DOB ? new Date(payload.DOB) : null,
      phone: payload.phone || null,
      profileImage,
      role,
      otpCode: otp,
      expiresAt,
    },
  });

  // Send OTP email
  const subject = "Your Registration Verification OTP";
  const html = `
  <div style="font-family: Arial, sans-serif; color: #333;">
    <h2>Account Registration Verification</h2>
    <p>Hi <b>${payload.fullName || "User"}</b>,</p>
    <p>Your OTP code for completing registration is:</p>
    <h1 style="color: #007BFF;">${otp}</h1>
    <p>This OTP is valid for <b>5 minutes</b>. If you did not request this, please ignore this email.</p>
    <p>Thanks, <br>The Support Team</p>
  </div>
`;

  await sendEmail(payload.email, subject, html);

  return {
    email: payload.email,
  };
};

// ONLY FOR APPLE SUBMISSION - Step 2: Verify OTP, auto-generate username, create User, remove PendingUser
const verifySignupOtpDB = async (payload: { email: string; otp: string }) => {
  const { email, otp } = payload;

  if (!email || !otp) {
    throw new ApiError(400, "Email and OTP are required.");
  }

  const pendingUser = await prisma.pendingUser.findUnique({
    where: { email },
  });

  if (!pendingUser) {
    throw new ApiError(400, "No pending registration found for this email.");
  }

  if (Date.now() > pendingUser.expiresAt.getTime()) {
    await prisma.pendingUser.delete({ where: { email } });
    throw new ApiError(410, "OTP has expired. Please sign up again.");
  }

  if (otp !== pendingUser.otpCode) {
    throw new ApiError(401, "Invalid OTP.");
  }

  // Auto-generate unique loginUserName
  let userName = "";
  let isUnique = false;
  let attempts = 0;

  while (!isUnique && attempts < 10) {
    userName =
      pendingUser.role === UserRole.Teacher
        ? generateTeacherUserName()
        : generateStudentUserName();
    const existing = await prisma.user.findUnique({
      where: { loginUserName: userName },
    });
    if (!existing) {
      isUnique = true;
    }
    attempts++;
  }

  if (!isUnique) {
    userName = `${pendingUser.role === UserRole.Teacher ? "teach" : "s"}${Date.now().toString().slice(-6)}`;
  }

  // Create active User with plain password as requested and isManualSignup: true
  const newUser = await prisma.user.create({
    data: {
      loginUserName: userName,
      fullName: pendingUser.fullName,
      email: pendingUser.email,
      password: pendingUser.password,
      gender: pendingUser.gender,
      DOB: pendingUser.DOB,
      phone: pendingUser.phone,
      profileImage: pendingUser.profileImage,
      role: pendingUser.role,
      status: "Active",
      isManualSignup: true,
    },
  });

  // Clean up pending registration
  await prisma.pendingUser.delete({
    where: { email },
  });

  // Generate access token so the user can immediately use it
  const accessToken = jwtHelpers.generateToken(
    {
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
      fullName: newUser.fullName,
    },
    config.jwt.jwt_secret as string,
    config.jwt.expires_in as string
  );

  return {
    userName: newUser.loginUserName,
    email: newUser.email,
    fullName: newUser.fullName,
    role: newUser.role,
    accessToken,
  };
};

export const authService = {
  loginUserIntoDB,
  adminLogin,
  getProfileFromDB,
  updateProfileIntoDB,
  sendForgotPasswordOtpDB,
  verifyForgotPasswordOtpCodeDB,
  resetForgotPasswordDB,
  changePassword,
  signupIntoPendingDB,
  verifySignupOtpDB,
};
