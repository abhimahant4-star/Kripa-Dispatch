// Saves every MongoDB collection (including uploaded files stored in the database)
// to backup/<date-time>/<collection>.json
//   npm run backup
// Restore with: npm run restore -- backup/<folder>
import mongoose from "mongoose";
import fs from "node:fs";
import path from "node:path";

const { EJSON } = mongoose.mongo.BSON;
const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI missing. Copy .env.example to .env.local first.");
  process.exit(1);
}

await mongoose.connect(uri);
const db = mongoose.connection.db;
const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-");
const dir = path.join("backup", stamp);
fs.mkdirSync(dir, { recursive: true });

const collections = (await db.listCollections().toArray()).filter((c) => c.type === "collection" && !c.name.startsWith("system."));
const summary = {};
for (const { name } of collections) {
  const docs = await db.collection(name).find({}).toArray();
  fs.writeFileSync(path.join(dir, `${name}.json`), EJSON.stringify(docs, null, 2, { relaxed: false }));
  summary[name] = docs.length;
}

// Files saved on disk by older versions of the app
if (fs.existsSync("uploads")) {
  const files = fs.readdirSync("uploads").filter((f) => f !== ".gitkeep");
  if (files.length) {
    fs.mkdirSync(path.join(dir, "uploads"), { recursive: true });
    for (const f of files) fs.copyFileSync(path.join("uploads", f), path.join(dir, "uploads", f));
    summary["uploads folder"] = files.length;
  }
}

fs.writeFileSync(
  path.join(dir, "_info.json"),
  JSON.stringify({ createdAt: new Date().toISOString(), database: db.databaseName, counts: summary }, null, 2)
);
console.log(`Backup saved to ${dir}`);
console.table(summary);
await mongoose.disconnect();
