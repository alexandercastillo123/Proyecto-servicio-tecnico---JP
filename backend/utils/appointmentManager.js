const db = require('../config/database');

/**
 * Automatically transitions appointments from 'active' to 'completed'
 * if they are past their scheduled date and time.
 * We'll use a 12-hour buffer after the scheduled time to be safe.
 */
const autoUpdateAppointments = async () => {
    try {
        console.log('[AppointmentManager] Checking for appointments to complete...');
        
        // Find appointments that are 'active' but past scheduled_date + scheduled_time
        // and haven't been updated in the last 12 hours (to avoid constant updates if needed)
        // More simply: status = 'active' AND (scheduled_date < CURDATE() OR (scheduled_date = CURDATE() AND scheduled_time < SUBTIME(CURTIME(), "12:00:00")))
        
        const query = `
            UPDATE appointments 
            SET status = 'completed' 
            WHERE status = 'active' 
              AND (
                scheduled_date < CURDATE() 
                OR (scheduled_date = CURDATE() AND scheduled_time < SUBTIME(CURTIME(), '12:00:00'))
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
 * Starts the interval task for appointment management
 * Runs every hour
 */
const startAppointmentAutomation = () => {
    // Run once on startup
    autoUpdateAppointments();
    
    // Interval: 1 hour (3600000 ms)
    setInterval(autoUpdateAppointments, 3600 * 1000);
};

module.exports = {
    startAppointmentAutomation
};
