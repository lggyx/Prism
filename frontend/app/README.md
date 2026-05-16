# Prism Frontend

Mobile-first React + Capacitor frontend for 世界观透镜.

## Stack

- Bun
- Vite
- React + TypeScript
- React Router
- TanStack Query
- Zustand
- Zod
- Capacitor 8 Android

## Development

Start the mock server:

```powershell
cd D:\Prism\MOCK
bun run start
```

Start the frontend:

```powershell
cd D:\Prism\frontend\app
bun install
bun run dev
```

Build and sync Android:

```powershell
bun run build
bun run cap:add:android
bun run cap:sync
```
