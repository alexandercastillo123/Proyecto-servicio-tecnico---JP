/**
 * Validate DNI format (8 digits)
 * @param {String} dni - DNI to validate
 * @returns {Boolean}
 */
const isValidDNI = (dni) => {
    return /^\d{8}$/.test(dni);
};

/**
 * Validate RUC format (11 digits, starts with 10 or 20)
 * @param {String} ruc - RUC to validate
 * @returns {Boolean}
 */
const isValidRUC = (ruc) => {
    return /^(10|20)\d{9}$/.test(ruc);
};

/**
 * Validate email format
 * @param {String} email - Email to validate
 * @returns {Boolean}
 */
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Validate phone format (Peru)
 * @param {String} phone - Phone number to validate
 * @returns {Boolean}
 */
const isValidPhone = (phone) => {
    return /^(\+51)?9\d{8}$/.test(phone.replace(/\s/g, ''));
};

module.exports = {
    isValidDNI,
    isValidRUC,
    isValidEmail,
    isValidPhone
};
