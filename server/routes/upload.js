const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticateToken } = require('../auth');
const { uploadToSupabaseStorage } = require('../supabase');

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Memory storage for direct Supabase cloud upload
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

router.post('/', authenticateToken, upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    // Try uploading to Supabase Storage
    const publicUrl = await uploadToSupabaseStorage(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );

    return res.json({
      url: publicUrl,
      filename: req.file.originalname,
      size: req.file.size,
      storage: 'supabase'
    });
  } catch (err) {
    console.warn('Supabase storage upload failed, saving to local disk fallback:', err.message);

    // Fallback: save to local uploads directory
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const localFileName = uniqueSuffix + path.extname(req.file.originalname);
    const localFilePath = path.join(uploadDir, localFileName);

    fs.writeFileSync(localFilePath, req.file.buffer);

    return res.json({
      url: `/uploads/${localFileName}`,
      filename: req.file.originalname,
      size: req.file.size,
      storage: 'local'
    });
  }
});

module.exports = router;
