import express, { type Router } from "express";

// Shared harness for router integration tests: mounts a router on a real
// ephemeral port and exposes a small fetch-based request helper, so each
// test file only has to inject fake db/auth dependencies.
export async function startTestServer(mountPath: string, router: Router) {
  const app = express();
  app.use(express.json());
  app.use(mountPath, router);

  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.on("listening", resolve));
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;

  return {
    port,
    async request(
      path: string,
      method = "GET",
      body?: unknown,
      headers: Record<string, string> = {},
    ) {
      const response = await fetch(`http://127.0.0.1:${port}${path}`, {
        method,
        ...(body !== undefined
          ? {
              body: JSON.stringify(body),
              headers: { "Content-Type": "application/json", ...headers },
            }
          : { headers }),
      });
      const responseBody = await response.json().catch(() => ({}));
      return { status: response.status, body: responseBody };
    },
    async close() {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    },
  };
}
