const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const processImages = async (req, res, next) => {
    if (!req.files || req.files.length === 0) {
        return next();
    }

    try {
        const processedFiles = [];
        const uploadDir = path.join(__dirname, '..', process.env.UPLOAD_DIR || './uploads');

        // Ensure upload directory exists
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        await Promise.all(
            req.files.map(async (file) => {
                const filename = `${uuidv4()}.webp`;
                const filepath = path.join(uploadDir, filename);

                await sharp(file.buffer)
                    .resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })
                    .toFormat('webp')
                    .webp({ quality: 80 })
                    .toFile(filepath);

                processedFiles.push({
                    filename: filename,
                    path: filepath,
                    mimetype: 'image/webp',
                    size: file.size // Approximate
                });
            })
        );

        // Replace req.files with the newly written file metadata
        req.files = processedFiles;
        next();
    } catch (err) {
        console.error('Image processing error:', err);
        next(err);
    }
};

module.exports = processImages;
