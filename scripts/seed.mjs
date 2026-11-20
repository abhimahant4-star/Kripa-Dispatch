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
const email = (process.env.SEED_ADMIN_EMAIL || "admin@kirpadispatch.com").toLowerCase();
const password = process.env.SEED_ADMIN_PASSWORD || "Admin@123";
const existing = await col("users").findOne({ email });
let adminId;
if (existing) {
  adminId = existing._id;
  console.log(`Admin ${email} already exists — left unchanged.`);
} else {
  const r = await col("users").insertOne({
    name: "Kirpa Admin",
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

// ---- Drivers (fictional demo people) ----
const drivers = await col("drivers").insertMany(
  [
    ["Gurpreet", "Singh", "Brampton", "ON", "Canada", "L6T 4B8", "AZ (Ontario)", "Per Mile", 0.62, 200, "Yes", "Company Driver"],
    ["James", "Carter", "Dallas", "TX", "USA", "75212", "Class A", "Per Mile", 0.6, 18, "No", "Company Driver"],
    ["Harjit", "Sandhu", "Fresno", "CA", "USA", "93725", "Class A", "Percentage of Load", 28, 400, "No", "Owner Operator"],
    ["Michael", "Rodriguez", "Phoenix", "AZ", "USA", "85043", "Class A", "Per Mile", 0.58, -5, "No", "Company Driver"],
    ["Daniel", "Thompson", "Calgary", "AB", "Canada", "T2C 4L8", "Class 1 (Canada)", "Flat per Load", 900, 90, "Yes", "Lease Operator"],
  ].map(([firstName, lastName, city, state, country, zip, licenseClass, paymentType, payRate, licDays, crossBorder, driverType], i) => ({
    firstName,
    lastName,
    phone: `+1 (${[905, 214, 559, 602, 403][i]}) 555-01${20 + i}`,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
    city,
    state,
    country,
    zip,
    status: "Available",
    driverType,
    licenseNumber: country === "Canada" ? `${lastName[0]}${4521 + i}-${30118 + i * 7}-${60512 + i}` : `${String(48120391 + i * 11177)}`,
    licenseState: state,
    licenseClass,
    endorsements: i === 1 ? "H, N, T" : i === 3 ? "N" : "",
    licenseExpiry: day(licDays),
    medicalCardExpiry: day(licDays + 120),
    mvrDate: day(-60 - i * 20),
    drugTestDate: day(-90 - i * 15),
    crossBorder,
    fastCardExpiry: crossBorder === "Yes" ? day(700 + i * 30) : null,
    passportExpiry: crossBorder === "Yes" ? day(1500) : null,
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
    ["101", "TX", "R4K-2291", "Freightliner", "Cascadia 126", 2022, "Sleeper Tractor", 1, 0],
    ["102", "AZ", "AF19-552", "Peterbilt", "579", 2021, "Sleeper Tractor", 3, 1],
    ["103", "AB", "BTX-4417", "Kenworth", "T680", 2023, "Sleeper Tractor", 4, 2],
    ["104", "ON", "AX 77 214", "Volvo", "VNL 860", 2020, "Sleeper Tractor", 0, 3],
    ["105", "CA", "XP58213", "International", "LT625", 2019, "Day Cab Tractor", null, 4],
  ].map(([unitNumber, plateState, plateNumber, make, model, year, truckType, drv, i]) => ({
    unitNumber,
    plateState,
    plateNumber,
    make,
    model,
    year,
    truckType,
    ownership: i === 2 ? "Owner Operator" : "Company",
    vin: ["3AKJHHDR5NSNA4521", "1XPBD49X1MD771022", "1XKYD49X7PJ330201", "4V4NC9EH5LN118867", "3HSDZAPR4KN904512"][i],
    odometer: [312450, 418220, 156980, 522310, 611045][i],
    eldProvider: ["Samsara", "Motive", "Samsara", "Motive", "Omnitracs"][i],
    status: i === 4 ? "Maintenance" : "Available",
    assignedDriver: drv === null ? null : D[drv],
    registrationExpiry: day(25 + i * 70),
    inspectionExpiry: day(12 + i * 45),
    insuranceExpiry: day(150 + i * 10),
    iftaExpiry: day(40 + i * 5),
    hvutPaidUntil: day(250),
    ...stamp,
  }))
);
const T = Object.values(trucks.insertedIds);

// ---- Trailers ----
const trailers = await col("trailers").insertMany(
  [
    ["5301", "Dry Van", 53, "Utility", "TX", null],
    ["5302", "Reefer", 53, "Utility", "TX", 0],
    ["4801", "Flatbed", 48, "Fontaine", "AB", 2],
    ["5303", "Step Deck", 53, "Great Dane", "AZ", null],
    ["5304", "Reefer", 53, "Wabash", "ON", 3],
  ].map(([unitNumber, type, length, make, plateState, trk], i) => ({
    unitNumber,
    type,
    length,
    make,
    plateState,
    plateNumber: `${["TRL", "TRA", "TRB", "TRC", "TRD"][i]}-${4410 + i * 37}`,
    axles: 2,
    year: 2020 + (i % 3),
    ownership: "Company",
    reeferUnit: type === "Reefer" ? "Thermo King Precedent S-600" : "",
    vin: `1UYVS25${30 + i}M${700120 + i * 913}`,
    status: "Available",
    assignedTruck: trk === null ? null : T[trk],
    registrationExpiry: day(300 + i * 20),
    inspectionExpiry: day(90 + i * 40),
    ...stamp,
  }))
);
const TR = Object.values(trailers.insertedIds);

// ---- Companies (fictional names for the demo) ----
const COMPANIES = [
  ["Summit Freight Brokerage LLC", "Broker", "2200 W Fulton St", "Chicago", "IL", "60612", "USA", "MC-784512", "2314587", "Net 30"],
  ["Great Lakes Logistics Inc.", "Broker", "6800 Kitimat Rd", "Mississauga", "ON", "L5N 5M1", "Canada", "MC-661204", "1983320", "Quick Pay"],
  ["Lone Star Direct Foods", "Shipper & Receiver", "4500 Irving Blvd", "Dallas", "TX", "75247", "USA", "", "", "Net 15"],
  ["Valley Fresh Produce Co.", "Shipper", "3150 S Golden State Blvd", "Fresno", "CA", "93725", "USA", "", "", null],
  ["Midwest Steel Fabricators", "Shipper", "1400 Alum Creek Dr", "Columbus", "OH", "43207", "USA", "", "", null],
  ["Peachtree Distribution Center", "Receiver", "3700 Southside Industrial Pkwy", "Atlanta", "GA", "30354", "USA", "", "", null],
  ["Maple Leaf Cold Storage", "Receiver", "120 Steeles Ave E", "Brampton", "ON", "L6T 1A3", "Canada", "", "", null],
  ["Rocky Mountain Building Supply", "Receiver", "5505 72 Ave SE", "Calgary", "AB", "T2C 3C4", "Canada", "", "", null],
  ["Desert Sun Retail DC", "Receiver", "4801 W Buckeye Rd", "Phoenix", "AZ", "85043", "USA", "", "", null],
];
const companies = await col("companies").insertMany(
  COMPANIES.map(([name, type, street, city, state, zip, country, mcNumber, dotNumber, paymentTerms], i) => ({
    name,
    type,
    street,
    city,
    state,
    zip,
    country,
    mcNumber,
    dotNumber,
    paymentTerms,
    phone: `+1 (${[312, 905, 214, 559, 614, 404, 905, 403, 602][i]}) 555-02${10 + i}`,
    email: `dispatch@${name.toLowerCase().replace(/[^a-z]+/g, "").slice(0, 14)}.example.com`,
    billingEmail: ["Broker", "Shipper & Receiver"].includes(type) ? `ap@${name.toLowerCase().replace(/[^a-z]+/g, "").slice(0, 14)}.example.com` : "",
    contactPerson: ["Lisa Morgan", "Raj Patel", "Kevin Brooks", "Maria Lopez", "Tom Becker", "Angela Davis", "Simran Kaur", "Chris Walker", "Emily Nguyen"][i],
    ...stamp,
  }))
);
const C = Object.values(companies.insertedIds);

const stop = (ci, date, type) => {
  const [, , street, city, state, zip, country] = COMPANIES[ci];
  return { _id: oid(), company: C[ci], street, city, state, zip, country, date, type, time: "08:00 - 14:00", referenceNumber: `PU${48000 + ci * 17}`, completed: false };
};

// ---- Dispatches ----
const loads = [
  { trip: "Dallas, TX → Atlanta, GA — frozen food", cust: 2, drv: 1, trk: 0, trl: 1, pu: 2, del: 5, mi: 780, fee: "Flat Rate", rate: 2650, fsc: 0, tax: 0, status: "In Transit", d: -2, acc: [{ name: "Lumper Fee", amount: 150 }], loc: "I-20 near Birmingham, AL", goods: "Frozen food (−10°F)", wt: 42000 },
  { trip: "Fresno, CA → Brampton, ON — fresh produce", cust: 1, drv: 0, trk: 3, trl: 4, pu: 3, del: 6, mi: 2620, fee: "Per Mile", rate: 3.1, fsc: 0.4, tax: 0, status: "Dispatched", d: 0, acc: [{ name: "Border Crossing / Customs", amount: 125 }], loc: "Fresno, CA — at shipper", goods: "Fresh produce (34°F)", wt: 40000, border: "PARS 8130 2245 9917" },
  { trip: "Columbus, OH → Calgary, AB — steel beams", cust: 0, drv: 4, trk: 2, trl: 2, pu: 4, del: 7, mi: 1880, fee: "Flat Rate", rate: 6200, fsc: 0, tax: 0, status: "Delivered", d: -9, acc: [{ name: "Tarp Fee", amount: 150 }], loc: "Calgary, AB — delivered", goods: "Steel beams", wt: 44000, border: "PAPS 6631 0042 1187" },
  { trip: "Columbus, OH → Atlanta, GA — fabricated steel", cust: 0, drv: 3, trk: 1, trl: 3, pu: 4, del: 5, mi: 570, fee: "Per Mile", rate: 2.75, fsc: 0, tax: 0, status: "Invoiced", d: -20, acc: [{ name: "Detention", amount: 100 }], loc: "Atlanta, GA", goods: "Fabricated steel", wt: 38000 },
  { trip: "Brampton, ON → Calgary, AB — dry goods", cust: 1, drv: 0, trk: 3, trl: 0, pu: 6, del: 7, mi: 2100, fee: "Flat Rate", rate: 7400, fsc: 0, tax: 13, status: "Paid", d: -45, acc: [], loc: "Calgary, AB", goods: "Packaged dry goods", wt: 36000 },
  { trip: "Dallas, TX → Phoenix, AZ — groceries", cust: 2, drv: 1, trk: 0, trl: 0, pu: 2, del: 8, mi: 1065, fee: "Per Mile", rate: 2.6, fsc: 0, tax: 0, status: "Paid", d: -80, acc: [], loc: "Phoenix, AZ", goods: "Grocery pallets", wt: 39000 },
  { trip: "Fresno, CA → Phoenix, AZ — produce", cust: 0, drv: 2, trk: 1, trl: 1, pu: 3, del: 8, mi: 590, fee: "Flat Rate", rate: 1900, fsc: 0, tax: 0, status: "Paid", d: -110, acc: [], loc: "Phoenix, AZ", goods: "Produce (36°F)", wt: 41000 },
  { trip: "Columbus, OH → Dallas, TX — steel coils", cust: 0, drv: 3, trk: 2, trl: 3, pu: 4, del: 2, mi: 1050, fee: "Per Mile", rate: 2.45, fsc: 0, tax: 0, status: "Paid", d: -140, acc: [{ name: "Layover", amount: 250 }], loc: "Dallas, TX", goods: "Steel coils", wt: 45000 },
];

const r2 = (x) => Math.round(x * 100) / 100;
let seq = 0;
const docs = loads.map((l) => {
  const primary = l.fee === "Per Mile" ? r2(l.rate * l.mi) : l.rate;
  const fuel = r2(l.fsc * l.mi);
  const acc = l.acc.reduce((s, a) => s + a.amount, 0);
  const subtotal = r2(primary + fuel + acc);
  const tax = r2((subtotal * l.tax) / 100);
  const total = r2(subtotal + tax);
  const advance = l.status === "In Transit" ? 500 : 0;
  const created = day(l.d);
  seq += 1;
  return {
    loadNumber: `KD-${1000 + seq}`,
    tripName: l.trip,
    customer: C[l.cust],
    customerLoadNumber: `${l.cust === 1 ? "GLL" : l.cust === 0 ? "SFB" : "PO"}-${248500 + seq * 13}`,
    ewayBillNumber: `BOL${77120 + seq * 31}`,
    borderNumber: l.border || "",
    status: l.status,
    dispatcher: adminId,
    driver: D[l.drv],
    teamDrivers: [],
    truck: T[l.trk],
    trailer: TR[l.trl],
    loadedMiles: l.mi,
    deadheadMiles: 45,
    totalMiles: l.mi + 45,
    commodity: l.goods,
    weight: l.wt,
    invoiceValue: l.wt * 3,
    manualPay: Math.round(l.mi * 0.6),
    driverAdvance: 200,
    accessoryDriverPay: 0,
    pickups: [stop(l.pu, created, "Live Load / Unload")],
    deliveries: [stop(l.del, day(l.d + Math.ceil(l.mi / 550)), "Appointment")],
    primaryFeeType: l.fee,
    rate: l.rate,
    quantity: null,
    fuelSurchargePerMile: l.fsc,
    accessories: l.acc.map((a) => ({ _id: oid(), ...a })),
    gstPercent: l.tax,
    invoiceAdvance: advance,
    primaryCharges: primary,
    fuelSurcharge: fuel,
    accessoryTotal: acc,
    subtotal,
    gstAmount: tax,
    invoiceTotal: total,
    balanceDue: r2(total - advance),
    ratePerMile: r2(subtotal / l.mi),
    invoiceDate: ["Invoiced", "Paid"].includes(l.status) ? day(l.d + 5) : null,
    checkCalls: [
      { _id: oid(), at: created, status: "Planned", note: "Dispatch created", by: "Kirpa Admin" },
      { _id: oid(), at: new Date(), status: l.status, location: l.loc, note: "Driver check call", by: "Kirpa Admin" },
    ],
    createdAt: created,
    updatedAt: new Date(),
  };
});
await col("dispatches").insertMany(docs);
await col("counters").updateOne({ _id: "dispatch" }, { $set: { seq } }, { upsert: true });

// Equipment on active loads is busy.
await col("drivers").updateMany({ _id: { $in: [D[0], D[1]] } }, { $set: { status: "On Trip" } });
await col("trucks").updateMany({ _id: { $in: [T[0], T[3]] } }, { $set: { status: "In Use" } });
await col("trailers").updateMany({ _id: { $in: [TR[1], TR[4]] } }, { $set: { status: "In Use" } });

await col("syllabus").insertMany(
  [
    ["E-mail Format", "Load booking email"],
    ["USA States Abbreviations", "Abbreviations"],
    ["Canadian Provinces & Cross-border (PARS / PAPS)", "Canada loads"],
    ["Load Boards (DAT, Truckstop, 123Loadboard)", "Finding loads"],
    ["Rate Confirmation — what to check", "Rate con"],
    ["Broker Setup Packet (MC, W-9, COI)", "Carrier packet"],
    ["Hours of Service (HOS) & ELD", "HOS rules"],
    ["Trailer Types & Equipment", "Equipment"],
    ["Detention, Layover, Lumper & TONU", "Accessorials"],
    ["Invoicing & Factoring", "Getting paid"],
  ].map(([topic, shortDetails], i) => ({ sno: i + 1, topic, shortDetails, ...stamp }))
);

await col("lectures").insertMany([
  { title: "How to find and book loads on DAT", date: day(-1), batch: "Batch 1", description: "Searching lanes, calling brokers and negotiating the rate per mile.", ...stamp },
  { title: "Reading a rate confirmation", date: day(0), batch: "Batch 1", description: "Pickup/delivery numbers, detention terms and what to check before you sign.", ...stamp },
]);

console.log("Demo data added: 5 drivers, 5 trucks, 5 trailers, 9 companies, 8 dispatches, syllabus and lectures.");
await mongoose.disconnect();
