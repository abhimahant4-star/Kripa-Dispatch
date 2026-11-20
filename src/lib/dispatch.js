// Shared (client + server) dispatch constants and invoice math.
// Note: distance fields are stored as loadedMiles / deadheadMiles for historical reasons,
// but every value in them is in KILOMETRES.

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

export const FEE_TYPES = ["Fixed Freight", "Per KM", "Per Tonne"];

export const GST_RATES = [0, 5, 12, 18];

export const ACCESSORIAL_TYPES = [
  "Loading Charges",
  "Unloading Charges",
  "Hamali / Labour",
  "Detention / Halting",
  "Toll Charges",
  "Extra KM Charges",
  "Multi-point Pickup/Delivery",
  "Weighbridge Charges",
  "Transit Insurance",
  "Escort Charges",
  "Border / Entry Tax",
  "Other",
];

export const STOP_TYPES = ["Loading", "Unloading", "Container Pickup", "Container Drop"];

const n = (v) => {
  const x = parseFloat(v);
  return Number.isFinite(x) ? x : 0;
};

export function computeTotals(d) {
  const loadedKm = n(d.loadedMiles);
  const emptyKm = n(d.deadheadMiles);
  const totalMiles = loadedKm + emptyKm;

  let primaryCharges = 0;
  if (d.primaryFeeType === "Fixed Freight") primaryCharges = n(d.rate);
  else if (d.primaryFeeType === "Per KM") primaryCharges = n(d.rate) * loadedKm;
  else if (d.primaryFeeType === "Per Tonne") primaryCharges = n(d.rate) * n(d.quantity);

  const fuelSurcharge = n(d.fuelSurchargePerMile) * loadedKm;
  const accessoryTotal = (d.accessories || []).reduce((s, a) => s + n(a.amount), 0);
  const subtotal = primaryCharges + fuelSurcharge + accessoryTotal;
  const gstAmount = (subtotal * n(d.gstPercent)) / 100;
  const invoiceTotal = subtotal + gstAmount;
  const balanceDue = invoiceTotal - n(d.invoiceAdvance);
  const ratePerMile = loadedKm ? subtotal / loadedKm : 0;

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

export const money = (v) =>
  (Number(v) || 0).toLocaleString("en-IN", { style: "currency", currency: "INR" });

export const num = (v) => (Number(v) || 0).toLocaleString("en-IN");
