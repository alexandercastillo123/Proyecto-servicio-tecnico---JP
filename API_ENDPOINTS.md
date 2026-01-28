# API Endpoints - Servicio Técnico J&P

## 📡 Base URL

```
http://localhost:3000/api
```

Para emulador Android: `http://10.0.2.2:3000/api`

---

## 🔐 Autenticación (Authentication)

### 1. Registrar Usuario
**POST** `/auth/register`

**Body:**
```json
{
  "email": "cliente@example.com",
  "password": "123456",
  "role": "client",  // "client" o "tech"
  "personType": "natural",  // "natural" o "juridical"
  "names": "Juan",  // Si es persona natural
  "surnames": "Pérez",  // Si es persona natural
  "dni": "12345678",  // Si es persona natural
  "companyName": "Mi Empresa SAC",  // Si es persona jurídica
  "ruc": "20123456789",  // Si es persona jurídica
  "phone": "987654321",
  "city": "Lima",
  "referenceAddress": "Av. Principal 123"  // Solo para técnicos
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "userId": 1,
    "email": "cliente@example.com",
    "role": "client",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### 2. Iniciar Sesión
**POST** `/auth/login`

**Body:**
```json
{
  "email": "cliente@example.com",
  "password": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "userId": 1,
    "email": "cliente@example.com",
    "role": "client",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### 3. Olvidé Mi Contraseña
**POST** `/auth/forgot-password`

**Body:**
```json
{
  "email": "cliente@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Verification code sent to email",
  "devCode": "123456"  // Solo para desarrollo
}
```

---

### 4. Verificar Código
**POST** `/auth/verify-code`

**Body:**
```json
{
  "email": "cliente@example.com",
  "code": "123456"
}
```

---

### 5. Restablecer Contraseña
**POST** `/auth/reset-password`

**Body:**
```json
{
  "email": "cliente@example.com",
  "code": "123456",
  "newPassword": "newpassword123"
}
```

---

## 👤 Usuarios (Users)

### 6. Obtener Mi Perfil
**GET** `/users/profile`

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "cliente@example.com",
    "role": "client",
    "phone": "987654321",
    "profile_image_url": "/uploads/1_123456.jpg",
    "address": "Av. Principal 123",
    "city": "Lima",
    "person_type": "natural",
    "names": "Juan",
    "surnames": "Pérez",
    "dni": "12345678",
    "company_name": null,
    "ruc": null,
    "rating": 0.00,
    "reviews_count": 0
  }
}
```

---

### 7. Actualizar Perfil
**PUT** `/users/profile`

**Headers:**
```
Authorization: Bearer {token}
```

**Body:**
```json
{
  "phone": "999888777",
  "address": "Nueva dirección",
  "city": "Lima"
}
```

---

### 8. Subir Foto de Perfil
**POST** `/users/profile/photo`

**Headers:**
```
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Body:**
```
photo: [archivo de imagen]
```

---

### 9. Obtener Usuario por ID
**GET** `/users/:id`

**Ejemplo:** `GET /users/5`

---

## 🔧 Técnicos (Technicians)

### 10. Listar Técnicos
**GET** `/technicians`

**Query Params (opcionales):**
- `city` - Filtrar por ciudad
- `minRating` - Calificación mínima
- `page` - Número de página (default: 1)
- `limit` - Resultados por página (default: 10)

**Ejemplo:** `GET /technicians?city=Lima&minRating=4.5&page=1&limit=10`

**Response:**
```json
{
  "success": true,
  "data": {
    "technicians": [
      {
        "id": 2,
        "email": "tecnico@example.com",
        "phone": "987654321",
        "profile_image_url": "/uploads/2_123456.jpg",
        "address": "Av. Técnicos 456",
        "city": "Lima",
        "person_type": "natural",
        "names": "Carlos",
        "surnames": "Rodríguez",
        "dni": "87654321",
        "reference_address": "Zona Lima Norte",
        "rating": 4.8,
        "reviews_count": 124
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 5,
      "totalPages": 1
    }
  }
}
```

---

### 11. Obtener Técnico por ID
**GET** `/technicians/:id`

**Ejemplo:** `GET /technicians/2`

**Response:** Incluye datos del técnico + horarios

```json
{
  "success": true,
  "data": {
    "id": 2,
    "names": "Carlos",
    "surnames": "Rodríguez",
    "rating": 4.8,
    "reviews_count": 124,
    "schedule": [
      {
        "id": 1,
        "day_of_week": "Monday",
        "start_time": "09:00:00",
        "end_time": "18:00:00",
        "is_active": true
      }
    ]
  }
}
```

---

### 12. Obtener Horario de Técnico
**GET** `/technicians/:id/schedule`

**Ejemplo:** `GET /technicians/2/schedule`

---

### 13. Crear/Actualizar Mi Horario (Solo Técnicos)
**POST** `/technicians/schedule`

**Headers:**
```
Authorization: Bearer {token}
```

**Body:**
```json
{
  "schedules": [
    {
      "dayOfWeek": "Monday",
      "startTime": "09:00",
      "endTime": "18:00",
      "isActive": true
    },
    {
      "dayOfWeek": "Tuesday",
      "startTime": "09:00",
      "endTime": "18:00",
      "isActive": true
    }
  ]
}
```

---

### 14. Actualizar Entrada de Horario (Solo Técnicos)
**PUT** `/technicians/schedule/:id`

**Headers:**
```
Authorization: Bearer {token}
```

---

## 📅 Citas (Appointments)

### 15. Crear Cita
**POST** `/appointments`

**Headers:**
```
Authorization: Bearer {token}
```

**Body:**
```json
{
  "technicianId": 2,
  "scheduledDate": "2024-02-15",
  "scheduledTime": "10:00",
  "description": "Reparación de laptop"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Appointment created successfully",
  "data": {
    "appointmentId": 1
  }
}
```

---

### 16. Listar Mis Citas
**GET** `/appointments`

**Headers:**
```
Authorization: Bearer {token}
```

**Query Params (opcionales):**
- `status` - Filtrar por estado: pending, confirmed, completed, cancelled

**Ejemplo:** `GET /appointments?status=pending`

---

### 17. Obtener Cita por ID
**GET** `/appointments/:id`

**Headers:**
```
Authorization: Bearer {token}
```

**Ejemplo:** `GET /appointments/1`

---

### 18. Actualizar Estado de Cita
**PUT** `/appointments/:id/status`

**Headers:**
```
Authorization: Bearer {token}
```

**Body:**
```json
{
  "status": "confirmed"  // pending, confirmed, completed, cancelled
}
```

---

### 19. Cancelar Cita
**DELETE** `/appointments/:id`

**Headers:**
```
Authorization: Bearer {token}
```

---

## 💬 Mensajes (Messages)

### 20. Listar Conversaciones
**GET** `/messages/conversations`

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "other_user_id": 2,
      "email": "tecnico@example.com",
      "names": "Carlos",
      "surnames": "Rodríguez",
      "profile_image_url": "/uploads/2_123456.jpg",
      "last_message_time": "2024-01-22T14:30:00.000Z",
      "unread_count": 3
    }
  ]
}
```

---

### 21. Obtener Mensajes con Usuario
**GET** `/messages/:userId`

**Headers:**
```
Authorization: Bearer {token}
```

**Ejemplo:** `GET /messages/2`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "sender_id": 1,
      "receiver_id": 2,
      "message_text": "Hola, necesito ayuda",
      "message_type": "text",
      "offer_price": null,
      "offer_status": null,
      "created_at": "2024-01-22T14:25:00.000Z",
      "is_read": true,
      "appointment_id": null
    },
    {
      "id": 2,
      "sender_id": 2,
      "receiver_id": 1,
      "message_text": "Tarifa de servicio: S/.40.00",
      "message_type": "offer",
      "offer_price": 40.00,
      "offer_status": "pending",
      "created_at": "2024-01-22T14:30:00.000Z",
      "is_read": false,
      "appointment_id": 1
    }
  ]
}
```

---

### 22. Enviar Mensaje
**POST** `/messages`

**Headers:**
```
Authorization: Bearer {token}
```

**Body:**
```json
{
  "receiverId": 2,
  "messageText": "Hola, necesito ayuda",
  "appointmentId": 1  // Opcional
}
```

---

### 23. Enviar Oferta de Servicio (Solo Técnicos)
**POST** `/messages/offer`

**Headers:**
```
Authorization: Bearer {token}
```

**Body:**
```json
{
  "receiverId": 1,
  "offerPrice": 40.00,
  "messageText": "Oferta de instalación",  // Opcional
  "appointmentId": 1  // Opcional
}
```

---

### 24. Aceptar Oferta
**PUT** `/messages/offer/:id/accept`

**Headers:**
```
Authorization: Bearer {token}
```

**Ejemplo:** `PUT /messages/offer/2/accept`

---

### 25. Rechazar Oferta
**PUT** `/messages/offer/:id/reject`

**Headers:**
```
Authorization: Bearer {token}
```

**Ejemplo:** `PUT /messages/offer/2/reject`

---

### 26. Cancelar Oferta (Solo quien envió)
**PUT** `/messages/offer/:id/cancel`

**Headers:**
```
Authorization: Bearer {token}
```

**Ejemplo:** `PUT /messages/offer/2/cancel`

---

### 27. Marcar Mensaje como Leído
**PUT** `/messages/:id/read`

**Headers:**
```
Authorization: Bearer {token}
```

**Ejemplo:** `PUT /messages/1/read`

---

## ❤️ Health Check

### 28. Verificar Estado del Servidor
**GET** `/health` (sin /api en la URL)

**URL:** `http://localhost:3000/health`

**Response:**
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2024-01-22T14:30:00.000Z"
}
```

---

## 📝 Notas Importantes

### Autenticación
- Todos los endpoints protegidos requieren el header: `Authorization: Bearer {token}`
- El token se obtiene al hacer login o registro
- Guardar el token en `shared_preferences` o similar

### Cambiar URL Base
En `api_constants.dart`:
```dart
// Para emulador Android
static const String baseUrl = 'http://10.0.2.2:3000/api';

// Para dispositivo físico (reemplazar X con tu IP local)
static const String baseUrl = 'http://192.168.1.X:3000/api';

// Para producción
static const String baseUrl = 'https://tu-servidor.com/api';
```

### Estados de Citas
- `pending` - Pendiente
- `confirmed` - Confirmada
- `completed` - Completada
- `cancelled` - Cancelada

### Estados de Ofertas
- `pending` - Pendiente
- `accepted` - Aceptada
- `rejected` - Rechazada
- `cancelled` - Cancelada

---

## 🔗 Enlaces Útiles

- **[Backend README](file:///c:/Users/codecta10/Desktop/Proyecto%20servicio%20tecnico/backend/README.md)** - Documentación completa del backend
- **[Walkthrough](file:///C:/Users/codecta10/.gemini/antigravity/brain/9271a072-03fe-4d90-a349-2f14c425b365/walkthrough.md)** - Guía de integración Flutter
- **[API Constants](file:///c:/Users/codecta10/Desktop/Proyecto%20servicio%20tecnico/servicio_tecnico/lib/core/constants/api_constants.dart)** - Constantes de endpoints en Flutter
