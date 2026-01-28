DROP DATABASE IF EXISTS servicio_tecnico_db;
CREATE DATABASE IF NOT EXISTS servicio_tecnico_db;
USE servicio_tecnico_db;

-- 1. Usuarios (Autenticación)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('client', 'tech') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Perfiles (Detalles extendidos)
-- Se agregaron restricciones de unicidad para DNI y RUC y campos de dirección fiscal.
CREATE TABLE IF NOT EXISTS user_profiles (
    user_id INT PRIMARY KEY,
    phone VARCHAR(20),
    profile_image_url VARCHAR(255),
    address TEXT, -- Dirección física/fiscal general
    city VARCHAR(100),
    
    -- Tipo de Persona
    person_type ENUM('natural', 'juridical') NOT NULL,
    
    -- Campos Persona Natural (Client o Tech)
    names VARCHAR(100),
    surnames VARCHAR(100),
    dni VARCHAR(20) UNIQUE,
    
    -- Campos Persona Jurídica (Empresa)
    company_name VARCHAR(150),
    ruc VARCHAR(20) UNIQUE,
    
    -- Atributos específicos del Técnico
    reference_address VARCHAR(255),
    rating DECIMAL(3, 2) DEFAULT 0.00,
    reviews_count INT DEFAULT 0,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. Horarios del Técnico
-- Cambiado VARCHAR por ENUM para evitar errores de escritura y facilitar filtros.
CREATE TABLE IF NOT EXISTS technician_schedules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    technician_id INT NOT NULL,
    day_of_week ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday') NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (technician_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 4. Citas / Servicios
CREATE TABLE IF NOT EXISTS appointments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT NOT NULL,
    technician_id INT NOT NULL,
    scheduled_date DATE NOT NULL,
    scheduled_time TIME NOT NULL,
    description TEXT,
    status ENUM('pending', 'confirmed', 'completed', 'cancelled') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES users(id),
    FOREIGN KEY (technician_id) REFERENCES users(id)
);

-- 5. Chat y Ofertas
-- Se añadió 'appointment_id' para vincular una oferta económica a una cita específica.
CREATE TABLE IF NOT EXISTS chat_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sender_id INT NOT NULL,
    receiver_id INT NOT NULL,
    appointment_id INT DEFAULT NULL, -- Relación opcional si el mensaje es una oferta para una cita
    message_text TEXT,
    message_type ENUM('text', 'offer') DEFAULT 'text',
    offer_price DECIMAL(10, 2),
    offer_status ENUM('pending', 'accepted', 'rejected', 'cancelled') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_read BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (sender_id) REFERENCES users(id),
    FOREIGN KEY (receiver_id) REFERENCES users(id),
    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL
);

-- 6. Reseñas / Reviews
CREATE TABLE IF NOT EXISTS reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    appointment_id INT NOT NULL,
    client_id INT NOT NULL,
    technician_id INT NOT NULL,
    rating TINYINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
    FOREIGN KEY (client_id) REFERENCES users(id),
    FOREIGN KEY (technician_id) REFERENCES users(id)
);

-- 7. Actualizar tipos de mensaje para incluir citas
ALTER TABLE chat_messages MODIFY COLUMN message_type ENUM('text', 'offer', 'appointment') DEFAULT 'text';
