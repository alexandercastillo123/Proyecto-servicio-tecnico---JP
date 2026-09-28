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
        } else if (url.includes('chat') || url.includes('messages')) {
            category = 'chat';
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
    const url = req.originalUrl.toLowerCase();
    const isChat = url.includes('chat') || url.includes('messages');

    if (isChat) {
        // Chat allows images, audios, videos, documents
        const allowedExtensions = [
            '.jpg', '.jpeg', '.png', '.webp', '.gif',
            '.mp3', '.wav', '.m4a', '.aac', '.ogg', '.opus',
            '.mp4', '.mov', '.avi', '.mkv', '.webm',
            '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt', '.zip'
        ];
        const extension = path.extname(file.originalname).toLowerCase();
        if (
            allowedExtensions.includes(extension) || 
            file.mimetype.startsWith('image/') || 
            file.mimetype.startsWith('audio/') || 
            file.mimetype.startsWith('video/') || 
            file.mimetype.startsWith('application/')
        ) {
            return cb(null, true);
        }
        const error = new Error('Tipo de archivo no permitido en el chat');
        error.statusCode = 400;
        return cb(error, false);
    }

    // Default: Image only
    const isImageMime = file.mimetype.startsWith('image/');
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    const extension = path.extname(file.originalname).toLowerCase();
    const isImageExtension = allowedExtensions.includes(extension);

    if (isImageMime || isImageExtension) {
        cb(null, true);
    } else {
        const error = new Error('Solo se permiten imágenes (.jpg, .png, .webp)');
        error.statusCode = 400; // Sugerir status code
        cb(error, false);
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // Aumentado a 50MB para videos/audios/archivos
    fileFilter: fileFilter
});

/**
 * Obtiene la ruta relativa para guardar en la base de datos (sin el prefijo uploads/)
 */
upload.getRelativePath = (file) => {
    if (!file) return null;
    
    // Normalizar a barras hacia adelante para consistencia
    let normalizedPath = file.path.replace(/\\/g, '/');
    
    // Eliminar el prefijo de uploads si existe (con o sin barra final)
    const base = UPLOAD_BASE.replace(/\\/g, '/');
    if (normalizedPath.startsWith(base)) {
        normalizedPath = normalizedPath.substring(base.length);
    }
    
    // Asegurar que no empiece con barra inclinada
    if (normalizedPath.startsWith('/')) {
        normalizedPath = normalizedPath.substring(1);
    }
    
    return normalizedPath;
};

module.exports = upload;
