# Usuarios de Prueba - Servicio Técnico J&P

Para probar la aplicación, se han creado los siguientes usuarios de prueba en la base de datos.

## 📝 Cómo Cargar los Usuarios

Ejecuta el script SQL:

```bash
mysql -u root -p servicio_tecnico_db < "c:\Users\codecta10\Desktop\Proyecto servicio tecnico\base_de_datos\test_users.sql"
```

O desde MySQL Workbench/phpMyAdmin, ejecuta el archivo `test_users.sql`

---

## 👥 Usuarios Disponibles

### 1. Cliente (Persona Natural)
```
Email: cliente@test.com
Password: 123456
Rol: client
Nombre: Juan Carlos Pérez López
DNI: 12345678
Ciudad: Lima
```

### 2. Técnico (Persona Natural)
```
Email: tecnico@test.com
Password: 123456
Rol: tech
Nombre: María Elena García Rodríguez
DNI: 87654321
Ciudad: Lima
Calificación: 4.8 ⭐
Reseñas: 124
Horario: Lun-Vie 9:00-18:00, Sáb 10:00-14:00
```

### 3. Técnico Empresa (Persona Jurídica)
```
Email: empresa@test.com
Password: 123456
Rol: tech
Razón Social: Servicios Técnicos JP SAC
RUC: 20123456789
Ciudad: Lima
Calificación: 4.9 ⭐
Reseñas: 203
Horario: Lun-Vie 8:00-20:00, Sáb 9:00-17:00, Dom 9:00-13:00
```

---

## 🧪 Pruebas Sugeridas

### Login como Cliente
1. Abre la app Flutter
2. Email: `cliente@test.com`
3. Password: `123456`
4. Deberías ir a la pantalla de cliente (Client Home)

### Login como Técnico
1. Email: `tecnico@test.com` o `empresa@test.com`
2. Password: `123456`
3. Deberías ir a la pantalla de proveedor (Provider Home)

### Registro de Nuevo Usuario
1. Haz clic en "¿No tiene una cuenta?"
2. Selecciona rol (Cliente o Técnico)
3. Selecciona tipo de persona (Natural o Jurídica)
4. Completa el formulario
5. El usuario se creará en la base de datos

---

## 🔧 Notas Técnicas

- **Password Hash**: Todos usan bcrypt con salt rounds = 10
- **Token JWT**: Se genera automáticamente al hacer login/registro
- **Duración del Token**: 7 días (configurable en `.env`)

---

## 📊 Verificar en la Base de Datos

```sql
USE servicio_tecnico_db;

-- Ver todos los usuarios
SELECT u.id, u.email, u.role, up.names, up.surnames, up.company_name
FROM users u
LEFT JOIN user_profiles up ON u.id = up.user_id;

-- Ver técnicos con horarios
SELECT 
    u.email,
    up.names,
    up.company_name,
    ts.day_of_week,
    ts.start_time,
    ts.end_time
FROM users u
INNER JOIN user_profiles up ON u.id = up.user_id
LEFT JOIN technician_schedules ts ON u.id = ts.technician_id
WHERE u.role = 'tech'
ORDER BY u.id, ts.day_of_week;
```

---

## 🚀 Siguiente Paso

1. ✅ Asegúrate de que el backend esté corriendo (`npm run dev`)
2. ✅ Ejecuta el script `test_users.sql` en MySQL
3. ✅ Ejecuta `flutter pub get` en el proyecto Flutter
4. ✅ Corre la app Flutter
5. ✅ Prueba el login con los usuarios de arriba

¡Todo debería funcionar conectado al backend real!
