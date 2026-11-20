import Link from "next/link";
import { FileText, Pencil } from "lucide-react";
import { connectDB } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { Models } from "@/models";
import { Badge, fmtDate } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function Profile() {
  const session = await getSession();
  await connectDB();
  const u = await Models.users.findById(session.sub).lean();
  if (!u) return <p>Profile not found.</p>;

  const info = [
    ["Name", u.name],
    ["Email", u.email],
    ["Phone", u.phone],
    ["Employee / Student ID", u.employeeId],
    ["Joining Date", fmtDate(u.joiningDate)],
    ["Batch", u.batch],
    ["Father Name", u.fatherName],
    ["Mother Name", u.motherName],
    ["Address", u.address],
  ];
  const docs = [
    ["Matric PDF", u.matricFile],
    ["10th PDF", u.tenthFile],
    ["Aadhaar PDF", u.aadhaarFile],
  ];

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-2xl p-6 text-white shadow-lg sm:p-8">
        <div className="absolute inset-0 bg-[linear-gradient(110deg,#0a1a45_0%,#0f2560_50%,#d4a017_130%)]" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-400">My profile</p>
            <h1 className="mt-2 text-3xl font-bold">{u.name}</h1>
            <div className="mt-2 flex gap-2">
              <Badge value={u.role} />
              <Badge value={u.status} />
            </div>
          </div>
          {session.role === "admin" && (
            <Link href={`/users/${u._id}/edit`} className="btn-gold self-start">
              <Pencil className="h-4 w-4" /> Edit Profile
            </Link>
          )}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="card p-6 lg:col-span-2">
          <h2 className="mb-4 font-semibold text-navy-900">Profile overview</h2>
          <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
            {info.map(([k, v]) => (
              <div key={k}>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{k}</dt>
                <dd className="mt-1 whitespace-pre-line text-sm text-slate-900">{v || <span className="text-slate-400">—</span>}</dd>
              </div>
            ))}
          </dl>
        </section>
        <section className="card p-6">
          <h2 className="mb-4 font-semibold text-navy-900">Documents</h2>
          <div className="space-y-2">
            {docs.map(([k, v]) =>
              v ? (
                <a key={k} href={v} target="_blank" className="flex items-center justify-center gap-2 rounded-lg border border-royal-500/40 px-4 py-2.5 text-sm font-medium text-royal-600 hover:bg-royal-50">
                  <FileText className="h-4 w-4" /> {k}
                </a>
              ) : (
                <p key={k} className="rounded-lg border border-dashed border-slate-300 px-4 py-2.5 text-center text-sm text-slate-400">
                  {k} — not uploaded
                </p>
              )
            )}
          </div>
          {session.role !== "admin" && <p className="mt-4 text-xs text-slate-500">Ask an admin to update your profile details or documents.</p>}
        </section>
      </div>
    </div>
  );
}
