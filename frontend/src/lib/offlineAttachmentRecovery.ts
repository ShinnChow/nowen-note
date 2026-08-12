export const OFFLINE_ATTACHMENT_RETRY_EVENT = "nowen:offline-attachment-retry-requested";

export function requestOfflineAttachmentRetry(attachmentIds: readonly string[]): void {
  if (attachmentIds.length === 0 || typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(OFFLINE_ATTACHMENT_RETRY_EVENT, {
    detail: { attachmentIds: [...attachmentIds] },
  }));
}
