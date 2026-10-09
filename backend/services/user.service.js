/**
 * user.service.js
 * Single Responsibility: User profile business logic.
 * Delegates all DB access to user.repository.js
 */
const userRepo = require('../repository/user.repository');
const AppError = require('../utils/AppError');

const getProfile = async (userId) => {
    const user = await userRepo.findById(userId);
    if (!user) throw new AppError('Usuario no encontrado.', 404);
    return user;
};

const getUserById = async (userId) => {
    const user = await userRepo.findPublicById(userId);
    if (!user) throw new AppError('Usuario no encontrado.', 404);
    return user;
};

const updateProfile = async (userId, fields) => {
    const { username } = fields;
    if (username) {
        if (await userRepo.usernameExists(username, userId)) {
            throw new AppError('El nombre de usuario ya está en uso por otra persona.', 409);
        }
        await userRepo.updateUsername(userId, username);
    }
    await userRepo.updateProfile(userId, fields);
};

const updateProfileImage = async (userId, imageUrl) => {
    await userRepo.updateProfileImage(userId, imageUrl);
};

const toggleAvailability = async (userId, isAvailable) => {
    if (!isAvailable && await userRepo.hasActiveAppointments(userId)) {
        throw new AppError(
            'No puedes desactivar tu cuenta mientras tengas citas activas. Finaliza o cancela tus servicios pendientes primero.',
            400
        );
    }
    await userRepo.updateAvailability(userId, isAvailable);
};

module.exports = { getProfile, getUserById, updateProfile, updateProfileImage, toggleAvailability };
