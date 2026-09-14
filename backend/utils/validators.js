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
 * Calculates char diversity and randomness (Gibberish Detection)
 * Refined to be less aggressive with real emails
 */
const isGibberish = (str) => {
    if (!str || str.length < 8) return false;

    // Check if it's mostly numbers (valid for many users)
    const digitCount = (str.match(/\d/g) || []).length;
    if (digitCount / str.length > 0.6) return false;

    const uniqueChars = new Set(str.toLowerCase().replace(/[^a-z]/g, '')).size;
    const ratio = uniqueChars / str.length;

    // Only reject if VERY long and with almost no repeating characters (unlikely for humans)
    return (str.length > 25 && ratio > 0.7);
};

/**
 * Validate email existence (Regex, MX records, and Refined Heuristic)
 * @param {String} email - Email to validate
 * @returns {Promise<Boolean>}
 */
const isValidEmail = async (email) => {
    try {
        // 1. Basic Regex
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(email)) return false;

        const [localPart, domain] = email.split('@');

        // 2. Gibberish Check (Only for extreme cases now)
        if (isGibberish(localPart)) {
            console.warn(`Extreme gibberish suspected: ${email}`);
            return false;
        }

        // 3. Domain specific rules
        const lowDomain = domain.toLowerCase();
        if (lowDomain === 'gmail.com' && localPart.length < 4) {
            // Gmail allows names like 'abc.d' (5 chars), but very rarely < 4
            return false;
        }

        // 4. Disposable check
        if (DISPOSABLE_DOMAINS.includes(lowDomain)) {
            return false;
        }

        // 5. DNS MX Check (The most reliable free way)
        const mxRecords = await dns.resolveMx(domain);
        if (!mxRecords || mxRecords.length === 0) {
            return false;
        }

        return true;
    } catch (error) {
        console.warn(`DNS check failed, falling back to basic format: ${error.message}`);
        return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
    }
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
