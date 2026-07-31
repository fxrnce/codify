import { spawn } from "node:child_process";

const MAX_DATABASE_ATTEMPTS = 5;
const BASE_RETRY_DELAY_MS = 5_000;
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      env: process.env,
      stdio: "inherit",
    });

    child.once("error", reject);
    child.once("exit", (code, signal) => {
      resolve({
        code: code ?? 1,
        signal,
      });
    });
  });
}

function wait(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

async function runDatabaseTask(scriptName, label) {
  for (let attempt = 1; attempt <= MAX_DATABASE_ATTEMPTS; attempt += 1) {
    console.log(
      `${label} (attempt ${attempt}/${MAX_DATABASE_ATTEMPTS})...`,
    );

    const result = await run(npmCommand, ["run", scriptName]);

    if (result.code === 0) {
      return;
    }

    if (attempt === MAX_DATABASE_ATTEMPTS) {
      throw new Error(
        `${label} failed after ${MAX_DATABASE_ATTEMPTS} attempts.`,
      );
    }

    const retryDelay = BASE_RETRY_DELAY_MS * attempt;

    console.warn(
      `${label} could not reach the database. Retrying in ${retryDelay / 1_000} seconds...`,
    );

    await wait(retryDelay);
  }
}

async function start() {
  await runDatabaseTask("prisma:migrate:deploy", "Database migration");
  await runDatabaseTask("prisma:seed", "Product catalog seed");

  const server = spawn(process.execPath, ["dist/server.js"], {
    env: process.env,
    stdio: "inherit",
  });

  process.once("SIGINT", () => {
    server.kill("SIGINT");
  });

  process.once("SIGTERM", () => {
    server.kill("SIGTERM");
  });

  server.once("error", (error) => {
    console.error("Failed to launch Codify backend:", error);
    process.exit(1);
  });

  server.once("exit", (code) => {
    process.exit(code ?? 0);
  });
}

start().catch((error) => {
  console.error("Render startup failed:", error);
  process.exit(1);
});
