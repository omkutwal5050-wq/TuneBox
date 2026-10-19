# TuneBox

## Development

Install both dependency sets, configure `backend/.env` from
[`backend/.env.example`](./backend/.env.example), then run:

```powershell
npm run dev
cd backend
npm run dev
```

The backend serves local media at `/songs`, `/coverpages`, and uploaded files at
`/uploads`. Set `VITE_API_URL` to the deployed API base URL when building the
frontend. Set `FRONTEND_ORIGINS` on the backend to a comma-separated list of
allowed frontend origins, without trailing slashes:

```env
FRONTEND_ORIGINS=https://tunebox.example.com,https://www.tunebox.example.com
```

Local development defaults to `http://localhost:5173` and
`http://127.0.0.1:5173`. In production, `FRONTEND_ORIGINS` is required.

## API additions

- JWT authentication is returned by `/api/auth/register` and `/api/auth/login`.
- Existing profile, likes, and embedded playlist fields remain compatible.
- `POST /api/users/:userId/recently-played` stores the complete play history,
  including a track snapshot so old external previews remain available.
- `GET /api/recommendations/:userId` returns personalized local tracks.
- `GET /api/catalog/facets` returns genres, artists, and albums.
- `POST /api/admin/songs` accepts `title`, `artist`, `genre`, optional metadata,
  and multipart `audio` plus `cover` files for admin users.

Run backend regression tests with:

```powershell
cd backend
npm test
```

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
