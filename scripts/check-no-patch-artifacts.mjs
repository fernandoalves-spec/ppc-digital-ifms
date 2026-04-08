import { readdirSync, readFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { join, relative } from "node:path";

const FORBIDDEN_PATTERNS = [
  /^\(cd "\$\(git rev-parse --show-toplevel\)" && git apply --3way <<'EOF'/,
  /^---\s+.+/,
  /^\+\+\+\s+.+/,
  /^@@\s?.*/,
];

function listFilesFromGit() {
  try {
    return execSync(
      "git ls-files 'server/**/*.ts' 'client/**/*.ts' 'client/**/*.tsx' 'shared/**/*.ts'",
      { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
    )
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  } catch {
    return null;
  }
}

function listFilesFromFs() {
  const roots = ["server", "client", "shared"];
  const files = [];

  const visit = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === "node_modules" || entry.name === ".git" || entry.name === "dist") continue;

      const fullPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        visit(fullPath);
        continue;
      }

      if (!entry.isFile()) continue;

      const isTs = fullPath.endsWith(".ts") || fullPath.endsWith(".tsx");
      if (!isTs) continue;

      files.push(relative(process.cwd(), fullPath).replaceAll("\\", "/"));
    }
  };

  for (const root of roots) {
    visit(root);
  }

  return files;
}

const sourceFiles = listFilesFromGit() ?? listFilesFromFs();
const violations = [];

for (const file of sourceFiles) {
  const lines = readFileSync(file, "utf8").split(/\r?\n/);
  lines.forEach((line, index) => {
    if (FORBIDDEN_PATTERNS.some((pattern) => pattern.test(line))) {
      violations.push(`${file}:${index + 1}: ${line}`);
    }
  });
}

if (violations.length > 0) {
  console.error("[integrity] Possible patch artifacts were found in source files:\n");
  console.error(violations.join("\n"));
  process.exit(1);
}

console.log("[integrity] Patch artifact check completed successfully.");
