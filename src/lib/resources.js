// Single source of truth for every simple record type in the admin panel.
// The same config drives: Mongo schemas, API search/filters, list tables, view pages and forms.

export const US_STATES = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California", CO: "Colorado", CT: "Connecticut",
  DE: "Delaware", DC: "District of Columbia", FL: "Florida", GA: "Georgia", HI: "Hawaii", ID: "Idaho", IL: "Illinois",
  IN: "Indiana", IA: "Iowa", KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland",
  MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi", MO: "Missouri", MT: "Montana",
  NE: "Nebraska", NV: "Nevada", NH: "New Hampshire", NJ: "New Jersey", NM: "New Mexico", NY: "New York",
  NC: "North Carolina", ND: "North Dakota", OH: "Ohio", OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania",
  RI: "Rhode Island", SC: "South Carolina", SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah",
  VT: "Vermont", VA: "Virginia", WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming",
};
export const CA_PROVINCES = {
  AB: "Alberta", BC: "British Columbia", MB: "Manitoba", NB: "New Brunswick", NL: "Newfoundland and Labrador",
  NS: "Nova Scotia", NT: "Northwest Territories", NU: "Nunavut", ON: "Ontario", PE: "Prince Edward Island",
  QC: "Quebec", SK: "Saskatchewan", YT: "Yukon",
};
// Stored as the 2-letter code (TX, ON…), shown as "TX — Texas".
export const STATE_NAMES = { ...US_STATES, ...CA_PROVINCES };
export const STATES = Object.keys(STATE_NAMES);
export const stateLabel = (code) => (STATE_NAMES[code] ? `${code} — ${STATE_NAMES[code]}` : code);
export const COUNTRIES = ["USA", "Canada", "Mexico"];

const address = [
  { name: "street", label: "Street Address" },
  { name: "city", label: "City", required: true },
  { name: "state", label: "State / Province", type: "select", options: STATES, labels: STATE_NAMES, required: true, filter: true },
  { name: "zip", label: "ZIP / Postal Code" },
  { name: "country", label: "Country", type: "select", options: COUNTRIES, default: "USA" },
];

export const RESOURCES = {
  drivers: {
    model: "Driver",
    label: "Drivers",
    singular: "Driver",
    icon: "IdCard",
    description: "Driver profiles, CDL, DOT medical card, pay type and document expiry dates.",
    title: (r) => [r.firstName, r.lastName].filter(Boolean).join(" "),
    searchFields: ["firstName", "lastName", "phone", "email", "licenseNumber"],
    sections: [
      {
        title: "Personal details",
        fields: [
          { name: "firstName", label: "First Name", required: true },
          { name: "lastName", label: "Last Name" },
          { name: "phone", label: "Cell Phone", type: "tel", required: true, placeholder: "+1 (555) 123-4567" },
          { name: "alternatePhone", label: "Alternate Phone", type: "tel" },
          { name: "email", label: "Email", type: "email" },
          { name: "status", label: "Status", type: "select", options: ["Available", "On Trip", "Off Duty", "Inactive"], default: "Available", required: true, filter: true, badge: true },
          { name: "driverType", label: "Driver Type", type: "select", options: ["Company Driver", "Owner Operator", "Lease Operator"], default: "Company Driver", filter: true },
          { name: "dateOfBirth", label: "Date of Birth", type: "date" },
        ],
      },
      { title: "Address", fields: address },
      {
        title: "CDL & compliance",
        fields: [
          { name: "licenseNumber", label: "CDL Number" },
          { name: "licenseState", label: "CDL State / Province", type: "select", options: STATES, labels: STATE_NAMES },
          { name: "licenseClass", label: "CDL Class", type: "select", options: ["Class A", "Class B", "Class C", "Class 1 (Canada)", "Class 3 (Canada)", "AZ (Ontario)", "DZ (Ontario)"] },
          { name: "endorsements", label: "Endorsements", placeholder: "H, N, T, X, TWIC…" },
          { name: "licenseExpiry", label: "CDL Expiry", type: "date", expiry: true },
          { name: "medicalCardExpiry", label: "DOT Medical Card Expiry", type: "date", expiry: true },
          { name: "mvrDate", label: "Last MVR Check", type: "date" },
          { name: "drugTestDate", label: "Last Drug & Alcohol Test", type: "date" },
          { name: "crossBorder", label: "Cross-border (US ⇄ Canada)", type: "select", options: ["Yes", "No"], default: "No", filter: true },
          { name: "fastCardExpiry", label: "FAST Card Expiry", type: "date", expiry: true },
          { name: "passportExpiry", label: "Passport Expiry", type: "date", expiry: true },
          { name: "hireDate", label: "Hire Date", type: "date" },
          { name: "terminationDate", label: "Termination Date", type: "date" },
        ],
      },
      {
        title: "Documents",
        fields: [
          { name: "licenseFile", label: "CDL Copy (front & back)", type: "file" },
          { name: "medicalCardFile", label: "DOT Medical Card", type: "file" },
          { name: "mvrFile", label: "MVR Report", type: "file" },
          { name: "drugTestFile", label: "Drug Test Result", type: "file" },
          { name: "applicationFile", label: "Employment Application", type: "file" },
          { name: "w9File", label: "W-9 / Tax Form", type: "file" },
          { name: "passportFile", label: "Passport / FAST Card", type: "file" },
        ],
      },
      {
        title: "Pay",
        fields: [
          { name: "paymentType", label: "Default Payment Type", type: "select", options: ["Per Mile", "Percentage of Load", "Flat per Load", "Hourly", "Weekly Salary"], required: true, filter: true },
          { name: "payRate", label: "Pay Rate", type: "number", step: "0.01", hint: "$/mile, % of load, $/load, $/hour or $/week depending on type" },
          { name: "emergencyContact", label: "Emergency Contact", type: "textarea" },
          { name: "notes", label: "Notes", type: "textarea" },
        ],
      },
    ],
    columns: [
      { key: "firstName", label: "Driver", render: "title", sub: "phone" },
      { key: "city", label: "Location", render: "location" },
      { key: "paymentType", label: "Pay Type", sub: "driverType" },
      { key: "licenseNumber", label: "CDL", sub: "licenseExpiry", subRender: "expiry" },
      { key: "medicalCardExpiry", label: "Medical Card", render: "expiry" },
      { key: "status", label: "Status", render: "badge" },
    ],
  },

  trucks: {
    model: "Truck",
    label: "Trucks",
    singular: "Truck",
    icon: "Truck",
    description: "Tractors and trucks with VIN, plates, IRP / IFTA, inspections and the assigned driver.",
    title: (r) => `Unit ${r.unitNumber}`,
    refLabel: (r) => `Unit ${r.unitNumber}${r.make ? ` · ${r.make}` : ""}`,
    searchFields: ["unitNumber", "vin", "plateNumber", "make", "model"],
    sections: [
      {
        title: "Vehicle",
        fields: [
          { name: "unitNumber", label: "Unit Number", required: true, unique: true },
          { name: "status", label: "Status", type: "select", options: ["Available", "In Use", "Maintenance", "Out of Service"], default: "Available", required: true, filter: true, badge: true },
          { name: "ownership", label: "Ownership", type: "select", options: ["Company", "Owner Operator", "Leased"], default: "Company", filter: true },
          { name: "truckType", label: "Truck Type", type: "select", options: ["Sleeper Tractor", "Day Cab Tractor", "Straight / Box Truck", "Hotshot Pickup", "Cargo Van"], filter: true },
          { name: "make", label: "Make", placeholder: "Freightliner, Peterbilt, Kenworth, Volvo…" },
          { name: "model", label: "Model", placeholder: "Cascadia, 579, T680…" },
          { name: "year", label: "Year", type: "number" },
          { name: "vin", label: "VIN" },
          { name: "plateNumber", label: "License Plate" },
          { name: "plateState", label: "Plate State / Province", type: "select", options: STATES, labels: STATE_NAMES },
          { name: "odometer", label: "Odometer (miles)", type: "number" },
          { name: "eldProvider", label: "ELD Provider", placeholder: "Samsara, Motive, Omnitracs…" },
          { name: "eldSerial", label: "ELD Serial No." },
        ],
      },
      {
        title: "Assignment & compliance",
        fields: [
          { name: "assignedDriver", label: "Assigned Driver", type: "ref", ref: "drivers" },
          { name: "registrationExpiry", label: "Registration (IRP) Expiry", type: "date", expiry: true },
          { name: "inspectionExpiry", label: "Annual DOT Inspection Due", type: "date", expiry: true },
          { name: "insuranceExpiry", label: "Insurance Expiry", type: "date", expiry: true },
          { name: "iftaExpiry", label: "IFTA Decal Expiry", type: "date", expiry: true },
          { name: "hvutPaidUntil", label: "HVUT (Form 2290) Paid Until", type: "date", expiry: true },
          { name: "registrationFile", label: "Registration / Cab Card", type: "file" },
          { name: "inspectionFile", label: "Annual Inspection Report", type: "file" },
          { name: "insuranceFile", label: "Insurance Certificate (COI)", type: "file" },
          { name: "leaseFile", label: "Lease Agreement", type: "file" },
          { name: "notes", label: "Notes", type: "textarea" },
        ],
      },
    ],
    columns: [
      { key: "unitNumber", label: "Unit", sub: "plateNumber", subPrefix: "Plate " },
      { key: "make", label: "Truck", render: "makeModel", sub: "year" },
      { key: "truckType", label: "Type", sub: "ownership" },
      { key: "inspectionExpiry", label: "Inspection Due", render: "expiry" },
      { key: "assignedDriver", label: "Driver", render: "ref" },
      { key: "status", label: "Status", render: "badge" },
    ],
  },

  trailers: {
    model: "Trailer",
    label: "Trailers",
    singular: "Trailer",
    icon: "Container",
    description: "Trailers, their inspections and the truck they're hooked to.",
    title: (r) => `Trailer ${r.unitNumber}`,
    refLabel: (r) => `Trailer ${r.unitNumber}${r.type ? ` · ${r.type}` : ""}`,
    searchFields: ["unitNumber", "vin", "plateNumber", "make"],
    sections: [
      {
        title: "Trailer",
        fields: [
          { name: "unitNumber", label: "Trailer Number", required: true, unique: true },
          { name: "type", label: "Type", type: "select", options: ["Dry Van", "Reefer", "Flatbed", "Step Deck", "RGN / Lowboy", "Conestoga", "Tanker", "Hopper", "Car Hauler", "Container Chassis", "Power Only", "Other"], required: true, filter: true },
          { name: "status", label: "Status", type: "select", options: ["Available", "In Use", "Maintenance", "Out of Service"], default: "Available", required: true, filter: true, badge: true },
          { name: "ownership", label: "Ownership", type: "select", options: ["Company", "Owner Operator", "Leased", "Customer / Interchange"], default: "Company" },
          { name: "length", label: "Length (ft)", type: "number" },
          { name: "axles", label: "Axles", type: "number" },
          { name: "vin", label: "VIN" },
          { name: "plateNumber", label: "License Plate" },
          { name: "plateState", label: "Plate State / Province", type: "select", options: STATES, labels: STATE_NAMES },
          { name: "make", label: "Make", placeholder: "Utility, Great Dane, Wabash…" },
          { name: "year", label: "Year", type: "number" },
          { name: "reeferUnit", label: "Reefer Unit", placeholder: "Thermo King, Carrier…" },
        ],
      },
      {
        title: "Assignment & compliance",
        fields: [
          { name: "assignedTruck", label: "Hooked to Truck", type: "ref", ref: "trucks" },
          { name: "registrationExpiry", label: "Registration Expiry", type: "date", expiry: true },
          { name: "inspectionExpiry", label: "Annual DOT Inspection Due", type: "date", expiry: true },
          { name: "insuranceExpiry", label: "Insurance Expiry", type: "date", expiry: true },
          { name: "registrationFile", label: "Registration", type: "file" },
          { name: "inspectionFile", label: "Annual Inspection Report", type: "file" },
          { name: "notes", label: "Notes", type: "textarea" },
        ],
      },
    ],
    columns: [
      { key: "unitNumber", label: "Trailer", sub: "plateNumber", subPrefix: "Plate " },
      { key: "type", label: "Type", sub: "length", subRender: "ft" },
      { key: "inspectionExpiry", label: "Inspection Due", render: "expiry" },
      { key: "assignedTruck", label: "Truck", render: "ref" },
      { key: "status", label: "Status", render: "badge" },
    ],
  },

  companies: {
    model: "Company",
    label: "Companies",
    singular: "Company",
    icon: "Building2",
    description: "Brokers, shippers, receivers, customers and factoring companies.",
    title: (r) => r.name,
    refLabel: (r) => `${r.name}${r.city ? ` (${r.city}${r.state ? `, ${r.state}` : ""})` : ""}`,
    searchFields: ["name", "phone", "email", "mcNumber", "dotNumber", "contactPerson"],
    sections: [
      {
        title: "Company",
        fields: [
          { name: "name", label: "Company Name", required: true },
          { name: "type", label: "Type", type: "select", options: ["Broker", "Shipper", "Receiver", "Shipper & Receiver", "Direct Customer", "Factoring Company", "Vendor"], required: true, filter: true, default: "Broker" },
          { name: "mcNumber", label: "MC Number", placeholder: "MC-123456" },
          { name: "dotNumber", label: "USDOT Number" },
          { name: "taxId", label: "Tax ID (EIN / Canadian BN)" },
          { name: "contactPerson", label: "Contact Person" },
          { name: "phone", label: "Phone", type: "tel" },
          { name: "alternatePhone", label: "Alternate Phone", type: "tel" },
          { name: "email", label: "Email", type: "email" },
          { name: "website", label: "Website", placeholder: "https://example.com" },
        ],
      },
      { title: "Address", fields: [address[0], { name: "suite", label: "Suite / Unit" }, ...address.slice(1)] },
      {
        title: "Billing",
        fields: [
          { name: "billingEmail", label: "Billing / Invoice Email", type: "email" },
          { name: "paymentTerms", label: "Payment Terms", type: "select", options: ["Quick Pay", "Net 15", "Net 30", "Net 45", "Net 60", "Factored", "COD"] },
          { name: "creditLimit", label: "Credit Limit ($)", type: "number" },
          { name: "agreementFile", label: "Broker-Carrier Agreement / W-9", type: "file" },
          { name: "notes", label: "Notes", type: "textarea" },
        ],
      },
    ],
    columns: [
      { key: "name", label: "Company", sub: "mcNumber" },
      { key: "type", label: "Type" },
      { key: "city", label: "Location", render: "location" },
      { key: "phone", label: "Phone" },
      { key: "paymentTerms", label: "Terms" },
    ],
  },

  users: {
    model: "User",
    label: "Staff & Dispatchers",
    singular: "Staff Member",
    icon: "Users",
    adminOnly: true,
    description: "People who can log in: admins and dispatchers, with their documents.",
    title: (r) => r.name,
    searchFields: ["name", "email", "phone", "employeeId"],
    sections: [
      {
        title: "Account",
        fields: [
          { name: "name", label: "Full Name", required: true },
          { name: "email", label: "Email (login)", type: "email", required: true, unique: true },
          { name: "password", label: "Password", type: "password", hint: "Leave blank to keep the current password" },
          { name: "role", label: "Role", type: "select", options: ["admin", "dispatcher"], default: "dispatcher", required: true, filter: true },
          { name: "status", label: "Status", type: "select", options: ["Active", "Inactive"], default: "Active", filter: true, badge: true },
          { name: "employeeId", label: "Employee / Student ID" },
          { name: "phone", label: "Phone", type: "tel" },
          { name: "joiningDate", label: "Start Date", type: "date" },
          { name: "batch", label: "Batch" },
        ],
      },
      {
        title: "Profile",
        fields: [
          { name: "address", label: "Address", type: "textarea" },
          { name: "emergencyContact", label: "Emergency Contact", type: "textarea" },
        ],
      },
      {
        title: "Documents",
        fields: [
          { name: "resumeFile", label: "Resume / CV", type: "file" },
          { name: "photoIdFile", label: "Photo ID (Driver's Licence / Passport)", type: "file" },
          { name: "workPermitFile", label: "Work Authorization / Permit", type: "file" },
          { name: "certificateFile", label: "Dispatcher Training Certificate", type: "file" },
          { name: "contractFile", label: "Signed Agreement / NDA", type: "file" },
        ],
      },
    ],
    columns: [
      { key: "name", label: "Name", sub: "email" },
      { key: "employeeId", label: "ID" },
      { key: "role", label: "Role", render: "badge" },
      { key: "phone", label: "Phone" },
      { key: "joiningDate", label: "Started", render: "date" },
      { key: "status", label: "Status", render: "badge" },
    ],
  },

  syllabus: {
    model: "Syllabus",
    label: "Syllabus",
    singular: "Syllabus Topic",
    icon: "BookOpen",
    description: "Training topics with their PDFs.",
    title: (r) => r.topic,
    searchFields: ["topic", "shortDetails"],
    defaultSort: "sno",
    sections: [
      {
        title: "Topic",
        fields: [
          { name: "sno", label: "S.No", type: "number" },
          { name: "topic", label: "Topic", required: true },
          { name: "shortDetails", label: "Short Details" },
          { name: "pdf", label: "PDF", type: "file" },
          { name: "description", label: "Description", type: "textarea" },
        ],
      },
    ],
    columns: [
      { key: "sno", label: "S.No" },
      { key: "topic", label: "Topic" },
      { key: "shortDetails", label: "Short Details" },
      { key: "pdf", label: "PDF", render: "file" },
    ],
  },

  lectures: {
    model: "Lecture",
    label: "Daily Lectures",
    singular: "Lecture",
    icon: "Video",
    description: "Lectures shared with each batch.",
    title: (r) => r.title,
    searchFields: ["title", "batch", "description"],
    defaultSort: "-date",
    sections: [
      {
        title: "Lecture",
        fields: [
          { name: "title", label: "Title", required: true },
          { name: "date", label: "Date", type: "date", required: true },
          { name: "batch", label: "Batch", filter: true, type: "text" },
          { name: "videoUrl", label: "Video / Meeting Link", placeholder: "https://..." },
          { name: "pdf", label: "Notes PDF", type: "file" },
          { name: "description", label: "Description", type: "textarea" },
        ],
      },
    ],
    columns: [
      { key: "date", label: "Date", render: "date" },
      { key: "title", label: "Title" },
      { key: "batch", label: "Batch" },
      { key: "videoUrl", label: "Link", render: "link" },
      { key: "pdf", label: "PDF", render: "file" },
    ],
  },
};

export function allFields(cfg) {
  return cfg.sections.flatMap((s) => s.fields);
}

export function refLabel(resourceKey, rec) {
  if (!rec || typeof rec !== "object") return "";
  const cfg = RESOURCES[resourceKey];
  return (cfg.refLabel || cfg.title)(rec);
}

// Badge colors shared by every status chip in the app.
export const STATUS_COLORS = {
  Available: "bg-emerald-100 text-emerald-800",
  Active: "bg-emerald-100 text-emerald-800",
  Delivered: "bg-emerald-100 text-emerald-800",
  Paid: "bg-emerald-100 text-emerald-800",
  "On Trip": "bg-blue-100 text-blue-800",
  "In Use": "bg-blue-100 text-blue-800",
  "In Transit": "bg-blue-100 text-blue-800",
  Dispatched: "bg-indigo-100 text-indigo-800",
  "At Pickup": "bg-sky-100 text-sky-800",
  "At Delivery": "bg-sky-100 text-sky-800",
  Planned: "bg-slate-100 text-slate-700",
  Invoiced: "bg-amber-100 text-amber-800",
  admin: "bg-amber-100 text-amber-800",
  dispatcher: "bg-blue-100 text-blue-800",
  Maintenance: "bg-orange-100 text-orange-800",
  "Off Duty": "bg-slate-100 text-slate-700",
  Inactive: "bg-slate-200 text-slate-600",
  "Out of Service": "bg-red-100 text-red-700",
  Cancelled: "bg-red-100 text-red-700",
};

// Who may create/edit/delete each resource. Everyone logged in can read.
export function canWrite(resource, role) {
  if (["users", "syllabus", "lectures"].includes(resource)) return role === "admin";
  return true;
}
