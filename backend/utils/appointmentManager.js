const db = require('../config/database');

/**
 * Automatically transitions appointments from 'active' to 'completed'
 * if they are past their scheduled date and time.
 * We'll use a 12-hour buffer after the scheduled time to be safe.
 */
const autoUpdateAppointments = async () => {
    try {
        console.log('[AppointmentManager] Checking for appointments to complete...');
        
        // Find appointments that are 'pending' or 'confirmed' but past scheduled_date + scheduled_time
        // We set them to 'expired' to match the controller logic.
        
        const query = `
            UPDATE appointments 
            SET status = 'expired' 
            WHERE status IN ('pending', 'confirmed') 
              AND (
                scheduled_date < CURDATE() 
                OR (scheduled_date = CURDATE() AND scheduled_time < CURTIME())
              )
        `;
        
        const result = await db.ejecutar(query);
        if (result.resultado.affectedRows > 0) {
            console.log(`[AppointmentManager] Auto-completed ${result.resultado.affectedRows} appointments.`);
        }
    } catch (error) {
        console.error('[AppointmentManager] Error in autoUpdateAppointments:', error);
    }
};

/**
 * Sends reminders for appointments starting in the next 30 minutes
 */
const sendReminders = async () => {
    try {
        console.log('[AppointmentManager] Checking for upcoming appointments (Reminders)...');
        
        const query = `
            SELECT a.id, a.client_id, a.technician_id, a.scheduled_time, 
                   up_c.names as client_name, up_t.names as tech_name
            FROM appointments a
            JOIN user_profiles up_c ON a.client_id = up_c.user_id
            JOIN user_profiles up_t ON a.technician_id = up_t.user_id
            JOIN notification_settings ns_t ON a.technician_id = ns_t.user_id
            WHERE a.status = 'confirmed' 
              AND a.scheduled_date = CURDATE()
              AND a.scheduled_time BETWEEN CURTIME() AND ADDTIME(CURTIME(), '00:30:00')
              AND ns_t.appointment_reminders = TRUE
              AND NOT EXISTS (
                  SELECT 1 FROM notifications n 
                  WHERE n.user_id = a.technician_id 
                    AND n.type = 'reminder' 
                    AND n.message LIKE CONCAT('%', a.id, '%')
                    AND n.created_at > DATE_SUB(NOW(), INTERVAL 12 HOUR)
              )
        `;
        
        const [upcoming] = await db.pool.query(query);
        
        for (const appt of upcoming) {
            // Notify Technician
            await db.ejecutar(
                'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
                [
                    appt.technician_id, 
                    'Recordatorio de Cita', 
                    `Tienes una cita con ${appt.client_name} a las ${appt.scheduled_time} (ID: ${appt.id}). ¡Prepárate!`,
                    'reminder'
                ]
            );
            
            // Notify Client
            await db.ejecutar(
                'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
                [
                    appt.client_id, 
                    'Recordatorio de Cita', 
                    `Tu cita con el técnico ${appt.tech_name} es en 30 minutos (${appt.scheduled_time}).`,
                    'reminder'
                ]
            );
        }
    } catch (error) {
        console.error('[AppointmentManager] Error in sendReminders:', error);
    }
};

/**
 * Cleanup expired password reset codes
 */
const cleanupExpiredResets = async () => {
    try {
        const result = await db.ejecutar('DELETE FROM password_resets WHERE expires_at < NOW()');
        if (result.resultado.affectedRows > 0) {
            console.log(`[AppointmentManager] Cleaned up ${result.resultado.affectedRows} expired password resets.`);
        }
    } catch (error) {
        console.error('[AppointmentManager] Error in cleanupExpiredResets:', error);
    }
};

/**
 * Starts the interval task for appointment management and maintenance
 */
const startAppointmentAutomation = () => {
    // Run once on startup
    autoUpdateAppointments();
    sendReminders();
    cleanupExpiredResets();
    
    // Interval for updates: 1 hour
    setInterval(autoUpdateAppointments, 3600 * 1000);
    
    // Interval for reminders: every 15 minutes
    setInterval(sendReminders, 15 * 60 * 1000);

    // Interval for maintenance: every 24 hours
    setInterval(cleanupExpiredResets, 24 * 3600 * 1000);
};

module.exports = {
    startAppointmentAutomation
};
