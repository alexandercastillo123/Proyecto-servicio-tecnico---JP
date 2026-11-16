# Servicio Técnico J&P - Backend API

Backend REST API para la aplicación móvil de servicios técnicos desarrollado con Node.js, Express y MySQL.

## 🚀 Características

- **Autenticación JWT** - Sistema de autenticación seguro con tokens
- **Gestión de Usuarios** - Registro y perfiles para clientes y técnicos
- **Personas Naturales/Jurídicas** - Soporte para ambos tipos de personas
- **Búsqueda de Técnicos** - Filtrado por ubicación y calificación
- **Sistema de Citas** - Agendamiento de servicios técnicos
- **Chat con Ofertas** - Mensajería con sistema de ofertas económicas
- **Horarios de Atención** - Gestión de disponibilidad de técnicos

## 📋 Requisitos Previos

- Node.js >= 14.x
- MySQL >= 5.7
- npm o yarn

## 🔧 Instalación

1. **Clonar o navegar al directorio del backend**

```bash
cd "c:\Users\codecta10\Desktop\Proyecto servicio tecnico\backend"
```

2. **Instalar dependencias**

```bash
npm install
```

3. **Configurar variables de entorno**

Copiar el archivo `.env.example` a `.env` y configurar:

```bash
cp .env.example .env
```

Editar `.env` con tus configuraciones:

```env
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=servicio_tecnico_db
DB_PORT=3306

JWT_SECRET=tu-clave-secreta-muy-segura
JWT_EXPIRATION=7d
```

4. **Crear la base de datos**

Ejecutar el script SQL ubicado en `../base_de_datos/schema.sql`:

```bash
mysql -u root -p < "../base_de_datos/schema.sql"
```

## 🎯 Uso

### Modo Desarrollo (con auto-reload)

```bash
npm run dev
```

### Modo Producción

```bash
npm start
```

El servidor se iniciará en `http://localhost:3000`

## 📚 Endpoints API

### Autenticación

- `POST /api/auth/register` - Registrar nuevo usuario
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/forgot-password` - Solicitar código de recuperación
- `POST /api/auth/verify-code` - Verificar código
- `POST /api/auth/reset-password` - Restablecer contraseña

### Usuarios

- `GET /api/users/profile` - Obtener perfil (requiere auth)
- `PUT /api/users/profile` - Actualizar perfil (requiere auth)
- `POST /api/users/profile/photo` - Subir foto de perfil (requiere auth)
- `GET /api/users/:id` - Obtener perfil público

### Técnicos

- `GET /api/technicians` - Listar técnicos (con filtros)
- `GET /api/technicians/:id` - Obtener detalles de técnico
- `GET /api/technicians/:id/schedule` - Obtener horario
- `POST /api/technicians/schedule` - Crear/actualizar horario (solo técnicos)

### Citas

- `POST /api/appointments` - Crear cita (requiere auth)
- `GET /api/appointments` - Listar mis citas (requiere auth)
- `GET /api/appointments/:id` - Obtener detalles de cita (requiere auth)
- `PUT /api/appointments/:id/status` - Actualizar estado (requiere auth)
- `DELETE /api/appointments/:id` - Cancelar cita (requiere auth)

### Mensajes

- `GET /api/messages/conversations` - Listar conversaciones (requiere auth)
- `GET /api/messages/:userId` - Obtener mensajes con usuario (requiere auth)
- `POST /api/messages` - Enviar mensaje (requiere auth)
- `POST /api/messages/offer` - Enviar oferta de servicio (solo técnicos)
- `PUT /api/messages/offer/:id/accept` - Aceptar oferta (requiere auth)
- `PUT /api/messages/offer/:id/reject` - Rechazar oferta (requiere auth)
- `PUT /api/messages/offer/:id/cancel` - Cancelar oferta (requiere auth)

## 🔒 Autenticación

Todas las rutas protegidas requieren un token JWT en el header:

```
Authorization: Bearer <token>
```

El token se obtiene al hacer login o registro.

## 📁 Estructura del Proyecto

```
backend/
├── config/
│   └── database.js          # Configuración de MySQL
├── controllers/
│   ├── auth.controller.js
│   ├── users.controller.js
│   ├── technicians.controller.js
│   ├── appointments.controller.js
│   └── messages.controller.js
├── middleware/
│   ├── auth.js              # Autenticación JWT
│   ├── validation.js        # Validación de requests
│   └── errorHandler.js      # Manejo de errores
├── routes/
│   ├── auth.routes.js
│   ├── users.routes.js
│   ├── technicians.routes.js
│   ├── appointments.routes.js
│   └── messages.routes.js
├── utils/
│   ├── jwt.js               # Utilidades JWT
│   ├── validators.js        # Validadores personalizados
│   └── fileUpload.js        # Configuración multer
├── uploads/                 # Directorio de archivos subidos
├── .env.example            # Ejemplo de variables de entorno
├── .gitignore
├── package.json
└── server.js               # Punto de entrada
```

## 🤝 Integración con Flutter

En tu aplicación Flutter, configurar la URL base del API:

```dart
const String API_BASE_URL = 'http://localhost:3000/api';
// En producción usar la URL del servidor desplegado
```

Ejemplo de llamada con autenticación:

```dart
final response = await http.get(
  Uri.parse('$API_BASE_URL/users/profile'),
  headers: {
    'Authorization': 'Bearer $token',
    'Content-Type': 'application/json',
  },
);
```

## 🐛 Troubleshooting

### Error de conexión a la base de datos

Verificar que MySQL esté corriendo y las credenciales en `.env` sean correctas.

### Error "Port already in use"

El puerto 3000 está ocupado. Cambiar `PORT` en `.env` a otro valor.

### Errores de validación

Revisar que los datos enviados cumplan con los requisitos de cada endpoint.

## 📝 Licencia

ISC
