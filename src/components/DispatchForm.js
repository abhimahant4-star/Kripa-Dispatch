"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Loader2, MapPin, Flag } from "lucide-react";
import { api } from "@/lib/client";
import { STATES, COUNTRIES, stateLabel } from "@/lib/resources";
import { DISPATCH_STATUSES, FEE_TYPES, ACCESSORIAL_TYPES, STOP_TYPES, TAX_RATES, taxLabel, CURRENCY, computeTotals, money } from "@/lib/dispatch";
import { PageHeader } from "./ui";
import { RefSelect, useRefOptions, toDateInput } from "./fields";

const emptyStop = () => ({ company: "", date: "", time: "", type: "", street: "", city: "", state: "", zip: "", country: "USA", referenceNumber: "", instructions: "", notes: "" });

const idOf = (v) => (v && typeof v === "object" ? v._id : v || "");

function Section({ title, subtitle, children, action }) {
  return (
    <section className="card p-5 sm:p-6">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-navy-800">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function F({ label, required, children, wide }) {
  return (
    <div className={wide ? "sm:col-span-2" : ""}>
      <label className="label">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

function StopEditor({ stops, setStops, kind }) {
  const companies = useRefOptions("companies");
  const isPickup = kind === "pickup";
  const label = isPickup ? "Shipper" : "Receiver";

  const update = (i, patch) => setStops(stops.map((s, j) => (j === i ? { ...s, ...patch } : s)));

  function pickCompany(i, id) {
    const c = companies?.find((x) => x._id === id);
    update(i, c ? { company: id, street: c.street || "", city: c.city || "", state: c.state || "", zip: c.zip || "", country: c.country || "USA" } : { company: id });
  }

  return (
    <div className="space-y-4">
      {stops.map((s, i) => (
        <div key={s._id || i} className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-navy-900">
              {isPickup ? <MapPin className="h-4 w-4 text-royal-600" /> : <Flag className="h-4 w-4 text-gold-600" />}
              {isPickup ? "Pickup" : "Delivery"} #{i + 1}
            </span>
            {stops.length > 1 && (
              <button type="button" onClick={() => setStops(stops.filter((_, j) => j !== i))} className="icon-btn text-red-600" title="Remove stop">
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <F label={label} required wide>
              <RefSelect refKey="companies" required value={s.company} onChange={(v) => pickCompany(i, v)} placeholder={`Select ${label}`} />
            </F>
            <F label={isPickup ? "Pickup Date" : "Delivery Date"} required>
              <input type="date" required className="input" value={toDateInput(s.date)} onChange={(e) => update(i, { date: e.target.value })} />
            </F>
            <F label="Time / Window">
              <input className="input" placeholder="08:00 - 14:00" value={s.time || ""} onChange={(e) => update(i, { time: e.target.value })} />
            </F>
            <F label="Address" wide>
              <input className="input" value={s.street || ""} onChange={(e) => update(i, { street: e.target.value })} />
            </F>
            <F label="City">
              <input className="input" value={s.city || ""} onChange={(e) => update(i, { city: e.target.value })} />
            </F>
            <F label="State / Province">
              <select className="input" value={s.state || ""} onChange={(e) => update(i, { state: e.target.value })}>
                <option value="">Select State / Province</option>
                {STATES.map((x) => (
                  <option key={x} value={x}>
                    {stateLabel(x)}
                  </option>
                ))}
              </select>
            </F>
            <F label="ZIP / Postal Code">
              <input className="input" value={s.zip || ""} onChange={(e) => update(i, { zip: e.target.value })} />
            </F>
            <F label="Country">
              <select className="input" value={s.country || ""} onChange={(e) => update(i, { country: e.target.value })}>
                {COUNTRIES.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </F>
            <F label="Type">
              <select className="input" value={s.type || ""} onChange={(e) => update(i, { type: e.target.value })}>
                <option value="">Select Type</option>
                {STOP_TYPES.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </F>
            <F label={isPickup ? "Pickup # / PO #" : "Delivery # / Appointment #"}>
              <input className="input" value={s.referenceNumber || ""} onChange={(e) => update(i, { referenceNumber: e.target.value })} />
            </F>
            <F label="Instructions" wide>
              <textarea className="input min-h-16" value={s.instructions || ""} onChange={(e) => update(i, { instructions: e.target.value })} />
            </F>
            <F label="Notes" wide>
              <textarea className="input min-h-16" value={s.notes || ""} onChange={(e) => update(i, { notes: e.target.value })} />
            </F>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function DispatchForm({ id }) {
  const router = useRouter();
  const trucks = useRefOptions("trucks");
  const drivers = useRefOptions("drivers");
  const [d, setD] = useState({
    tripName: "",
    customer: "",
    customerLoadNumber: "",
    status: "Planned",
    driver: "",
    teamDrivers: [],
    truck: "",
    trailer: "",
    pickups: [emptyStop()],
    deliveries: [emptyStop()],
    primaryFeeType: "Flat Rate",
    gstPercent: 0,
    accessories: [],
  });
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    api(`/api/dispatches/${id}`)
      .then(({ item }) =>
        setD({
          ...item,
          customer: idOf(item.customer),
          driver: idOf(item.driver),
          truck: idOf(item.truck),
          trailer: idOf(item.trailer),
          teamDrivers: (item.teamDrivers || []).map(idOf),
          pickups: item.pickups?.length ? item.pickups.map((s) => ({ ...s, company: idOf(s.company) })) : [emptyStop()],
          deliveries: item.deliveries?.length ? item.deliveries.map((s) => ({ ...s, company: idOf(s.company) })) : [emptyStop()],
        })
      )
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const set = (patch) => setD((s) => ({ ...s, ...patch }));
  const totals = useMemo(() => computeTotals(d), [d]);

  // Picking a truck fills in its assigned driver, and vice versa.
  function chooseTruck(truckId) {
    const t = trucks?.find((x) => x._id === truckId);
    set({ truck: truckId, ...(!d.driver && t?.assignedDriver ? { driver: idOf(t.assignedDriver) } : {}) });
  }
  function chooseDriver(driverId) {
    const t = trucks?.find((x) => idOf(x.assignedDriver) === driverId);
    set({ driver: driverId, ...(!d.truck && t ? { truck: t._id } : {}) });
  }

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await api(id ? `/api/dispatches/${id}` : "/api/dispatches", { method: id ? "PUT" : "POST", body: d });
      router.push(`/dispatches/${res.item._id}`);
      router.refresh();
    } catch (err) {
      setError(err.message);
      setSaving(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  if (loading) return <Loader2 className="mx-auto mt-20 h-6 w-6 animate-spin text-royal-600" />;

  const num = (k) => ({ type: "number", step: "any", className: "input", value: d[k] ?? "", onChange: (e) => set({ [k]: e.target.value }) });
  const notDriver = (o) => o.status !== "Inactive" && o._id !== d.driver;

  return (
    <>
      <PageHeader
        title={id ? `Edit Dispatch ${d.loadNumber || ""}` : "Add Dispatch"}
        subtitle="Build a trip with drivers, equipment, stops and fee details from one screen."
        back={{ href: "/dispatches", label: "Back to Dispatches" }}
      />
      <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          {error && <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

          <Section title="Trip setup" subtitle="Select the main driver, customer and status for this trip.">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <F label="Trip Name" required>
                <input className="input" required value={d.tripName} onChange={(e) => set({ tripName: e.target.value })} placeholder="Dallas, TX → Atlanta, GA — dry van" />
              </F>
              <F label="Customer" required>
                <RefSelect refKey="companies" required value={d.customer} onChange={(v) => set({ customer: v })} placeholder="Select Customer" />
              </F>
              <F label="Broker Load # / PO #">
                <input className="input" value={d.customerLoadNumber || ""} onChange={(e) => set({ customerLoadNumber: e.target.value })} />
              </F>
              <F label="BOL #">
                <input className="input" value={d.ewayBillNumber || ""} onChange={(e) => set({ ewayBillNumber: e.target.value })} />
              </F>
              <F label="PARS / PAPS # (cross-border)">
                <input className="input" value={d.borderNumber || ""} onChange={(e) => set({ borderNumber: e.target.value })} />
              </F>
              <F label="Select Driver" required>
                <RefSelect refKey="drivers" required value={d.driver} onChange={chooseDriver} filter={(o) => o.status !== "Inactive"} />
              </F>
              <F label="Status">
                <select className="input" value={d.status} onChange={(e) => set({ status: e.target.value })}>
                  {DISPATCH_STATUSES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </F>
              <F label="Commodity">
                <input className="input" value={d.commodity || ""} onChange={(e) => set({ commodity: e.target.value })} />
              </F>
              <F label="Weight (lbs)">
                <input {...num("weight")} />
              </F>
              <F label="Cargo Value ($)">
                <input {...num("invoiceValue")} />
              </F>
              <F label="Driver Pay ($)">
                <input {...num("manualPay")} />
              </F>
              <F label="Driver Advance / Cash ($)">
                <input {...num("driverAdvance")} />
              </F>
              <F label="Driver Accessorial Pay ($)">
                <input {...num("accessoryDriverPay")} />
              </F>
            </div>
          </Section>

          <Section
            title="Team drivers"
            subtitle="Add teammate drivers only when this dispatch needs them."
            action={
              <button type="button" className="btn-ghost py-1.5" onClick={() => set({ teamDrivers: [...d.teamDrivers, ""] })}>
                <Plus className="h-4 w-4" /> Add Team Member
              </button>
            }
          >
            {d.teamDrivers.length ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {d.teamDrivers.map((t, i) => (
                  <div key={i} className="flex gap-2">
                    <RefSelect refKey="drivers" value={t} filter={notDriver} onChange={(v) => set({ teamDrivers: d.teamDrivers.map((x, j) => (j === i ? v : x)) })} />
                    <button type="button" className="icon-btn h-auto w-10 text-red-600" onClick={() => set({ teamDrivers: d.teamDrivers.filter((_, j) => j !== i) })}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400">Solo trip — no team drivers.</p>
            )}
          </Section>

          <Section title="Equipment" subtitle="Assign the truck and trailer that will run this trip.">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <F label="Truck" required>
                <RefSelect refKey="trucks" required value={d.truck} onChange={chooseTruck} filter={(o) => o.status !== "Out of Service"} />
              </F>
              <F label="Trailer">
                <RefSelect refKey="trailers" value={d.trailer} onChange={(v) => set({ trailer: v })} filter={(o) => o.status !== "Out of Service"} />
              </F>
              <F label="Beginning Odometer">
                <input {...num("beginningOdometer")} />
              </F>
              <F label="Deadhead Miles">
                <input {...num("deadheadMiles")} />
              </F>
              <F label="Loaded Miles">
                <input {...num("loadedMiles")} />
              </F>
              <F label="Total Miles">
                <input className="input bg-slate-50" readOnly value={totals.totalMiles.toFixed(2)} />
              </F>
            </div>
            {drivers && d.driver && trucks && d.truck && (() => {
              const t = trucks.find((x) => x._id === d.truck);
              const assigned = idOf(t?.assignedDriver);
              return assigned && assigned !== d.driver ? (
                <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  Note: this truck is normally assigned to a different driver.
                </p>
              ) : null;
            })()}
          </Section>

          <Section
            title="Pickup stops"
            subtitle="One row per pickup. Choosing a shipper fills in its address."
            action={
              <button type="button" className="btn-ghost py-1.5" onClick={() => set({ pickups: [...d.pickups, emptyStop()] })}>
                <Plus className="h-4 w-4" /> Add Pickup
              </button>
            }
          >
            <StopEditor kind="pickup" stops={d.pickups} setStops={(pickups) => set({ pickups })} />
          </Section>

          <Section
            title="Delivery stops"
            subtitle="One row per delivery (receiver)."
            action={
              <button type="button" className="btn-ghost py-1.5" onClick={() => set({ deliveries: [...d.deliveries, emptyStop()] })}>
                <Plus className="h-4 w-4" /> Add Delivery
              </button>
            }
          >
            <StopEditor kind="delivery" stops={d.deliveries} setStops={(deliveries) => set({ deliveries })} />
          </Section>

          <Section title="Fee charges" subtitle={`Line haul, fuel surcharge per loaded mile, accessorials and tax. Amounts in ${CURRENCY}.`}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <F label="Primary Fee Type">
                <select className="input" value={d.primaryFeeType} onChange={(e) => set({ primaryFeeType: e.target.value })}>
                  {FEE_TYPES.map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </F>
              <F label={d.primaryFeeType === "Per Mile" ? "Rate per Loaded Mile ($)" : d.primaryFeeType === "Per Hour" ? "Rate per Hour ($)" : d.primaryFeeType === "Per Unit / Pallet" ? "Rate per Unit ($)" : "Line Haul Rate ($)"}>
                <input {...num("rate")} />
              </F>
              {(d.primaryFeeType === "Per Hour" || d.primaryFeeType === "Per Unit / Pallet") && (
                <F label={d.primaryFeeType === "Per Hour" ? "Hours" : "Units / Pallets"}>
                  <input {...num("quantity")} />
                </F>
              )}
              <F label="Fuel Surcharge ($/mile)">
                <input {...num("fuelSurchargePerMile")} placeholder="0" />
              </F>
              <F label="Tax (Canada GST / HST)">
                <select className="input" value={d.gstPercent ?? 0} onChange={(e) => set({ gstPercent: Number(e.target.value) })}>
                  {TAX_RATES.map((r) => (
                    <option key={r} value={r}>
                      {taxLabel(r)}
                    </option>
                  ))}
                </select>
              </F>
              <F label="Advance / Quick Pay Received ($)">
                <input {...num("invoiceAdvance")} />
              </F>
              <F label="Invoice Date">
                <input type="date" className="input" value={toDateInput(d.invoiceDate)} onChange={(e) => set({ invoiceDate: e.target.value })} />
              </F>
            </div>

            <div className="mt-6">
              <div className="mb-2 flex items-center justify-between">
                <p className="label mb-0">Accessorial charges</p>
                <button type="button" className="btn-ghost py-1.5" onClick={() => set({ accessories: [...d.accessories, { name: "Detention", amount: "" }] })}>
                  <Plus className="h-4 w-4" /> Add Charge
                </button>
              </div>
              {d.accessories.length ? (
                <div className="space-y-2">
                  {d.accessories.map((a, i) => (
                    <div key={i} className="grid grid-cols-[1fr_140px_40px] gap-2">
                      <select className="input" value={a.name} onChange={(e) => set({ accessories: d.accessories.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)) })}>
                        {ACCESSORIAL_TYPES.map((x) => (
                          <option key={x}>{x}</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        step="any"
                        className="input"
                        placeholder="Amount $"
                        value={a.amount ?? ""}
                        onChange={(e) => set({ accessories: d.accessories.map((x, j) => (j === i ? { ...x, amount: e.target.value } : x)) })}
                      />
                      <button type="button" className="icon-btn h-auto w-10 text-red-600" onClick={() => set({ accessories: d.accessories.filter((_, j) => j !== i) })}>
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400">No accessorials (detention, lumper, layover, TONU…).</p>
              )}
            </div>

            <div className="mt-6">
              <F label="Notes">
                <textarea className="input min-h-20" value={d.notes || ""} onChange={(e) => set({ notes: e.target.value })} />
              </F>
            </div>
          </Section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card overflow-hidden">
            <div className="bg-navy-900 px-5 py-4 text-white">
              <p className="text-xs font-semibold uppercase tracking-widest text-gold-400">Invoice summary</p>
              <p className="mt-1 text-3xl font-bold">{money(totals.invoiceTotal)}</p>
              <p className="text-xs text-slate-300">Live estimate as you type</p>
            </div>
            <dl className="space-y-2 p-5 text-sm">
              {[
                ["Line Haul", totals.primaryCharges],
                ["Fuel Surcharge", totals.fuelSurcharge],
                ["Accessorials", totals.accessoryTotal],
                [`Tax (${d.gstPercent || 0}%)`, totals.gstAmount],
                ["Advance Received", -(parseFloat(d.invoiceAdvance) || 0)],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <dt className="text-slate-500">{k}</dt>
                  <dd className="font-medium">{money(v)}</dd>
                </div>
              ))}
              <div className="flex justify-between border-t border-slate-200 pt-2 text-base">
                <dt className="font-semibold text-navy-900">Balance Due</dt>
                <dd className="font-bold text-navy-900">{money(totals.balanceDue)}</dd>
              </div>
              <div className="flex justify-between pt-1 text-xs text-slate-500">
                <dt>Rate per loaded mile (RPM)</dt>
                <dd>{money(totals.ratePerMile)}</dd>
              </div>
            </dl>
            <div className="border-t border-slate-100 p-5">
              <button className="btn-gold w-full" disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save Dispatch
              </button>
              <button type="button" className="btn-ghost mt-2 w-full" onClick={() => router.back()}>
                Cancel
              </button>
            </div>
          </div>
        </aside>
      </form>
    </>
  );
}
