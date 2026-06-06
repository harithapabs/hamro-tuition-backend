const USE_CLOUDINARY = !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);

let cloudinary;
function init() {
  if (USE_CLOUDINARY && !cloudinary) {
    cloudinary = require('cloudinary').v2;
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true
    });
  }
}

async function uploadFile(localPath, destPath, contentType) {
  if (USE_CLOUDINARY) {
    init();
    const folder = destPath.includes('/') ? destPath.substring(0, destPath.lastIndexOf('/')) : 'uploads';
    const publicId = destPath.includes('/') ? destPath.substring(destPath.lastIndexOf('/') + 1).replace(/\.[^.]+$/, '') : destPath.replace(/\.[^.]+$/, '');
    const result = await cloudinary.uploader.upload(localPath, {
      folder,
      public_id: publicId,
      resource_type: 'auto',
      overwrite: true
    });
    return result.secure_url;
  }
  return `/uploads/${destPath.split('/').pop()}`;
}

async function uploadBuffer(buffer, destPath, contentType) {
  if (USE_CLOUDINARY) {
    init();
    const folder = destPath.includes('/') ? destPath.substring(0, destPath.lastIndexOf('/')) : 'uploads';
    const publicId = destPath.includes('/') ? destPath.substring(destPath.lastIndexOf('/') + 1).replace(/\.[^.]+$/, '') : destPath.replace(/\.[^.]+$/, '');
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream({
        folder,
        public_id: publicId,
        resource_type: 'auto',
        overwrite: true
      }, (err, result) => {
        if (err) return reject(err);
        resolve(result.secure_url);
      });
      stream.end(buffer);
    });
  }
  return null;
}

async function getSignedUrl(destPath, expiresInMinutes = 60) {
  if (USE_CLOUDINARY) {
    init();
    return cloudinary.url(destPath, { secure: true, sign_url: true, type: 'authenticated' });
  }
  return `/uploads/${destPath.split('/').pop()}`;
}

async function deleteFile(publicId) {
  if (USE_CLOUDINARY) {
    init();
    try { await cloudinary.uploader.destroy(publicId); } catch {}
  } else {
    const fs = require('fs');
    const path = require('path');
    try {
      fs.unlinkSync(path.join(__dirname, '..', 'uploads', publicId.split('/').pop()));
    } catch {}
  }
}

module.exports = { uploadFile, uploadBuffer, getSignedUrl, deleteFile, USE_CLOUDINARY };
