-- Usuarios de prueba para Servicio Técnico J&P
-- Password para todos: 123456
-- Hash generado: $2a$10$s0joOQIXR/ZdFWqzYzgTgO7XZiaSyS.armTWRxXhKXkHcgYkW1BHm

USE servicio_tecnico_db;

-- Limpiar datos existentes si es necesario
-- DELETE FROM chat_messages;
-- DELETE FROM appointments;
-- DELETE FROM technician_schedules;
-- DELETE FROM user_profiles;
-- DELETE FROM users;

-- ===== USUARIO CLIENTE (Persona Natural) =====
-- Email: cliente@test.com
-- Password: 123456
INSERT INTO users (email, password_hash, role) VALUES 
('cliente@test.com', '123456', 'client');

SET @client_id = LAST_INSERT_ID();

INSERT INTO user_profiles (
    user_id, phone, person_type, names, surnames, dni, city, address
) VALUES (
    @client_id,
    '987654321',
    'natural',
    'Juan Carlos',
    'Pérez López',
    '12345678',
    'Lima',
    'Av. Principal 123, Miraflores'
);

-- ===== USUARIO TÉCNICO (Persona Natural) =====
-- Email: tecnico@test.com
-- Password: 123456
INSERT INTO users (email, password_hash, role) VALUES 
('tecnico@test.com', '654321', 'tech');

SET @tech_id = LAST_INSERT_ID();

INSERT INTO user_profiles (
    user_id, phone, person_type, names, surnames, dni, city, 
    reference_address, rating, reviews_count
) VALUES (
    @tech_id,
    '999888777',
    'natural',
    'María Elena',
    'García Rodríguez',
    '87654321',
    'Lima',
    'San Isidro - Zona céntrica',
    4.8,
    124
);

-- Horario del técnico
INSERT INTO technician_schedules (technician_id, day_of_week, start_time, end_time, is_active) VALUES
(@tech_id, 'Monday', '09:00:00', '18:00:00', TRUE),
(@tech_id, 'Tuesday', '09:00:00', '18:00:00', TRUE),
(@tech_id, 'Wednesday', '09:00:00', '18:00:00', TRUE),
(@tech_id, 'Thursday', '09:00:00', '18:00:00', TRUE),
(@tech_id, 'Friday', '09:00:00', '18:00:00', TRUE),
(@tech_id, 'Saturday', '10:00:00', '14:00:00', TRUE);

-- ===== USUARIO TÉCNICO EMPRESA (Persona Jurídica) =====
-- Email: empresa@test.com
-- Password: 123456
INSERT INTO users (email, password_hash, role) VALUES 
('empresa@test.com', '134679', 'tech');

SET @empresa_id = LAST_INSERT_ID();

INSERT INTO user_profiles (
    user_id, phone, person_type, company_name, ruc, city,
    reference_address, rating, reviews_count
) VALUES (
    @empresa_id,
    '944555666',
    'juridical',
    'Servicios Técnicos JP SAC',
    '20123456789',
    'Lima',
    'Lima Norte - Independencia',
    4.9,
    203
);

-- Horario de la empresa
INSERT INTO technician_schedules (technician_id, day_of_week, start_time, end_time, is_active) VALUES
(@empresa_id, 'Monday', '08:00:00', '20:00:00', TRUE),
(@empresa_id, 'Tuesday', '08:00:00', '20:00:00', TRUE),
(@empresa_id, 'Wednesday', '08:00:00', '20:00:00', TRUE),
(@empresa_id, 'Thursday', '08:00:00', '20:00:00', TRUE),
(@empresa_id, 'Friday', '08:00:00', '20:00:00', TRUE),
(@empresa_id, 'Saturday', '09:00:00', '17:00:00', TRUE),
(@empresa_id, 'Sunday', '09:00:00', '13:00:00', TRUE);

-- Verificar insertions
SELECT '✅ Usuarios de prueba creados exitosamente!' as resultado;
SELECT 'USUARIOS:' as seccion;
SELECT id, email, role FROM users;
SELECT '' as separador;
SELECT 'PERFILES:' as seccion;
SELECT user_id, person_type, names, surnames, company_name, city FROM user_profiles;
