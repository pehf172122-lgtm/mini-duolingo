# 📄 INFORME – DESARROLLO DEL GAMIFICATION SERVICE

Base de datos MySQL
```sql
CREATE DATABASE IF NOT EXISTS gamification_service_db;

USE gamification_service_db;

-- Create tables for gamification-service

CREATE TABLE IF NOT EXISTS points (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId VARCHAR(36) NOT NULL,
  points INT NOT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_points (userId)
);

CREATE TABLE IF NOT EXISTS streaks (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId VARCHAR(36) NOT NULL,
  currentStreak INT NOT NULL DEFAULT 0,
  lastActivityDate DATE,
  INDEX idx_user_streak (userId)
);

CREATE TABLE IF NOT EXISTS achievements (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId VARCHAR(36) NOT NULL,
  achievementType VARCHAR(100) NOT NULL,
  unlockedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_achievement (userId, achievementType),
  INDEX idx_user_achievement (userId)
);

**Proyecto:** Sistema tipo Duolingo con arquitectura de microservicios  
**Autor:** (Tu nombre)  
**Fecha:** 2026  

---

## 🧭 1. OBJETIVO DEL TRABAJO

Desarrollar un microservicio llamado **Gamification Service** dentro de una arquitectura de microservicios, encargado de gestionar:

- Sistema de puntos (XP)  
- Rachas (streaks)  
- Logros (achievements)  

Aplicando conceptos del documento *“Desarrollo de Sistemas Informáticos y Multimediales”*, especialmente:

- Modularidad  
- Extensibilidad  
- Bajo acoplamiento  
- Arquitectura distribuida  

---

## 🏗️ 2. ARQUITECTURA IMPLEMENTADA

El sistema sigue una arquitectura de microservicios:

```plaintext
Frontend (React)
        │
        ▼
API Gateway
        │
        ▼
Content Service ─────► Gamification Service

👉 El Gamification Service funciona como un módulo independiente encargado de la lógica de motivación.

🗂️ 3. ESTRUCTURA DEL GAMIFICATION SERVICE
gamification-service/
│
├── src/
│   ├── controllers/
│   │   └── gamification.controller.ts
│   │
│   ├── services/
│   │   └── gamification.service.ts
│   │
│   ├── routes/
│   │   └── gamification.routes.ts
│   │
│   ├── db/
│   │   └── pool.ts
│   │
│   ├── models/
│   │   ├── point.model.ts
│   │   ├── streak.model.ts
│   │   └── achievement.model.ts
│   │
│   ├── utils/
│   │   ├── AppError.ts
│   │   └── errorHandler.ts
│   │
│   ├── app.ts
│   └── server.ts
│
├── migrations/
│   └── create_tables.sql
⚙️ 4. ARCHIVOS Y FUNCIONES PRINCIPALES
📌 4.1 gamification.service.ts

👉 Contiene la lógica de negocio principal

Funciones:
🔹 addXp(userId, points)
Inserta puntos en la base de datos
Calcula el total acumulado
🔹 getXp(userId)
Obtiene el total de puntos del usuario
🔹 updateStreak(userId)
Calcula la racha del usuario
Incrementa si es consecutivo
Reinicia si hay interrupción
🔹 getStreak(userId)
Devuelve la racha actual
🔹 unlockAchievement(userId, achievementType)
Desbloquea logros
Evita duplicados
🔹 getAchievements(userId)
Lista los logros del usuario
🔥 🔹 processUserAction(userId, actionType) (MEJORA CLAVE)

👉 Función central basada en eventos:

LESSON_COMPLETED → +20 XP  
EXERCISE_CORRECT → +10 XP  
PRONUNCIATION_PRACTICE → +15 XP  
Responsabilidades:
Añadir XP
Actualizar racha
Desbloquear logros automáticamente

👉 Esta función convierte el sistema en un motor de gamificación real

📌 4.2 gamification.controller.ts

👉 Maneja las peticiones HTTP

Endpoints:
POST /xp/add
GET /xp/:userId
POST /streak/update
GET /streak/:userId
POST /achievement/unlock
GET /achievement/:userId
🔥 POST /action (nuevo)
📌 4.3 gamification.routes.ts

Define las rutas:

router.post('/action', controller.processAction);
📌 4.4 pool.ts

👉 Configuración de conexión a MySQL usando mysql2

🗄️ 5. BASE DE DATOS
🔹 points
userId
points
createdAt
🔹 streaks
userId
currentStreak
lastActivityDate
🔹 achievements
userId
achievementType
unlockedAt
🔧 Mejora aplicada:
Índices para rendimiento
Restricción UNIQUE para evitar duplicados
Valores por defecto en fechas
🧠 6. DECISIONES ARQUITECTÓNICAS
✔ Uso de microservicios

Cada módulo es independiente:

Alta cohesión
Bajo acoplamiento
✔ Uso de eventos (processUserAction)

En lugar de funciones sueltas:

❌ addXp() directamente
✔ processUserAction()

👉 Mejora escalabilidad

✔ Separación por capas
Controller → HTTP
Service → lógica
DB → persistencia
✔ Comunicación REST
Entre servicios mediante HTTP
🔄 7. CAMBIOS REALIZADOS
🔹 Mejora en validación de actionType
if (!(actionType in ACTION_XP))
🔹 Corrección de bug en fechas (streak)
Evita errores por setHours()
🔹 Eliminación de as any
Código más limpio y seguro
🔹 Mejora del SQL
Índices
Restricciones
Defaults
🔹 Creación de endpoint /action
Permite centralizar la lógica de gamificación
⚠️ 8. ERRORES ENCONTRADOS Y SOLUCIONES
❌ Error 1: Cannot POST /action

🔍 Causa:

Ruta incorrecta

✔ Solución:

/api/v1/gamification/action
❌ Error 2: Bug en cálculo de racha

🔍 Causa:

Uso incorrecto de setHours()

✔ Solución:

Crear nuevas fechas normalizadas
❌ Error 3: Validación incorrecta de acción

🔍 Causa:

Validación basada en valor

✔ Solución:

Validar existencia en objeto
🔗 9. INTEGRACIÓN ENTRE MICROSERVICIOS

Implementado:

✔ Gamification Service funciona correctamente

Próximo paso:

Conectar:
Content Service → Gamification Service
🚀 10. SIGUIENTE PASO DEL PROYECTO
🔥 Integrar Content Service

Cuando el usuario:

Responde correctamente
Completa una lección

👉 Content Service debe llamar:

POST /action
🔥 Flujo final esperado:
Usuario → Content Service → Gamification Service

# 🎮 Gamification Service – Lista de Configuración Pendiente

## 📌 Proyecto: Sistema tipo Duolingo con microservicios

---

# 🎯 1. CONFIGURACIÓN BÁSICA (OBLIGATORIO)

## 🔲 1.1 Validar `.env`

📍 `gamification-service/.env`

```env
PORT=5300
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=...
DB_NAME=gamification_db
```

✔ Debe coincidir con:

```env
GAMIFICATION_SERVICE_URL=http://127.0.0.1:5300
```

---

## 🔲 1.2 Verificar prefijo de rutas

📍 `src/app.ts`

```ts
app.use('/api/v1/gamification', gamificationRoutes);
```

✔ Evita errores de rutas

---

## 🔲 1.3 Verificar ejecución del servicio

```bash
npm run dev
```

✔ Sin errores
✔ Conexión a DB activa

---

# 🔗 2. INTEGRACIÓN (CRÍTICO)

## 🔲 2.1 Conectar Content Service

📍 `content-service/src/services/...`

```ts
POST http://localhost:3000/api/v1/gamification/action
```

---

## 🔲 2.2 Conectar Pronunciation Service

```ts
actionType: 'PRONUNCIATION_PRACTICE'
```

---

## 🔲 2.3 Verificar flujo completo

✔ Content → Gamification
✔ Pronunciation → Gamification

---

# 🔐 3. SEGURIDAD

## 🔲 3.1 Validar JWT en API Gateway

Proteger:

```
/api/v1/gamification/*
```

---

## 🔲 3.2 Obtener userId desde token

❌ Actual:

```ts
userId en body
```

✔ Correcto:

```ts
req.user.id
```

---

# ⚙️ 4. MEJORAS DE BACKEND

## 🔲 4.1 Centralizar tipos de acciones

📍 `src/constants/actions.ts`

```ts
export enum ActionType {
  LESSON_COMPLETED = 'LESSON_COMPLETED',
  EXERCISE_CORRECT = 'EXERCISE_CORRECT',
  PRONUNCIATION_PRACTICE = 'PRONUNCIATION_PRACTICE'
}
```

---

## 🔲 4.2 Separar lógica de logros

📍 `src/services/achievement.service.ts`

---

## 🔲 4.3 Manejo de logs

Reemplazar:

```ts
console.error
```

por sistema de logs estructurado

---

# 🗄️ 5. BASE DE DATOS

## 🔲 5.1 Agregar índices

```sql
CREATE INDEX idx_user_points ON points(userId);
CREATE INDEX idx_user_streak ON streaks(userId);
CREATE INDEX idx_user_achievements ON achievements(userId);
```

---

## 🔲 5.2 Evitar duplicados

```sql
UNIQUE(userId, achievementType)
```

---

## 🔲 5.3 Validar integridad

✔ No NULL innecesarios
✔ Defaults correctos

---

# 🌐 6. API GATEWAY

## 🔲 6.1 Verificar proxy

```ts
/api/v1/gamification → http://localhost:5300
```

---

## 🔲 6.2 Manejo de errores

✔ No romper flujo si gamification falla

---

# 🧪 7. PRUEBAS

## 🔲 7.1 Probar endpoints

* `/xp`
* `/streak`
* `/achievement`
* `/action`

---

## 🔲 7.2 Probar flujo real

✔ XP aumenta
✔ Streak cambia
✔ Logros se desbloquean

---

# 🎮 8. FUNCIONALIDAD (SIGUIENTE NIVEL)

## 🔲 8.1 Ranking global

Tabla:

```sql
leaderboard
```

---

## 🔲 8.2 Niveles

```ts
Level = XP / 100
```

---

## 🔲 8.3 Sistema de recompensas

* Badges
* Desbloqueos

---

# 🎯 9. FRONTEND

✔ Mostrar XP
✔ Mostrar racha 🔥
✔ Mostrar logros 🏆

---

# 🧠 RESUMEN FINAL

## 🔥 OBLIGATORIO

* `.env` correcto
* Rutas bien definidas
* Conexión con Gateway
* Integración con Content

## 🚀 IMPORTANTE

* JWT funcionando
* userId desde token
* Base de datos optimizada

## 🧬 PRO

* Ranking
* Niveles
* Arquitectura limpia

---

# 🚀 SIGUIENTE PASO

1. Conectar Content → Gamification
2. Probar flujo completo
3. Implementar JWT
4. Mejorar base de datos

---
