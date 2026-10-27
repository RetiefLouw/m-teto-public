import app from "./app";
import { seedPhase2 } from "./lib/seed-phase2";
import { seedGauteng } from "./lib/seed-gauteng";
import { seedCSOs } from "./lib/seed-cso";
import { seedLegalProBono } from "./lib/seed-legal-probono";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
  seedPhase2().catch(console.error);
  seedGauteng().catch(console.error);
  seedCSOs().catch(console.error);
  seedLegalProBono().catch(console.error);
});
