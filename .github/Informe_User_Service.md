# 📄 Informe Técnico – Desarrollo del User Service (Arquitectura de Microservicios)

## 🧭 1. Contexto del Proyecto

### 🗄️ Base de datos en MySQL

```sql
CREATE DATABASE user_service_db;
USE user_service_db;

CREATE TABLE users (
    user_id VARCHAR(36) PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_profiles (
    user_id VARCHAR(36) PRIMARY KEY,
    display_name VARCHAR(100),
    native_language VARCHAR(10),
    learning_language VARCHAR(10),
    avatar_url VARCHAR(500),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE user_streaks (
    user_id VARCHAR(36) PRIMARY KEY,
    current_streak INT DEFAULT 0,
    longest_streak INT DEFAULT 0,
    last_activity_date DATE,
    streak_freeze BOOLEAN DEFAULT FALSE
);

CREATE TABLE refresh_tokens (
  token_id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  token VARCHAR(500) NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_revoked BOOLEAN DEFAULT FALSE,

  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

Se está desarrollando un sistema tipo Duolingo basado en una arquitectura de microservicios, donde cada servicio es independiente y cumple una responsabilidad específica.

El primer microservicio implementado fue:

👉 User Service (gestión de usuarios y autenticación)

🏗️ 2. Decisiones Arquitectónicas Clave
🔹 2.1 Uso de Microservicios
Separación por dominios (User, Content, Vocabulary, etc.)
Comunicación vía REST
Escalabilidad futura
🔹 2.2 Base de Datos

✔ Se decidió:

Usar MySQL
Mantener una base de datos por microservicio (buena práctica)
🔹 2.3 Identificadores (Cambio crítico)

❌ Antes:

AUTO_INCREMENT (numérico)

✅ Ahora:

UUID

Motivo:

Evitar colisiones entre servicios
Mayor seguridad
Mejor para sistemas distribuidos
🔹 2.4 Arquitectura por capas

Se implementó estructura limpia:

controllers → services → repositories → database

✔ Beneficios:

Separación de responsabilidades
Código mantenible
Escalabilidad
🔐 3. Implementación de Autenticación (AUTH)
🔹 3.1 Registro (Register)

✔ Funcionalidades implementadas:

Validación de datos
Hash de contraseña (bcrypt)
Creación de usuario
Creación automática de:
perfil
racha (streak)
🔹 3.2 Login

✔ Mejoras importantes:

🔒 Seguridad implementada:

Mensaje genérico:

"Invalid credentials"
Uso de dummy hash para evitar ataques de timing
Comparación segura con bcrypt
🔹 3.3 JWT

✔ Se implementaron:

Access Token
Refresh Token

✔ Configuración:

Expiración configurable
Secret desde .env
🔄 4. Implementación de Refresh Tokens
🔹 4.1 Problema resuelto

❌ Antes:

JWT sin renovación

✅ Ahora:

Sistema completo de refresh tokens
🔹 4.2 Flujo implementado
Login genera:
accessToken
refreshToken
RefreshToken se guarda en DB
Endpoint /refresh:
valida token
genera nuevo accessToken
🔹 4.3 Seguridad añadida
Verificación de expiración
Revocación de tokens
Validación contra DB
🧪 5. Validaciones con Zod
🔹 5.1 Problema inicial

❌ No había validaciones robustas

🔹 5.2 Solución

✔ Se implementó:

zod
Middleware validate

✔ Validaciones:

email válido
password seguro
username limpio
🔹 5.3 Error encontrado

Error:

Unrecognized key: "password"

✔ Causa:

.strict() en esquema

✔ Solución:

Ajustar estructura del body o esquema
⚠️ 6. Errores Encontrados y Soluciones
❌ Error 1: helmet mal configurado
app.use(helmet)

✔ Solución:

app.use(helmet())
❌ Error 2: Tipos UUID vs number

Error:

Argument of type 'number' is not assignable to 'string'

✔ Causa:

Cambio a UUID no aplicado en todo el sistema

✔ Solución:

Migrar TODO a string
❌ Error 3: JWT TypeScript error

✔ Solución:

Ajustar tipos correctamente
Asegurar expiresIn válido
❌ Error 4: SQL undefined

Error:

Bind parameters must not contain undefined

✔ Causa:

Valores no inicializados

✔ Solución:

Validar antes de enviar a DB
❌ Error 5: Refresh Token Payload

Error:

Property 'email' is missing

✔ Causa:

Tipos estrictos en JWT

✔ Solución:

Hacer email opcional o incluirlo
🧱 7. Estructura Final del User Service
src/
├── auth/
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── auth.routes.ts
│   ├── auth.validation.ts
│
├── controllers/
├── services/
├── repositories/
├── middleware/
│   ├── auth.ts
│   ├── validate.ts
│   ├── errorHandler.ts
│
├── utils/
│   ├── jwt.ts
│   ├── hash.ts
│
├── db/
├── config/
🔓 8. Endpoints Implementados
🔐 Auth
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/refresh
POST /api/v1/auth/logout
👤 User
GET /api/v1/users/me
GET /api/v1/users/:id
PUT /api/v1/users/:id
DELETE /api/v1/users/:id
🚀 9. Estado Actual del Proyecto

✔ Funcional:

Registro
Login
JWT
Refresh Tokens
Perfil
Streak
Validaciones
Middleware de seguridad

✔ Probado con:

Thunder Client
🧠 10. Lecciones Aprendidas
Cambiar a UUID afecta TODO el sistema
Validaciones deben ir antes del service
Seguridad en login es crítica
JWT requiere diseño claro desde el inicio
Los errores de tipado en TypeScript ayudan a detectar fallos reales
🔜 11. SIGUIENTE PASO: API GATEWAY
🌐 11.1 ¿Qué es el API Gateway?

Es el punto único de entrada al sistema.

🎯 11.2 Responsabilidades
Enrutamiento a microservicios
Validación de JWT
Manejo de errores global
Seguridad básica
Logging
🧩 11.3 Flujo
Cliente → API Gateway → User Service
🛠️ 11.4 Lo que vas a construir

👉 Nuevo proyecto:

api-gateway/
📌 11.5 Funcionalidades iniciales
Proxy a user-service
Middleware de autenticación
Manejo de errores
Rutas centralizadas
⚡ 11.6 Estrategia con Copilot

👉 Modelo recomendado:

GPT-4o mini o Copilot default

👉 Prompt único (optimizado):

Generar gateway completo en una sola solicitud
🧩 12. Conclusión

El User Service quedó:

✔ Seguro
✔ Escalable
✔ Bien estructurado
✔ Listo para producción (nivel base)


# 📋 User Service - Pending Tasks & Improvements

## 🧩 Estado Actual

El servicio ya cuenta con:

- ✔ Registro y login
- ✔ JWT + Refresh Tokens
- ✔ UUID como identificador
- ✔ Validaciones con Zod
- ✔ Middleware de autenticación
- ✔ Arquitectura por capas (controller, service, repository)
- ✔ Conexión a base de datos MySQL

👉 Estado: **MVP funcional y estable**

---

# 🔥 1. Tareas CRÍTICAS (Antes de API Gateway)

## 🛡️ 1.1 Estandarizar respuestas

Todas las respuestas deben seguir este formato:

```json
{
  "success": true,
  "message": "string",
  "data": {},
  "error": null
}

✔ Aplicar en TODOS los endpoints
✔ Aplicar también en errores

⚠️ 1.2 Mejorar errorHandler

Debe:

Manejar errores personalizados { status, message }
Evitar exponer errores internos
Mantener formato estándar
🔐 1.3 Middleware JWT robusto

Debe:

Leer correctamente Authorization: Bearer TOKEN
Manejar:
Token inválido
Token expirado
Inyectar:
req.userId
👤 1.4 Endpoint /users/me

Debe:

Usar req.userId (NO params)
No exponer password_hash
Respuesta limpia y consistente
🔑 1.5 Sincronización JWT_SECRET

Debe ser el mismo en:

user-service
api-gateway

⚠️ Si no coincide → tokens inválidos

⚙️ 2. Tareas IMPORTANTES
🔄 2.1 Rotación de Refresh Tokens

Falta:

Invalidar token antiguo
Generar nuevo refresh token al usar /refresh
🚪 2.2 Logout funcional

Debe:

Revocar refresh token en base de datos
🧼 2.3 Normalización de datos

Aplicar siempre:

email = email.toLowerCase().trim()
username = username.trim()

✔ En register
✔ En login

🔍 2.4 Índices en base de datos

Asegurar:

email UNIQUE
username UNIQUE
user_id PRIMARY KEY
🧪 2.5 Validaciones completas
Evitar campos extra
Validar tipos en update
Validar UUID
🧠 3. Mejoras Arquitectónicas
📦 3.1 Separar AUTH completamente

Estructura:

src/auth/

Acciones:

Mover toda la lógica de auth a auth.service.ts
Limpiar userService.ts
🧩 3.2 Tipos / DTOs

Definir:

RegisterInput
LoginInput
UserResponse
📡 3.3 Health Check mejorado

Endpoint:

{
  "service": "user-service",
  "status": "ok",
  "timestamp": "..."
}
🚀 4. Preparación para API Gateway
🌐 4.1 Rutas consistentes

Usar siempre:

/api/v1/auth
/api/v1/users
📦 4.2 Logging

Opcional:

requestId
logs estructurados
🔐 4.3 Seguridad en respuestas

NO exponer:

password_hash
refresh tokens
🧪 5. Testing
✔ Pruebas mínimas
register
login
refresh
logout
/users/me
🔬 Opcional
Jest
Supertest
🧠 6. Errores ya corregidos
✔ UUID vs number
✔ helmet mal configurado
✔ validaciones débiles
✔ login inseguro
✔ errores de JWT en TypeScript
✔ conflicto ESM vs CommonJS