import Link from "next/link";
import { Route, IdCard, Truck, IndianRupee, AlertTriangle, Plus, BookOpen, Video, Receipt } from "lucide-react";
import { connectDB } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { Models, Dispatch } from "@/models";
import { ACTIVE_STATUSES, DISPATCH_STATUSES, money } from "@/lib/dispatch";
import { Badge, fmtDate, ExpiryText } from "@/components/ui";
import { LoadsTable } from "@/components/RecentLoads";
import { driverName } from "@/lib/format";

export const dynamic = "force-dynamic";

const TRUCK_DOCS = [["registrationExpiry","RC"],["insuranceExpiry","Insurance"],["permitExpiry","Permit"],["fitnessExpiry","Fitness certificate"],["pucExpiry","PUC"],["roadTaxExpiry","Road tax"]];

async function countBy(model, field) {
  const rows = await model.aggregate([{ $group: { _id: `$${field}`, n: { $sum: 1 } } }]);
  return Object.fromEntries(rows.map((r) => [r._id || "—", r.n]));
}

function Kpi({ icon: Icon, label, value, sub, href, accent }) {
  return (
    <Link href={href} className="card group flex items-start gap-4 p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${accent}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
        <p className="mt-1 whitespace-nowrap text-xl font-bold tabular-nums text-navy-900">{value}</p>
        {sub && <p className="mt-0.5 truncate text-xs text-slate-500">{sub}</p>}
      </div>
    </Link>
  );
}

function StatusBars({ title, counts, order, href }) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const max = Math.max(1, ...Object.values(counts));
  return (
    <section className="card p-5">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="font-semibold text-navy-900">{title}</h2>
        <Link href={href} className="text-xs font-semibold text-royal-600 hover:underline">
          {total} total →
        </Link>
      </div>
      <ul className="space-y-2.5">
        {order.map((s) => (
          <li key={s} className="grid grid-cols-[110px_1fr_32px] items-center gap-3 text-sm" title={`${s}: ${counts[s] || 0}`}>
            <span className="truncate text-slate-600">{s}</span>
            <span className="h-2 rounded-full bg-slate-100">
              <span className="block h-2 rounded-full bg-royal-600" style={{ width: `${((counts[s] || 0) / max) * 100}%` }} />
            </span>
            <span className="text-right font-semibold tabular-nums text-navy-900">{counts[s] || 0}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default async function Dashboard() {
  const session = await getSession();
  await connectDB();

  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const sixStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1));
  const soon = new Date(Date.now() + 30 * 86400000);

  const [driverCounts, truckCounts, trailerCounts, loadCounts, monthRev, unpaid, revByMonth, active, recent, driverAlerts, truckAlerts] = await Promise.all([
    countBy(Models.drivers, "status"),
    countBy(Models.trucks, "status"),
    countBy(Models.trailers, "status"),
    countBy(Dispatch, "status"),
    Dispatch.aggregate([{ $match: { createdAt: { $gte: monthStart }, status: { $ne: "Cancelled" } } }, { $group: { _id: null, t: { $sum: "$invoiceTotal" }, n: { $sum: 1 } } }]),
    Dispatch.aggregate([{ $match: { status: { $in: ["Delivered", "Invoiced"] } } }, { $group: { _id: null, t: { $sum: "$balanceDue" }, n: { $sum: 1 } } }]),
    Dispatch.aggregate([
      { $match: { createdAt: { $gte: sixStart }, status: { $ne: "Cancelled" } } },
      { $group: { _id: { y: { $year: "$createdAt" }, m: { $month: "$createdAt" } }, t: { $sum: "$invoiceTotal" } } },
    ]),
    Dispatch.find({ status: { $in: ACTIVE_STATUSES } })
      .sort("-updatedAt")
      .limit(8)
      .populate([{ path: "driver", select: "firstName lastName phone" }, { path: "truck", select: "unitNumber plateNumber" }, { path: "customer", select: "name" }])
      .lean(),
    Dispatch.find()
      .sort("-createdAt")
      .limit(6)
      .populate([
        { path: "driver", select: "firstName lastName" },
        { path: "truck", select: "unitNumber plateNumber" },
        { path: "trailer", select: "unitNumber plateNumber" },
        { path: "customer", select: "name" },
        { path: "pickups.company", select: "name" },
        { path: "deliveries.company", select: "name" },
      ])
      .lean(),
    Models.drivers
      .find({ status: { $ne: "Inactive" }, $or: [{ licenseExpiry: { $lte: soon } }, { medicalCardExpiry: { $lte: soon } }] })
      .select("firstName lastName licenseExpiry medicalCardExpiry")
      .limit(10)
      .lean(),
    Models.trucks
      .find({ $or: [{"registrationExpiry":{ $lte: soon }},{"insuranceExpiry":{ $lte: soon }},{"permitExpiry":{ $lte: soon }},{"fitnessExpiry":{ $lte: soon }},{"pucExpiry":{ $lte: soon }},{"roadTaxExpiry":{ $lte: soon }}] })
      .select("unitNumber plateNumber registrationExpiry insuranceExpiry permitExpiry fitnessExpiry pucExpiry roadTaxExpiry")
      .limit(10)
      .lean(),
  ]);

  const sum = (o) => Object.values(o).reduce((a, b) => a + b, 0);
  const activeCount = ACTIVE_STATUSES.reduce((a, s) => a + (loadCounts[s] || 0), 0);

  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5 + i, 1));
    const hit = revByMonth.find((r) => r._id.y === d.getUTCFullYear() && r._id.m === d.getUTCMonth() + 1);
    return { label: d.toLocaleString("en-US", { month: "short", timeZone: "UTC" }), t: hit?.t || 0 };
  });
  const maxRev = Math.max(1, ...months.map((m) => m.t));

  const alerts = [
    ...driverAlerts.flatMap((d) => [
      d.licenseExpiry && d.licenseExpiry <= soon && { href: `/drivers/${d._id}`, who: driverName(d), what: "Driving licence", date: d.licenseExpiry },
      d.medicalCardExpiry && d.medicalCardExpiry <= soon && { href: `/drivers/${d._id}`, who: driverName(d), what: "Medical fitness", date: d.medicalCardExpiry },
    ]),
    ...truckAlerts.flatMap((t) => [
      ...TRUCK_DOCS.map(([k, what]) => t[k] && t[k] <= soon && { href: `/trucks/${t._id}`, who: t.plateNumber || `Truck ${t.unitNumber}`, what, date: t[k] }),
    ]),
  ]
    .filter(Boolean)
    .sort((a, b) => a.date - b.date);

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-2xl bg-navy-900 p-6 text-white shadow-lg sm:p-8">
        <div className="absolute inset-0 bg-[linear-gradient(110deg,#0a1a45_0%,#0f2560_45%,#1d4fd1_75%,#d4a017_120%)]" />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-400">Kripa Dispatch Control Center</p>
            <h1 className="mt-2 text-3xl font-bold">Welcome back, {session.name?.split(" ")[0]}</h1>
            <p className="mt-2 max-w-xl text-sm text-slate-300">
              {activeCount} load{activeCount === 1 ? "" : "s"} on the road right now · {driverCounts.Available || 0} drivers and {truckCounts.Available || 0} trucks available.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/dispatches/new" className="btn-gold">
              <Plus className="h-4 w-4" /> New Dispatch
            </Link>
            <Link href="/drivers/new" className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/30 hover:bg-white/20">
              <Plus className="h-4 w-4" /> Driver
            </Link>
            <Link href="/trucks/new" className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/30 hover:bg-white/20">
              <Plus className="h-4 w-4" /> Truck
            </Link>
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Kpi icon={Route} label="Active loads" value={activeCount} sub={`${sum(loadCounts)} dispatches all time`} href="/dispatches" accent="bg-royal-100 text-royal-600" />
        <Kpi icon={IndianRupee} label="Revenue this month" value={money(Math.round(monthRev[0]?.t || 0)).replace(/\.00$/, "")} sub={`${monthRev[0]?.n || 0} loads booked`} href="/dispatches" accent="bg-gold-100 text-gold-600" />
        <Kpi icon={Receipt} label="Awaiting payment" value={money(Math.round(unpaid[0]?.t || 0)).replace(/\.00$/, "")} sub={`${unpaid[0]?.n || 0} delivered / invoiced`} href="/dispatches" accent="bg-amber-100 text-amber-700" />
        <Kpi icon={IdCard} label="Drivers" value={`${driverCounts.Available || 0} / ${sum(driverCounts)}`} sub={`${driverCounts["On Trip"] || 0} on trip · available / total`} href="/drivers" accent="bg-emerald-100 text-emerald-700" />
        <Kpi icon={Truck} label="Trucks" value={`${truckCounts.Available || 0} / ${sum(truckCounts)}`} sub={`${truckCounts.Maintenance || 0} in maintenance · ${sum(trailerCounts)} trailers`} href="/trucks" accent="bg-navy-800 text-gold-400" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="card p-5 lg:col-span-2">
          <div className="mb-1 flex items-baseline justify-between">
            <h2 className="font-semibold text-navy-900">Invoiced revenue — last 6 months</h2>
            <span className="text-xs text-slate-500">by dispatch creation date</span>
          </div>
          <div className="mt-6 flex h-52 items-end gap-3 border-b border-slate-200 sm:gap-6">
            {months.map((m) => (
              <div key={m.label} className="group relative flex h-full flex-1 flex-col items-center justify-end" title={`${m.label}: ${money(m.t)}`}>
                <span className="mb-1 text-[11px] font-semibold tabular-nums text-slate-600">{m.t ? money(m.t).replace(/\.00$/, "") : ""}</span>
                <span className="w-full max-w-14 rounded-t bg-royal-600 transition group-hover:bg-navy-800" style={{ height: `${Math.max((m.t / maxRev) * 85, m.t ? 2 : 0)}%` }} />
              </div>
            ))}
          </div>
          <div className="mt-2 flex gap-3 sm:gap-6">
            {months.map((m) => (
              <span key={m.label} className="flex-1 text-center text-xs text-slate-500">
                {m.label}
              </span>
            ))}
          </div>
        </section>

        <section className="card p-5">
          <div className="mb-4 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <h2 className="font-semibold text-navy-900">Compliance alerts</h2>
            <span className="ml-auto text-xs text-slate-500">next 30 days</span>
          </div>
          {alerts.length ? (
            <ul className="max-h-60 space-y-2 overflow-y-auto">
              {alerts.map((a, i) => (
                <li key={i}>
                  <Link href={a.href} className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-slate-50">
                    <span>
                      <span className="font-medium text-navy-900">{a.who}</span>
                      <span className="block text-xs text-slate-500">{a.what}</span>
                    </span>
                    <span className="text-right text-xs">
                      <ExpiryText value={a.date} />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-lg bg-emerald-50 px-3 py-6 text-center text-sm text-emerald-800">All licences, medical certificates and vehicle papers (RC, permit, insurance, fitness, PUC) are valid.</p>
          )}
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <StatusBars title="Loads by status" counts={loadCounts} order={DISPATCH_STATUSES} href="/dispatches" />
        <StatusBars title="Drivers" counts={driverCounts} order={["Available", "On Trip", "Off Duty", "Inactive"]} href="/drivers" />
        <StatusBars title="Trucks" counts={truckCounts} order={["Available", "In Use", "Maintenance", "Out of Service"]} href="/trucks" />
      </div>

      <section className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="font-semibold text-navy-900">Live tracking — loads on the road</h2>
          <Link href="/dispatches" className="text-xs font-semibold text-royal-600 hover:underline">
            All dispatches →
          </Link>
        </div>
        {active.length ? (
          <ul className="divide-y divide-slate-100">
            {active.map((d) => {
              const last = d.checkCalls?.[d.checkCalls.length - 1];
              return (
                <li key={String(d._id)}>
                  <Link href={`/dispatches/${d._id}`} className="grid gap-2 px-5 py-3 hover:bg-royal-50/40 sm:grid-cols-[120px_1fr_1fr_auto] sm:items-center">
                    <span className="font-semibold text-royal-600">{d.loadNumber}</span>
                    <span className="text-sm">
                      <span className="font-medium text-navy-900">{driverName(d.driver)}</span>
                      <span className="text-slate-500"> · {d.truck?.plateNumber || `Truck ${d.truck?.unitNumber}`} · {d.customer?.name}</span>
                    </span>
                    <span className="text-sm text-slate-600">
                      {last?.location ? `📍 ${last.location}` : "No location yet"}
                      <span className="block text-xs text-slate-400">{last ? `updated ${fmtDate(last.at, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}` : ""}</span>
                    </span>
                    <Badge value={d.status} />
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="px-5 py-8 text-center text-sm text-slate-500">No loads on the road right now.</p>
        )}
      </section>

      <section className="card overflow-hidden">
        <h2 className="border-b border-slate-100 px-5 py-4 font-semibold text-navy-900">Recently created dispatches</h2>
        {recent.length ? <LoadsTable items={JSON.parse(JSON.stringify(recent))} /> : <p className="px-5 py-8 text-center text-sm text-slate-500">No dispatches yet.</p>}
      </section>

      <section className="card p-5">
        <h2 className="mb-4 font-semibold text-navy-900">Training modules</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Link href="/syllabus" className="flex items-center gap-4 rounded-xl border border-royal-100 bg-royal-50/50 p-4 hover:border-royal-500">
            <BookOpen className="h-6 w-6 text-royal-600" />
            <span>
              <span className="block font-semibold text-navy-900">Syllabus</span>
              <span className="text-sm text-slate-500">View topics and available PDFs.</span>
            </span>
          </Link>
          <Link href="/lectures" className="flex items-center gap-4 rounded-xl border border-gold-100 bg-gold-100/40 p-4 hover:border-gold-500">
            <Video className="h-6 w-6 text-gold-600" />
            <span>
              <span className="block font-semibold text-navy-900">Daily Lectures</span>
              <span className="text-sm text-slate-500">Open lectures shared for your batches.</span>
            </span>
          </Link>
        </div>
      </section>
    </div>
  );
}
