import { app } from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./lib/prisma.js";

console.log("Starting Codify backend...");

const server = app.listen(env.PORT, "0.0.0.0", () => {
  console.log("");
  console.log("Codify backend started successfully.");
  console.log(`Environment: ${env.NODE_ENV}`);
  console.log(`Local URL: http://localhost:${env.PORT}`);
  console.log("");
});

server.on("error", (error) => {
  console.error("Backend server failed to start:", error);
  process.exit(1);
});

let isShuttingDown = false;

function shutdownServer(signal: string) {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;

  console.log(`${signal} received. Closing Codify backend...`);

  server.close(async (error) => {
    if (error) {
      console.error("Failed to close the backend cleanly:", error);
      process.exit(1);
    }

    try {
      await prisma.$disconnect();

      console.log("Database connection closed.");
      console.log("Codify backend closed.");

      process.exit(0);
    } catch (disconnectError) {
      console.error(
        "Failed to close the database connection:",
        disconnectError,
      );

      process.exit(1);
    }
  });

  setTimeout(() => {
    console.error("Forced backend shutdown.");
    process.exit(1);
  }, 10_000).unref();
}

process.on("SIGINT", () => {
  shutdownServer("SIGINT");
});

process.on("SIGTERM", () => {
  shutdownServer("SIGTERM");
});
