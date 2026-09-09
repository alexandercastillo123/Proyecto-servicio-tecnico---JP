# Proyecto de Servicio Técnico - App & Backend

Este proyecto es una plataforma integral para la gestión de servicios técnicos, permitiendo la interacción entre clientes y técnicos especializados.

## 🚀 Características Principales

- **Gestión de Citas**: Sistema de agendamiento y cancelación sincronizado en tiempo real.
- **Chat Integrado**: Comunicación directa entre clientes y técnicos con soporte para ofertas y estados de citas.
- **Sistema de Reseñas**: Calificaciones dinámicas y comentarios para técnicos.
- **Perfiles Personalizados**: Soporte para Personas Naturales y Jurídicas (DNI/RUC).
- **Identidad Unificada**: Uso de nombres de usuario reales en toda la interfaz.

## 🛠️ Tecnologías Utilizadas

- **Frontend**: Flutter (Dart)
- **Backend**: Node.js (Express)
- **Base de Datos**: MySQL
- **Autenticación**: JWT (JSON Web Tokens)

## 🛠️ Configuración y Ejecución

### 1. Requisitos Previos
- Node.js (v14+)
- MySQL Server
- Flutter SDK (v3.0+)
- Android Studio / VS Code (con plugins de Flutter)

### 2. Configuración de la Base de Datos
1. Inicia tu servidor MySQL.
2. Ejecuta el script de inicialización ubicado en `/base_de_datos/schema.sql`.
3. (Opcional) Ejecuta `test_users.sql` para datos de prueba.

### 3. Ejecución del Backend
```bash
cd backend
npm install
node server.js
```
> [!NOTE]
> Asegúrate de configurar las credenciales de la base de datos en `backend/config/database.js`.

### 4. Ejecución del Frontend (Flutter)
```bash
cd servicio_tecnico
flutter pub get
flutter run
```

## 📋 Estructura del Proyecto

- `/backend`: API REST construida con Node.js/Express.
- `/servicio_tecnico`: Aplicación móvil desarrollada en Flutter.
- `/base_de_datos`: Scripts SQL para la creación del esquema y datos.

## ✒️ Autor
**Alexander Castillo** - *Desarrollo y mantenimiento*
**Johan Pa** - *Desarrollo y mantenimiento*
