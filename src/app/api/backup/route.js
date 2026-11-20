import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Admin-only download of the whole database as one JSON file (MongoDB Extended JSON).
// ?files=0 leaves out the uploaded documents (much smaller file).
// Restore it with:  npm run restore -- path/to/kirpa-backup-....json
export async function GET(req) {
  const session = await getSession();
  if (!session || session.role !== "admin") return new Response("Admins only", { status: 403 });
  const withFiles = new URL(req.url).searchParams.get("files") !== "0";

  await connectDB();
  const db = mongoose.connection.db;
  const { EJSON } = mongoose.mongo.BSON;
  const names = (await db.listCollections().toArray())
    .filter((c) => c.type === "collection" && !c.name.startsWith("system."))
    .map((c) => c.name)
    .filter((n) => withFiles || n !== "upload_chunks")
    .sort();

  const enc = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        controller.enqueue(enc.encode(`{"_info":${JSON.stringify({ createdAt: new Date().toISOString(), by: session.name, includesFiles: withFiles })}`));
        for (const name of names) {
          controller.enqueue(enc.encode(`,\n${JSON.stringify(name)}:[`));
          let first = true;
          for await (const doc of db.collection(name).find({})) {
            controller.enqueue(enc.encode((first ? "\n" : ",\n") + EJSON.stringify(doc, { relaxed: false })));
            first = false;
          }
          controller.enqueue(enc.encode("]"));
        }
        controller.enqueue(enc.encode("}\n"));
        controller.close();
      } catch (e) {
        controller.error(e);
      }
    },
  });

  const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-");
  return new Response(stream, {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="kirpa-backup-${stamp}${withFiles ? "" : "-records"}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
