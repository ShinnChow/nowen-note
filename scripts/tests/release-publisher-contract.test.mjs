import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const rootDir = path.resolve(path.dirname(__filename), "../..");

async function readRepoFile(relativePath) {
  return readFile(path.join(rootDir, relativePath), "utf8");
}

test("tag 构建工作流只产出 artifacts，不直接发布 GitHub Release", async () => {
  const workflow = await readRepoFile(".github/workflows/release.yml");

  assert.match(workflow, /node-version:\s*["']22["']/);
  assert.match(workflow, /permissions:\s*\n\s*contents:\s*read/);
  assert.equal((workflow.match(/--publish never/g) || []).length, 4);
  assert.doesNotMatch(workflow, /--publish always/);
  assert.doesNotMatch(workflow, /github\.event_name\s*==\s*['"]push['"]/);
  assert.doesNotMatch(workflow, /GH_TOKEN:/);
  assert.match(workflow, /actions\/upload-artifact@v4/);
});

test("本地发布守卫在正式校验前汇总 CI macOS 产物", async () => {
  const releaseGuard = await readRepoFile("scripts/release.sh");

  assert.match(releaseGuard, /nowen-note-mac/);
  assert.match(releaseGuard, /gh run download/);
  assert.match(releaseGuard, /gh release upload/);
  assert.match(releaseGuard, /--clobber/);
  assert.match(releaseGuard, /failed to collect CI macOS assets; keeping \$\{TAG\} as draft/);

  const collectIndex = releaseGuard.lastIndexOf("if ! collect_ci_mac_assets");
  const verifyIndex = releaseGuard.indexOf("==== 验证 GitHub Release 更新元数据与远端资产 ====", collectIndex);
  assert.ok(collectIndex >= 0, "缺少 CI macOS 产物汇总调用");
  assert.ok(verifyIndex > collectIndex, "必须先汇总 CI macOS 产物，再执行远端 Release 校验");
});

test("Windows Node ZIP 使用 PowerShell Expand-Archive 解压", async () => {
  const fetchNode = await readRepoFile("scripts/fetch-node.mjs");

  assert.match(fetchNode, /process\.platform === "win32"/);
  assert.match(fetchNode, /powershell\.exe/);
  assert.match(fetchNode, /Expand-Archive/);
  assert.match(fetchNode, /-LiteralPath/);
  assert.match(fetchNode, /-DestinationPath/);
  assert.match(fetchNode, /ZIP 解压成功但未找到目标文件/);
});
