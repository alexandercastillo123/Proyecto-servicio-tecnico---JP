DROP DATABASE IF EXISTS servicio_tecnico_db;
CREATE DATABASE IF NOT EXISTS servicio_tecnico_db;
USE servicio_tecnico_db;

-- 1. Usuarios (Autenticación)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('client', 'tech', 'store', 'admin') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Perfiles de Usuario (Información Personal/Corporativa)
CREATE TABLE IF NOT EXISTS user_profiles (
    user_id INT PRIMARY KEY,
    phone VARCHAR(20),
    profile_image_url VARCHAR(255),
    address TEXT,
    city VARCHAR(100),
    person_type ENUM('natural', 'juridical') NOT NULL,
    names VARCHAR(100),        -- Para persona natural
    surnames VARCHAR(100),     -- Para persona natural
    dni VARCHAR(20) UNIQUE,    -- Para persona natural
    company_name VARCHAR(255), -- Para persona jurídica
    ruc VARCHAR(20) UNIQUE,    -- Para persona jurídica
    reference_address TEXT,    -- Para técnicos
    description TEXT,          -- Bio/Descripción del técnico o empresa
    rating DECIMAL(2,1) DEFAULT 0,
    reviews_count INT DEFAULT 0,
    latitude DECIMAL(10, 8) DEFAULT NULL,  -- Coordenadas del técnico (geocodificadas)
    longitude DECIMAL(11, 8) DEFAULT NULL, -- Permite valores del -180 al 180
    is_available BOOLEAN DEFAULT TRUE,     -- Técnico activo/inactivo (aparece en radar de búsqueda)
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. Sucursales
CREATE TABLE IF NOT EXISTS sucursales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,   
    name VARCHAR(255) NOT NULL,
    description TEXT,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    zip_code VARCHAR(20) NOT NULL,
    country VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255) NOT NULL,
    whatsapp VARCHAR(20),
    website_url VARCHAR(255),
    image_url VARCHAR(255),
    latitude DECIMAL(10, 8) DEFAULT NULL,
    longitude DECIMAL(11, 8) DEFAULT NULL,
    rating DECIMAL(2,1) DEFAULT 0,
    reviews_count INT DEFAULT 0,
    specialties TEXT,
    social_media JSON,
    opening_time TIME,
    closing_time TIME,
    open_days VARCHAR(100),
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 4. Productos de Tiendas (Sucursales)
CREATE TABLE IF NOT EXISTS store_products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sucursal_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    image_url VARCHAR(255),
    category VARCHAR(100),
    brand VARCHAR(100),
    sku VARCHAR(50),
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sucursal_id) REFERENCES sucursales(id) ON DELETE CASCADE
);

-- 5. Pedidos de Tiendas
CREATE TABLE IF NOT EXISTS store_orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT NOT NULL,
    sucursal_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT DEFAULT 1,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    status ENUM('pending', 'confirmed', 'shipped', 'delivered', 'completed', 'cancelled') DEFAULT 'pending',
    delivery_address TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES users(id),
    FOREIGN KEY (sucursal_id) REFERENCES sucursales(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES store_products(id) ON DELETE CASCADE
);

-- 6. Horarios de Técnicos
CREATE TABLE IF NOT EXISTS technician_schedules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    technician_id INT NOT NULL,
    day_of_week ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday') NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (technician_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 7. Citas / Servicios
CREATE TABLE IF NOT EXISTS appointments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT NOT NULL,
    technician_id INT NOT NULL,
    scheduled_date DATE NOT NULL,
    scheduled_time TIME NOT NULL,
    description TEXT,
    status ENUM('pending', 'confirmed', 'completed', 'cancelled', 'cancellation_pending', 'expired') DEFAULT 'pending',
    cancelled_by INT DEFAULT NULL,
    price DECIMAL(10, 2) DEFAULT NULL,
    payment_method ENUM('yape', 'plin', 'transfer', 'cash') DEFAULT NULL,
    payment_status ENUM('pending', 'waiting_confirmation', 'paid') DEFAULT 'pending',
    payment_confirmed_at TIMESTAMP NULL DEFAULT NULL,
    service_type ENUM('local', 'domicilio') DEFAULT 'local',
    service_lat DECIMAL(10, 7) DEFAULT NULL,
    service_lng DECIMAL(10, 7) DEFAULT NULL,
    service_address TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES users(id),
    FOREIGN KEY (technician_id) REFERENCES users(id),
    FOREIGN KEY (cancelled_by) REFERENCES users(id)
);

-- 8. Chat y Ofertas
CREATE TABLE IF NOT EXISTS chat_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sender_id INT NOT NULL,
    receiver_id INT NOT NULL,
    appointment_id INT DEFAULT NULL,
    message_text TEXT,
    message_type ENUM('text', 'offer', 'appointment', 'order') DEFAULT 'text',
    offer_price DECIMAL(10, 2),
    offer_status ENUM('pending', 'accepted', 'rejected', 'cancelled') DEFAULT 'pending',
    order_id INT DEFAULT NULL,
    cancelled_by INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_read BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (sender_id) REFERENCES users(id),
    FOREIGN KEY (receiver_id) REFERENCES users(id),
    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL,
    FOREIGN KEY (order_id) REFERENCES store_orders(id) ON DELETE SET NULL,
    FOREIGN KEY (cancelled_by) REFERENCES users(id)
);

-- 9. Reseñas / Reviews
CREATE TABLE IF NOT EXISTS reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    appointment_id INT DEFAULT NULL,
    client_id INT NOT NULL,
    technician_id INT NOT NULL,
    rating TINYINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL,
    FOREIGN KEY (client_id) REFERENCES users(id),
    FOREIGN KEY (technician_id) REFERENCES users(id)
);

-- 10. Citas en Sucursales
CREATE TABLE IF NOT EXISTS sucursales_citas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sucursal_id INT NOT NULL,
    cita_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sucursal_id) REFERENCES sucursales(id) ON DELETE CASCADE,
    FOREIGN KEY (cita_id) REFERENCES appointments(id) ON DELETE CASCADE
);

-- 11. Reseñas de Tiendas
CREATE TABLE IF NOT EXISTS store_reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sucursal_id INT NOT NULL,
    client_id INT NOT NULL,
    rating TINYINT CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sucursal_id) REFERENCES sucursales(id) ON DELETE CASCADE,
    FOREIGN KEY (client_id) REFERENCES users(id)
);

-- 12. Horarios Detallados de Tiendas
CREATE TABLE IF NOT EXISTS store_schedules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sucursal_id INT NOT NULL,
    day_of_week ENUM('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'),
    open_time TIME,
    close_time TIME,
    is_closed BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (sucursal_id) REFERENCES sucursales(id) ON DELETE CASCADE
);

-- 13. Password Resets
CREATE TABLE IF NOT EXISTS password_resets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    code VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para optimización
CREATE INDEX idx_user_profiles_available ON user_profiles(is_available);
CREATE INDEX idx_sucursales_status ON sucursales(status);
CREATE INDEX idx_sucursales_location ON sucursales(latitude, longitude);