# Codify deployment guide

This guide migrates Codify from local development to a hosted API and
cloud-built mobile application. The backend is deployed first so every EAS
build receives a working HTTPS API URL.

## 1. Prepare the production services

Create or identify:

- A production PostgreSQL database. The existing schema and migration history
  work with a hosted PostgreSQL provider such as Neon or Render Postgres.
- A Clerk production instance, or an intentional decision to keep using the
  Clerk development instance during preview testing.
- An Expo account with access to the `codify-fda/codify` EAS project.
- Apple Developer and Google Play Console accounts before store submission.

Keep the Clerk secret key and database URL out of Git. They belong in Render.
The Expo publishable key and API URL are public bundle configuration and belong
in EAS environments.

## 2. Deploy the backend on Render

The root `render.yaml` defines a `codify-api` Node web service with:

- `backend/` as the monorepo root directory
- deterministic installation through `npm ci`
- a TypeScript production build
- `prisma migrate deploy` before the API starts
- the `/health` health check
- automatic deployment only after GitHub CI checks pass

In the Render Dashboard:

1. Create a new Blueprint and connect this GitHub repository.
2. Select the repository's `render.yaml`.
3. Supply the prompted secret values:
   - `DATABASE_URL`
   - `CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
4. Review `CORS_ORIGIN`. `*` is suitable for native clients. If the API is
   called from a deployed web app, replace it with that web app's exact origin.
5. Create the Blueprint and wait for CI, build, migration, and health checks.

The Blueprint starts on Render's Free instance type. Because Free services do
not support pre-deploy commands, `npm run start:render` applies pending Prisma
migrations before starting the compiled API. The command also runs after a Free
service wakes from sleep; when there are no pending migrations it exits quickly.

Render Free services can sleep after inactivity and are intended for testing,
not a production mobile API. Before a public release, upgrade to a paid instance,
move `npm run prisma:migrate:deploy` to `preDeployCommand`, and change the start
command back to `npm start`. This keeps migrations separate from application
startup when multiple instances or zero-downtime deploys are in use.

After deployment, verify:

```text
https://codify-api-hkjj.onrender.com/health
```

The response should have HTTP status `200` and identify `codify-backend`.

## 3. Configure EAS environments

Sign in and verify that the local project is linked to the expected EAS project:

```powershell
npx eas-cli@latest login
npx eas-cli@latest project:info
```

Create the public app variables for the preview environment:

```powershell
npx eas-cli@latest env:create --name EXPO_PUBLIC_API_URL --value https://codify-api-hkjj.onrender.com --environment preview --visibility plaintext
npx eas-cli@latest env:create --name EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY --value YOUR_CLERK_PUBLISHABLE_KEY --environment preview --visibility plaintext
```

Create the same variable names in the production environment, using production
values:

```powershell
npx eas-cli@latest env:create --name EXPO_PUBLIC_API_URL --value https://codify-api-hkjj.onrender.com --environment production --visibility plaintext
npx eas-cli@latest env:create --name EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY --value YOUR_CLERK_PUBLISHABLE_KEY --environment production --visibility plaintext
```

Anything bundled into an Expo client is readable by users. Never add the Clerk
secret key or database URL to EAS client variables.

## 4. Build and test preview

The `preview` profile creates internally distributed builds. Android uses an APK
so it can be installed directly on test devices.

```powershell
npx eas-cli@latest build --profile preview --platform android
npx eas-cli@latest build --profile preview --platform ios
```

Before production, test at least:

- Sign-up, sign-in, sign-out, and token refresh
- Product search and barcode lookup
- Scan history creation, refresh, and deletion
- Allergen preference synchronization
- Product report submission and history
- App restart, offline behavior, and a slow/cold API start

## 5. Build and submit production

The `production` profile uses EAS-managed build numbers and creates store-ready
artifacts. Cloud builds and store accounts can incur charges.

```powershell
npx eas-cli@latest build --profile production --platform all
```

After configuring store credentials with EAS, submit each successful build:

```powershell
npx eas-cli@latest submit --profile production --platform ios
npx eas-cli@latest submit --profile production --platform android
```

Do not put Apple or Google credentials in `eas.json`. Let EAS credential
management or protected CI secrets supply them.

## 6. Release and rollback

For each release:

1. Merge only after GitHub CI passes.
2. Let Render deploy and run `prisma migrate deploy`.
3. Verify `/health` and exercise a protected endpoint with a test user.
4. Build the EAS preview profile and complete smoke testing.
5. Promote with a production build and store submission.

If the backend release fails, Render keeps the last healthy deployment. Fix the
forward migration or application code and redeploy; do not edit an already
applied Prisma migration. If a mobile release is faulty, stop its staged store
rollout and submit a corrected build with the next remotely managed build
number.
