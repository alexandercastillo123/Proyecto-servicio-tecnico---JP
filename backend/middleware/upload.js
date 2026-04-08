const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Carpeta base de subidas desde variable de entorno
const UPLOAD_BASE = process.env.UPLOAD_DIR || 'uploads/';

// Asegurar que los directorios existan
const createDir = (dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
};

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let category = 'others';
        
        const url = req.originalUrl.toLowerCase();
        if (url.includes('products')) {
            category = 'products';
        } else if (url.includes('sucursales') || url.includes('stores')) {
            category = 'stores';
        } else if (url.includes('users') || url.includes('photo') || url.includes('avatar')) {
            category = 'avatars';
        } else if (url.includes('tech')) {
            category = 'technicians';
        }

        const dest = path.join(UPLOAD_BASE, category, '/');
        createDir(dest);
        cb(null, dest);
    },
    filename: (req, file, cb) => {
        // Nombre de archivo limpio: timestamp-random.ext
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Solo se permiten imágenes'), false);
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // Aumentado a 10MB para premium photos
    fileFilter: fileFilter
});

/**
 * Obtiene la ruta relativa para guardar en la base de datos (sin el prefijo uploads/)
 */
upload.getRelativePath = (file) => {
    if (!file) return null;
    // req.file.path suele ser "uploads/category/filename.ext" o "uploads\category\filename.ext"
    // Queremos "category/filename.ext"
    const normalizedPath = file.path.replace(/\\/g, '/');
    return normalizedPath.replace(`${UPLOAD_BASE}`, '');
};

module.exports = upload;
