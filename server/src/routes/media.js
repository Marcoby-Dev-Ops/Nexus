const express = require('express');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Directory for generated media (ensure this exists and is writable)
const MEDIA_DIR = path.join(__dirname, '../../../media');

// Serve a file by filename
router.get('/:filename', (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(MEDIA_DIR, filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }
  res.sendFile(filePath);
});

// List all media files (optional, for debugging)
router.get('/', (req, res) => {
  fs.readdir(MEDIA_DIR, (err, files) => {
    if (err) return res.status(500).json({ error: 'Failed to list media files' });
    res.json({ files });
  });
});

module.exports = router;
