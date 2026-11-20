import Link from "next/link";
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
  return d.toLocaleDateString("en-IN", { ...opts, timeZone: "UTC" });
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
