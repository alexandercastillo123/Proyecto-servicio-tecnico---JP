/**
 * Normaliza la ruta de una imagen para evitar prefijos duplicados y asegurar la carga correcta.
 * @param {string} path - La ruta guardada en la base de datos (ej. "products/img.jpg" o "uploads/products/img.jpg")
 * @returns {string} - La URL final normalizada empezando con /uploads/
 */
export const getImageUrl = (path) => {
    if (!path) return null;
    
    // Normalizar barras
    let cleanPath = path.replace(/\\/g, '/');
    
    // Eliminar el prefijo "uploads/" si ya viene incluido en la ruta de la BD
    if (cleanPath.startsWith('uploads/')) {
        cleanPath = cleanPath.substring(8);
    }
    
    // Eliminar barra inicial si existe
    if (cleanPath.startsWith('/')) {
        cleanPath = cleanPath.substring(1);
    }
    
    // Devolver con el prefijo correcto
    return `/uploads/${cleanPath}`;
};
