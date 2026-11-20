"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Plus, Search, Eye, Pencil, Printer, Trash2, Loader2 } from "lucide-react";
import { api } from "@/lib/client";
import { DISPATCH_STATUSES, money, num } from "@/lib/dispatch";
import { PageHeader, Badge, fmtDate, Empty } from "./ui";
import { RefSelect } from "./fields";
import { stopLine, driverName } from "@/lib/format";

const PAGE_SIZE = 20;

export default function DispatchList() {
  const [draft, setDraft] = useState({ q: "", status: "", driver: "", customer: "" });
  const [query, setQuery] = useState(draft);
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams({ page, limit: PAGE_SIZE });
    Object.entries(query).forEach(([k, v]) => v && p.set(k, v));
    try {
      setData(await api(`/api/dispatches?${p}`));
    } catch (e) {
      alert(e.message);
    }
    setLoading(false);
  }, [query, page]);

  useEffect(() => {
    load();
  }, [load]);

  async function remove(d) {
    if (!confirm(`Delete dispatch ${d.loadNumber}? This cannot be undone.`)) return;
    await api(`/api/dispatches/${d._id}`, { method: "DELETE" }).catch((e) => alert(e.message));
    load();
  }

  const pages = Math.max(1, Math.ceil(data.total / PAGE_SIZE));

  return (
    <>
      <PageHeader title="Dispatches" subtitle="Every load with its driver, equipment, stops, invoice and tracking.">
        <Link href="/dispatches/new" className="btn-gold">
          <Plus className="h-4 w-4" /> Add Dispatch
        </Link>
      </PageHeader>

      <div className="no-print mb-4 flex flex-wrap gap-2">
        {["", "Planned", "Dispatched", "In Transit", "Delivered", "Invoiced", "Paid"].map((s) => (
          <button
            key={s || "all"}
            onClick={() => {
              const next = { ...draft, status: s };
              setDraft(next);
              setQuery(next);
              setPage(1);
            }}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              query.status === s ? "bg-navy-800 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
            }`}
          >
            {s || "All loads"}
          </button>
        ))}
      </div>

      <form
        className="card mb-6 grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-5"
        onSubmit={(e) => {
          e.preventDefault();
          setQuery(draft);
          setPage(1);
        }}
      >
        <div className="sm:col-span-2 lg:col-span-1">
          <label className="label">Search</label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input className="input pl-9" placeholder="Load #, trip, commodity" value={draft.q} onChange={(e) => setDraft({ ...draft, q: e.target.value })} />
          </div>
        </div>
        <div>
          <label className="label">Status</label>
          <select className="input" value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value })}>
            <option value="">All</option>
            {DISPATCH_STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Driver</label>
          <RefSelect refKey="drivers" placeholder="All drivers" value={draft.driver} onChange={(v) => setDraft({ ...draft, driver: v })} />
        </div>
        <div>
          <label className="label">Customer</label>
          <RefSelect refKey="companies" placeholder="All customers" value={draft.customer} onChange={(v) => setDraft({ ...draft, customer: v })} />
        </div>
        <div className="flex items-end gap-2">
          <button className="btn-navy">Search</button>
          <button
            type="button"
            className="btn-ghost"
            onClick={() => {
              const e = { q: "", status: "", driver: "", customer: "" };
              setDraft(e);
              setQuery(e);
              setPage(1);
            }}
          >
            Reset
          </button>
        </div>
      </form>

      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <h2 className="font-semibold text-navy-900">My Dispatches</h2>
          <span className="rounded-full bg-royal-50 px-3 py-1 text-xs font-semibold text-royal-600">
            {loading ? <Loader2 className="inline h-3 w-3 animate-spin" /> : `${data.total} records`}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50/70">
              <tr>
                <th className="th">Load #</th>
                <th className="th">Driver</th>
                <th className="th">Truck</th>
                <th className="th">Customer</th>
                <th className="th">Pickup → Delivery</th>
                <th className="th text-right">KM</th>
                <th className="th text-right">Invoice</th>
                <th className="th">Date</th>
                <th className="th">Status</th>
                <th className="th text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.items.map((d) => (
                <tr key={d._id} className="hover:bg-royal-50/40">
                  <td className="td">
                    <Link href={`/dispatches/${d._id}`} className="font-semibold text-royal-600 hover:underline">
                      {d.loadNumber}
                    </Link>
                    <div className="max-w-40 truncate text-xs text-slate-500">{d.tripName}</div>
                  </td>
                  <td className="td">{driverName(d.driver)}</td>
                  <td className="td whitespace-nowrap">{d.truck?.plateNumber || d.truck?.unitNumber || "—"}</td>
                  <td className="td font-medium">{d.customer?.name || "—"}</td>
                  <td className="td">
                    <div>{stopLine(d.pickups?.[0])}</div>
                    <div className="text-xs text-slate-500">→ {stopLine(d.deliveries?.[d.deliveries.length - 1])}</div>
                  </td>
                  <td className="td text-right">{num(d.loadedMiles)}</td>
                  <td className="td text-right font-semibold">{money(d.invoiceTotal)}</td>
                  <td className="td whitespace-nowrap">{fmtDate(d.pickups?.[0]?.date || d.createdAt)}</td>
                  <td className="td">
                    <Badge value={d.status} />
                  </td>
                  <td className="td">
                    <div className="flex justify-end gap-1.5">
                      <Link href={`/dispatches/${d._id}`} className="icon-btn text-royal-600" title="View & track">
                        <Eye className="h-4 w-4" />
                      </Link>
                      <Link href={`/dispatches/${d._id}/edit`} className="icon-btn text-gold-600" title="Edit">
                        <Pencil className="h-4 w-4" />
                      </Link>
                      <Link href={`/dispatches/${d._id}?print=1`} className="icon-btn" title="Print invoice">
                        <Printer className="h-4 w-4" />
                      </Link>
                      <button onClick={() => remove(d)} className="icon-btn text-red-600" title="Delete">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && !data.items.length && <Empty title="No dispatches found">Create a load with “Add Dispatch”.</Empty>}
        </div>
        {pages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm">
            <span className="text-slate-500">
              Page {page} of {pages}
            </span>
            <div className="flex gap-2">
              <button className="btn-ghost py-1.5" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                Previous
              </button>
              <button className="btn-ghost py-1.5" disabled={page >= pages} onClick={() => setPage(page + 1)}>
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
