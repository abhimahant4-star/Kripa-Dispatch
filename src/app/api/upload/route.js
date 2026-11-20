import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { json } from "@/lib/api";
import { getSession } from "@/lib/auth";
import { CHUNK_SIZE, MAX_FILE_SIZE, FILE_TYPES, extOf } from "@/lib/files";

// One request per chunk: fields `chunk` (blob), `index`, `total`, `name`, `size` and `id` (after the first chunk).
export async function POST(req) {
  const session = await getSession();
  if (!session) return json({ error: "Unauthorized" }, 401);
  try {
    const form = await req.formData();
    const chunk = form.get("chunk") || form.get("file");
    if (!chunk || typeof chunk === "string") return json({ error: "No file" }, 400);
    const index = Number(form.get("index") || 0);
    const total = Number(form.get("total") || 1);
    const name = String(form.get("name") || chunk.name || "file");
    const size = Number(form.get("size") || chunk.size);
    const ext = extOf(name);
    if (!FILE_TYPES[ext]) return json({ error: `Allowed: ${Object.keys(FILE_TYPES).join(", ")}` }, 400);
    if (size > MAX_FILE_SIZE) return json({ error: "File is larger than 15 MB" }, 400);
    if (chunk.size > CHUNK_SIZE + 1024 || total > Math.ceil(MAX_FILE_SIZE / CHUNK_SIZE) || index >= total) return json({ error: "Bad chunk" }, 400);

    await connectDB();
    const db = mongoose.connection.db;
    const files = db.collection("uploads");
    let id;
    if (index === 0) {
      id = new mongoose.Types.ObjectId();
      await files.insertOne({ _id: id, name, type: FILE_TYPES[ext], size, chunks: total, complete: false, by: session.sub, createdAt: new Date() });
    } else {
      id = new mongoose.Types.ObjectId(String(form.get("id")));
      const doc = await files.findOne({ _id: id, complete: false, by: session.sub });
      if (!doc) return json({ error: "Upload not found — please try again" }, 400);
    }
    const data = new mongoose.mongo.Binary(Buffer.from(await chunk.arrayBuffer()));
    await db.collection("upload_chunks").updateOne({ fileId: id, n: index }, { $set: { fileId: id, n: index, data } }, { upsert: true });
    if (index === total - 1) {
      const count = await db.collection("upload_chunks").countDocuments({ fileId: id });
      if (count !== total) return json({ error: "Upload incomplete — please try again" }, 400);
      await files.updateOne({ _id: id }, { $set: { complete: true } });
      return json({ id: String(id), url: `/api/files/${id}`, name, done: true });
    }
    return json({ id: String(id), done: false });
  } catch (e) {
    console.error(e);
    return json({ error: e.message || "Upload failed" }, 500);
  }
}
