import { readFile } from "fs/promises";
import path from "path";
import { getSession } from "@/lib/auth";

const TYPES = {
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

// Uploaded documents are only served to logged-in users.
export async function GET(_req, { params }) {
  if (!(await getSession())) return new Response("Unauthorized", { status: 401 });
  const { name } = await params;
  const safe = path.basename(name);
  try {
    const data = await readFile(path.join(process.cwd(), "uploads", safe));
    return new Response(data, {
      headers: {
        "Content-Type": TYPES[path.extname(safe).toLowerCase()] || "application/octet-stream",
        "Content-Disposition": `inline; filename="${safe}"`,
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
