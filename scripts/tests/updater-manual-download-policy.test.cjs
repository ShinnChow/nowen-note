const test = require("node:test");
const assert = require("node:assert/strict");
const {
  MAC_MANUAL_DOWNLOAD_NOTICE,
  buildReleaseDownloadUrl,
  isManualDownloadPlatform,
  withManualDownloadNotice,
} = require("../../electron/updaterPolicy");

test("macOS uses manual browser download policy", () => {
  assert.equal(isManualDownloadPlatform("darwin"), true);
  assert.equal(isManualDownloadPlatform("win32"), false);
  assert.equal(isManualDownloadPlatform("linux"), false);
});

test("release URL targets the detected stable version", () => {
  assert.equal(
    buildReleaseDownloadUrl("v1.4.6"),
    "https://github.com/cropflre/nowen-note/releases/tag/v1.4.6",
  );
  assert.equal(
    buildReleaseDownloadUrl("invalid"),
    "https://github.com/cropflre/nowen-note/releases/latest",
  );
});

test("manual download notice is prepended exactly once", () => {
  assert.equal(withManualDownloadNotice(""), MAC_MANUAL_DOWNLOAD_NOTICE);
  const value = withManualDownloadNotice("修复若干问题");
  assert.equal(value, `${MAC_MANUAL_DOWNLOAD_NOTICE}\n\n修复若干问题`);
  assert.equal(withManualDownloadNotice(value), value);
});
