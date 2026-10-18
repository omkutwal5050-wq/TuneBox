const cloudinary = require('cloudinary').v2;
const multer = require('multer');

// Configure Cloudinary with your credentials from .env
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = {
  _handleFile(req, file, callback) {
    const folder = file.mimetype.startsWith('image/')
      ? 'tunebox/covers'
      : 'tunebox/songs';
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'auto',
        allowed_formats: ['jpg', 'png', 'jpeg', 'mp3', 'wav', 'm4a'],
      },
      (error, result) => {
        if (error) return callback(error);
        callback(null, {
          path: result.secure_url,
          size: result.bytes,
          filename: result.public_id,
        });
      }
    );

    file.stream.on('error', callback);
    file.stream.pipe(uploadStream);
  },

  _removeFile(req, file, callback) {
    cloudinary.uploader.destroy(file.filename, { invalidate: true }, callback);
  },
};

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (req, file, callback) => {
    const allowed = file.fieldname === 'audio'
      ? /^audio\//.test(file.mimetype)
      : /^image\//.test(file.mimetype);
    callback(allowed ? null : new Error('Unsupported media type'), allowed);
  },
});

module.exports = { cloudinary, upload };