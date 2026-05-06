# 📘 Informe Técnico: Desarrollo del Vocabulary Service (Arquitectura de Microservicios)

Base de datos MySQL
```sql
create database vocabulary_service_db;
USE vocabulary_service_db;


CREATE TABLE words (
  id INT NOT NULL AUTO_INCREMENT,
  word VARCHAR(255) NOT NULL,
  language VARCHAR(50) NOT NULL,
  ipa VARCHAR(255),
  audio_url VARCHAR(500),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY unique_word (word),
  INDEX idx_word (word)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

select * from examples;

CREATE TABLE meanings (
  id INT NOT NULL AUTO_INCREMENT,
  word_id INT NOT NULL,
  meaning TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_meanings_word_id (word_id),
  CONSTRAINT fk_meanings_word_id FOREIGN KEY (word_id)
    REFERENCES words (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE examples (
  id INT NOT NULL AUTO_INCREMENT,
  meaning_id INT NOT NULL,
  example_text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_examples_meaning_id (meaning_id),
  CONSTRAINT fk_examples_meaning_id FOREIGN KEY (meaning_id)
    REFERENCES meanings (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

---

## 🧭 1. Contexto del Proyecto

Se desarrolló un microservicio llamado **Vocabulary Service** como parte de un sistema tipo Duolingo basado en arquitectura de microservicios. Este servicio tiene como objetivo gestionar el aprendizaje profundo de palabras, incluyendo:

- Palabras  
- Significados  
- Ejemplos  
- Información fonética (IPA)  
- Recursos multimedia (audio)  

---

## 🏗️ 2. Estructura del Microservicio

### 📁 Estructura de carpetas

```plaintext
src/
├── app.ts
├── server.ts
├── config/
│   └── env.ts
├── db/
│   └── pool.ts
├── controllers/
│   └── word.controller.ts
├── services/
│   └── word.service.ts
├── repositories/
│   ├── word.repository.ts
│   ├── meaning.repository.ts
│   └── example.repository.ts
├── routes/
│   └── word.routes.ts
├── middlewares/
│   ├── error.middleware.ts
│   └── logger.middleware.ts
├── utils/
│   └── AppError.ts
🧩 3. Archivos Generados y Funciones
🔹 app.ts
Configuración de Express
Middlewares: cors, helmet, json, logger
Registro de rutas /api/v1/words
Endpoint /health
Manejo global de errores
🔹 server.ts
Inicialización del servidor
Conexión a base de datos
Manejo de errores al iniciar
🔹 env.ts
Configuración de variables de entorno (.env)
Datos de conexión a MySQL
🔹 pool.ts
Creación del pool de conexiones MySQL (mysql2/promise)
🔹 AppError.ts

Clase personalizada de errores:

Extiende Error
Incluye:
statusCode
isOperational
Permite manejo controlado de errores
🔹 Repositories (Acceso a datos)
word.repository.ts
getAllWords()
getWordById(id)
createWord(data)
meaning.repository.ts
getMeaningsByWordId(wordId)
example.repository.ts
getExamplesByMeaningId(meaningId)

👉 Responsabilidad: acceso directo a la base de datos (sin lógica de negocio)

🔹 word.service.ts (Lógica de negocio)

Funciones:

getAllWords()
Obtiene palabras con meanings y examples
Usa Promise.all para optimización
getWordById(id)

Retorna estructura completa:

word → meanings → examples
createWord(data)
Crea una palabra

👉 Aquí se aplica:

Composición de datos
Manejo de errores
Optimización (paralelismo)
🔹 word.controller.ts

Funciones:

getAllWords
getWordById
createWord

Responsabilidades:

Validación de entrada
Manejo de respuestas HTTP
Delegación al service
🔹 word.routes.ts

Endpoints:

GET /
GET /:id
POST /
🔹 error.middleware.ts
Manejo global de errores
Soporte para AppError

Devuelve:

statusCode correcto (404, 400, 500)
🧠 4. Decisiones Arquitectónicas
✔ Arquitectura en capas
Controller → Service → Repository → DB
✔ Separación de responsabilidades
Repository → acceso a datos
Service → lógica
Controller → HTTP
✔ Uso de DTOs
Estructura clara de salida
Evita exponer modelo de DB directamente
✔ Uso de AppError
Manejo de errores uniforme
Evita errores genéricos
✔ Uso de Promise.all
Mejora rendimiento
Evita bloqueos secuenciales
✔ Uso de MySQL con relaciones
Foreign Keys
ON DELETE CASCADE
Integridad referencial
🔄 5. Cambios Realizados
🔹 Eliminación de duplicidad
Se eliminó un repository duplicado con Not implemented
🔹 Optimización de queries
Eliminación de doble consulta en createWord
Uso de datos retornados directamente
🔹 Mejora en tipado MySQL

Uso de:

RowDataPacket[] & CustomType[]
🔹 Cambio en rutas
words.routes.ts → word.routes.ts
🔹 Corrección de error middleware
Se empezó a usar statusCode correctamente
🚨 6. Errores Encontrados y Soluciones
❌ Error: módulo no encontrado (cors, helmet)

✔ Solución:

npm install cors helmet
npm install -D @types/cors @types/helmet
❌ Error: rutas incorrectas

✔ Solución:

Corregir import en app.ts
❌ Error: QueryResult en mysql2

✔ Solución:

pool.query<RowDataPacket[] & CustomType[]>
❌ Error: top-level await

✔ Solución:

Crear función startServer()
❌ Error: conexión MySQL

✔ Solución:

Configurar .env
Añadir contraseña correcta
❌ Error: siempre retornaba 500

✔ Solución:

Corregir error.middleware.ts
Usar statusCode de AppError
❌ Error: N+1 queries

✔ Solución:

Uso de Promise.all
🧪 7. Pruebas Realizadas
✔ GET /words
Retorna lista (vacía inicialmente)
✔ GET /words/:id
Manejo correcto de 404
✔ POST /words
Inserción correcta en DB
🚀 8. Estado Actual del Microservicio
✔ Funcional
✔ Conectado a DB
✔ Endpoints operativos
✔ Arquitectura limpia
✔ Preparado para integración

# 📘 Checklist Final - Vocabulary Service

## 🎯 Objetivo

Este documento lista todo lo necesario para que el **Vocabulary Service** esté completamente configurado, funcional, escalable y listo para integrarse con otros microservicios en la arquitectura.

---

# ✅ 1. Configuración Básica

* [ ] Variables de entorno correctamente definidas (`.env`)

  * PORT
  * DB_HOST
  * DB_PORT
  * DB_USER
  * DB_PASSWORD
  * DB_NAME

* [ ] `env.ts` cargando correctamente `dotenv`

* [ ] Puerto configurado y único (ej: 5100)

---

# ✅ 2. Base de Datos

* [ ] Base de datos creada (`vocabulary_db`)

* [ ] Tablas creadas:

  * words
  * meanings
  * examples

* [ ] Relaciones correctamente definidas:

  * FK meanings → words
  * FK examples → meanings

* [ ] Índices y constraints:

  * UNIQUE en `word`
  * ON DELETE CASCADE

---

# ✅ 3. Conexión a Base de Datos

* [ ] Pool de conexión (`pool.ts`) funcionando
* [ ] Función de prueba de conexión implementada
* [ ] Manejo de errores de conexión

---

# ✅ 4. Arquitectura Interna

## Repositories

* [ ] Acceso a datos sin lógica de negocio
* [ ] Queries optimizadas
* [ ] Tipado correcto (`RowDataPacket`)

## Services

* [ ] Lógica de negocio implementada
* [ ] Uso de `Promise.all` (optimización)
* [ ] Composición:

  * word → meanings → examples

## Controllers

* [ ] Validación de inputs
* [ ] Manejo de errores con `next()`
* [ ] Respuestas consistentes

## Routes

* [ ] Endpoints definidos:

  * GET /
  * GET /:id
  * POST /

---

# ✅ 5. Manejo de Errores

* [ ] Clase `AppError` implementada
* [ ] `error.middleware.ts` usando `statusCode`
* [ ] Respuesta estándar:

```json
{
  "success": false,
  "message": "",
  "data": null,
  "error": ""
}
```

---

# ✅ 6. Middlewares

* [ ] `cors` configurado
* [ ] `helmet` configurado
* [ ] `logger` funcionando
* [ ] `express.json()` activo

---

# ✅ 7. API (Endpoints)

* [ ] GET `/api/v1/words`

* [ ] GET `/api/v1/words/:id`

* [ ] POST `/api/v1/words`

* [ ] Pruebas realizadas (Postman / Thunder Client)

* [ ] Respuestas correctas:

  * 200 OK
  * 201 Created
  * 404 Not Found
  * 400 Bad Request

---

# ✅ 8. Integración con API Gateway

* [ ] Ruta registrada en API Gateway
* [ ] Proxy funcionando correctamente
* [ ] Endpoint accesible desde Gateway:

  ```
  /api/v1/vocabulary/words
  ```

---

# 🔐 9. Seguridad (Pendiente / Mejora)

* [ ] Soporte para header:

  ```
  Authorization: Bearer <token>
  ```

* [ ] Validación JWT (opcional, vía Gateway)

---

# 🧠 10. Buenas Prácticas

* [ ] Separación de responsabilidades (Controller / Service / Repository)
* [ ] Código tipado correctamente
* [ ] Manejo de errores consistente
* [ ] No duplicación de lógica
* [ ] Nombres de rutas consistentes (`words` vs `word`)

---

# 🚀 11. Integraciones Futuras

## Con Content Service

* [ ] Obtener palabras para ejercicios
* [ ] Validar respuestas

## Con Pronunciation Service

* [ ] Usar IPA
* [ ] Usar audio_url

## Con Multimedia Service

* [ ] Gestionar audios/imágenes

## Con Gamification Service

* [ ] Otorgar puntos por aprendizaje

---

# 🧪 12. Testing (Recomendado)

* [ ] Tests de endpoints
* [ ] Tests de services
* [ ] Tests de integración

---

# 📦 13. Producción (Opcional)

* [ ] Variables de entorno seguras
* [ ] Logs estructurados
* [ ] Dockerización
* [ ] Health checks

---

# 🧾 Conclusión

Si todos los puntos anteriores están completos, el **Vocabulary Service**:

✔ Está correctamente configurado
✔ Es funcional y escalable
✔ Puede integrarse con otros microservicios
✔ Cumple con buenas prácticas de arquitectura

---

# 🎯 Siguiente paso recomendado

👉 Integración completa con otros servicios (especialmente Content Service)
👉 Implementación en frontend
👉 Escalado del sistema

---
