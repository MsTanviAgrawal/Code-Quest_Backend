import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ensure upload directories
const baseDir = path.join(__dirname, '../uploads/public');
const imgDir = path.join(baseDir, 'images');
const vidDir = path.join(baseDir, 'videos');
[baseDir, imgDir, vidDir].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const isImage = file.mimetype.startsWith('image/');
    const isVideo = file.mimetype.startsWith('video/');
    if (isImage) return cb(null, imgDir);
    if (isVideo) return cb(null, vidDir);
    return cb(new Error('Only image or video files are allowed!'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${file.mimetype.startsWith('image/') ? 'img' : 'media'}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedImages = /jpeg|jpg|png|gif|webp/;
  const allowedVideos = /mp4|avi|mov|wmv|flv|mkv|webm/;
  const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
  const isImage = allowedImages.test(ext) && file.mimetype.startsWith('image/');
  const isVideo = allowedVideos.test(ext) && file.mimetype.startsWith('video/');
  if (isImage || isVideo) return cb(null, true);
  cb(new Error('Unsupported file type'));
};

const mediaUpload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
  fileFilter
});

export default mediaUpload;
