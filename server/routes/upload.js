const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticateToken } = require('../auth');
const { supabase, uploadToSupabaseStorage } = require('../supabase');

const STORAGE_BUCKET = 'posm-attachments';
const MAX_DIRECT_UPLOAD_BYTES = 25 * 1024 * 1024;
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'pdf'];

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

// POST /api/upload/sign
// Returns a one-time signed URL so the browser uploads the file straight to
// Supabase Storage. This bypasses Vercel's 4.5MB serverless request body limit.
router.post('/sign', authenticateToken, async (req, res) => {
  const { filename, size } = req.body || {};
  const ext = String(filename || '').split('.').pop().toLowerCase();

  if (!filename || !ALLOWED_EXTENSIONS.includes(ext)) {
    return res.status(400).json({ error: 'Only JPG, PNG, WEBP, GIF or PDF files can be uploaded' });
  }
  if (size && Number(size) > MAX_DIRECT_UPLOAD_BYTES) {
    return res.status(400).json({ error: 'File size exceeds the 25MB limit' });
  }

  const filePath = `uploads/${Date.now()}-${Math.round(Math.random() * 1e9)}.${ext}`;
  const { data, error } = await supabase.storage.from(STORAGE_BUCKET).createSignedUploadUrl(filePath);
  if (error) {
    return res.status(500).json({ error: `Could not prepare upload: ${error.message}` });
  }

  const { data: publicData } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath);

  res.json({
    upload_url: data.signedUrl,
    public_url: publicData.publicUrl,
    path: filePath
  });
});

// POST /api/upload (small files only on Vercel: request body limit is 4.5MB)
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
