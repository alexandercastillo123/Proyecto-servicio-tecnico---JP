/**
 * appointmentManager.js
 * Background automation tasks for appointment lifecycle management.
 * Delegates all DB access to appointment.repository.js and notification.repository.js
 */
const appointmentRepo = require('../repository/appointment.repository');
const notificationRepo = require('../repository/notification.repository');

const autoUpdateAppointments = async () => {
    try {
        const affected = await appointmentRepo.expireOldAppointments();
        if (affected > 0) {
            console.log(`[AppointmentManager] Auto-expired ${affected} appointments.`);
        }
    } catch (error) {
        console.error('[AppointmentManager] Error in autoUpdateAppointments:', error.message);
    }
};

const sendReminders = async () => {
    try {
        const upcoming = await appointmentRepo.findUpcomingForReminder();
        for (const appt of upcoming) {
            await appointmentRepo.insertReminderNotification(
                appt.technician_id,
                'Recordatorio de Cita',
                `Tienes una cita con ${appt.client_name} a las ${appt.scheduled_time} (ID: ${appt.id}). ¡Prepárate!`
            );
            await appointmentRepo.insertReminderNotification(
                appt.client_id,
                'Recordatorio de Cita',
                `Tu cita con el técnico ${appt.tech_name} es en 30 minutos (${appt.scheduled_time}).`
            );
        }
    } catch (error) {
        console.error('[AppointmentManager] Error in sendReminders:', error.message);
    }
};

const cleanupExpiredResets = async () => {
    try {
        const affected = await notificationRepo.deleteExpiredResets();
        if (affected > 0) {
            console.log(`[AppointmentManager] Cleaned up ${affected} expired password resets.`);
        }
    } catch (error) {
        console.error('[AppointmentManager] Error in cleanupExpiredResets:', error.message);
    }
};

const startAppointmentAutomation = () => {
    autoUpdateAppointments();
    sendReminders();
    cleanupExpiredResets();

    setInterval(autoUpdateAppointments, 3600 * 1000);       // Every 1 hour
    setInterval(sendReminders, 15 * 60 * 1000);             // Every 15 minutes
    setInterval(cleanupExpiredResets, 24 * 3600 * 1000);    // Every 24 hours
};

module.exports = { startAppointmentAutomation };
