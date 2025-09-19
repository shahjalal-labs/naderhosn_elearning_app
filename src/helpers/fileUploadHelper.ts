import multer from "multer";

const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: { fileSize: 3000 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/avif",
      "video/mp4",
      "video/x-matroska",
      "application/pdf",
    ];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(new Error("File type not allowed") as unknown as null, false);
    }
    cb(null, true);
  },
});

// upload single image
const profileImage = upload.single("profileImage");
const coverPhoto = upload.single("coverPhoto");
const experienceFile = upload.single("experienceFile");
const uploadSingle = upload.single("file");
const uploadSchoolLogo = upload.single("schoolLogo");

// upload multiple image
const uploadMultiple = upload.fields([
  { name: "profileImage", maxCount: 1 },
  { name: "mediaUrl", maxCount: 1 },
  { name: "documentUrls", maxCount: 5 },
]);
const uploadBooks = upload.fields([
  { name: "coverImage", maxCount: 1 },
  { name: "bookPdf", maxCount: 1 },
]);

export const fileUploader = {
  upload,
  uploadMultiple,
  profileImage,
  coverPhoto,
  uploadSingle,
  experienceFile,
  uploadSchoolLogo,
  uploadBooks
};
