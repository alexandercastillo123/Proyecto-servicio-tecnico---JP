/**
 * seed.js
 * Inserta fixtures mínimos para testear user.repository.
 * Mantener sincronizado con la suite; cada test puede usar estos IDs constantes.
 */
const { pool } = require('../../config/database');

const PASSWORD_HASH = '$2a$10$QrGI0wSUqALbQctiuGk5bu86FJDvZOHrFhLHrfLUEUh4Vr9pJ2b4e';

const seed = {
    admin: {
        email: 'admin@jyp.com',
        username: 'admin_jyp',
        passwordHash: PASSWORD_HASH,
        role: 'admin',
    },
    client: {
        email: 'cliente@test.com',
        username: 'cliente_test',
        passwordHash: PASSWORD_HASH,
        role: 'client',
    },
    tech: {
        email: 'tecnico@test.com',
        username: 'tecnico_test',
        passwordHash: PASSWORD_HASH,
        role: 'tech',
    },
    storeUser: {
        email: 'tienda@test.com',
        username: 'tienda_test',
        passwordHash: PASSWORD_HASH,
        role: 'store',
    },
};

async function clear() {
    await pool.query('SET FOREIGN_KEY_CHECKS = 0');
    for (const t of [
        'appointments',
        'user_device_tokens',
        'password_resets',
        'sucursales',
        'user_profiles',
        'users',
    ]) {
        await pool.query(`TRUNCATE TABLE \`${t}\``);
    }
    await pool.query('SET FOREIGN_KEY_CHECKS = 1');
}

async function insertUser(user) {
    const [result] = await pool.query(
        'INSERT INTO users (email, username, password_hash, role) VALUES (?, ?, ?, ?)',
        [user.email, user.username, user.passwordHash, user.role]
    );
    return result.insertId;
}

async function insertProfile(userId, fields) {
    const {
        phone, address, city, personType, names, surnames,
        dni, companyName, ruc, referenceAddress, description,
        rating, reviewsCount, isAvailable,
    } = fields;

    await pool.query(
        `INSERT INTO user_profiles
            (user_id, phone, address, city, person_type, names, surnames, dni,
             company_name, ruc, reference_address, description, rating,
             reviews_count, is_available)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            userId,
            phone || null,
            address || null,
            city || null,
            personType,
            names || null,
            surnames || null,
            dni || null,
            companyName || null,
            ruc || null,
            referenceAddress || null,
            description || null,
            rating ?? 0,
            reviewsCount ?? 0,
            isAvailable ?? true,
        ]
    );
}

async function run({ withProfiles = true, withTechAppointments = false } = {}) {
    await clear();

    const ids = {};
    ids.admin = await insertUser(seed.admin);
    ids.client = await insertUser(seed.client);
    ids.tech = await insertUser(seed.tech);
    ids.storeUser = await insertUser(seed.storeUser);

    if (withProfiles) {
        await insertProfile(ids.admin, {
            phone: '999111222',
            address: 'Oficina Central J&P',
            city: 'Lima',
            personType: 'natural',
            names: 'Administrador',
            surnames: 'J&P Systems',
            dni: '00000000',
        });

        await insertProfile(ids.client, {
            phone: '987654321',
            address: 'Av. Principal 123',
            city: 'Lima',
            personType: 'natural',
            names: 'Juan',
            surnames: 'Pérez',
            dni: '12345678',
        });

        await insertProfile(ids.tech, {
            phone: '999888777',
            address: 'Av. Tecnológica 100',
            city: 'Lima',
            personType: 'natural',
            names: 'María',
            surnames: 'García',
            dni: '87654321',
            referenceAddress: 'San Isidro',
            description: 'Reparación de laptops',
            rating: 4.8,
            reviewsCount: 124,
        });

        await insertProfile(ids.storeUser, {
            phone: '944555666',
            address: 'Av. Wilson 456',
            city: 'Lima',
            personType: 'juridical',
            companyName: 'Servicios Técnicos JP SAC',
            ruc: '20123456789',
        });

        // Sucursal para el user store (la usa findPublicById al hacer LEFT JOIN)
        await pool.query(
            `INSERT INTO sucursales
                (user_id, name, address, city, state, zip_code, country, phone, email)
             VALUES (?, 'Sucursal Test', 'Av. Test 100', 'Lima', 'Lima', '15001', 'Perú', '01-0000000', 'store@test.com')`,
            [ids.storeUser]
        );
    }

    if (withTechAppointments) {
        // Una cita activa futura para el técnico
        await pool.query(
            `INSERT INTO appointments
                (client_id, technician_id, scheduled_date, scheduled_time, status, description)
             VALUES (?, ?, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '10:00:00', 'confirmed', 'cita test')`,
            [ids.client, ids.tech]
        );
    }

    return ids;
}

module.exports = { run, clear, seed };