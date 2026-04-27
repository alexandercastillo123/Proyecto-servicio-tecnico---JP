const db = require('./config/database');

async function testCancel() {
    try {
        const id = 1; // Assuming there is an appointment with ID 1
        const userId = 1; // Assuming user ID 1
        
        console.log('Testing cancel query logic...');
        
        const initialRes = await db.listar(
            'SELECT a.*, u.role FROM appointments a JOIN users u ON a.technician_id = u.id WHERE a.id = ?',
            false,
            [id]
        );
        
        if (!initialRes.exito) {
            console.error('Initial Select Error:', initialRes.mensaje);
            return;
        }
        
        console.log('Initial Select Result:', initialRes.resultado);
        
        if (initialRes.resultado) {
            const appointment = initialRes.resultado;
            let newStatus = 'cancelled';
            // ... logic ...
            
            const dbRes = await db.ejecutar(
                `UPDATE appointments SET status = ?, cancelled_by = ?
                 WHERE id = ? AND (client_id = ? OR technician_id = ?)`,
                [newStatus, userId, id, userId, userId]
            );
            
            if (!dbRes.exito) {
                console.error('Update Error:', dbRes.mensaje);
            } else {
                console.log('Update Success:', dbRes.resultado);
            }
        } else {
            console.log('No appointment found with ID', id);
        }
        
        process.exit(0);
    } catch (err) {
        console.error('Test Error:', err);
        process.exit(1);
    }
}

testCancel();
