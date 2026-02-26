const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const processImages = async (req, res, next) => {
    // Handle both upload.array() (array) and upload.fields() (object) formats
    let allFiles = [];
    if (Array.isArray(req.files)) {
        allFiles = req.files;
    } else if (req.files && typeof req.files === 'object') {
        // upload.fields() returns { photos: [...], audio: [...] }
        allFiles = Object.values(req.files).flat();
    }

    if (allFiles.length === 0) {
        return next();
    }

    try {
        const uploadDir = path.join(__dirname, '..', process.env.UPLOAD_DIR || './uploads');

        // Ensure upload directory exists
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        // Separate images from audio files
        const imageFiles = allFiles.filter(f => f.mimetype.startsWith('image/'));
        const audioFiles = allFiles.filter(f => f.mimetype.startsWith('audio/'));

        // Process images with sharp
        const processedImages = [];
        await Promise.all(
            imageFiles.map(async (file) => {
                const filename = `${uuidv4()}.webp`;
                const filepath = path.join(uploadDir, filename);

                await sharp(file.buffer)
                    .resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })
                    .toFormat('webp')
                    .webp({ quality: 80 })
                    .toFile(filepath);

                processedImages.push({
                    filename: filename,
                    path: filepath,
                    mimetype: 'image/webp',
                    size: file.size,
                });
            })
        );

        // Save audio files directly (no processing)
        if (audioFiles.length > 0) {
            const audioFile = audioFiles[0]; // Only one audio per memory
            const ext = audioFile.mimetype.split('/')[1] === 'mpeg' ? 'mp3' : audioFile.mimetype.split('/')[1];
            const filename = `${uuidv4()}.${ext}`;
            const filepath = path.join(uploadDir, filename);
            fs.writeFileSync(filepath, audioFile.buffer);
            req.audioFile = { filename, path: filepath, mimetype: audioFile.mimetype };
        }

        // Replace req.files with processed image metadata only
        req.files = processedImages;
        next();
    } catch (err) {
        console.error('File processing error:', err);
        next(err);
    }
};

module.exports = processImages;
