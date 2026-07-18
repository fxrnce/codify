# Codify

Codify is an Expo mobile application backed by an Express and PostgreSQL API.
It provides a product catalog, barcode scan history, allergen preferences, and
authenticated product reports.

## Stack

- Expo SDK 54, Expo Router, React Native, and TypeScript
- Clerk authentication
- Express 5 and TypeScript
- Prisma 7 with PostgreSQL
- EAS Build for preview and production app builds
- Render for the backend API

## Requirements

- Node.js 24 and npm
- A PostgreSQL database
- A Clerk application
- Expo Go or an Expo development build for local device testing

## Local setup

1. Install frontend and backend dependencies:

   ```powershell
   npm ci
   npm --prefix backend ci
   ```

2. Create local environment files:

   ```powershell
   Copy-Item .env.example .env
   Copy-Item backend/.env.example backend/.env
   ```

3. Fill in the Clerk and PostgreSQL values in both environment files.

4. Apply the database migrations:

   ```powershell
   npm --prefix backend run prisma:migrate:deploy
   ```

5. Start the API and Expo app in separate terminals:

   ```powershell
   npm --prefix backend run dev
   ```

   ```powershell
   npm start
   ```

`EXPO_PUBLIC_API_URL=http://localhost:3000` works for a web browser and iOS
Simulator. Android Emulator normally uses `http://10.0.2.2:3000`. A physical
device must use the development computer's LAN address, such as
`http://192.168.1.10:3000`.

## Environment variables

The Expo app requires:

- `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `EXPO_PUBLIC_API_URL`

The backend requires:

- `CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `DATABASE_URL`
- `NODE_ENV`, `PORT`, and `CORS_ORIGIN` have safe local defaults

Never put a secret in an `EXPO_PUBLIC_*` variable. Expo embeds those variables
in the application bundle.

## Quality checks

```powershell
npm run lint
npm run typecheck
npm audit --omit=dev --audit-level=high
npm --prefix backend run prisma:validate
npm --prefix backend run typecheck
npm --prefix backend run build
npm --prefix backend audit --omit=dev --audit-level=high
```

GitHub Actions runs the same checks and creates an Android JavaScript bundle on
every pull request and every push to `main`.

## Deployment

The production rollout intentionally follows this order:

1. Deploy the backend to Render.
2. Run the checked-in Prisma migrations against the production database.
3. Verify the Render `/health` endpoint.
4. Configure EAS preview and production variables with the Render HTTPS URL.
5. Build and test a preview APK.
6. Build the store-ready production artifacts.

See [Deployment guide](docs/deployment.md) for the complete Render, database,
EAS, and rollback procedure.
