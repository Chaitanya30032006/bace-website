const fs = require('fs');

// Magic byte signatures for allowed image types
const MAGIC_BYTES = {
  'image/jpeg': [Buffer.from([0xFF, 0xD8, 0xFF])],
  'image/png': [Buffer.from([0x89, 0x50, 0x4E, 0x47])],
  'image/gif': [Buffer.from([0x47, 0x49, 0x46, 0x38])],
  'image/webp': [Buffer.from('RIFF'), Buffer.from('WEBP')]
};

function checkMagicBytes(buffer) {
  // JPEG
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return 'image/jpeg';
  }
  // PNG
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
    return 'image/png';
  }
  // GIF
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) {
    return 'image/gif';
  }
  // WEBP (RIFF....WEBP)
  if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
      buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50) {
    return 'image/webp';
  }
  return null;
}

/**
 * Middleware to validate uploaded file magic bytes after multer processes it.
 * Use AFTER multer middleware in the route chain.
 */
function validateImageMagicBytes(req, res, next) {
  const files = req.files || (req.file ? [req.file] : []);

  for (const file of files) {
    try {
      const buffer = fs.readFileSync(file.path, { length: 12 });
      // Read first 12 bytes
      const fd = fs.openSync(file.path, 'r');
      const headerBuf = Buffer.alloc(12);
      fs.readSync(fd, headerBuf, 0, 12, 0);
      fs.closeSync(fd);

      const detectedType = checkMagicBytes(headerBuf);
      if (!detectedType) {
        // Remove the suspicious file
        fs.unlinkSync(file.path);
        return res.status(400).json({
          message: 'Invalid file: the file content does not match a supported image format (JPEG, PNG, GIF, WEBP).'
        });
      }
    } catch (err) {
      if (file.path && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      return res.status(400).json({ message: 'File validation failed', error: err.message });
    }
  }

  next();
}

module.exports = { validateImageMagicBytes, checkMagicBytes };
