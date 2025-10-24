import { Worker } from "bullmq";
import { forgotPasswordHtml, otpHtml } from "../constant";
import redisClient from "../helpers/radis";
import sendEmail from "../helpers/sendEmail";

new Worker(
  "email",
  async (job) => {
    console.log('iam form email worker ')
    const { email, fullName, otp } = job.data;
    let subject = "";
    let html = "";

    if (job.name === "sendOtp") {
      subject = "Account verification";
      html = otpHtml(fullName, otp);
    } else if (job.name === "forgotPasswordOtp") {
      subject = "Your Password Reset OTP";
      html = forgotPasswordHtml(fullName, otp);
    } else {
      console.warn(`Unknown job name: ${job.name}`);
      return;
    }
    try {
      await sendEmail(email, subject, html);
      console.log(`✅ Email sent to ${email} for job: ${job.name}`);
    } catch (err) {
      console.error("Failed to send email:", err);
    }
  },
  { connection: redisClient }
);
