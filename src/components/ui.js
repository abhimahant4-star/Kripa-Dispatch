import Link from "next/link";
import { Eye, Download, FileText } from "lucide-react";
import { STATUS_COLORS } from "@/lib/resources";

export function PageHeader({ title, subtitle, children, back }) {
  return (
    <div className="no-print mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {back && (
          <Link href={back.href} className="mb-2 inline-block text-sm font-medium text-royal-600 hover:underline">
            ← {back.label}
          </Link>
        )}
        <h1 className="text-2xl font-bold text-navy-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}

export function Badge({ value }) {
  if (!value) return <span className="text-slate-400">—</span>;
  return (
    <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${STATUS_COLORS[value] || "bg-slate-100 text-slate-700"}`}>
      {value}
    </span>
  );
}

export function fmtDate(v, opts = { month: "short", day: "numeric", year: "numeric" }) {
  if (!v) return "";
  const d = new Date(v);
  if (isNaN(d)) return "";
  // Dates are stored at UTC midnight; show them in UTC so they don't shift a day.
  return d.toLocaleDateString("en-US", { ...opts, timeZone: "UTC" });
}

export function daysUntil(v) {
  if (!v) return null;
  const d = new Date(v);
  const today = new Date();
  const t = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((d.getTime() - t) / 86400000);
}

export function ExpiryText({ value }) {
  if (!value) return <span className="text-slate-400">—</span>;
  const days = daysUntil(value);
  const cls = days < 0 ? "text-red-600 font-semibold" : days <= 30 ? "text-amber-600 font-semibold" : "text-slate-500";
  return (
    <span className={cls}>
      {fmtDate(value)}
      {days < 0 ? " · expired" : days <= 30 ? ` · ${days}d left` : ""}
    </span>
  );
}

export function Empty({ title, children }) {
  return (
    <div className="px-6 py-14 text-center">
      <p className="font-semibold text-navy-900">{title}</p>
      {children && <div className="mt-1 text-sm text-slate-500">{children}</div>}
    </div>
  );
}

export const downloadUrl = (url) => `${url}${url.includes("?") ? "&" : "?"}download=1`;

// "View" opens the document in a new tab, "Download" saves it.
export function DocButtons({ url, compact }) {
  if (!url) return <span className="text-slate-400">—</span>;
  const cls = compact
    ? "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-semibold"
    : "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-semibold";
  return (
    <span className="inline-flex flex-wrap gap-2">
      <a href={url} target="_blank" rel="noreferrer" className={`${cls} border-royal-500/40 text-royal-600 hover:bg-royal-50`}>
        <Eye className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} /> View
      </a>
      <a href={downloadUrl(url)} className={`${cls} border-gold-500/60 bg-gold-100/50 text-gold-600 hover:bg-gold-100`}>
        <Download className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} /> Download
      </a>
    </span>
  );
}

// One row per document field: name, then View / Download (or "Not uploaded").
export function DocumentList({ docs, emptyAction }) {
  return (
    <ul className="divide-y divide-slate-100">
      {docs.map(([label, url]) => (
        <li key={label} className="flex flex-wrap items-center justify-between gap-3 py-3">
          <span className="flex items-center gap-2 text-sm font-medium text-navy-900">
            <FileText className={`h-4 w-4 ${url ? "text-royal-600" : "text-slate-300"}`} /> {label}
          </span>
          {url ? <DocButtons url={url} /> : <span className="text-sm text-slate-400">Not uploaded{emptyAction}</span>}
        </li>
      ))}
    </ul>
  );
}
