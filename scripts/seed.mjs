// Creates the first admin account and (optionally) demo data.
//   npm run seed                  -> admin + demo data (only if there are no drivers yet)
//   npm run seed -- --no-demo     -> admin only
//   npm run seed -- --reset-demo  -> DELETES all drivers, trucks, trailers, companies, dispatches,
//                                    syllabus and lectures, then adds fresh demo data (users are kept)
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI missing. Copy .env.example to .env.local first.");
  process.exit(1);
}
const withDemo = !process.argv.includes("--no-demo");
const resetDemo = process.argv.includes("--reset-demo");

await mongoose.connect(uri);
const db = mongoose.connection.db;
const col = (n) => db.collection(n);
const now = new Date();
const stamp = { createdAt: now, updatedAt: now };
const day = (offset) => {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + offset);
  return d;
};
const oid = () => new mongoose.Types.ObjectId();

// ---- Admin ----
const email = (process.env.SEED_ADMIN_EMAIL || "admin@kripadispatch.com").toLowerCase();
const password = process.env.SEED_ADMIN_PASSWORD || "Admin@123";
const existing = await col("users").findOne({ email });
let adminId;
if (existing) {
  adminId = existing._id;
  console.log(`Admin ${email} already exists — left unchanged.`);
} else {
  const r = await col("users").insertOne({
    name: "Kripa Admin",
    email,
    password: await bcrypt.hash(password, 10),
    role: "admin",
    status: "Active",
    joiningDate: day(0),
    ...stamp,
  });
  adminId = r.insertedId;
  console.log(`Created admin ${email} (password from SEED_ADMIN_PASSWORD).`);
}
await col("users").createIndex({ email: 1 }, { unique: true });

if (!withDemo) {
  await mongoose.disconnect();
  process.exit(0);
}

const DEMO = ["drivers", "trucks", "trailers", "companies", "dispatches", "syllabus", "lectures", "counters"];
if (resetDemo) {
  for (const c of DEMO) await col(c).deleteMany({});
  console.log("Removed existing drivers, trucks, trailers, companies, dispatches, syllabus and lectures.");
} else if ((await col("drivers").countDocuments()) > 0) {
  console.log("Drivers already exist — skipping demo data (use --reset-demo to replace it).");
  await mongoose.disconnect();
  process.exit(0);
}

// ---- Drivers ----
const drivers = await col("drivers").insertMany(
  [
    ["Gurpreet", "Singh", "Ludhiana", "Punjab", "PB10", "Per KM", 3.5, 200],
    ["Harjit", "Sandhu", "Jalandhar", "Punjab", "PB08", "Per Trip", 4500, 18],
    ["Rajesh", "Yadav", "Gurugram", "Haryana", "HR26", "Monthly Salary", 24000, 400],
    ["Sukhwinder", "Gill", "Amritsar", "Punjab", "PB02", "Per KM", 3.2, -5],
    ["Manoj", "Kumar", "Jaipur", "Rajasthan", "RJ14", "Percentage of Freight", 10, 90],
  ].map(([firstName, lastName, city, state, rto, paymentType, payRate, licDays], i) => ({
    firstName,
    lastName,
    phone: `+91 98${140 + i}0 ${21000 + i * 1111}`,
    city,
    state,
    country: "India",
    zip: `${141001 + i * 1000}`,
    status: "Available",
    licenseNumber: `${rto} 2015${String(41230 + i * 77).padStart(7, "0")}`,
    licenseState: state,
    licenseExpiry: day(licDays),
    medicalCardExpiry: day(licDays + 120),
    hireDate: day(-400 + i * 30),
    paymentType,
    payRate,
    ...stamp,
  }))
);
const D = Object.values(drivers.insertedIds);

// ---- Trucks ----
const trucks = await col("trucks").insertMany(
  [
    ["101", "PB10 HK 4521", "Punjab", "Tata", "Signa 3518.T", 2022, "Closed Body / Container", 25, 10, 0],
    ["102", "PB08 GT 7710", "Punjab", "Ashok Leyland", "3520 AVTR", 2021, "Open Body", 25, 10, 1],
    ["103", "HR55 AK 3302", "Haryana", "BharatBenz", "3523R", 2023, "Closed Body / Container", 25, 10, 2],
    ["104", "PB65 BC 1188", "Punjab", "Tata", "Prima 5530.S", 2020, "Trailer (Tractor)", 40, 18, 3],
    ["105", "RJ14 GD 9045", "Rajasthan", "Eicher", "Pro 6028", 2019, "Open Body", 28, 12, null],
  ].map(([unitNumber, plateNumber, plateState, make, model, year, bodyType, capacity, tyres, drv], i) => ({
    unitNumber,
    plateNumber,
    plateState,
    make,
    model,
    year,
    bodyType,
    capacity,
    tyres,
    vin: `MAT${448120 + i * 3311}K${7 + i}PB${20210 + i}`,
    status: i === 4 ? "Maintenance" : "Available",
    assignedDriver: drv === null ? null : D[drv],
    permitType: "National Permit",
    permitExpiry: day(25 + i * 70),
    insuranceExpiry: day(150 + i * 10),
    fitnessExpiry: day(60 + i * 40),
    pucExpiry: day(12 + i * 30),
    registrationExpiry: day(1500 + i * 100),
    roadTaxExpiry: day(200 + i * 15),
    ...stamp,
  }))
);
const T = Object.values(trucks.insertedIds);

// ---- Trailers ----
const trailers = await col("trailers").insertMany(
  [
    ["T-501", "PB10 TR 1101", "Flatbed", 40, 3],
    ["T-502", "PB10 TR 1102", "Container 32 ft", 32, 0],
    ["T-503", "HR55 TR 2210", "Low Bed", 40, null],
    ["T-504", "PB65 TR 0907", "Container 20 ft", 20, null],
  ].map(([unitNumber, plateNumber, type, length, trk]) => ({
    unitNumber,
    plateNumber,
    type,
    length,
    axles: 3,
    status: "Available",
    assignedTruck: trk === null ? null : T[trk],
    plateState: plateNumber.startsWith("HR") ? "Haryana" : "Punjab",
    make: "Fabricated (local)",
    year: 2021,
    fitnessExpiry: day(300),
    ...stamp,
  }))
);
const TR = Object.values(trailers.insertedIds);

// ---- Companies (fictional names for the demo) ----
const companies = await col("companies").insertMany(
  [
    ["Shree Ganesh Steel Pvt Ltd", "Customer", "Ludhiana", "Punjab", "03AAKCS4521F1Z5", "30 Days"],
    ["Punjab Agro Exports", "Customer", "Amritsar", "Punjab", "03AAHFP7710K1Z2", "15 Days"],
    ["Northline Freight Movers", "Transporter / Broker", "New Delhi", "Delhi", "07AAJCN3302M1Z8", "7 Days"],
    ["Satluj Textile Mills", "Consignor (Shipper)", "Ludhiana", "Punjab", "03AADCS1188Q1Z1", null],
    ["Ambika Rice Mills", "Consignor (Shipper)", "Karnal", "Haryana", "06AAEFA9045R1Z4", null],
    ["Western India Warehousing", "Consignee", "Bhiwandi", "Maharashtra", "27AAFCW2210B1Z6", null],
    ["Mundra Port Container Yard", "Consignee", "Mundra", "Gujarat", "24AAGCM0907C1Z3", null],
    ["Bengaluru Retail DC", "Consignee", "Bengaluru", "Karnataka", "29AABCB5150D1Z9", null],
  ].map(([name, type, city, state, gstin, paymentTerms], i) => ({
    name,
    type,
    city,
    state,
    gstin,
    pan: gstin.slice(2, 12),
    country: "India",
    street: `Plot ${12 + i * 7}, Industrial Area Phase ${1 + (i % 3)}`,
    zip: `${141003 + i * 13000}`,
    phone: `+91 ${161 + i} ${4002100 + i * 37}`,
    contactPerson: ["Rakesh Goyal", "Amrit Pal", "Vikas Sharma", "Neeraj Jain", "Sunil Bansal", "Prakash Patil", "Hitesh Shah", "Kiran Rao"][i],
    paymentTerms,
    ...stamp,
  }))
);
const C = Object.values(companies.insertedIds);
const CITY = {
  Ludhiana: ["Ludhiana", "Punjab"],
  Amritsar: ["Amritsar", "Punjab"],
  Karnal: ["Karnal", "Haryana"],
  Bhiwandi: ["Bhiwandi", "Maharashtra"],
  Mundra: ["Mundra", "Gujarat"],
  Bengaluru: ["Bengaluru", "Karnataka"],
};

const stop = (company, city, date, type) => ({
  _id: oid(),
  company,
  city: CITY[city][0],
  state: CITY[city][1],
  country: "India",
  date,
  type,
  completed: false,
});

// ---- Dispatches ----
const loads = [
  { trip: "Ludhiana → Bhiwandi, steel coils", cust: 0, drv: 0, trk: 0, trl: 1, pu: [3, "Ludhiana"], del: [5, "Bhiwandi"], km: 1650, fee: "Fixed Freight", rate: 92000, gst: 12, status: "In Transit", d: -2, acc: [{ name: "Loading Charges", amount: 1500 }, { name: "Toll Charges", amount: 6800 }], loc: "Kota bypass, NH 52", goods: "Steel coils", wt: 24000 },
  { trip: "Karnal → Mundra, basmati rice", cust: 1, drv: 1, trk: 1, trl: null, pu: [4, "Karnal"], del: [6, "Mundra"], km: 1150, fee: "Per Tonne", rate: 2700, qty: 25, gst: 0, status: "Dispatched", d: 0, acc: [], loc: "Karnal mandi gate", goods: "Basmati rice (bags)", wt: 25000 },
  { trip: "Ludhiana → Bengaluru, yarn", cust: 2, drv: 2, trk: 2, trl: null, pu: [3, "Ludhiana"], del: [7, "Bengaluru"], km: 2550, fee: "Per KM", rate: 52, gst: 12, status: "Delivered", d: -9, acc: [{ name: "Unloading Charges", amount: 2000 }], loc: "Bengaluru, Hoskote", goods: "Cotton yarn", wt: 18000 },
  { trip: "Amritsar → Mundra, export cargo", cust: 1, drv: 3, trk: 3, trl: 0, pu: [4, "Amritsar"], del: [6, "Mundra"], km: 1350, fee: "Fixed Freight", rate: 78000, gst: 0, status: "Invoiced", d: -20, acc: [{ name: "Detention / Halting", amount: 3000 }], loc: "Mundra port gate", goods: "Rice export containers", wt: 26000 },
  { trip: "Ludhiana → Bhiwandi, hosiery", cust: 0, drv: 0, trk: 0, trl: 1, pu: [3, "Ludhiana"], del: [5, "Bhiwandi"], km: 1650, fee: "Fixed Freight", rate: 88000, gst: 12, status: "Paid", d: -45, acc: [{ name: "Toll Charges", amount: 6500 }], loc: "Bhiwandi", goods: "Hosiery cartons", wt: 9000 },
  { trip: "Karnal → Bengaluru, rice", cust: 2, drv: 2, trk: 2, trl: null, pu: [4, "Karnal"], del: [7, "Bengaluru"], km: 2300, fee: "Per KM", rate: 48, gst: 12, status: "Paid", d: -80, acc: [], loc: "Bengaluru", goods: "Rice bags", wt: 25000 },
  { trip: "Ludhiana → Mundra, machinery", cust: 0, drv: 1, trk: 1, trl: null, pu: [3, "Ludhiana"], del: [6, "Mundra"], km: 1300, fee: "Fixed Freight", rate: 71000, gst: 0, status: "Paid", d: -110, acc: [], loc: "Mundra", goods: "Machinery parts", wt: 15000 },
  { trip: "Amritsar → Bhiwandi, dry fruits", cust: 1, drv: 4, trk: 3, trl: 0, pu: [4, "Amritsar"], del: [5, "Bhiwandi"], km: 1800, fee: "Fixed Freight", rate: 96000, gst: 12, status: "Paid", d: -140, acc: [{ name: "Loading Charges", amount: 1200 }], loc: "Bhiwandi", goods: "Dry fruits", wt: 12000 },
];

let seq = 0;
const docs = loads.map((l) => {
  const primary = l.fee === "Fixed Freight" ? l.rate : l.fee === "Per KM" ? l.rate * l.km : l.rate * l.qty;
  const acc = l.acc.reduce((s, a) => s + a.amount, 0);
  const subtotal = primary + acc;
  const gstAmount = Math.round(subtotal * l.gst) / 100;
  const total = subtotal + gstAmount;
  const advance = l.status === "In Transit" ? 25000 : 0;
  const created = day(l.d);
  seq += 1;
  return {
    loadNumber: `KD-${1000 + seq}`,
    tripName: l.trip,
    customer: C[l.cust],
    customerLoadNumber: `LR-${24500 + seq}`,
    ewayBillNumber: `${3410 + seq} ${5521 + seq * 3} ${7700 + seq * 7}`,
    status: l.status,
    dispatcher: adminId,
    driver: D[l.drv],
    teamDrivers: [],
    truck: T[l.trk],
    trailer: l.trl === null ? null : TR[l.trl],
    loadedMiles: l.km,
    deadheadMiles: 60,
    totalMiles: l.km + 60,
    commodity: l.goods,
    weight: l.wt,
    invoiceValue: l.wt * 60,
    manualPay: Math.round(l.km * 3.5),
    driverAdvance: 5000,
    accessoryDriverPay: Math.round((l.km / 450) * 300),
    pickups: [stop(C[l.pu[0]], l.pu[1], created, "Loading")],
    deliveries: [stop(C[l.del[0]], l.del[1], day(l.d + Math.ceil(l.km / 450)), "Unloading")],
    primaryFeeType: l.fee,
    rate: l.rate,
    quantity: l.qty || null,
    fuelSurchargePerMile: 0,
    accessories: l.acc.map((a) => ({ _id: oid(), ...a })),
    gstPercent: l.gst,
    invoiceAdvance: advance,
    primaryCharges: primary,
    fuelSurcharge: 0,
    accessoryTotal: acc,
    subtotal,
    gstAmount,
    invoiceTotal: total,
    balanceDue: total - advance,
    ratePerMile: Math.round((subtotal / l.km) * 100) / 100,
    invoiceDate: ["Invoiced", "Paid"].includes(l.status) ? day(l.d + 5) : null,
    checkCalls: [
      { _id: oid(), at: created, status: "Planned", note: "Dispatch created", by: "Kripa Admin" },
      { _id: oid(), at: new Date(), status: l.status, location: l.loc, note: "Driver check call", by: "Kripa Admin" },
    ],
    createdAt: created,
    updatedAt: new Date(),
  };
});
await col("dispatches").insertMany(docs);
await col("counters").updateOne({ _id: "dispatch" }, { $set: { seq } }, { upsert: true });

// Equipment on active loads is busy.
await col("drivers").updateMany({ _id: { $in: [D[0], D[1]] } }, { $set: { status: "On Trip" } });
await col("trucks").updateMany({ _id: { $in: [T[0], T[1]] } }, { $set: { status: "In Use" } });
await col("trailers").updateMany({ _id: { $in: [TR[1]] } }, { $set: { status: "In Use" } });

await col("syllabus").insertMany(
  [
    ["Booking loads with transporters & brokers", "Load booking calls and messages"],
    ["Indian state codes & RTO codes", "State and vehicle number codes"],
    ["Freight calculation (per trip, per km, per tonne)", "Rate calculation"],
    ["LR / Bilty — what to check", "Lorry receipt"],
    ["E-way bill basics", "E-way bill"],
    ["GST on goods transport (GTA, RCM)", "GST"],
    ["Vehicle papers: RC, permit, fitness, PUC, insurance", "Vehicle documents"],
  ].map(([topic, shortDetails], i) => ({ sno: i + 1, topic, shortDetails, ...stamp }))
);

await col("lectures").insertMany([
  { title: "How to find and book a load", date: day(-1), batch: "Batch 1", description: "Working with transporters, brokers and load apps; negotiating freight.", ...stamp },
  { title: "Reading an LR and e-way bill", date: day(0), batch: "Batch 1", description: "What every dispatcher must check before the truck leaves.", ...stamp },
]);

console.log("Demo data added: 5 drivers, 5 trucks, 4 trailers, 8 companies, 8 dispatches, syllabus and lectures.");
await mongoose.disconnect();
