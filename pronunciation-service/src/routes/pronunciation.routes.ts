import { Router } from 'express';
import controller from '../controllers/pronunciation.controller';
import multer from 'multer';


const router = Router();

router.post('/evaluate', controller.evaluate);

const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'));
    }
  }
});

router.post(
  '/evaluate-audio',
  upload.single('audio'),
  controller.evaluateAudio
);

export default router;
