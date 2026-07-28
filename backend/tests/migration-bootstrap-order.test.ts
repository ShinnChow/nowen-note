import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

test("knowledge-tree bootstrap registers schema versions 60-64 before migrations.ts is evaluated", async () => {
  await import("../src/runtime/knowledge-tree-migration-bootstrap");
  const { CURRENT_SCHEMA_VERSION, MIGRATIONS } = await import("../src/db/migrations");
  const versions = new Set(MIGRATIONS.map((migration) => migration.version));

  for (const version of [60, 61, 62, 63, 64]) {
    assert.ok(versions.has(version), `feature migration v${version} must be registered`);
  }
  assert.ok(
    CURRENT_SCHEMA_VERSION >= 64,
    `expected schema support >= 64, received ${CURRENT_SCHEMA_VERSION}`,
  );
});

test("database-consuming permission runtime loads after the migration bootstrap", () => {
  const indexSource = fs.readFileSync(
    path.resolve(__dirname, "../src/index.hardened.ts"),
    "utf8",
  );
  const bootstrapSource = fs.readFileSync(
    path.resolve(__dirname, "../src/runtime/knowledge-tree-migration-bootstrap.ts"),
    "utf8",
  );

  const bootstrapIndex = indexSource.indexOf('import "./runtime/knowledge-tree-migration-bootstrap.js";');
  const permissionRuntimeIndex = indexSource.indexOf('import "./runtime/notebook-permission-management.js";');

  assert.ok(bootstrapIndex >= 0, "index.hardened must import the migration bootstrap");
  assert.ok(permissionRuntimeIndex >= 0, "index.hardened must import the permission runtime");
  assert.ok(
    bootstrapIndex < permissionRuntimeIndex,
    "feature migrations must be registered before permission runtime evaluation",
  );
  assert.doesNotMatch(
    bootstrapSource,
    /import\s+["']\.\/notebook-permission-management\.js["']/,
    "migration bootstrap must not import database-consuming runtimes",
  );
});
