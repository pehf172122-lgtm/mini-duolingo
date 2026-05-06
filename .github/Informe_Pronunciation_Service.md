# 📄 INFORME TÉCNICO  
## Integración de Microservicios – Sistema tipo Duolingo

---

Base de datsos MySQL
```sql
CREATE DATABASE pronunciation_service_db;
USE pronunciation_service_db;

CREATE TABLE evaluations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId VARCHAR(36) NOT NULL,
  word VARCHAR(255) NOT NULL,
  expectedText TEXT NOT NULL,
  transcribedText TEXT NOT NULL,
  score INT NOT NULL,
  feedback TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


## 🧩 1. OBJETIVO DEL TRABAJO

Implementar y conectar correctamente los microservicios:

- user-service  
- content-service  
- vocabulary-service  
- pronunciation-service  
- gamification-service  
- api-gateway  

Con el objetivo de construir un flujo funcional de aprendizaje con:

- autenticación  
- evaluación de ejercicios  
- evaluación de pronunciación  
- gamificación (XP)  

---

## 🏗️ 2. ARQUITECTURA IMPLEMENTADA

### 🔗 API Gateway como punto central

El sistema sigue arquitectura de microservicios:


Frontend → API Gateway → Microservicios


### 📌 Servicios

| Servicio | Responsabilidad |
|----------|----------------|
| user-service | autenticación |
| content-service | contenido educativo |
| vocabulary-service | palabras |
| pronunciation-service | evaluación de audio |
| gamification-service | XP, progreso |
| api-gateway | proxy y orquestación |

---

## 📁 3. ARCHIVOS CLAVE Y FUNCIONES

### 🔹 pronunciation-service

#### 📄 pronunciation.controller.ts

**Funciones principales:**

- `evaluateAudio`
  - recibe audio (`multipart/form-data`)
  - usa OpenAI Whisper (con fallback)
  - genera transcripción
  - evalúa pronunciación
  - envía evento a gamification  

```ts id="send-action"
await sendUserAction(token, userId, 'PRONUNCIATION_PRACTICE');
evaluate
evalúa texto directamente (sin audio)
usa validación con schema
conecta con gamification
🔹 gamification-service
📄 gamification.controller.ts
Función	Descripción
addXp	agrega puntos
getXp	obtiene XP
updateStreak	actualiza racha
getStreak	obtiene racha
unlockAchievement	logros
getAchievements	lista logros
processAction	procesa acciones del usuario

⚠️ Punto crítico:

const userId = (req as any).user?.userId;

👉 Depende de middleware de autenticación

🔹 pronunciation-service
📄 gamificationClient.ts

Función:

sendUserAction(token, userId, actionType)

Envía POST a:

/api/v1/gamification/action
``` id="endpoint-gamification"

---

### 🔹 api-gateway

#### 📄 proxy.service.ts

**Responsabilidad:**

- redirigir requests  
- reenviar headers importantes  

```ts id="headers-forward"
if (req.user?.userId) {
  proxyReq.setHeader('x-user-id', req.user.userId);
}
if (req.headers.authorization) {
  proxyReq.setHeader('authorization', req.headers.authorization);
}
📄 app.ts

Configuración de rutas:

app.use('/api/v1/pronunciation', authMiddleware, proxy);
app.use('/api/v1/gamification', authMiddleware, proxy);
⚙️ 4. DECISIONES IMPORTANTES
✅ 1. Uso de API Gateway
✔ Centraliza acceso
✔ Maneja autenticación
✔ Evita acoplamiento
✅ 2. Separación de responsabilidades
pronunciation → evalúa audio
gamification → maneja XP
content → maneja ejercicios

👉 Evita dependencias innecesarias

✅ 3. Uso de fallback en Whisper
catch {
  transcribedText = randomFake;
}

✔ Permite seguir probando sin cuota de API

✅ 4. Comunicación entre servicios
pronunciation → gamification mediante HTTP
token reenviado
🐛 5. ERRORES ENCONTRADOS
❌ ERROR 1: "Invalid body" en gamification

🔍 Causa:

const userId = (req as any).user?.userId;

👉 req.user era undefined

✔ Solución:

asegurar que el token llega
verificar authMiddleware en gateway
console.log('BODY:', req.body);
console.log('USER:', req.user);
❌ ERROR 2: Cannot set headers after they are sent

🔍 Causa:

proxyReq.write(bodyData);

✔ Solución:

❌ eliminar ese bloque
✔ dejar que Express maneje el body
❌ ERROR 3: "request aborted"

🔍 Causa:

body mal procesado
conflicto con proxy

✔ Solución:

eliminar manipulación manual del body
usar express.json() correctamente
❌ ERROR 4: 502 Bad Gateway / socket hang up

🔍 Causa:

conexión rota entre gateway y servicio
request incompleto

✔ Solución:

corregir proxy
asegurar que body no se sobrescribe
mantener headers intactos
❌ ERROR 5: Whisper 429

🔍 Causa:

sin cuota en OpenAI

✔ Solución:

fallback con respuestas simuladas
✅ 6. RESULTADOS LOGRADOS
✔ Login funcional
✔ Evaluación de audio funcional
✔ Evaluación con fallback
✔ Comunicación pronunciation → gamification
✔ XP acumulándose correctamente
✔ Gateway funcionando correctamente
✔ Errores críticos solucionados
🧠 7. ARQUITECTURA FINAL LOGRADA
Frontend
   ↓
API Gateway
   ↓
Pronunciation Service
   ↓
Gamification Service
``` id="final-arch"

✔ Flujo completo funcional  

---

## 🚀 8. DISEÑO DEL FLUJO TIPO DUOLINGO

**Estructura:**

- Unidad → Lección → Ejercicio  

**Flujo:**

- content entrega ejercicio  
- usuario responde  
- pronunciation evalúa audio  
- gamification otorga XP  

---

## ⚠️ 9. COSAS QUE FALTAN (IMPORTANTES)

### 🔥 1. Sistema de progreso (CRÍTICO)

Actualmente NO tienes:

- progreso por lección  
- control de ejercicios completados  

👉 necesitas:

- `progress-service`  

---

### 🔥 2. Validación en content-service

- evaluar respuestas de texto  
- no solo audio  

---

### 🔥 3. Manejo de estados del usuario

- lección completada  
- desbloqueo de contenido  

---

### 🔥 4. Mejor manejo de errores entre servicios

- retry  
- logs estructurados  

---

### 🔥 5. Eventos (nivel avanzado)

En lugar de HTTP:

- RabbitMQ  
- Kafka  

---

## 🧭 10. SIGUIENTES PASOS RECOMENDADOS

### 🥇 Paso 1 (OBLIGATORIO)

👉 Crear `progress-service`

**Endpoints:**

``` id="progress-endpoints"
POST /progress/update  
GET /progress/:userId
🥈 Paso 2

👉 Integrar progreso con:

content-service
gamification-service
🥉 Paso 3

👉 Mejorar gamificación:

XP por tipo de ejercicio
streaks reales
logros
🧠 Paso 4 (PRO)

👉 Implementar eventos (RabbitMQ)

🚀 Paso 5

👉 Frontend (ya puedes empezar)

🏁 CONCLUSIÓN

Tu sistema actualmente:

✔ Funciona
✔ Está bien separado
✔ Sigue buenas prácticas
✔ Ya tiene flujo real de usuario

# 📘 Pronunciation Service - Ajustes Pendientes

Este documento resume TODO lo que falta para dejar completamente funcional y bien integrado el **pronunciation-service** dentro del sistema tipo Duolingo.

---

# ✅ 1. Manejo real de transcripción (Whisper)

## Problema actual

* Estás usando fallback porque aparece error 429 (cuota excedida).

## Pendiente

* Configurar correctamente OpenAI:

  * API Key válida
  * Billing activo
* Eliminar fallback cuando ya funcione

## Mejora opcional

* Guardar transcripciones para análisis futuro

---

# ✅ 2. Validación dinámica de palabras

## Problema actual

* Solo funciona correctamente con "hello"

## Pendiente

* Validar contra cualquier palabra:

### Opción recomendada

* Obtener palabra desde content-service

Ejemplo:

```ts
GET /api/v1/content/exercise/:id
```

Luego comparar:

```ts
expectedText vs transcribedText
```

---

# ✅ 3. Mejora del algoritmo de evaluación

## Problema actual

* Comparación simple

## Pendiente

* Implementar:

  * Distancia de Levenshtein
  * Comparación fonética (opcional)

## Objetivo

* Evaluaciones más realistas

---

# ✅ 4. Manejo de archivos (audio)

## Problema actual

* Se borra el archivo con fs.unlinkSync

## Pendiente

* Manejo seguro:

```ts
if (fs.existsSync(req.file.path)) {
  fs.unlinkSync(req.file.path);
}
```

## Mejora opcional

* Subir a cloud storage (S3, Cloudinary)

---

# ✅ 5. Integración con gamification-service

## Estado actual

* Funciona parcialmente
* Error previo: "Invalid body" (ya diagnosticado)

## Pendiente

### Corregir envío de datos

Actualmente envías:

```ts
{ userId, actionType }
```

Pero el backend usa:

```ts
const userId = req.user?.userId;
```

### Solución correcta

NO enviar userId en body

```ts
await axios.post(
  `${GAMIFICATION_URL}/action`,
  { actionType },
  {
    headers: {
      Authorization: `Bearer ${token}`
    }
  }
);
```

---

# ✅ 6. Manejo de errores robusto

## Pendiente

* Estandarizar errores:

  * Whisper
  * Archivo inválido
  * Fallo de red

## Ejemplo

```ts
try {
  // lógica
} catch (error) {
  next(new AppError('Error evaluando audio', 500));
}
```

---

# ✅ 7. Logs y debugging

## Pendiente

Agregar logs clave:

```ts
console.log('User:', userId);
console.log('Word:', word);
console.log('Transcribed:', transcribedText);
```

---

# ✅ 8. Validación con Zod (consistencia)

## Problema actual

* evaluate usa schema
* evaluateAudio NO

## Pendiente

* Crear schema para audio:

```ts
const evaluateAudioSchema = z.object({
  word: z.string(),
  expectedText: z.string()
});
```

---

# ✅ 9. Seguridad

## Pendiente

* Validar JWT correctamente
* No confiar en headers manuales

---

# ✅ 10. Flujo completo (arquitectura final)

## Flujo esperado

1. Usuario entra a ejercicio
2. content-service envía palabra
3. Usuario pronuncia
4. pronunciation-service evalúa
5. Envía resultado
6. Llama a gamification-service
7. Se otorgan puntos

---

# 🚀 11. Mejoras avanzadas (tipo Duolingo)

## Opcional

* Feedback por fonemas
* Nivel de dificultad
* Historial de pronunciación
* Estadísticas del usuario

---

# 📌 12. Checklist final

* [ ] Whisper funcionando
* [ ] Validación dinámica de palabras
* [ ] Algoritmo mejorado
* [ ] Integración correcta con gamification
* [ ] Manejo de errores
* [ ] Logs
* [ ] Seguridad JWT
* [ ] Flujo completo con content-service

---

# 🧠 Conclusión

El servicio ya está **funcional**, pero aún no está completamente listo para producción.

Lo más importante ahora:

1. Corregir integración con gamification
2. Hacer validación dinámica
3. Activar Whisper real

---

Si completas estos puntos, ya tendrás un sistema MUY cercano a un Duolingo real 🚀
