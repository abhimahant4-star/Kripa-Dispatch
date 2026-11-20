"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/client";
import { money } from "@/lib/dispatch";
import { Badge, fmtDate, Empty } from "./ui";
import { stopLine, driverName } from "@/lib/format";

export function LoadsTable({ items }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-100">
        <thead className="bg-slate-50/70">
          <tr>
            <th className="th">Load</th>
            <th className="th">Customer</th>
            <th className="th">Route</th>
            <th className="th">Driver / Truck</th>
            <th className="th text-right">Invoice</th>
            <th className="th">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {items.map((d) => (
            <tr key={d._id} className="hover:bg-royal-50/40">
              <td className="td">
                <Link href={`/dispatches/${d._id}`} className="font-semibold text-royal-600 hover:underline">
                  {d.loadNumber}
                </Link>
                <div className="text-xs text-slate-500">{fmtDate(d.pickups?.[0]?.date || d.createdAt)}</div>
              </td>
              <td className="td">{d.customer?.name || "—"}</td>
              <td className="td">
                <div className="text-sm">{stopLine(d.pickups?.[0])}</div>
                <div className="text-xs text-slate-500">→ {stopLine(d.deliveries?.[d.deliveries.length - 1])}</div>
              </td>
              <td className="td">
                <div>{driverName(d.driver)}</div>
                <div className="text-xs text-slate-500">
                  {d.truck ? d.truck.plateNumber || `Truck ${d.truck.unitNumber}` : ""}
                  {d.trailer ? ` · ${d.trailer.plateNumber || `Trailer ${d.trailer.unitNumber}`}` : ""}
                </div>
              </td>
              <td className="td text-right font-semibold">{money(d.invoiceTotal)}</td>
              <td className="td">
                <Badge value={d.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function RecentLoads({ filter, title = "Recent dispatches", limit = 10 }) {
  const [items, setItems] = useState(null);
  const key = JSON.stringify(filter);
  useEffect(() => {
    const p = new URLSearchParams({ limit, ...JSON.parse(key) });
    api(`/api/dispatches?${p}`)
      .then((d) => setItems(d.items))
      .catch(() => setItems([]));
  }, [key, limit]);

  return (
    <section className="card overflow-hidden">
      <h2 className="border-b border-slate-100 px-5 py-4 font-semibold text-navy-900">{title}</h2>
      {items === null ? (
        <p className="p-5 text-sm text-slate-500">Loading…</p>
      ) : items.length ? (
        <LoadsTable items={items} />
      ) : (
        <Empty title="No dispatches yet" />
      )}
    </section>
  );
}
