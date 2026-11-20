// Single source of truth for every simple record type in the admin panel.
// The same config drives: Mongo schemas, API search/filters, list tables, view pages and forms.

export const STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana",
  "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana",
  "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  // Union territories
  "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi",
  "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry",
];
export const COUNTRIES = ["India", "Nepal", "Bhutan", "Bangladesh"];

const address = [
  { name: "street", label: "Address" },
  { name: "city", label: "City", required: true },
  { name: "state", label: "State", type: "select", options: STATES, required: true, filter: true },
  { name: "zip", label: "PIN Code" },
  { name: "country", label: "Country", type: "select", options: COUNTRIES, default: "India" },
];

export const RESOURCES = {
  drivers: {
    model: "Driver",
    label: "Drivers",
    singular: "Driver",
    icon: "IdCard",
    description: "Driver profiles, driving licence, pay type and document expiry dates.",
    title: (r) => [r.firstName, r.lastName].filter(Boolean).join(" "),
    searchFields: ["firstName", "lastName", "phone", "email", "licenseNumber"],
    sections: [
      {
        title: "Personal details",
        fields: [
          { name: "firstName", label: "First Name", required: true },
          { name: "lastName", label: "Last Name" },
          { name: "phone", label: "Mobile Number", type: "tel", required: true, placeholder: "+91 98765 43210" },
          { name: "alternatePhone", label: "Alternate Mobile", type: "tel" },
          { name: "email", label: "Email", type: "email" },
          { name: "status", label: "Status", type: "select", options: ["Available", "On Trip", "Off Duty", "Inactive"], default: "Available", required: true, filter: true, badge: true },
          { name: "aadhaarNumber", label: "Aadhaar Number" },
        ],
      },
      { title: "Address", fields: address },
      {
        title: "Licence & documents",
        fields: [
          { name: "licenseNumber", label: "Driving Licence No.", placeholder: "PB10 20190012345" },
          { name: "licenseState", label: "Licence Issuing State", type: "select", options: STATES },
          { name: "licenseExpiry", label: "Licence Valid Till", type: "date", expiry: true },
          { name: "medicalCardExpiry", label: "Medical Fitness Valid Till", type: "date", expiry: true },
          { name: "hireDate", label: "Joining Date", type: "date" },
          { name: "terminationDate", label: "Leaving Date", type: "date" },
          { name: "licenseFile", label: "Licence Copy (PDF/Image)", type: "file" },
          { name: "aadhaarFile", label: "Aadhaar Copy (PDF/Image)", type: "file" },
        ],
      },
      {
        title: "Pay",
        fields: [
          { name: "paymentType", label: "Default Payment Type", type: "select", options: ["Per KM", "Per Trip", "Monthly Salary", "Percentage of Freight"], required: true, filter: true },
          { name: "payRate", label: "Pay Rate", type: "number", step: "0.01", hint: "₹/km, ₹/trip, ₹/month or % depending on type" },
          { name: "emergencyContact", label: "Emergency Contact", type: "textarea" },
          { name: "notes", label: "Notes", type: "textarea" },
        ],
      },
    ],
    columns: [
      { key: "firstName", label: "Driver", render: "title", sub: "phone" },
      { key: "city", label: "Location", render: "location" },
      { key: "paymentType", label: "Payment Type" },
      { key: "licenseNumber", label: "Licence", sub: "licenseExpiry", subRender: "expiry" },
      { key: "status", label: "Status", render: "badge" },
    ],
  },

  trucks: {
    model: "Truck",
    label: "Trucks",
    singular: "Truck",
    icon: "Truck",
    description: "Vehicles with registration, chassis number, permits and the assigned driver.",
    title: (r) => r.plateNumber || `Unit ${r.unitNumber}`,
    refLabel: (r) => `${r.plateNumber || r.unitNumber}${r.make ? ` · ${r.make}` : ""}`,
    searchFields: ["unitNumber", "vin", "plateNumber", "make", "model"],
    sections: [
      {
        title: "Vehicle",
        fields: [
          { name: "unitNumber", label: "Fleet / Unit No.", required: true, unique: true },
          { name: "plateNumber", label: "Registration No. (RC)", placeholder: "PB10 AB 1234" },
          { name: "status", label: "Status", type: "select", options: ["Available", "In Use", "Maintenance", "Out of Service"], default: "Available", required: true, filter: true, badge: true },
          { name: "plateState", label: "Registered State", type: "select", options: STATES },
          { name: "vin", label: "Chassis No." },
          { name: "engineNumber", label: "Engine No." },
          { name: "make", label: "Make", placeholder: "Tata, Ashok Leyland, BharatBenz…" },
          { name: "model", label: "Model" },
          { name: "year", label: "Year", type: "number" },
          { name: "bodyType", label: "Body Type", type: "select", options: ["Open Body", "Closed Body / Container", "Trailer (Tractor)", "Tanker", "Tipper", "Reefer"], filter: true },
          { name: "capacity", label: "Capacity (tonnes)", type: "number", step: "0.1" },
          { name: "tyres", label: "No. of Tyres", type: "number" },
        ],
      },
      {
        title: "Assignment & documents",
        fields: [
          { name: "assignedDriver", label: "Assigned Driver", type: "ref", ref: "drivers" },
          { name: "permitType", label: "Permit Type", type: "select", options: ["National Permit", "State Permit", "All India Tourist", "Temporary"] },
          { name: "permitExpiry", label: "Permit Valid Till", type: "date", expiry: true },
          { name: "insuranceExpiry", label: "Insurance Valid Till", type: "date", expiry: true },
          { name: "fitnessExpiry", label: "Fitness Certificate Valid Till", type: "date", expiry: true },
          { name: "pucExpiry", label: "PUC Valid Till", type: "date", expiry: true },
          { name: "registrationExpiry", label: "RC Valid Till", type: "date", expiry: true },
          { name: "roadTaxExpiry", label: "Road Tax Valid Till", type: "date", expiry: true },
          { name: "fastagId", label: "FASTag ID" },
          { name: "rcFile", label: "RC Copy (PDF/Image)", type: "file" },
          { name: "notes", label: "Notes", type: "textarea" },
        ],
      },
    ],
    columns: [
      { key: "plateNumber", label: "Registration No.", sub: "unitNumber", subPrefix: "Unit " },
      { key: "make", label: "Vehicle", render: "makeModel", sub: "capacity", subRender: "tonnes" },
      { key: "bodyType", label: "Body" },
      { key: "permitExpiry", label: "Permit", render: "expiry" },
      { key: "assignedDriver", label: "Driver", render: "ref" },
      { key: "status", label: "Status", render: "badge" },
    ],
  },

  trailers: {
    model: "Trailer",
    label: "Trailers",
    singular: "Trailer",
    icon: "Container",
    description: "Trailers and containers, and the truck they're attached to.",
    title: (r) => r.plateNumber || `Trailer ${r.unitNumber}`,
    refLabel: (r) => `${r.plateNumber || r.unitNumber}${r.type ? ` · ${r.type}` : ""}`,
    searchFields: ["unitNumber", "vin", "plateNumber", "make"],
    sections: [
      {
        title: "Trailer",
        fields: [
          { name: "unitNumber", label: "Trailer / Unit No.", required: true, unique: true },
          { name: "plateNumber", label: "Registration No.", placeholder: "PB10 TR 4567" },
          { name: "type", label: "Type", type: "select", options: ["Flatbed", "Low Bed", "Semi-Low Bed", "Container 20 ft", "Container 32 ft", "Open Body", "Tanker", "Reefer", "Car Carrier", "Other"], required: true, filter: true },
          { name: "status", label: "Status", type: "select", options: ["Available", "In Use", "Maintenance", "Out of Service"], default: "Available", required: true, filter: true, badge: true },
          { name: "length", label: "Length (ft)", type: "number" },
          { name: "axles", label: "No. of Axles", type: "number" },
          { name: "vin", label: "Chassis No." },
          { name: "plateState", label: "Registered State", type: "select", options: STATES },
          { name: "make", label: "Make" },
          { name: "year", label: "Year", type: "number" },
        ],
      },
      {
        title: "Assignment & documents",
        fields: [
          { name: "assignedTruck", label: "Attached to Truck", type: "ref", ref: "trucks" },
          { name: "registrationExpiry", label: "RC Valid Till", type: "date", expiry: true },
          { name: "fitnessExpiry", label: "Fitness Certificate Valid Till", type: "date", expiry: true },
          { name: "insuranceExpiry", label: "Insurance Valid Till", type: "date", expiry: true },
          { name: "notes", label: "Notes", type: "textarea" },
        ],
      },
    ],
    columns: [
      { key: "plateNumber", label: "Registration No.", sub: "unitNumber", subPrefix: "Unit " },
      { key: "type", label: "Type", sub: "length", subRender: "ft" },
      { key: "vin", label: "Chassis No." },
      { key: "assignedTruck", label: "Truck", render: "ref" },
      { key: "status", label: "Status", render: "badge" },
    ],
  },

  companies: {
    model: "Company",
    label: "Companies",
    singular: "Company",
    icon: "Building2",
    description: "Customers, transporters, consignors (shippers) and consignees.",
    title: (r) => r.name,
    refLabel: (r) => `${r.name}${r.city ? ` (${r.city})` : ""}`,
    searchFields: ["name", "phone", "email", "gstin", "contactPerson"],
    sections: [
      {
        title: "Company",
        fields: [
          { name: "name", label: "Company Name", required: true },
          { name: "type", label: "Type", type: "select", options: ["Customer", "Transporter / Broker", "Consignor (Shipper)", "Consignee", "Consignor & Consignee", "Vendor"], required: true, filter: true, default: "Customer" },
          { name: "gstin", label: "GSTIN", placeholder: "03ABCDE1234F1Z5" },
          { name: "pan", label: "PAN" },
          { name: "contactPerson", label: "Contact Person" },
          { name: "phone", label: "Phone Number", type: "tel" },
          { name: "alternatePhone", label: "Alternate Phone", type: "tel" },
          { name: "email", label: "Email", type: "email" },
          { name: "website", label: "Website", placeholder: "https://example.com" },
        ],
      },
      { title: "Address", fields: [address[0], { name: "suite", label: "Landmark / Area" }, ...address.slice(1)] },
      {
        title: "Billing",
        fields: [
          { name: "paymentTerms", label: "Payment Terms", type: "select", options: ["Advance", "On Delivery", "7 Days", "15 Days", "30 Days", "45 Days"] },
          { name: "creditLimit", label: "Credit Limit (₹)", type: "number" },
          { name: "notes", label: "Notes", type: "textarea" },
        ],
      },
    ],
    columns: [
      { key: "name", label: "Company", sub: "gstin", subPrefix: "GSTIN " },
      { key: "type", label: "Type" },
      { key: "city", label: "Location", render: "location" },
      { key: "phone", label: "Phone" },
      { key: "contactPerson", label: "Contact" },
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
          { name: "joiningDate", label: "Joining Date", type: "date" },
          { name: "batch", label: "Batch" },
        ],
      },
      {
        title: "Profile",
        fields: [
          { name: "fatherName", label: "Father Name" },
          { name: "motherName", label: "Mother Name" },
          { name: "address", label: "Address", type: "textarea" },
        ],
      },
      {
        title: "Documents",
        fields: [
          { name: "matricFile", label: "Matric PDF", type: "file" },
          { name: "tenthFile", label: "10th PDF", type: "file" },
          { name: "aadhaarFile", label: "Aadhaar PDF", type: "file" },
        ],
      },
    ],
    columns: [
      { key: "name", label: "Name", sub: "email" },
      { key: "employeeId", label: "ID" },
      { key: "role", label: "Role", render: "badge" },
      { key: "phone", label: "Phone" },
      { key: "joiningDate", label: "Joined", render: "date" },
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
