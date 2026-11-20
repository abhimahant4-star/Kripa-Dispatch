import { readFile } from "fs/promises";
import path from "path";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { FILE_TYPES, extOf } from "@/lib/files";

// Uploaded documents are only served to logged-in users.
export async function GET(req, { params }) {
  if (!(await getSession())) return new Response("Unauthorized", { status: 401 });
  const { name } = await params;
  const disposition = new URL(req.url).searchParams.get("download") ? "attachment" : "inline";

  if (/^[a-f0-9]{24}$/i.test(name)) {
    await connectDB();
    const db = mongoose.connection.db;
    const id = new mongoose.Types.ObjectId(name);
    const file = await db.collection("uploads").findOne({ _id: id, complete: true });
    if (!file) return new Response("Not found", { status: 404 });
    const chunks = await db.collection("upload_chunks").find({ fileId: id }).sort({ n: 1 }).toArray();
    const data = Buffer.concat(chunks.map((c) => Buffer.from(c.data.buffer)));
    return new Response(data, {
      headers: {
        "Content-Type": file.type || "application/octet-stream",
        "Content-Disposition": `${disposition}; filename*=UTF-8''${encodeURIComponent(file.name)}`,
        "Cache-Control": "private, max-age=86400",
      },
    });
  }

  // Older uploads saved on disk (local installs only).
  const safe = path.basename(name);
  try {
    const data = await readFile(path.join(process.cwd(), "uploads", safe));
    return new Response(data, {
      headers: { "Content-Type": FILE_TYPES[extOf(safe)] || "application/octet-stream", "Content-Disposition": `${disposition}; filename="${safe}"` },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
