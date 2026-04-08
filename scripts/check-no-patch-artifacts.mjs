import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";

const FORBIDDEN_PATTERNS = [
  /^\(cd "\$\(git rev-parse --show-toplevel\)" && git apply --3way <<'EOF'/,
  /^---\s+.+/,
  /^\+\+\+\s+.+/,
  /^@@\s?.*/,
];

const sourceFiles = execSync("git ls-files 'server/**/*.ts' 'client/**/*.ts' 'client/**/*.tsx' 'shared/**/*.ts'", {
  encoding: "utf8",
})
  .split("\n")
  .map((line) => line.trim())
  .filter(Boolean);

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
  console.error("[integrity] Foram encontrados possíveis artefatos de patch em arquivos fonte:\n");
  console.error(violations.join("\n"));
  process.exit(1);
}

console.log("[integrity] Verificação de artefatos de patch concluída sem problemas.");
