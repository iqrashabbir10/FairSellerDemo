// Attachment rules shared by every chat composer. The backend enforces the same limits
// (SupportService: 2 MB per file, images / PDF / Word / text only) — this just fails fast in the UI.

export const MAX_ATTACHMENT_BYTES = 2 * 1024 * 1024;

const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp", "pdf", "doc", "docx", "txt"];
const IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "gif", "webp"]);

/** Value for <input type="file" accept>. */
export const ATTACHMENT_ACCEPT = ALLOWED_EXTENSIONS.map((ext) => `.${ext}`).join(",");

const extensionOf = (name: string) => name.split("?")[0].split(".").pop()?.toLowerCase() ?? "";

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Returns an error message, or null when the file is acceptable. */
export function validateAttachment(file: File): string | null {
  if (file.size === 0) return `"${file.name}" is empty.`;
  if (file.size > MAX_ATTACHMENT_BYTES) {
    return `"${file.name}" is ${formatBytes(file.size)} — files can be at most ${formatBytes(MAX_ATTACHMENT_BYTES)}.`;
  }
  if (!ALLOWED_EXTENSIONS.includes(extensionOf(file.name))) {
    return "Only images, PDF, Word documents and text files can be sent.";
  }
  return null;
}

export const isImageFile = (nameOrUrl: string) => IMAGE_EXTENSIONS.has(extensionOf(nameOrUrl));

/** Best-effort display name for a stored attachment URL (the backend only returns the URL). */
export function attachmentDisplayName(url: string) {
  const last = decodeURIComponent(url.split("?")[0].split("/").pop() ?? "attachment");
  return last || "attachment";
}
