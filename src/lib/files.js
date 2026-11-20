// Uploaded documents are stored inside MongoDB (collections "uploads" + "upload_chunks"),
// so they work on Vercel (no disk) and are included in database backups.
// Files are sent in pieces of CHUNK_SIZE bytes because Vercel limits one request to ~4.5 MB.
export const CHUNK_SIZE = 3 * 1024 * 1024;
export const MAX_FILE_SIZE = 15 * 1024 * 1024;
export const FILE_TYPES = {
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};
export const extOf = (name) => {
  const m = /\.[^.]+$/.exec(name || "");
  return m ? m[0].toLowerCase() : "";
};
