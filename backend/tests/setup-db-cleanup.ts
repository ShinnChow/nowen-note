import test from "node:test";

let closed = false;

test.after(async () => {
  if (closed) return;
  closed = true;
  const { closeDb } = await import("../src/db/schema.ts");
  closeDb();
});
