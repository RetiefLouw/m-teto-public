import { spawn, type ChildProcess } from "node:child_process";
import { once } from "node:events";
import { existsSync, readFileSync } from "node:fs";
import { createServer, request as httpRequest } from "node:http";
import { resolve } from "node:path";

const ROOT_DIR = resolve(import.meta.dirname, "../..");
const ENV_PATH = resolve(ROOT_DIR, ".env");
const WEB_PORT = 3000;
const API_PORT = process.env.API_PORT ? Number(process.env.API_PORT) : 5555;
const FRONTEND_PORT = 5173;
const DB_CONTAINER = "mteto-postgres";
const DEFAULT_DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/mteto";
const STARTUP_TIMEOUT_MS = 90_000;

const args = new Set(process.argv.slice(2));

if (args.has("--help") || args.has("-h")) {
  console.log(`Usage: pnpm run dev:web\n\nStarts the learner web app locally by ensuring Postgres is running, applying the Drizzle schema, launching the API and Vite frontend, and exposing both on http://127.0.0.1:${WEB_PORT}.`);
  process.exit(0);
}

const childProcesses: ChildProcess[] = [];
let proxyServer: ReturnType<typeof createServer> | null = null;
let shuttingDown = false;

function log(message: string): void {
  console.log(`[dev:web] ${message}`);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolvePromise) => setTimeout(resolvePromise, ms));
}

function parseEnvFile(filePath: string): Record<string, string> {
  if (!existsSync(filePath)) {
    return {};
  }

  const content = readFileSync(filePath, "utf8");
  const env: Record<string, string> = {};

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const equalsIndex = line.indexOf("=");
    if (equalsIndex === -1) {
      continue;
    }

    const key = line.slice(0, equalsIndex).trim();
    let value = line.slice(equalsIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    env[key] = value;
  }

  return env;
}

const fileEnv = parseEnvFile(ENV_PATH);
const sharedEnv: NodeJS.ProcessEnv = {
  ...process.env,
  ...fileEnv,
  DATABASE_URL: fileEnv.DATABASE_URL || process.env.DATABASE_URL || DEFAULT_DATABASE_URL,
  ADMIN_PIN: fileEnv.ADMIN_PIN || process.env.ADMIN_PIN || "",
  ISSUER_URL: fileEnv.ISSUER_URL || process.env.ISSUER_URL || "https://replit.com/oidc",
  REPL_ID: fileEnv.REPL_ID || process.env.REPL_ID || "replace-with-your-replit-app-id",
  AI_INTEGRATIONS_OPENAI_BASE_URL:
    fileEnv.AI_INTEGRATIONS_OPENAI_BASE_URL ||
    process.env.AI_INTEGRATIONS_OPENAI_BASE_URL ||
    "https://api.openai.com/v1",
  AI_INTEGRATIONS_OPENAI_API_KEY:
    fileEnv.AI_INTEGRATIONS_OPENAI_API_KEY ||
    process.env.AI_INTEGRATIONS_OPENAI_API_KEY ||
    "replace-with-your-openai-api-key",
};

function prefixOutput(name: string, stream: NodeJS.ReadableStream | null, target: NodeJS.WriteStream): void {
  if (!stream) {
    return;
  }

  let buffer = "";
  stream.setEncoding("utf8");
  stream.on("data", (chunk: string) => {
    buffer += chunk;
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (line.length > 0) {
        target.write(`[${name}] ${line}\n`);
      }
    }
  });
  stream.on("end", () => {
    if (buffer.length > 0) {
      target.write(`[${name}] ${buffer}\n`);
    }
  });
}

function spawnManagedProcess(
  name: string,
  command: string,
  commandArgs: string[],
  env: NodeJS.ProcessEnv,
): ChildProcess {
  const child = spawn(command, commandArgs, {
    cwd: ROOT_DIR,
    env,
    stdio: ["ignore", "pipe", "pipe"],
  });

  childProcesses.push(child);
  prefixOutput(name, child.stdout, process.stdout);
  prefixOutput(name, child.stderr, process.stderr);

  child.on("exit", (code, signal) => {
    if (!shuttingDown && code !== 0) {
      console.error(
        `[${name}] exited unexpectedly with ${signal ? `signal ${signal}` : `code ${code}`}`,
      );
      void shutdown(1);
    }
  });

  return child;
}

function runCommand(
  label: string,
  command: string,
  commandArgs: string[],
  env: NodeJS.ProcessEnv,
): Promise<void> {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, commandArgs, {
      cwd: ROOT_DIR,
      env,
      stdio: ["ignore", "pipe", "pipe"],
    });

    prefixOutput(label, child.stdout, process.stdout);
    prefixOutput(label, child.stderr, process.stderr);

    child.on("error", reject);
    child.on("exit", (code, signal) => {
      if (code === 0) {
        resolvePromise();
        return;
      }

      reject(
        new Error(
          `${label} failed with ${signal ? `signal ${signal}` : `code ${code}`}`,
        ),
      );
    });
  });
}

function runDocker(commandArgs: string[]): Promise<void> {
  return runCommand("docker", "docker", commandArgs, process.env);
}

function runDockerCapture(commandArgs: string[]): Promise<string> {
  return new Promise((resolvePromise, reject) => {
    const child = spawn("docker", commandArgs, {
      cwd: ROOT_DIR,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    child.stdout?.setEncoding("utf8");
    child.stderr?.setEncoding("utf8");
    child.stdout?.on("data", (chunk: string) => {
      stdout += chunk;
    });
    child.stderr?.on("data", (chunk: string) => {
      stderr += chunk;
    });

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolvePromise(stdout.trim());
        return;
      }

      reject(new Error(stderr.trim() || `docker ${commandArgs.join(" ")} failed`));
    });
  });
}

async function isHttpReady(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(1_500) });
    return response.ok;
  } catch {
    return false;
  }
}

async function waitForHttp(url: string, label: string): Promise<void> {
  const deadline = Date.now() + STARTUP_TIMEOUT_MS;

  while (Date.now() < deadline) {
    if (await isHttpReady(url)) {
      return;
    }
    await delay(1_000);
  }

  throw new Error(`${label} did not become ready at ${url}`);
}

async function ensureDockerAvailable(): Promise<void> {
  await runDocker(["--version"]);
}

async function ensurePostgres(): Promise<void> {
  log("Ensuring local PostgreSQL is available in Docker...");
  await ensureDockerAvailable();

  let exists = true;
  try {
    await runDockerCapture(["inspect", DB_CONTAINER]);
  } catch {
    exists = false;
  }

  if (!exists) {
    await runDocker(["pull", "postgres:16"]);
    await runDocker([
      "run",
      "-d",
      "--name",
      DB_CONTAINER,
      "-e",
      "POSTGRES_USER=postgres",
      "-e",
      "POSTGRES_PASSWORD=postgres",
      "-e",
      "POSTGRES_DB=mteto",
      "-p",
      "127.0.0.1:5432:5432",
      "postgres:16",
    ]);
  } else {
    const running = await runDockerCapture([
      "inspect",
      "-f",
      "{{.State.Running}}",
      DB_CONTAINER,
    ]);

    if (running !== "true") {
      await runDocker(["start", DB_CONTAINER]);
    }
  }

  const deadline = Date.now() + STARTUP_TIMEOUT_MS;
  while (Date.now() < deadline) {
    try {
      await runDocker(["exec", DB_CONTAINER, "pg_isready", "-U", "postgres", "-d", "mteto"]);
      log("PostgreSQL is ready.");
      return;
    } catch {
      await delay(1_000);
    }
  }

  throw new Error("PostgreSQL did not become ready in time.");
}

async function applySchema(): Promise<void> {
  log("Applying database schema...");
  await runCommand("db", "pnpm", ["--dir", "lib/db", "run", "push"], sharedEnv);
}

function startApi(): ChildProcess {
  log("Starting API server...");
  return spawnManagedProcess("api", "pnpm", ["--dir", "artifacts/api-server", "run", "dev"], {
    ...sharedEnv,
    NODE_ENV: "development",
    PORT: String(API_PORT),
  });
}

function startFrontend(): ChildProcess {
  log("Starting learner web app frontend...");
  const env: NodeJS.ProcessEnv = {
    ...sharedEnv,
    PORT: String(FRONTEND_PORT),
    BASE_PATH: "/",
  };

  delete env["REPL_ID"];

  return spawnManagedProcess("web", "pnpm", ["--dir", "artifacts/m-teto", "run", "dev"], env);
}

async function startProxy(): Promise<void> {
  if (proxyServer) {
    return;
  }

  proxyServer = createServer((incomingRequest, outgoingResponse) => {
    const targetPort = incomingRequest.url?.startsWith("/api") ? API_PORT : FRONTEND_PORT;

    const proxyRequest = httpRequest(
      {
        hostname: "127.0.0.1",
        port: targetPort,
        path: incomingRequest.url,
        method: incomingRequest.method,
        headers: {
          ...incomingRequest.headers,
          host: `127.0.0.1:${targetPort}`,
        },
      },
      (proxyResponse) => {
        outgoingResponse.writeHead(proxyResponse.statusCode ?? 502, proxyResponse.headers);
        proxyResponse.pipe(outgoingResponse, { end: true });
      },
    );

    proxyRequest.on("error", (error) => {
      outgoingResponse.writeHead(502, { "content-type": "text/plain" });
      outgoingResponse.end(`Proxy error: ${error.message}`);
    });

    incomingRequest.pipe(proxyRequest, { end: true });
  });

  proxyServer.listen(WEB_PORT, "0.0.0.0");
  await once(proxyServer, "listening");
}

async function shutdown(exitCode = 0): Promise<void> {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  log("Shutting down local web stack...");

  if (proxyServer) {
    await new Promise<void>((resolvePromise) => {
      proxyServer?.close(() => resolvePromise());
    });
  }

  for (const child of childProcesses) {
    if (!child.killed) {
      child.kill("SIGTERM");
    }
  }

  await delay(500);

  for (const child of childProcesses) {
    if (child.exitCode === null && !child.killed) {
      child.kill("SIGKILL");
    }
  }

  process.exit(exitCode);
}

process.on("SIGINT", () => {
  void shutdown(0);
});
process.on("SIGTERM", () => {
  void shutdown(0);
});

async function main(): Promise<void> {
  await ensurePostgres();
  await applySchema();
  startApi();
  await waitForHttp(`http://127.0.0.1:${API_PORT}/api/healthz`, "API server");
  startFrontend();
  await waitForHttp(`http://127.0.0.1:${FRONTEND_PORT}/`, "frontend dev server");
  await startProxy();
  await waitForHttp(`http://127.0.0.1:${WEB_PORT}/api/healthz`, "local proxy");

  log(`Ready: http://127.0.0.1:${WEB_PORT}`);
  log(`API health: http://127.0.0.1:${WEB_PORT}/api/healthz`);
  log("Press Ctrl+C to stop the web and API processes. The Docker Postgres container is left running for faster restarts.");
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[dev:web] ${message}`);
  void shutdown(1);
});
