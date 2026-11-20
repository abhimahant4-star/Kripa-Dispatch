// Restores a backup made with `npm run backup` (a folder) or downloaded from the app's Data Backup page (a .json file).
//   npm run restore -- backup/<folder or file.json>            -> adds records that are missing (existing ones are kept)
//   npm run restore -- backup/<folder or file.json> --replace  -> EMPTIES each collection first, then restores it exactly
import mongoose from "mongoose";
import fs from "node:fs";
import path from "node:path";

const { EJSON } = mongoose.mongo.BSON;
const uri = process.env.MONGODB_URI;
const src = process.argv.slice(2).find((a) => !a.startsWith("--"));
const replace = process.argv.includes("--replace");
if (!uri) {
  console.error("MONGODB_URI missing. Copy .env.example to .env.local first.");
  process.exit(1);
}
if (!src || !fs.existsSync(src)) {
  console.error("Usage: npm run restore -- backup/<folder or file.json> [--replace]");
  process.exit(1);
}

// { collectionName: [docs] }
let data = {};
if (fs.statSync(src).isDirectory()) {
  for (const file of fs.readdirSync(src).filter((f) => f.endsWith(".json") && !f.startsWith("_"))) {
    data[file.slice(0, -5)] = EJSON.parse(fs.readFileSync(path.join(src, file), "utf8"), { relaxed: false });
  }
} else {
  data = EJSON.parse(fs.readFileSync(src, "utf8"), { relaxed: false });
  delete data._info;
}

await mongoose.connect(uri);
const db = mongoose.connection.db;
const summary = {};
for (const [name, docs] of Object.entries(data)) {
  const col = db.collection(name);
  if (replace) await col.deleteMany({});
  let restored = 0;
  if (docs.length) {
    if (replace) restored = (await col.insertMany(docs)).insertedCount;
    else
      restored = (
        await col.bulkWrite(docs.map((d) => ({ updateOne: { filter: { _id: d._id }, update: { $setOnInsert: d }, upsert: true } })))
      ).upsertedCount;
  }
  summary[name] = { inBackup: docs.length, restored };
}

const upDir = fs.statSync(src).isDirectory() && path.join(src, "uploads");
if (upDir && fs.existsSync(upDir)) {
  fs.mkdirSync("uploads", { recursive: true });
  for (const f of fs.readdirSync(upDir)) if (!fs.existsSync(path.join("uploads", f))) fs.copyFileSync(path.join(upDir, f), path.join("uploads", f));
}
console.table(summary);
await mongoose.disconnect();
