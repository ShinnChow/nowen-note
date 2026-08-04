const RELEASES_BASE_URL = "https://github.com/cropflre/nowen-note/releases";
const MAC_MANUAL_DOWNLOAD_NOTICE =
  "macOS 暂不支持客户端内自动安装。点击“立即更新”后将打开浏览器，请下载对应芯片版本的安装包并手动安装。";

function isManualDownloadPlatform(platform = process.platform) {
  return platform === "darwin";
}

function normalizeStableVersion(version) {
  const normalized = String(version || "").trim().replace(/^v/i, "");
  return /^\d+\.\d+\.\d+(?:\+[^-\s]+)?$/.test(normalized) ? normalized : "";
}

function buildReleaseDownloadUrl(version) {
  const normalized = normalizeStableVersion(version);
  return normalized
    ? `${RELEASES_BASE_URL}/tag/v${encodeURIComponent(normalized)}`
    : `${RELEASES_BASE_URL}/latest`;
}

function withManualDownloadNotice(releaseNotes) {
  const notes = String(releaseNotes || "").trim();
  if (!notes) return MAC_MANUAL_DOWNLOAD_NOTICE;
  if (notes.includes(MAC_MANUAL_DOWNLOAD_NOTICE)) return notes;
  return `${MAC_MANUAL_DOWNLOAD_NOTICE}\n\n${notes}`;
}

module.exports = {
  MAC_MANUAL_DOWNLOAD_NOTICE,
  RELEASES_BASE_URL,
  buildReleaseDownloadUrl,
  isManualDownloadPlatform,
  normalizeStableVersion,
  withManualDownloadNotice,
};
