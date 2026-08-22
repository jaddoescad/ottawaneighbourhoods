import { spawnSync } from "node:child_process";
import { verifyVercelTarget } from "./verify-vercel-target.mjs";

const VERCEL_VERSION = "59.4.0";

function runVercel(args, { capture = false } = {}) {
  const result = spawnSync(
    "npx",
    ["--yes", `vercel@${VERCEL_VERSION}`, ...args],
    {
      cwd: process.cwd(),
      encoding: "utf8",
      stdio: capture ? "pipe" : "inherit",
    },
  );

  if (capture) {
    if (result.stdout) process.stdout.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }

  return `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
}

const target = await verifyVercelTarget();
const action = process.argv[2];

if (action === "preview") {
  console.log(
    `Creating preview for verified project ${target.scope}/${target.projectName}...`,
  );
  runVercel(["deploy", "--yes", "--scope", target.scope]);
  process.exit(0);
}

if (action === "promote") {
  const deploymentUrl = process.argv[3];

  if (!deploymentUrl) {
    console.error(
      "Production promotion blocked: provide the verified preview URL. Usage: npm run deploy:promote -- https://<preview>.vercel.app",
    );
    process.exit(1);
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(deploymentUrl);
  } catch {
    console.error("Production promotion blocked: the preview URL is invalid.");
    process.exit(1);
  }

  if (
    parsedUrl.protocol !== "https:" ||
    !parsedUrl.hostname.endsWith(".vercel.app")
  ) {
    console.error(
      "Production promotion blocked: only an HTTPS Vercel preview URL can be promoted.",
    );
    process.exit(1);
  }

  const inspection = runVercel(
    ["inspect", deploymentUrl, "--scope", target.scope],
    { capture: true },
  );

  if (!inspection.includes(target.projectName)) {
    console.error(
      "Production promotion blocked: the preview does not belong to the approved ottawahoods project.",
    );
    process.exit(1);
  }

  console.log(
    `Promoting verified preview to ${target.productionDomain} without rebuilding...`,
  );
  runVercel(["promote", deploymentUrl, "--yes", "--scope", target.scope]);
  process.exit(0);
}

console.error(
  "Unsupported deployment action. Use `preview` or `promote <preview-url>`. Direct production deployments are intentionally disabled.",
);
process.exit(1);
