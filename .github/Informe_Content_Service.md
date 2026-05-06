# 📄 INFORME TÉCNICO  
## Desarrollo del Content Service (Arquitectura de Microservicios tipo Duolingo)


Base de datos MySQL
```sql
CREATE DATABASE content_service_db;
USE content_service_db;

CREATE TABLE units (
  id VARCHAR(36) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE lessons (
  id VARCHAR(36) PRIMARY KEY,
  unit_id VARCHAR(36),
  title VARCHAR(255) NOT NULL,
  content TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE CASCADE
);

select * from exercises;

CREATE TABLE exercises (
  id VARCHAR(36) PRIMARY KEY,
  lesson_id VARCHAR(36),
  prompt TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  type VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
);
CREATE TABLE lesson_progress (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  lesson_id VARCHAR(36) NOT NULL,
  exercises_completed INT DEFAULT 0,
  correct_answers INT DEFAULT 0,
  total_exercises INT DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_lesson (user_id, lesson_id)
);

CREATE TABLE user_exercises (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  exercise_id VARCHAR(36) NOT NULL,
  is_correct BOOLEAN,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_exercise (user_id, exercise_id)
);

CREATE TABLE exercise_attempts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId VARCHAR(36),
  exerciseId VARCHAR(36),
  isCorrect BOOLEAN,
  UNIQUE KEY unique_attempt (userId, exerciseId)
);

ALTER TABLE exercises ADD COLUMN order_index INT DEFAULT 0;

---

# 🧠 1. INTRODUCCIÓN

En este proceso se desarrolló el **Content Service**, uno de los microservicios principales del sistema tipo Duolingo. Este servicio es responsable de gestionar el contenido educativo, incluyendo unidades, lecciones y ejercicios.

El desarrollo se realizó siguiendo una arquitectura de microservicios, aplicando principios como:

- Modularidad  
- Bajo acoplamiento  
- Alta cohesión  
- Separación de responsabilidades  

---

# 🏗️ 2. ARQUITECTURA IMPLEMENTADA

El Content Service se diseñó bajo una arquitectura en capas:

- **Routes** → Define endpoints  
- **Controllers** → Maneja requests/responses  
- **Services** → Lógica de negocio  
- **Database** → Conexión a MySQL  
- **Models** → Tipado de datos  

---

# 📁 3. ESTRUCTURA DEL PROYECTO

```plaintext
content-service/
│
├── src/
│   ├── app.ts
│   ├── database/connection.ts
│   ├── models/
│   │   ├── unit.model.ts
│   │   ├── lesson.model.ts
│   │   └── exercise.model.ts
│   ├── services/content.service.ts
│   ├── controllers/content.controller.ts
│   ├── routes/content.routes.ts
│   └── utils/errorHandler.ts
🧩 4. DESCRIPCIÓN DE ARCHIVOS
📍 4.1 app.ts

Función:

Punto de entrada del microservicio
Configura Express
Define ruta base /api/v1/content
Manejo global de errores
Endpoint de salud /health
📍 4.2 database/connection.ts

Función:

Configura conexión a MySQL mediante mysql2
Usa variables de entorno
Implementa pool de conexiones
📍 4.3 models/

Función:

Define estructuras de datos (TypeScript)
Representa tablas:
Units
Lessons
Exercises
📍 4.4 services/content.service.ts

Función:

Lógica de negocio del sistema

Operaciones:

Crear unidades
Obtener unidades
Crear lecciones
Obtener lecciones por unidad
Crear ejercicios
Obtener ejercicios por lección
Validar respuestas
📍 4.5 controllers/content.controller.ts

Función:

Recibe requests HTTP
Valida datos
Llama al service
Devuelve respuestas estructuradas

Formato estándar:

{
  "success": true,
  "message": "",
  "data": {},
  "error": null
}
📍 4.6 routes/content.routes.ts

Función:

Define endpoints REST

Endpoints principales:

/units
/lessons
/exercises
/exercises/:exerciseId/validate
📍 4.7 utils/errorHandler.ts

Función:

Middleware global de manejo de errores
🧠 5. DECISIONES ARQUITECTÓNICAS
✔ Separación en capas

Permite:

Mantenimiento sencillo
Escalabilidad
✔ Uso de UUID
Evita colisiones
Ideal para microservicios
✔ Base de datos relacional (MySQL)

Relaciones:

Unit → Lesson
Lesson → Exercise
✔ Validaciones en el Service
Evita datos inválidos
Mejora integridad
✔ API REST estandarizada
Uso correcto de métodos HTTP
Rutas jerárquicas
🔧 6. CAMBIOS REALIZADOS
🔹 Mejora en validación de respuestas

Antes:

answer === correct_answer

Después:

normalize(answer) === normalize(expected)
🔹 Implementación de tipo de ejercicio
type: "translation" | "speaking" | "multiple_choice"
🔹 Validación de relaciones

Se agregó verificación:

existencia de Unit antes de crear Lesson
existencia de Lesson antes de crear Exercise
🔹 Mejora en manejo de errores

Antes:

throw { status: 404 }

Después:

const error = new Error()
error.status = 404
🔹 Corrección de tipos TypeScript
Tipado de Request y Response
Configuración de @types/node
❌ 7. ERRORES ENCONTRADOS Y SOLUCIONES
🔴 Error: módulos no encontrados

Solución:

npm install express cors dotenv mysql2 uuid
npm install -D @types/node @types/express
🔴 Error: process no definido

Solución:

"types": ["node"]
🔴 Error: URL inválida

Incorrecto:

http:///api/...

Correcto:

http://localhost:5000/api/...
🔴 Error: 404 Lesson not found

Solución:

Crear datos en orden:

Unit
Lesson
Exercise
🔴 Error: uso incorrecto de :exerciseId

Solución:

Reemplazar por ID real

🧪 8. PRUEBAS REALIZADAS

Flujo validado:

Crear unidad ✔
Crear lección ✔
Crear ejercicio ✔
Validar respuesta ✔
🎯 9. ESTADO ACTUAL DEL SISTEMA
✔ Funcional
CRUD completo
Validaciones
Relaciones
⚠️ Limitaciones
No integrado con otros microservicios
Sin autenticación
Sin multimedia
Sin comunicación distribuida
🚀 10. SIGUIENTE PASO: API GATEWAY
🎯 Objetivo

Centralizar el acceso al sistema

🔗 Flujo esperado
Frontend → API Gateway → Content Service
🧩 Funciones del Gateway
Enrutamiento
Validación JWT
Seguridad
Manejo de errores
🔌 Integración
/api/v1/content → http://localhost:5000
📦 Ejemplo
app.use('/api/v1/content', proxy('http://localhost:5000'));
🎯 Resultado esperado
El frontend NO llama directamente al Content Service
Todo pasa por el Gateway
🧠 11. CONCLUSIÓN

El Content Service fue desarrollado exitosamente como un microservicio funcional, cumpliendo con los principios fundamentales de diseño de sistemas distribuidos.

Se logró:

Implementar lógica de negocio sólida
Mantener una arquitectura escalable
Preparar el sistema para integración futura
📄 PARTE 2 – EVOLUCIÓN DEL CONTENT SERVICE + INTEGRACIÓN GLOBAL
🧭 1. OBJETIVO DEL TRABAJO

Implementar un flujo completo tipo Duolingo dentro del sistema:

👉 Validación de ejercicios
👉 Integración con gamificación
👉 Seguimiento de progreso por usuario
👉 Prevención de trampas (anti-duplicación)
🏗️ 2. ARQUITECTURA RESULTANTE
Frontend
   ↓
API Gateway
   ↓
Content Service
   ↓
Vocabulary Service
   ↓
Gamification Service
   ↓
Base de datos
📁 3. ARCHIVOS CLAVE Y FUNCIONES
🔹 content.controller.ts

Funciones:

createUnit
createLesson
createExercise
validateExercise
completeLesson
getUserProgress

Cambio importante:

const userId = req.user?.userId;
🔹 content.service.ts (CORE)
🧠 validateExerciseAnswer

Responsable de:

Validar respuesta
Consultar vocabulary-service
Evitar duplicados
Guardar intento
Actualizar progreso
Enviar evento a gamification
🔥 Función interna:
hasUserAnswered
🔹 progress.service.ts

Función:

updateLessonProgress
🔹 Nuevas tablas
user_exercises

Evita duplicación

lesson_progress

Permite:

progreso por lección
porcentaje
estado
🗄️ 4. BASE DE DATOS
lesson_progress
user_id
lesson_id
exercises_completed
correct_answers
total_exercises
completed
user_exercises
user_id
exercise_id
is_correct
⚙️ 5. DECISIONES CLAVE
✅ No crear progress-service
Integrado en content-service
Menos complejidad
✅ Anti-duplicación
Implementación de user_exercises
✅ Progreso independiente de aciertos

Siempre se actualiza

✅ Validación semántica

Uso de vocabulary-service

✅ Comunicación HTTP
content → gamification
content → vocabulary
🔄 6. CAMBIOS REALIZADOS
Cambio req.user.id → req.user.userId
Flujo completo de validación
Implementación de progreso
Anti-duplicación
Respuesta enriquecida
❌ 7. ERRORES Y SOLUCIONES
userId no existe → tipado global
duplicación → user_exercises
progreso incorrecto → actualizar siempre
variable mal usada → reordenar flujo
doble return → limpieza
arquitectura inconsistente → rediseño
🧪 8. RESULTADOS
✔ Validación robusta
✔ Integración completa
✔ Progreso real
✔ Anti-trampa
✔ Backend listo
🧠 9. CONCEPTOS APLICADOS
Microservicios
Separación de responsabilidades
Persistencia
Comunicación HTTP
Validación semántica
Integridad de datos
🚀 10. ESTADO ACTUAL
✔ User Service
✔ Content Service
✔ Vocabulary Service
✔ Pronunciation Service
✔ Gamification Service
✔ API Gateway
✔ Progreso funcional
⚠️ 11. LO QUE FALTA
Desbloqueo de lecciones
Endpoint /units-with-progress
Mapa tipo Duolingo
Estados locked/unlocked
🧭 12. SIGUIENTE PASO

👉 Implementar:

🔥 Desbloqueo de lecciones + mapa de progreso


---
