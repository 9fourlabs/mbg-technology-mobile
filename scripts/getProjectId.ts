import { tenantProjects } from "./tenantProjects";

const [, , tenant] = process.argv;

if (!tenant) {
  // eslint-disable-next-line no-console
  console.error("Usage: tsx scripts/getProjectId.ts <tenant-id>");
  process.exit(1);
}

const id = tenantProjects[tenant];
if (!id) {
  // eslint-disable-next-line no-console
  console.error(`Unknown tenant "${tenant}". Add it to scripts/tenantProjects.ts`);
  process.exit(1);
}

// eslint-disable-next-line no-console
console.log(id);

