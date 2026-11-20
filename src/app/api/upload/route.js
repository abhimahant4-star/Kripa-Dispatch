import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";
import { json } from "@/lib/api";
import { getSession } from "@/lib/auth";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");
const ALLOWED = [".pdf", ".png", ".jpg", ".jpeg", ".webp", ".doc", ".docx"];
const MAX = 15 * 1024 * 1024;

export async function POST(req) {
  if (!(await getSession())) return json({ error: "Unauthorized" }, 401);
  const form = await req.formData();
  const file = form.get("file");
  if (!file || typeof file === "string") return json({ error: "No file" }, 400);
  const ext = path.extname(file.name).toLowerCase();
  if (!ALLOWED.includes(ext)) return json({ error: `Allowed: ${ALLOWED.join(", ")}` }, 400);
  if (file.size > MAX) return json({ error: "File is larger than 15 MB" }, 400);

  const base = path.basename(file.name, ext).replace(/[^a-z0-9_-]+/gi, "-").slice(0, 60);
  const name = `${Date.now()}-${crypto.randomBytes(4).toString("hex")}-${base}${ext}`;
  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, name), Buffer.from(await file.arrayBuffer()));
  return json({ url: `/api/files/${name}`, name: file.name });
}
