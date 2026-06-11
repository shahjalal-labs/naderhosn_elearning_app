// import "./helpers/cron";
import express, { Application, NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import cors from "cors";
import router from "./app/routes";
import GlobalErrorHandler from "./app/middlewares/globalErrorHandler";
import { PrismaClient } from "@prisma/client";
import path from "path";
import { bullBoardRouter } from "./bullBoard";
import basicAuth from "express-basic-auth"
import { deleteData,  privacyPolicy,  userDelete } from "./helpers/userDelete";

const app: Application = express();
const prisma = new PrismaClient();

(async () => {
  try {
    await prisma.$connect();
    console.log("✅ Database connected successfully!");
  } catch (error) {
    console.error("Failed to connect to services:", error);
    process.exit(1); // exit app if connection fails
  }
})();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));
app.use("/public", express.static(path.join(__dirname, "..", "public")));

app.get("/", (req: Request, res: Response) => {
  res.send({
    Message: "🫡 Hellow there !  Thanks for reaching out to the E-Learning Backend",
  });
});

// Test page route - redirect to the public HTML page
app.get("/test-books", (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});
app.use(
  "/admin/queues",
  basicAuth({
    users: { admin: "supersecret" },
    challenge: true,
  }),
  bullBoardRouter
);
app.get("/delete-account", (req, res) => {
  res.send(userDelete());
});
app.get("/delete-data", (req, res) => {
  res.send(deleteData());
});
app.get("/privacy-policy", (req, res) => {
  res.send(privacyPolicy());
});

app.use("/api/v1", router);
app.use(GlobalErrorHandler);

app.use((req: Request, res: Response, next: NextFunction) => {
  res.status(httpStatus.NOT_FOUND).json({
    success: false,
    message: "API NOT FOUND!",
    error: {
      path: req.originalUrl,
      message: "© Your requested path is not found!",
    },
  });
});

export default app;
