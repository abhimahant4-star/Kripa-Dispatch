import mongoose, { Schema } from "mongoose";
import { RESOURCES, allFields } from "@/lib/resources";
import { DISPATCH_STATUSES, FEE_TYPES, computeTotals } from "@/lib/dispatch";

const { ObjectId } = Schema.Types;

function fieldToSchema(f) {
  let def;
  switch (f.type) {
    case "number":
      def = { type: Number };
      break;
    case "date":
      def = { type: Date };
      break;
    case "checkbox":
      def = { type: Boolean, default: false };
      break;
    case "ref":
      def = { type: ObjectId, ref: RESOURCES[f.ref].model, default: null };
      break;
    case "password":
      def = { type: String, select: false };
      break;
    default:
      def = { type: String, trim: true };
  }
  if (f.required) def.required = [true, `${f.label} is required`];
  if (f.options) def.enum = [...f.options, null, ""].filter((x) => x !== undefined);
  if (f.default !== undefined) def.default = f.default;
  if (f.unique) def.unique = true;
  return def;
}

function model(name, schema, collection) {
  return mongoose.models[name] || mongoose.model(name, schema, collection);
}

export const Models = {};

for (const [key, cfg] of Object.entries(RESOURCES)) {
  const shape = {};
  for (const f of allFields(cfg)) shape[f.name] = fieldToSchema(f);
  if (key === "users") shape.email.lowercase = true;
  const schema = new Schema(shape, { timestamps: true });
  Models[key] = model(cfg.model, schema, key);
}

// ---- Dispatch (loads) ----

const StopSchema = new Schema(
  {
    company: { type: ObjectId, ref: "Company" },
    date: Date,
    time: String,
    type: String,
    street: String,
    city: String,
    state: String,
    zip: String,
    country: { type: String, default: "USA" },
    referenceNumber: String,
    instructions: String,
    notes: String,
    completed: { type: Boolean, default: false },
  },
  { _id: true }
);

const CheckCallSchema = new Schema(
  {
    at: { type: Date, default: Date.now },
    status: String,
    location: String,
    note: String,
    by: String,
  },
  { _id: true }
);

const CounterSchema = new Schema({ _id: String, seq: Number });
export const Counter = model("Counter", CounterSchema, "counters");

const DispatchSchema = new Schema(
  {
    loadNumber: { type: String, unique: true },
    tripName: { type: String, required: [true, "Trip name is required"], trim: true },
    customer: { type: ObjectId, ref: "Company", required: [true, "Customer is required"] },
    customerLoadNumber: String, // broker load # / PO #
    ewayBillNumber: String, // BOL number
    borderNumber: String, // PARS / PAPS (US-Canada)
    invoiceValue: Number, // cargo value
    status: { type: String, enum: DISPATCH_STATUSES, default: "Planned" },
    dispatcher: { type: ObjectId, ref: "User" },

    driver: { type: ObjectId, ref: "Driver", required: [true, "Driver is required"] },
    teamDrivers: [{ type: ObjectId, ref: "Driver" }],
    manualPay: Number,
    driverAdvance: Number,
    accessoryDriverPay: Number,

    truck: { type: ObjectId, ref: "Truck", required: [true, "Truck is required"] },
    trailer: { type: ObjectId, ref: "Trailer" },
    beginningOdometer: Number,
    deadheadMiles: Number,
    loadedMiles: Number,
    totalMiles: Number,
    commodity: String,
    weight: Number,

    pickups: [StopSchema],
    deliveries: [StopSchema],

    primaryFeeType: { type: String, enum: FEE_TYPES, default: "Flat Rate" },
    rate: Number,
    quantity: Number,
    fuelSurchargePerMile: Number,
    accessories: [{ name: String, amount: Number }],
    invoiceAdvance: Number,
    gstPercent: { type: Number, default: 0 },

    primaryCharges: Number,
    fuelSurcharge: Number,
    accessoryTotal: Number,
    subtotal: Number,
    gstAmount: Number,
    invoiceTotal: Number,
    balanceDue: Number,
    ratePerMile: Number,

    invoiceDate: Date,
    notes: String,
    checkCalls: [CheckCallSchema],
  },
  { timestamps: true }
);

DispatchSchema.pre("validate", async function () {
  Object.assign(this, computeTotals(this));
  if (!this.loadNumber) {
    const c = await Counter.findByIdAndUpdate("dispatch", { $inc: { seq: 1 } }, { new: true, upsert: true });
    this.loadNumber = `KD-${1000 + c.seq}`;
  }
});

export const Dispatch = model("Dispatch", DispatchSchema, "dispatches");
Models.dispatches = Dispatch;
