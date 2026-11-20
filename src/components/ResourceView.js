"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, FileText, Loader2, ExternalLink } from "lucide-react";
import { RESOURCES, refLabel } from "@/lib/resources";
import { api, canWrite } from "@/lib/client";
import { PageHeader, Badge, fmtDate, ExpiryText } from "./ui";
import RecentLoads from "./RecentLoads";

export function FieldValue({ f, v }) {
  if (v === undefined || v === null || v === "") return <span className="text-slate-400">—</span>;
  if (f.badge) return <Badge value={v} />;
  if (f.expiry) return <ExpiryText value={v} />;
  if (f.type === "date") return fmtDate(v);
  if (f.type === "ref")
    return (
      <Link href={`/${f.ref}/${v._id}`} className="font-medium text-royal-600 hover:underline">
        {refLabel(f.ref, v)}
      </Link>
    );
  if (f.type === "file")
    return (
      <a href={v} target="_blank" className="inline-flex items-center gap-1 font-medium text-royal-600 hover:underline">
        <FileText className="h-4 w-4" /> Open document
      </a>
    );
  if (typeof v === "string" && /^https?:\/\//.test(v))
    return (
      <a href={v} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 break-all font-medium text-royal-600 hover:underline">
        {v} <ExternalLink className="h-3 w-3 shrink-0" />
      </a>
    );
  if (f.type === "number") return Number(v).toLocaleString("en-IN");
  return <span className="whitespace-pre-line">{String(v)}</span>;
}

export default function ResourceView({ resourceKey, id, role }) {
  const cfg = RESOURCES[resourceKey];
  const router = useRouter();
  const [item, setItem] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api(`/api/${resourceKey}/${id}`)
      .then((d) => setItem(d.item))
      .catch((e) => setError(e.message));
  }, [resourceKey, id]);

  async function remove() {
    if (!confirm(`Delete ${cfg.title(item)}? This cannot be undone.`)) return;
    try {
      await api(`/api/${resourceKey}/${id}`, { method: "DELETE" });
      router.push(`/${resourceKey}`);
      router.refresh();
    } catch (e) {
      alert(e.message);
    }
  }

  if (error) return <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>;
  if (!item) return <Loader2 className="mx-auto mt-20 h-6 w-6 animate-spin text-royal-600" />;

  const loadFilter = { drivers: "driver", trucks: "truck", trailers: "trailer", companies: "customer" }[resourceKey];

  return (
    <>
      <PageHeader title={cfg.title(item)} subtitle={`${cfg.singular} details`} back={{ href: `/${resourceKey}`, label: `Back to ${cfg.label}` }}>
        {canWrite(resourceKey, role) && (
          <>
            <Link href={`/${resourceKey}/${id}/edit`} className="btn-gold">
              <Pencil className="h-4 w-4" /> Edit
            </Link>
            <button onClick={remove} className="btn-ghost text-red-600">
              <Trash2 className="h-4 w-4" /> Delete
            </button>
          </>
        )}
      </PageHeader>
      <div className="grid gap-6">
        {cfg.sections.map((s) => (
          <section key={s.title} className="card p-5 sm:p-6">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-navy-800">{s.title}</h2>
            <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
              {s.fields
                .filter((f) => f.type !== "password")
                .map((f) => (
                  <div key={f.name} className={f.type === "textarea" ? "sm:col-span-2 lg:col-span-3" : ""}>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{f.label}</dt>
                    <dd className="mt-1 text-sm text-slate-900">
                      <FieldValue f={f} v={item[f.name]} />
                    </dd>
                  </div>
                ))}
            </dl>
          </section>
        ))}
        {loadFilter && <RecentLoads filter={{ [loadFilter]: id }} title="Dispatch history" />}
      </div>
    </>
  );
}
