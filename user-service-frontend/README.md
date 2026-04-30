# User Service Frontend

Minimal Vite + React TypeScript frontend for the `user-service`.

Features:
- Login / Register / Profile pages
- Uses cookie-based refresh token flow (`credentials: 'include'`)
- Copies the repo `images/Imagen2.png` into `public/Imagen2.png` automatically on `npm install`

Quick start:

```bash
cd user-service-frontend
npm install
npm run dev
```

Set the API base URL via `VITE_API_URL` (defaults to `http://localhost:3000/api/v1`):

```bash
VITE_API_URL=http://localhost:3001/api/v1 npm run dev
```

Note: The postinstall script copies the logo from the repo root. If you move folders, copy `images/Imagen2.png` into `user-service-frontend/public/Imagen2.png` manually.
