import { execFileSync } from "node:child_process";
import process from "node:process";

const vsixPath = process.argv[2] ?? "api-contract-guardian.vsix";

function fail(message) {
  console.error(`VSIX validation failed: ${message}`);
  process.exit(1);
}

let entries;
try {
  entries = execFileSync("unzip", ["-Z1", vsixPath], { encoding: "utf8" })
    .split(/\r?\n/)
    .filter(Boolean);
} catch {
  fail(`could not read "${vsixPath}". Make sure the extension has been packaged successfully.`);
}

const entrySet = new Set(entries);
const manifestPath = "extension/package.json";

if (!entrySet.has(manifestPath)) {
  fail(`the package is missing the extension manifest at "${manifestPath}".`);
}

let manifest;
try {
  manifest = JSON.parse(
    execFileSync("unzip", ["-p", vsixPath, manifestPath], { encoding: "utf8" }),
  );
} catch {
  fail(`could not read or parse "${manifestPath}" from the VSIX.`);
}

const requiredFiles = [manifestPath];

for (const field of ["main", "icon"]) {
  const configuredPath = manifest[field];
  if (typeof configuredPath !== "string" || configuredPath.length === 0) {
    fail(`the extension manifest must define a valid "${field}" path.`);
  }

  const normalizedPath = configuredPath.replace(/^\.\//, "");
  if (normalizedPath.startsWith("/") || normalizedPath.split("/").includes("..")) {
    fail(`the manifest "${field}" path must stay inside the extension package: "${configuredPath}".`);
  }

  requiredFiles.push(`extension/${normalizedPath}`);
}

const missingFiles = requiredFiles.filter((file) => !entrySet.has(file));

if (missingFiles.length > 0) {
  fail(`required file(s) are missing:\n${missingFiles.map((file) => `- ${file}`).join("\n")}`);
}

console.log(`VSIX validation passed. Found all ${requiredFiles.length} required extension files.`);
