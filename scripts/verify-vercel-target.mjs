import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const EXPECTED = Object.freeze({
  projectName: "ottawahoods",
  projectId: "prj_ICwu9dVSEREXhDWTKs5NXgkdmeUT",
  orgId: "team_BxZ3OyyDivO3QiELtRdt328i",
  scope: "jad-slims-projects",
  productionDomain: "www.ottawahoods.com",
});

export async function verifyVercelTarget() {
  const linkPath = resolve(process.cwd(), ".vercel/project.json");
  let linkedProject;

  try {
    linkedProject = JSON.parse(await readFile(linkPath, "utf8"));
  } catch {
    throw new Error(
      "Deployment blocked: .vercel/project.json is missing or invalid. Explicitly link this folder to the existing ottawahoods project; never create a new project.",
    );
  }

  const mismatches = ["projectName", "projectId", "orgId"].filter(
    (key) => linkedProject[key] !== EXPECTED[key],
  );

  if (mismatches.length > 0) {
    throw new Error(
      `Deployment blocked: the linked Vercel target does not match the approved ottawahoods project (${mismatches.join(", ")}).`,
    );
  }

  return EXPECTED;
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(import.meta.filename)) {
  try {
    const target = await verifyVercelTarget();
    console.log(
      `Verified Vercel target: ${target.scope}/${target.projectName} → ${target.productionDomain}`,
    );
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
