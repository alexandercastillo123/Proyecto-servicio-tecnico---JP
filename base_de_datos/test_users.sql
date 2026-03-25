-- Usuarios de prueba para Servicio Técnico J&P
-- Password para todos: 123456
-- Hash: $2a$10$QrGI0wSUqALbQctiuGk5bu86FJDvZOHrFhLHrfLUEUh4Vr9pJ2b4e

USE servicio_tecnico_db;

-- Limpiar datos existentes
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE store_orders;
TRUNCATE TABLE store_schedules;
TRUNCATE TABLE store_reviews;
TRUNCATE TABLE store_products;
TRUNCATE TABLE sucursales_citas;
TRUNCATE TABLE sucursales;
TRUNCATE TABLE reviews;
TRUNCATE TABLE chat_messages;
TRUNCATE TABLE appointments;
TRUNCATE TABLE technician_schedules;
TRUNCATE TABLE user_profiles;
TRUNCATE TABLE users;
SET FOREIGN_KEY_CHECKS = 1;

-- ===== USUARIO CLIENTE =====
INSERT INTO users (email, username, password_hash, role) VALUES 
('alekeycastillo1@gmail.com', 'cliente_juan', '$2a$10$QrGI0wSUqALbQctiuGk5bu86FJDvZOHrFhLHrfLUEUh4Vr9pJ2b4e', 'client');

SET @client_id = LAST_INSERT_ID();

INSERT INTO user_profiles (
    user_id, phone, person_type, names, surnames, dni, city, address
) VALUES (
    @client_id, '987654321', 'natural', 'Juan', 'Castillo', '12345678', 'Lima', 'Av. Principal 123'
);

-- ===== USUARIO TÉCNICO =====
INSERT INTO users (email, username, password_hash, role) VALUES 
('alekeycastillo2@gmail.com', 'tecnico_pedro', '$2a$10$QrGI0wSUqALbQctiuGk5bu86FJDvZOHrFhLHrfLUEUh4Vr9pJ2b4e', 'tech');

SET @tech_id = LAST_INSERT_ID();

INSERT INTO user_profiles (
    user_id, phone, person_type, names, surnames, dni, city, reference_address, rating, reviews_count
) VALUES (
    @tech_id, '999888777', 'natural', 'Pedro', 'Sánchez', '87654321', 'Lima', 'San Isidro', 4.5, 10
);

-- ===== USUARIO TIENDA (Sucursal) =====
INSERT INTO users (email, username, password_hash, role) VALUES 
('alekeycastillo3@gmail.com', 'tienda_central', '$2a$10$QrGI0wSUqALbQctiuGk5bu86FJDvZOHrFhLHrfLUEUh4Vr9pJ2b4e', 'store');

SET @store_user_id = LAST_INSERT_ID();

INSERT INTO user_profiles (
    user_id, phone, person_type, company_name, ruc, city, address
) VALUES (
    @store_user_id, '944555666', 'juridical', 'J&P Global Tech', '20123456789', 'Lima', 'Av. Wilson 456'
);

-- Inyectar la sucursal directamente (como pidió el usuario)
INSERT INTO sucursales (
    user_id, name, description, address, city, state, zip_code, country, 
    phone, email, whatsapp, image_url, latitude, longitude, rating, reviews_count, 
    specialties, opening_time, closing_time, open_days
) VALUES (
    @store_user_id,
    'Sucursal Central Wilson',
    'Especialistas en reparación de laptops y venta de repuestos originales.',
    'Av. Wilson 456, Cercado de Lima',
    'Lima',
    'Lima',
    '15001',
    'Perú',
    '01-4235678',
    'wilson@jp-serviciotecnico.com',
    '944555666',
    'uploads/stores/wilson_store.jpg',
    -12.0560,
    -77.0369,
    4.9,
    50,
    'Laptops, PC, Consolas',
    '09:00:00',
    '20:00:00',
    'Lunes - Sábado'
);

SET @sucursal_id = LAST_INSERT_ID();

-- Horarios de la sucursal
INSERT INTO store_schedules (sucursal_id, day_of_week, open_time, close_time, is_closed) VALUES
(@sucursal_id, 'Monday', '09:00:00', '20:00:00', FALSE),
(@sucursal_id, 'Tuesday', '09:00:00', '20:00:00', FALSE),
(@sucursal_id, 'Wednesday', '09:00:00', '20:00:00', FALSE),
(@sucursal_id, 'Thursday', '09:00:00', '20:00:00', FALSE),
(@sucursal_id, 'Friday', '09:00:00', '20:00:00', FALSE),
(@sucursal_id, 'Saturday', '09:00:00', '18:00:00', FALSE),
(@sucursal_id, 'Sunday', '00:00:00', '00:00:00', TRUE);

-- Algunos productos de prueba
INSERT INTO store_products (sucursal_id, name, description, price, image_url, category, brand) VALUES
(@sucursal_id, 'Memoria RAM 8GB DDR4', 'Kingston Fury 3200MHz', 150.00, 'uploads/products/ram_8gb.jpg', 'Repuestos', 'Kingston'),
(@sucursal_id, 'SSD 480GB Kingston', 'SSD A400 SATA 2.5', 180.00, 'uploads/products/ssd_480gb.jpg', 'Almacenamiento', 'Kingston'),
(@sucursal_id, 'Pantalla Laptop 15.6"', 'Panel LED Slim 30 pins', 250.00, 'uploads/products/pantalla_156.jpg', 'Repuestos', 'LG/Samsung');

-- ===== USUARIO ADMINISTRADOR GENERAL (JyP) =====
INSERT INTO users (email, username, password_hash, role) VALUES 
('admin@jyp.com', 'admin_jyp', '$2a$10$QrGI0wSUqALbQctiuGk5bu86FJDvZOHrFhLHrfLUEUh4Vr9pJ2b4e', 'admin');

SET @admin_id = LAST_INSERT_ID();

INSERT INTO user_profiles (
    user_id, phone, person_type, names, surnames, dni, city, address
) VALUES (
    @admin_id, '999111222', 'natural', 'Administrador', 'J&P Systems', '00000000', 'Lima', 'Oficina Central J&P'
);

SELECT '✅ Datos de prueba inyectados correctamente con ADMIN!' as resultado;
