"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Pencil, Printer, Loader2, MapPin, Flag, Truck, Container, User, Send, Check } from "lucide-react";
import { api } from "@/lib/client";
import { DISPATCH_STATUSES, CURRENCY, taxLabel, money, num } from "@/lib/dispatch";
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

const COMPANY = {
  address: process.env.NEXT_PUBLIC_COMPANY_ADDRESS || "",
  phone: process.env.NEXT_PUBLIC_COMPANY_PHONE || "",
  mc: process.env.NEXT_PUBLIC_COMPANY_MC || "",
  dot: process.env.NEXT_PUBLIC_COMPANY_DOT || "",
  taxNo: process.env.NEXT_PUBLIC_COMPANY_GST_HST || "",
};

function stopCities(stops) {
  return (stops || []).map((s) => [s.city, s.state].filter(Boolean).join(", ")).filter(Boolean).join(" / ") || "—";
}

function Invoice({ d }) {
  const rows = [
    [
      d.primaryFeeType === "Per Mile"
        ? `Line haul — ${num(d.loadedMiles)} mi × ${money(d.rate)}`
        : d.primaryFeeType === "Per Hour"
        ? `Line haul — ${d.quantity || 0} hrs × ${money(d.rate)}`
        : d.primaryFeeType === "Per Unit / Pallet"
        ? `Line haul — ${d.quantity || 0} units × ${money(d.rate)}`
        : `Line haul — ${stopCities(d.pickups)} to ${stopCities(d.deliveries)}`,
      d.primaryCharges,
    ],
  ];
  if (d.fuelSurcharge) rows.push([`Fuel surcharge — ${num(d.loadedMiles)} mi × ${money(d.fuelSurchargePerMile)}`, d.fuelSurcharge]);
  for (const a of d.accessories || []) rows.push([a.name, a.amount]);

  return (
    <section className="print-area card p-6 sm:p-8">
      <div className="flex flex-col justify-between gap-6 border-b border-slate-200 pb-6 sm:flex-row">
        <div>
          <img src="/logo.jpeg" alt="Kirpa Truck Dispatch & Logistics" className="h-24 w-auto" />
          {COMPANY.address && <p className="mt-2 max-w-xs text-xs text-slate-600">{COMPANY.address}</p>}
          {COMPANY.phone && <p className="text-xs text-slate-600">Phone: {COMPANY.phone}</p>}
          {(COMPANY.mc || COMPANY.dot) && (
            <p className="text-xs font-semibold text-slate-700">{[COMPANY.mc && `MC# ${COMPANY.mc}`, COMPANY.dot && `USDOT# ${COMPANY.dot}`].filter(Boolean).join(" · ")}</p>
          )}
          {COMPANY.taxNo && <p className="text-xs text-slate-600">GST/HST# {COMPANY.taxNo}</p>}
        </div>
        <div className="sm:text-right">
          <p className="text-3xl font-bold tracking-tight text-navy-900">INVOICE</p>
          <p className="mt-1 text-sm text-slate-600">Invoice # {d.loadNumber}</p>
          <p className="text-sm text-slate-600">Date: {fmtDate(d.invoiceDate || d.updatedAt)}</p>
          {d.customer?.paymentTerms && <p className="text-sm text-slate-600">Terms: {d.customer.paymentTerms}</p>}
          {d.customerLoadNumber && <p className="text-sm text-slate-600">Load / PO # {d.customerLoadNumber}</p>}
          {d.ewayBillNumber && <p className="text-sm text-slate-600">BOL # {d.ewayBillNumber}</p>}
          {d.borderNumber && <p className="text-sm text-slate-600">PARS / PAPS # {d.borderNumber}</p>}
        </div>
      </div>

      <div className="grid gap-6 py-6 sm:grid-cols-3">
        <div>
          <p className="label">Bill to</p>
          <p className="font-semibold text-navy-900">{d.customer?.name}</p>
          <p className="text-sm text-slate-600">{[d.customer?.city, d.customer?.state].filter(Boolean).join(", ")}</p>
          {d.customer?.mcNumber && <p className="text-xs text-slate-600">{d.customer.mcNumber}</p>}
          {d.customer?.billingEmail && <p className="text-xs text-slate-600">{d.customer.billingEmail}</p>}
        </div>
        <div>
          <p className="label">Shipper</p>
          {d.pickups.map((s, i) => (
            <p key={i} className="text-sm text-slate-700">
              <span className="font-medium">{s.company?.name}</span> — {[s.city, s.state].filter(Boolean).join(", ")} ({fmtDate(s.date)})
            </p>
          ))}
        </div>
        <div>
          <p className="label">Receiver</p>
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
          <p className="label">Truck / Trailer</p>
          {d.truck ? `#${d.truck.unitNumber}` : "—"}
          {d.trailer ? ` / #${d.trailer.unitNumber}` : ""}
        </div>
        <div>
          <p className="label">Loaded Miles</p>
          {num(d.loadedMiles)} mi
        </div>
        <div>
          <p className="label">Commodity</p>
          {d.commodity || "—"}
          {d.weight ? ` · ${num(d.weight)} lbs` : ""}
        </div>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b-2 border-navy-800 text-left">
            <th className="py-2 font-semibold text-navy-900">Description</th>
            <th className="py-2 text-right font-semibold text-navy-900">Amount ({CURRENCY})</th>
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
          <span className="text-slate-500">Subtotal</span>
          <span className="font-semibold">{money(d.subtotal)}</span>
        </div>
        {d.gstPercent ? (
          <div className="flex justify-between">
            <span className="text-slate-500">{taxLabel(d.gstPercent)}</span>
            <span>{money(d.gstAmount)}</span>
          </div>
        ) : null}
        <div className="flex justify-between">
          <span className="text-slate-500">Invoice Total</span>
          <span className="font-semibold">{money(d.invoiceTotal)}</span>
        </div>
        {d.invoiceAdvance ? (
          <div className="flex justify-between">
            <span className="text-slate-500">Less Advance / Paid</span>
            <span>-{money(d.invoiceAdvance)}</span>
          </div>
        ) : null}
        <div className="flex justify-between border-t-2 border-navy-800 pt-2 text-lg">
          <span className="font-bold text-navy-900">Balance Due</span>
          <span className="font-bold text-navy-900">{money(d.balanceDue)}</span>
        </div>
      </div>

      {d.notes && <p className="mt-6 whitespace-pre-line text-sm text-slate-600">{d.notes}</p>}
      <div className="mt-10 flex items-end justify-between border-t border-slate-200 pt-4 text-xs text-slate-500">
        <p>Thank you for your business — Kirpa Truck Dispatch & Logistics</p>
        <p className="text-right">Please include the invoice # with your payment.</p>
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
                    Unit {d.truck.unitNumber}{d.truck.make ? ` · ${d.truck.make}` : ""}
                  </Link>
                ) : (
                  "—"
                )}
              </li>
              <li className="flex items-center gap-3">
                <Container className="h-4 w-4 text-royal-600" />
                {d.trailer ? (
                  <Link href={`/trailers/${d.trailer._id}`} className="font-medium text-royal-600 hover:underline">
                    Trailer {d.trailer.unitNumber} {d.trailer.type && `· ${d.trailer.type}`}
                  </Link>
                ) : (
                  <span className="text-slate-400">No trailer</span>
                )}
              </li>
            </ul>
            <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 text-sm">
              {[
                ["Loaded miles", num(d.loadedMiles)],
                ["Deadhead miles", num(d.deadheadMiles)],
                ["Driver pay", money(d.manualPay)],
                ["Driver advance", money(d.driverAdvance)],
                ["Driver accessorial pay", money(d.accessoryDriverPay)],
                ["Rate per mile", money(d.ratePerMile)],
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
              <input className="input" placeholder="Current location (e.g. I-40 near Amarillo, TX)" value={call.location} onChange={(e) => setCall({ ...call, location: e.target.value })} />
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
                    <span className="text-xs text-slate-500">{new Date(c.at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}</span>
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
