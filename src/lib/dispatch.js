// Shared (client + server) dispatch constants and invoice math (USA / Canada: miles, USD or CAD).

export const DISPATCH_STATUSES = [
  "Planned",
  "Dispatched",
  "At Pickup",
  "In Transit",
  "At Delivery",
  "Delivered",
  "Invoiced",
  "Paid",
  "Cancelled",
];

// Statuses that mean the truck/driver are busy on this load.
export const ACTIVE_STATUSES = ["Dispatched", "At Pickup", "In Transit", "At Delivery"];

export const FEE_TYPES = ["Flat Rate", "Per Mile", "Per Hour", "Per Unit / Pallet"];

// 0 for US loads; Canadian GST 5%, HST 13% (ON) / 14% (NS) / 15% (NB, NL, PE).
export const TAX_RATES = [0, 5, 13, 14, 15];
export const taxLabel = (r) =>
  ({ 0: "No tax", 5: "GST 5%", 13: "HST 13% (ON)", 14: "HST 14% (NS)", 15: "HST 15% (NB / NL / PE)" })[r] || `${r}%`;

export const ACCESSORIAL_TYPES = [
  "Detention",
  "Layover",
  "Lumper Fee",
  "Driver Assist (Load / Unload)",
  "Extra Stop",
  "TONU (Truck Order Not Used)",
  "Tarp Fee",
  "Redelivery",
  "Scale Ticket",
  "Reefer Fuel",
  "Oversize / Overweight Permit",
  "Border Crossing / Customs",
  "Tolls",
  "Other",
];

export const STOP_TYPES = ["Live Load / Unload", "Drop & Hook", "Preloaded Trailer", "Appointment", "FCFS (First Come, First Served)"];

const n = (v) => {
  const x = parseFloat(v);
  return Number.isFinite(x) ? x : 0;
};

export function computeTotals(d) {
  const loaded = n(d.loadedMiles);
  const deadhead = n(d.deadheadMiles);
  const totalMiles = loaded + deadhead;

  let primaryCharges = 0;
  if (d.primaryFeeType === "Per Mile") primaryCharges = n(d.rate) * loaded;
  else if (d.primaryFeeType === "Per Hour" || d.primaryFeeType === "Per Unit / Pallet") primaryCharges = n(d.rate) * n(d.quantity);
  else primaryCharges = n(d.rate); // Flat Rate (and anything older)

  const fuelSurcharge = n(d.fuelSurchargePerMile) * loaded;
  const accessoryTotal = (d.accessories || []).reduce((s, a) => s + n(a.amount), 0);
  const subtotal = primaryCharges + fuelSurcharge + accessoryTotal;
  const gstAmount = (subtotal * n(d.gstPercent)) / 100;
  const invoiceTotal = subtotal + gstAmount;
  const balanceDue = invoiceTotal - n(d.invoiceAdvance);
  const ratePerMile = loaded ? subtotal / loaded : 0;

  return {
    totalMiles: round(totalMiles),
    primaryCharges: round(primaryCharges),
    fuelSurcharge: round(fuelSurcharge),
    accessoryTotal: round(accessoryTotal),
    subtotal: round(subtotal),
    gstAmount: round(gstAmount),
    invoiceTotal: round(invoiceTotal),
    balanceDue: round(balanceDue),
    ratePerMile: round(ratePerMile),
  };
}

function round(x) {
  return Math.round(x * 100) / 100;
}

// Set NEXT_PUBLIC_CURRENCY=CAD to bill in Canadian dollars (default USD).
export const CURRENCY = process.env.NEXT_PUBLIC_CURRENCY === "CAD" ? "CAD" : "USD";
const LOCALE = CURRENCY === "CAD" ? "en-CA" : "en-US";

export const money = (v) => (Number(v) || 0).toLocaleString(LOCALE, { style: "currency", currency: CURRENCY });

export const num = (v) => (Number(v) || 0).toLocaleString("en-US");
