import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { authenticate } from '../middlewares/auth.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse, ApiError } from '../utils/apiResponse.js';

const router = Router();

// In production: use Cloudinary or S3. For now: disk storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp|gif/;
  const ext = allowed.test(path.extname(file.originalname).toLowerCase());
  const mime = allowed.test(file.mimetype);
  if (ext && mime) cb(null, true);
  else cb(new ApiError('Only images allowed', 400));
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter,
});

router.post('/image', authenticate, upload.single('image'), asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('No file uploaded');

  // In production, upload to Cloudinary here and return URL
  const url = `/uploads/${req.file.filename}`;
  ApiResponse.success(res, { url }, 'Image uploaded');
}));

router.post('/images', authenticate, upload.array('images', 10), asyncHandler(async (req, res) => {
  if (!req.files?.length) throw ApiError.badRequest('No files uploaded');
  const urls = req.files.map(f => `/uploads/${f.filename}`);
  ApiResponse.success(res, { urls }, 'Images uploaded');
}));

export default router;
