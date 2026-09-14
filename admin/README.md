# Archived web admin prototype

This directory contains the earlier web interface for reference. It is not an
independent application and intentionally has no `package.json` or `npm run dev`
command.

The active administrator interface is part of the Expo app:

1. Start the backend from `backend/` with `npm run dev`.
2. Start Expo from the repository root with `npx expo start --clear`.
3. Sign in as an account whose database role is `ADMIN`.
4. Open the **Admin** tab in the mobile app.

Administrator routes and permission checks are implemented in
`backend/src/routes/admin.routes.ts`.
