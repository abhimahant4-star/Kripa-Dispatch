import { redirect } from "next/navigation";
import mongoose from "mongoose";
import { Download, DatabaseBackup, Terminal } from "lucide-react";
import { connectDB } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

const LABELS = {
  drivers: "Drivers",
  trucks: "Trucks",
  trailers: "Trailers",
  companies: "Companies",
  dispatches: "Dispatches (loads)",
  users: "Staff logins",
  syllabus: "Syllabus topics",
  lectures: "Daily lectures",
  uploads: "Uploaded documents",
};

export default async function BackupPage() {
  const session = await getSession();
  if (session?.role !== "admin") redirect("/dashboard");
  await connectDB();
  const db = mongoose.connection.db;
  const counts = await Promise.all(Object.keys(LABELS).map(async (k) => [k, await db.collection(k).countDocuments(k === "uploads" ? { complete: true } : {})]));
  const stats = await db.stats();

  return (
    <div className="space-y-6">
      <PageHeader title="Data Backup" subtitle="Download a copy of everything in the database. Keep it somewhere safe (Google Drive, a USB drive…)." />

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="card p-6 lg:col-span-2">
          <h2 className="mb-4 flex items-center gap-2 font-semibold text-navy-900">
            <DatabaseBackup className="h-5 w-5 text-royal-600" /> What's in the database
          </h2>
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {counts.map(([k, n]) => (
              <div key={k} className="rounded-lg bg-slate-50 p-3">
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{LABELS[k]}</dt>
                <dd className="mt-1 text-2xl font-bold text-navy-900">{n}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-xs text-slate-500">Database size: {(stats.dataSize / 1024 / 1024).toFixed(1)} MB</p>
        </section>

        <section className="card space-y-3 p-6">
          <h2 className="font-semibold text-navy-900">Download</h2>
          <a href="/api/backup" className="btn-gold w-full">
            <Download className="h-4 w-4" /> Full backup (with documents)
          </a>
          <a href="/api/backup?files=0" className="btn-ghost w-full">
            <Download className="h-4 w-4" /> Records only (smaller)
          </a>
          <p className="text-xs text-slate-500">
            The file is a .json with every driver, truck, trailer, company, load, login and (in the full backup) every uploaded PDF. Passwords are stored
            encrypted, never in plain text.
          </p>
        </section>
      </div>

      <section className="card p-6">
        <h2 className="mb-2 flex items-center gap-2 font-semibold text-navy-900">
          <Terminal className="h-5 w-5 text-royal-600" /> Backup folder & restore (on the developer's computer)
        </h2>
        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-600">
          <li>
            <code className="rounded bg-slate-100 px-1">npm run backup</code> saves everything to <code className="rounded bg-slate-100 px-1">backup/&lt;date-time&gt;/</code>, one file per
            collection.
          </li>
          <li>
            <code className="rounded bg-slate-100 px-1">npm run restore -- backup/&lt;folder or file.json&gt;</code> puts missing records back (existing ones are kept).
          </li>
          <li>
            Add <code className="rounded bg-slate-100 px-1">--replace</code> to make the database exactly match the backup.
          </li>
        </ul>
      </section>
    </div>
  );
}
