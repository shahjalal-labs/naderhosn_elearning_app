import prisma from "../../../shared/prisma";
import bcrypt from "bcryptjs";
import ApiError from "../../../errors/ApiErrors";
import { jwtHelpers } from "../../../helpers/jwtHelpers";
import config from "../../../config";
import { User } from "@prisma/client";
import generateOTP from "../../../helpers/generateOtp";
import { uploadInSpace } from "../../../shared/UploadHelper";
import { emailQueue } from "../../../queue/email.queue";
import httpStatus from "http-status";
import sendEmail from "../../../helpers/sendEmail";

const loginUserIntoDB = async (payload: {
  userName: string;
  password: string;
  fcmToken: string;
}) => {
  const user = await prisma.user.findUnique({
    where: {
      loginUserName: payload.userName,
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
  await emailQueue.add("forgotPasswordOtp", {
    email: existringUser.email,
    fullName: existringUser?.fullName,
    otp,
  });
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
  });
  if (!user) {
    throw new ApiError(404, "user not found!");
  }

  const { password, joinedAt, updatedAt, ...sanitizedUser } = user;

  return sanitizedUser;
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

export const authService = {
  loginUserIntoDB,
  adminLogin,
  getProfileFromDB,
  updateProfileIntoDB,
  sendForgotPasswordOtpDB,
  verifyForgotPasswordOtpCodeDB,
  resetForgotPasswordDB,
  changePassword,
};
