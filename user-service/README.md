# User Service

Instrucciones para ejecutar, migrar y probar el `user-service` localmente.

Requisitos
- Node.js 18+ y npm
- MySQL 8+

Variables de entorno mínimas (`.env`):

```
PORT=4000
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_db_password
DB_DATABASE=user_service_db
JWT_SECRET=change_this_secret
JWT_EXPIRES_IN=1h
BCRYPT_SALT_ROUNDS=10
```

1) Instalar dependencias

```powershell
cd user-service
npm ci
```

Nota: si `npm ci` falla por lockfile, usa `npm install`.

2) Aplicar migraciones (crear base y tablas)

```powershell
# usando las variables de entorno anteriores
cd user-service
npm run migrate:test-db
```

El script `scripts/setupTestDb.js` ejecuta `migrations/create_tables.sql` contra la base configurada por `DB_*`.

3) Ejecutar el servicio en desarrollo

```powershell
npm run dev
```

4) Ejecutar tests (requiere MySQL accesible con credenciales en env)

```powershell
# exportar vars (PowerShell)
$env:DB_HOST='127.0.0.1'; $env:DB_USER='root'; $env:DB_PASSWORD='your_db_password'; $env:DB_DATABASE='user_service_db'; $env:JWT_SECRET='local_secret'
npm test
```

5) Ejemplos curl

- Registro
```bash
curl -X POST http://localhost:4000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"juan","email":"juan@example.com","password":"Password123!"}'
```

- Login
```bash
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"emailOrUsername":"juan@example.com","password":"Password123!"}'
```

- Refresh
```bash
curl -X POST http://localhost:4000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"<REFRESH_TOKEN>"}'
```

- Logout
```bash
curl -X POST http://localhost:4000/api/v1/auth/logout \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"<REFRESH_TOKEN>"}'
```

6) Notas de despliegue
- Asegura que `JWT_SECRET` es idéntico en `api-gateway` y `user-service`.
- Revisa la migración de IDs existentes si tu base anterior usaba INT — convertir a UUID requiere pasos adicionales.

7) CI
Se añadió un workflow de GitHub Actions en `.github/workflows/ci.yml` que levanta MySQL, aplica migración y corre tests.

8) Próximos pasos recomendados
- Auditar formato de respuesta en controladores
- Añadir rate-limiting y bloqueo de cuenta
- Implementar email verification y password-reset si será público# User Service

Microservice providing user management (register, login, profile, streaks).

Run locally:

1. Copy `.env.example` to `.env` and set DB credentials.
2. Install deps: `npm install`
3. Dev: `npm run dev`
4. Build: `npm run build` then `npm start`
