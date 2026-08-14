import assert from "node:assert/strict";
import fs from "fs";
import os from "os";
import path from "path";
import test from "node:test";
import JSZip from "jszip";
import {
  createBackupFilename,
  createFullBackupArchive,
  hashFileSha256,
} from "../src/services/backup-archive";

test("同一秒创建的备份仍使用不同文件名", () => {
  const now = new Date("2026-08-14T02:00:00.000Z");
  const first = createBackupFilename("full", "11111111-1111-4111-8111-111111111111", now);
  const second = createBackupFilename("full", "22222222-2222-4222-8222-222222222222", now);
  assert.notEqual(first, second);
  assert.match(first, /^nowen-backup-full-2026-08-14T02-00-00-[a-f0-9]{8}\.zip$/);
});

test("完整备份创建时不会把附件或最终 ZIP 整包读入内存", async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "nowen-full-backup-streaming-"));
  const dataDir = path.join(root, "data");
  const backupDir = path.join(root, "backups");
  const attachmentDir = path.join(dataDir, "attachments");
  const attachmentPath = path.join(attachmentDir, "sample.bin");
  const dbPath = path.join(root, "db.sqlite");
  const zipPath = path.join(backupDir, "nowen-backup-full-test.zip");
  fs.mkdirSync(attachmentDir, { recursive: true });
  fs.mkdirSync(backupDir, { recursive: true });
  fs.writeFileSync(attachmentPath, Buffer.alloc(256 * 1024, 0x5a));
  fs.writeFileSync(dbPath, Buffer.from("SQLite format 3\0test database snapshot"));

  const originalReadFileSync = fs.readFileSync;
  (fs as any).readFileSync = function guardedReadFileSync(target: fs.PathOrFileDescriptor, ...args: unknown[]) {
    const resolved = typeof target === "string" ? path.resolve(target) : "";
    const isFinalZip = resolved.startsWith(path.resolve(backupDir) + path.sep) && resolved.endsWith(".zip");
    if (resolved === path.resolve(attachmentPath) || isFinalZip) {
      throw new Error(`禁止整包读取：${resolved}`);
    }
    return (originalReadFileSync as any).call(fs, target, ...args);
  };

  try {
    const stats = await createFullBackupArchive({
      zipPath,
      dbPath,
      dataDir,
      buildMeta: (files) => ({ formatVersion: 2, type: "full", files }),
    });
    const hashed = await hashFileSha256(zipPath);
    assert.equal(stats.attachments.count, 1);
    assert.equal(hashed.size, fs.statSync(zipPath).size);
    assert.match(hashed.checksum, /^[a-f0-9]{64}$/);
  } finally {
    (fs as any).readFileSync = originalReadFileSync;
  }

  try {
    const zip = await JSZip.loadAsync(fs.readFileSync(zipPath));
    assert.ok(zip.file("db.sqlite"));
    assert.ok(zip.file("attachments/sample.bin"));
    assert.ok(zip.file("meta.json"));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
