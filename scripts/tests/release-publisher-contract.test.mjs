import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const {
  assertCompleteMacReleaseAssets,
  findMissingMacReleaseAssets,
  isMacManualDownloadZip,
  requiredMacReleaseAssets,
} = require("../lib/release-platform-assets.cjs");

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

test("SignPath test-signing 只允许手动工作流使用测试证书", async () => {
  const workflow = await readRepoFile(".github/workflows/release.yml");

  assert.match(workflow, /actions:\s*read/);
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /github\.event_name == 'workflow_dispatch'/);
  assert.match(workflow, /signpath\/github-action-submit-signing-request@v2/);
  assert.match(workflow, /api-token:\s*\$\{\{ secrets\.SIGNPATH_API_TOKEN \}\}/);
  assert.match(workflow, /organization-id:\s*["']3fd6029d-c909-43a1-8b30-4d2bcdde4c7a["']/);
  assert.match(workflow, /project-slug:\s*["']nowen-note["']/);
  assert.match(workflow, /signing-policy-slug:\s*["']test-signing["']/);
  assert.match(workflow, /github-artifact-id:\s*\$\{\{ steps\.upload_signpath_test\.outputs\.artifact-id \}\}/);
  assert.match(workflow, /output-artifact-directory:\s*signpath-signed/);
  assert.match(workflow, /Get-AuthenticodeSignature/);
  assert.match(workflow, /nowen-note-win-signpath-test/);

  const signPathBlock = workflow.slice(
    workflow.indexOf("- name: Submit SignPath test signing request"),
    workflow.indexOf("- name: Build Electron (macOS x64 / Intel)"),
  );
  assert.match(signPathBlock, /workflow_dispatch/);
  assert.doesNotMatch(signPathBlock, /refs\/tags/);
  assert.doesNotMatch(signPathBlock, /signing-policy-slug:\s*["']release-signing["']/);
});

test("本地发布守卫在正式校验前汇总完整 CI macOS 产物", async () => {
  const releaseGuard = await readRepoFile("scripts/release.sh");

  assert.match(releaseGuard, /nowen-note-mac/);
  assert.match(releaseGuard, /gh run download/);
  assert.match(releaseGuard, /gh release upload/);
  assert.match(releaseGuard, /--clobber/);
  assert.match(releaseGuard, /release_has_complete_mac_assets/);
  assert.match(releaseGuard, /Nowen-Note-\$\{VERSION\}-x64\.dmg/);
  assert.match(releaseGuard, /Nowen-Note-\$\{VERSION\}-arm64\.dmg/);
  assert.match(releaseGuard, /Nowen-Note-\$\{VERSION\}-x64\.zip/);
  assert.match(releaseGuard, /Nowen-Note-\$\{VERSION\}-arm64\.zip/);
  assert.match(releaseGuard, /latest-mac\.yml/);
  assert.match(releaseGuard, /failed to collect complete CI macOS assets; keeping \$\{TAG\} as draft/);
  assert.match(releaseGuard, /macOS release assets are still incomplete after CI collection/);

  const collectIndex = releaseGuard.lastIndexOf("if ! collect_ci_mac_assets");
  const verifyIndex = releaseGuard.indexOf("==== 验证 GitHub Release 更新元数据与远端资产 ====", collectIndex);
  assert.ok(collectIndex >= 0, "缺少 CI macOS 产物汇总调用");
  assert.ok(verifyIndex > collectIndex, "必须先汇总并确认 macOS 产物完整，再执行远端 Release 校验");
});

test("完整桌面 Release 会写明四个平台支持情况", async () => {
  const releaseGuard = await readRepoFile("scripts/release.sh");

  assert.match(releaseGuard, /ensure_desktop_platform_notes/);
  assert.match(releaseGuard, /### 桌面端支持/);
  assert.match(releaseGuard, /Windows x64/);
  assert.match(releaseGuard, /macOS Intel x64/);
  assert.match(releaseGuard, /macOS Apple Silicon arm64/);
  assert.match(releaseGuard, /Linux x64/);
  assert.match(releaseGuard, /failed to update desktop platform notes; keeping \$\{TAG\} as draft/);
});

test("完整桌面 Release 的远端校验会阻止 macOS 平台整体缺失", async () => {
  const verifier = await readRepoFile("scripts/verify-release-update-assets.mjs");

  assert.match(verifier, /assertCompleteMacReleaseAssets/);
  assert.match(verifier, /byName\.has\("latest\.yml"\) && byName\.has\("latest-linux\.yml"\)/);
  assert.match(verifier, /remote Release \$\{tag\} macOS assets/);
  assert.match(verifier, /!isMacManualDownloadZip\(name\)/);
});

test("macOS 发版资产必须同时包含 Intel、Apple Silicon 与更新元数据", () => {
  const version = "1.4.16";
  const required = requiredMacReleaseAssets(version);

  assert.deepEqual(required, [
    "Nowen-Note-1.4.16-x64.dmg",
    "Nowen-Note-1.4.16-arm64.dmg",
    "Nowen-Note-1.4.16-x64.zip",
    "Nowen-Note-1.4.16-arm64.zip",
    "latest-mac.yml",
  ]);
  assert.deepEqual(findMissingMacReleaseAssets(required, version), []);
  assert.doesNotThrow(() => assertCompleteMacReleaseAssets(required, version));

  const incomplete = required.filter((name) => name !== "Nowen-Note-1.4.16-arm64.dmg");
  assert.deepEqual(findMissingMacReleaseAssets(incomplete, version), ["Nowen-Note-1.4.16-arm64.dmg"]);
  assert.throws(
    () => assertCompleteMacReleaseAssets(incomplete, version),
    /missing: Nowen-Note-1\.4\.16-arm64\.dmg/,
  );
});

test("macOS 双架构 ZIP 按手动下载资产处理", () => {
  assert.equal(isMacManualDownloadZip("Nowen-Note-1.4.16-x64.zip"), true);
  assert.equal(isMacManualDownloadZip("Nowen-Note-1.4.16-arm64.zip"), true);
  assert.equal(isMacManualDownloadZip("Nowen-Note-1.4.16-rc.1-arm64.zip"), true);
  assert.equal(isMacManualDownloadZip("Nowen-Note-1.4.16-setup.exe"), false);
  assert.equal(isMacManualDownloadZip("Nowen-Note-Lite-1.4.16-x64.zip"), false);
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
