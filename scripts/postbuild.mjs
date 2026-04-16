import fs from "node:fs/promises";
import path from "node:path";

const distDir = path.resolve("dist");
const cliPath = path.resolve("dist/cli.js");
const cliContents = await fs.readFile(cliPath, "utf8");

if (!cliContents.startsWith("#!/usr/bin/env node\n")) {
  await fs.writeFile(cliPath, `#!/usr/bin/env node\n${cliContents}`, "utf8");
}

await fs.chmod(cliPath, 0o755);

for (const entry of await fs.readdir(distDir)) {
  if (entry.endsWith(".map")) {
    await fs.rm(path.join(distDir, entry), { force: true });
  }
}
