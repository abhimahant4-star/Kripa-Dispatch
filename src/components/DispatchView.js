"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Pencil, Printer, Loader2, MapPin, Flag, Truck, Container, User, Send, Check } from "lucide-react";
import { api } from "@/lib/client";
import { DISPATCH_STATUSES, money, num } from "@/lib/dispatch";
import { PageHeader, Badge, fmtDate } from "./ui";
import { driverName } from "@/lib/format";

const FLOW = ["Planned", "Dispatched", "At Pickup", "In Transit", "At Delivery", "Delivered", "Invoiced", "Paid"];

function Progress({ status }) {
  const idx = FLOW.indexOf(status);
  if (status === "Cancelled") return <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">This dispatch was cancelled.</p>;
  return (
    <ol className="grid grid-cols-4 gap-y-4 sm:grid-cols-8">
      {FLOW.map((s, i) => (
        <li key={s} className="relative flex flex-col items-center text-center">
          {i > 0 && <span className={`absolute right-1/2 top-3.5 h-0.5 w-full -translate-y-1/2 ${i <= idx ? "bg-gold-500" : "bg-slate-200"}`} />}
          <span
            className={`relative z-10 flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
              i < idx ? "bg-gold-500 text-navy-950" : i === idx ? "bg-navy-800 text-gold-400 ring-4 ring-gold-400/30" : "bg-slate-200 text-slate-500"
            }`}
          >
            {i < idx ? <Check className="h-4 w-4" /> : i + 1}
          </span>
          <span className={`mt-1.5 text-[11px] font-semibold ${i <= idx ? "text-navy-900" : "text-slate-400"}`}>{s}</span>
        </li>
      ))}
    </ol>
  );
}

function StopCard({ stop, kind, n }) {
  const Icon = kind === "pickup" ? MapPin : Flag;
  return (
    <div className="flex gap-3">
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${kind === "pickup" ? "bg-royal-100 text-royal-600" : "bg-gold-100 text-gold-600"}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1 pb-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {kind === "pickup" ? "Pickup" : "Delivery"} #{n} · {fmtDate(stop.date)} {stop.time}
        </p>
        <p className="font-semibold text-navy-900">{stop.company?.name || "—"}</p>
        <p className="text-sm text-slate-600">{[stop.street, stop.city, stop.state, stop.zip].filter(Boolean).join(", ")}</p>
        {(stop.type || stop.referenceNumber) && (
          <p className="mt-1 text-xs text-slate-500">
            {stop.type}
            {stop.referenceNumber ? ` · Ref ${stop.referenceNumber}` : ""}
          </p>
        )}
        {stop.instructions && <p className="mt-1 rounded bg-slate-50 px-2 py-1 text-xs text-slate-600">{stop.instructions}</p>}
      </div>
    </div>
  );
}

const ONES = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function twoDigits(n) {
  return n < 20 ? ONES[n] : `${TENS[Math.floor(n / 10)]}${n % 10 ? ` ${ONES[n % 10]}` : ""}`;
}

// Indian numbering: crore, lakh, thousand, hundred.
function inWords(amount) {
  let n = Math.floor(Math.abs(amount || 0));
  const paise = Math.round((Math.abs(amount || 0) - n) * 100);
  if (!n && !paise) return "Zero Rupees Only";
  const parts = [];
  for (const [size, name] of [[10000000, "Crore"], [100000, "Lakh"], [1000, "Thousand"], [100, "Hundred"]]) {
    if (n >= size) {
      parts.push(`${size === 100 ? ONES[Math.floor(n / size)] : twoDigits(Math.floor(n / size))} ${name}`);
      n %= size;
    }
  }
  if (n) parts.push(twoDigits(n));
  return `${parts.join(" ")} Rupees${paise ? ` and ${twoDigits(paise)} Paise` : ""} Only`;
}

const COMPANY = {
  address: process.env.NEXT_PUBLIC_COMPANY_ADDRESS || "",
  phone: process.env.NEXT_PUBLIC_COMPANY_PHONE || "",
  gstin: process.env.NEXT_PUBLIC_COMPANY_GSTIN || "",
};

function stopCities(stops) {
  return (stops || []).map((s) => s.city).filter(Boolean).join(", ") || "—";
}

function Invoice({ d }) {
  const rows = [
    [
      d.primaryFeeType === "Fixed Freight"
        ? `Freight charges — ${stopCities(d.pickups)} to ${stopCities(d.deliveries)}`
        : d.primaryFeeType === "Per KM"
        ? `Freight — ${num(d.loadedMiles)} km × ${money(d.rate)}`
        : `Freight — ${d.quantity || 0} tonnes × ${money(d.rate)}`,
      d.primaryCharges,
    ],
  ];
  if (d.fuelSurcharge) rows.push([`Fuel surcharge — ${num(d.loadedMiles)} km × ${money(d.fuelSurchargePerMile)}`, d.fuelSurcharge]);
  for (const a of d.accessories || []) rows.push([a.name, a.amount]);
  const half = (d.gstAmount || 0) / 2;
  const interState = d.customer?.state && d.pickups?.[0]?.state && d.customer.state !== d.pickups[0].state;

  return (
    <section className="print-area card p-6 sm:p-8">
      <div className="flex flex-col justify-between gap-6 border-b border-slate-200 pb-6 sm:flex-row">
        <div>
          <img src="/logo.jpeg" alt="Kripa Truck Dispatch & Logistics" className="h-24 w-auto" />
          {COMPANY.address && <p className="mt-2 max-w-xs text-xs text-slate-600">{COMPANY.address}</p>}
          {COMPANY.phone && <p className="text-xs text-slate-600">Ph: {COMPANY.phone}</p>}
          {COMPANY.gstin && <p className="text-xs font-semibold text-slate-700">GSTIN: {COMPANY.gstin}</p>}
        </div>
        <div className="sm:text-right">
          <p className="text-3xl font-bold tracking-tight text-navy-900">{d.gstPercent ? "TAX INVOICE" : "FREIGHT BILL"}</p>
          <p className="mt-1 text-sm text-slate-600">Bill No. {d.loadNumber}</p>
          <p className="text-sm text-slate-600">Date: {fmtDate(d.invoiceDate || d.updatedAt)}</p>
          {d.customerLoadNumber && <p className="text-sm text-slate-600">LR / Bilty No. {d.customerLoadNumber}</p>}
          {d.ewayBillNumber && <p className="text-sm text-slate-600">E-way Bill No. {d.ewayBillNumber}</p>}
        </div>
      </div>

      <div className="grid gap-6 py-6 sm:grid-cols-3">
        <div>
          <p className="label">Bill to</p>
          <p className="font-semibold text-navy-900">{d.customer?.name}</p>
          <p className="text-sm text-slate-600">{[d.customer?.city, d.customer?.state].filter(Boolean).join(", ")}</p>
          {d.customer?.gstin && <p className="text-xs text-slate-600">GSTIN: {d.customer.gstin}</p>}
        </div>
        <div>
          <p className="label">Consignor</p>
          {d.pickups.map((s, i) => (
            <p key={i} className="text-sm text-slate-700">
              <span className="font-medium">{s.company?.name}</span> — {[s.city, s.state].filter(Boolean).join(", ")} ({fmtDate(s.date)})
            </p>
          ))}
        </div>
        <div>
          <p className="label">Consignee</p>
          {d.deliveries.map((s, i) => (
            <p key={i} className="text-sm text-slate-700">
              <span className="font-medium">{s.company?.name}</span> — {[s.city, s.state].filter(Boolean).join(", ")} ({fmtDate(s.date)})
            </p>
          ))}
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-4 rounded-lg bg-slate-50 p-4 text-sm sm:grid-cols-4">
        <div>
          <p className="label">Driver</p>
          {driverName(d.driver)}
        </div>
        <div>
          <p className="label">Vehicle No.</p>
          {d.truck?.plateNumber || d.truck?.unitNumber || "—"}
          {d.trailer ? ` / ${d.trailer.plateNumber || d.trailer.unitNumber}` : ""}
        </div>
        <div>
          <p className="label">Distance</p>
          {num(d.loadedMiles)} km
        </div>
        <div>
          <p className="label">Goods</p>
          {d.commodity || "—"}
          {d.weight ? ` · ${num(d.weight)} kg` : ""}
        </div>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b-2 border-navy-800 text-left">
            <th className="py-2 font-semibold text-navy-900">Description (SAC 9965 — goods transport)</th>
            <th className="py-2 text-right font-semibold text-navy-900">Amount</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([k, v], i) => (
            <tr key={i} className="border-b border-slate-100">
              <td className="py-2">{k}</td>
              <td className="py-2 text-right">{money(v)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="ml-auto mt-4 w-full max-w-sm space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-slate-500">Taxable Value</span>
          <span className="font-semibold">{money(d.subtotal)}</span>
        </div>
        {d.gstPercent ? (
          interState ? (
            <div className="flex justify-between">
              <span className="text-slate-500">IGST @ {d.gstPercent}%</span>
              <span>{money(d.gstAmount)}</span>
            </div>
          ) : (
            <>
              <div className="flex justify-between">
                <span className="text-slate-500">CGST @ {d.gstPercent / 2}%</span>
                <span>{money(half)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">SGST @ {d.gstPercent / 2}%</span>
                <span>{money(half)}</span>
              </div>
            </>
          )
        ) : (
          <p className="text-xs text-slate-500">GST payable by recipient under reverse charge (RCM), if applicable.</p>
        )}
        <div className="flex justify-between">
          <span className="text-slate-500">Invoice Total</span>
          <span className="font-semibold">{money(d.invoiceTotal)}</span>
        </div>
        {d.invoiceAdvance ? (
          <div className="flex justify-between">
            <span className="text-slate-500">Less Advance Received</span>
            <span>-{money(d.invoiceAdvance)}</span>
          </div>
        ) : null}
        <div className="flex justify-between border-t-2 border-navy-800 pt-2 text-lg">
          <span className="font-bold text-navy-900">Balance Due</span>
          <span className="font-bold text-navy-900">{money(d.balanceDue)}</span>
        </div>
      </div>
      <p className="mt-3 text-right text-xs italic text-slate-600">{inWords(d.balanceDue)}</p>

      {d.notes && <p className="mt-6 whitespace-pre-line text-sm text-slate-600">{d.notes}</p>}
      <div className="mt-10 flex items-end justify-between border-t border-slate-200 pt-4 text-xs text-slate-500">
        <p>Thank you for your business — Kripa Truck Dispatch & Logistics</p>
        <p className="text-right">
          <span className="mb-8 block">For Kripa Truck Dispatch & Logistics</span>
          Authorised Signatory
        </p>
      </div>
    </section>
  );
}

export default function DispatchView({ id }) {
  const sp = useSearchParams();
  const [d, setD] = useState(null);
  const [error, setError] = useState("");
  const [call, setCall] = useState({ status: "", location: "", note: "" });
  const [posting, setPosting] = useState(false);

  async function load() {
    try {
      setD((await api(`/api/dispatches/${id}`)).item);
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (d && sp.get("print")) setTimeout(() => window.print(), 300);
  }, [d, sp]);

  async function addCall(e) {
    e.preventDefault();
    setPosting(true);
    try {
      await api(`/api/track/${id}`, { method: "POST", body: call });
      setCall({ status: "", location: "", note: "" });
      await load();
    } catch (err) {
      alert(err.message);
    }
    setPosting(false);
  }

  if (error) return <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>;
  if (!d) return <Loader2 className="mx-auto mt-20 h-6 w-6 animate-spin text-royal-600" />;

  return (
    <>
      <PageHeader title={`${d.loadNumber} · ${d.tripName}`} subtitle={`Customer: ${d.customer?.name || "—"}`} back={{ href: "/dispatches", label: "Back to Dispatches" }}>
        <Badge value={d.status} />
        <Link href={`/dispatches/${id}/edit`} className="btn-ghost">
          <Pencil className="h-4 w-4" /> Edit Dispatch
        </Link>
        <button onClick={() => window.print()} className="btn-gold">
          <Printer className="h-4 w-4" /> Print Invoice
        </button>
      </PageHeader>

      <div className="no-print space-y-6">
        <section className="card p-5 sm:p-6">
          <h2 className="mb-5 text-sm font-bold uppercase tracking-wider text-navy-800">Load progress</h2>
          <Progress status={d.status} />
        </section>

        <div className="grid gap-6 lg:grid-cols-3">
          <section className="card p-5 sm:p-6 lg:col-span-1">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-navy-800">Assignment</h2>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-3">
                <User className="h-4 w-4 text-royal-600" />
                {d.driver ? (
                  <Link href={`/drivers/${d.driver._id}`} className="font-medium text-royal-600 hover:underline">
                    {driverName(d.driver)}
                  </Link>
                ) : (
                  "—"
                )}
                <span className="text-slate-500">{d.driver?.phone}</span>
              </li>
              {d.teamDrivers?.map((t) => (
                <li key={t._id} className="flex items-center gap-3 pl-7 text-slate-600">
                  + {driverName(t)} (team)
                </li>
              ))}
              <li className="flex items-center gap-3">
                <Truck className="h-4 w-4 text-royal-600" />
                {d.truck ? (
                  <Link href={`/trucks/${d.truck._id}`} className="font-medium text-royal-600 hover:underline">
                    {d.truck.plateNumber || `Truck ${d.truck.unitNumber}`}
                  </Link>
                ) : (
                  "—"
                )}
              </li>
              <li className="flex items-center gap-3">
                <Container className="h-4 w-4 text-royal-600" />
                {d.trailer ? (
                  <Link href={`/trailers/${d.trailer._id}`} className="font-medium text-royal-600 hover:underline">
                    {d.trailer.plateNumber || `Trailer ${d.trailer.unitNumber}`} {d.trailer.type && `· ${d.trailer.type}`}
                  </Link>
                ) : (
                  <span className="text-slate-400">No trailer</span>
                )}
              </li>
            </ul>
            <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 text-sm">
              {[
                ["Loaded km", num(d.loadedMiles)],
                ["Empty km", num(d.deadheadMiles)],
                ["Driver pay", money(d.manualPay)],
                ["Driver advance", money(d.driverAdvance)],
                ["Driver bhatta", money(d.accessoryDriverPay)],
                ["Freight / km", money(d.ratePerMile)],
                ["Dispatcher", d.dispatcher?.name || "—"],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-xs text-slate-500">{k}</dt>
                  <dd className="font-semibold text-navy-900">{v}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="card p-5 sm:p-6">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-navy-800">Route</h2>
            {d.pickups.map((s, i) => (
              <StopCard key={s._id} stop={s} kind="pickup" n={i + 1} />
            ))}
            {d.deliveries.map((s, i) => (
              <StopCard key={s._id} stop={s} kind="delivery" n={i + 1} />
            ))}
          </section>

          <section className="card p-5 sm:p-6">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-navy-800">Tracking & check calls</h2>
            <form onSubmit={addCall} className="space-y-2 rounded-xl bg-slate-50 p-3">
              <select className="input" value={call.status} onChange={(e) => setCall({ ...call, status: e.target.value })}>
                <option value="">Keep status ({d.status})</option>
                {DISPATCH_STATUSES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
              <input className="input" placeholder="Current location (e.g. Jaipur bypass, NH 48)" value={call.location} onChange={(e) => setCall({ ...call, location: e.target.value })} />
              <input className="input" placeholder="Note (ETA, delays, etc.)" value={call.note} onChange={(e) => setCall({ ...call, note: e.target.value })} />
              <button className="btn-navy w-full" disabled={posting}>
                {posting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Add update
              </button>
            </form>
            <ol className="mt-4 max-h-96 space-y-3 overflow-y-auto">
              {[...(d.checkCalls || [])].reverse().map((c) => (
                <li key={c._id} className="border-l-2 border-gold-500 pl-3">
                  <div className="flex items-center gap-2">
                    <Badge value={c.status} />
                    <span className="text-xs text-slate-500">{new Date(c.at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</span>
                  </div>
                  {c.location && <p className="mt-1 text-sm font-medium text-navy-900">📍 {c.location}</p>}
                  {c.note && <p className="text-sm text-slate-600">{c.note}</p>}
                  {c.by && <p className="text-xs text-slate-400">by {c.by}</p>}
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>

      <div className="mt-6">
        <Invoice d={d} />
      </div>
    </>
  );
}
