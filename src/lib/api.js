import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "./db";
import { getSession } from "./auth";
import { RESOURCES, allFields } from "./resources";
import { Models, Dispatch } from "@/models"; // importing registers every model for populate()
import { ACTIVE_STATUSES } from "./dispatch";

export function json(data, status = 200) {
  return NextResponse.json(data, { status });
}

export function errorResponse(e) {
  if (e?.name === "ValidationError") {
    const msg = Object.values(e.errors).map((x) => x.message).join(", ");
    return json({ error: msg }, 400);
  }
  if (e?.code === 11000) {
    const field = Object.keys(e.keyValue || {})[0];
    return json({ error: `A record with this ${field} already exists` }, 400);
  }
  if (e?.name === "CastError") return json({ error: "Invalid id" }, 400);
  console.error(e);
  return json({ error: e?.message || "Server error" }, 500);
}

// Resource meta for the API, including dispatches which have a custom form.
export function resourceMeta(key) {
  if (key === "dispatches") {
    return {
      model: Dispatch,
      searchFields: ["loadNumber", "tripName", "customerLoadNumber", "commodity"],
      filters: ["status", "driver", "truck", "trailer", "customer"],
      populate: [
        { path: "customer", select: "name city state gstin" },
        { path: "driver", select: "firstName lastName phone" },
        { path: "teamDrivers", select: "firstName lastName" },
        { path: "truck", select: "unitNumber plateNumber make" },
        { path: "trailer", select: "unitNumber plateNumber type" },
        { path: "dispatcher", select: "name" },
        { path: "pickups.company", select: "name city state" },
        { path: "deliveries.company", select: "name city state" },
      ],
      defaultSort: "-createdAt",
    };
  }
  const cfg = RESOURCES[key];
  if (!cfg) return null;
  const fields = allFields(cfg);
  return {
    cfg,
    model: Models[key],
    fields,
    searchFields: cfg.searchFields,
    filters: fields.filter((f) => f.filter || f.type === "ref").map((f) => f.name),
    populate: fields.filter((f) => f.type === "ref").map((f) => f.name),
    defaultSort: cfg.defaultSort || "-createdAt",
    adminOnly: cfg.adminOnly,
  };
}

export async function guard(key, { write = false } = {}) {
  const session = await getSession();
  if (!session) return { error: json({ error: "Unauthorized" }, 401) };
  const meta = resourceMeta(key);
  if (!meta) return { error: json({ error: "Not found" }, 404) };
  if (meta.adminOnly && session.role !== "admin") return { error: json({ error: "Admins only" }, 403) };
  if (write && key === "syllabus" && session.role !== "admin") return { error: json({ error: "Admins only" }, 403) };
  if (write && key === "lectures" && session.role !== "admin") return { error: json({ error: "Admins only" }, 403) };
  await connectDB();
  return { session, meta };
}

const NULLABLE = new Set(["ref", "number", "date", "select"]);

export async function cleanBody(key, meta, body) {
  const out = { ...body };
  delete out._id;
  delete out.createdAt;
  delete out.updatedAt;
  delete out.__v;

  if (meta.fields) {
    for (const f of meta.fields) {
      if (!(f.name in out)) continue;
      if (out[f.name] === "" && NULLABLE.has(f.type)) out[f.name] = null;
      if (f.type === "ref" && out[f.name] && typeof out[f.name] === "object") out[f.name] = out[f.name]._id;
    }
  }

  if (key === "users") {
    if (out.password) out.password = await bcrypt.hash(String(out.password), 10);
    else delete out.password;
  }

  if (key === "dispatches") {
    delete out.loadNumber;
    delete out.checkCalls;
    for (const k of ["customer", "driver", "truck", "trailer", "dispatcher"]) {
      if (out[k] === "") out[k] = null;
      if (out[k] && typeof out[k] === "object") out[k] = out[k]._id;
    }
    if (Array.isArray(out.teamDrivers)) {
      out.teamDrivers = out.teamDrivers.map((d) => (typeof d === "object" ? d?._id : d)).filter(Boolean);
    }
    for (const list of ["pickups", "deliveries"]) {
      if (!Array.isArray(out[list])) continue;
      out[list] = out[list].map((s) => ({
        ...s,
        company: (typeof s.company === "object" ? s.company?._id : s.company) || null,
        date: s.date || null,
      }));
    }
    for (const k of ["invoiceDate"]) if (out[k] === "") out[k] = null;
  }
  return out;
}

// Keep driver / truck / trailer status in step with the dispatch status.
export async function syncFleet(dispatch) {
  const active = ACTIVE_STATUSES.includes(dispatch.status);
  const done = ["Delivered", "Invoiced", "Paid", "Cancelled"].includes(dispatch.status);
  if (!active && !done) return;
  const driverIds = [dispatch.driver, ...(dispatch.teamDrivers || [])].filter(Boolean).map((d) => d._id || d);
  const truckId = dispatch.truck?._id || dispatch.truck;
  const trailerId = dispatch.trailer?._id || dispatch.trailer;

  if (active) {
    await Models.drivers.updateMany({ _id: { $in: driverIds } }, { status: "On Trip" });
    if (truckId) await Models.trucks.updateOne({ _id: truckId }, { status: "In Use" });
    if (trailerId) await Models.trailers.updateOne({ _id: trailerId }, { status: "In Use" });
  } else {
    // Only free equipment that isn't busy on another active load.
    const others = await Dispatch.find({ _id: { $ne: dispatch._id }, status: { $in: ACTIVE_STATUSES } }).select("driver teamDrivers truck trailer").lean();
    const busyDrivers = new Set(others.flatMap((o) => [o.driver, ...(o.teamDrivers || [])].map(String)));
    const busyTrucks = new Set(others.map((o) => String(o.truck)));
    const busyTrailers = new Set(others.map((o) => String(o.trailer)));
    const freeDrivers = driverIds.filter((id) => !busyDrivers.has(String(id)));
    await Models.drivers.updateMany({ _id: { $in: freeDrivers }, status: "On Trip" }, { status: "Available" });
    if (truckId && !busyTrucks.has(String(truckId))) await Models.trucks.updateOne({ _id: truckId, status: "In Use" }, { status: "Available" });
    if (trailerId && !busyTrailers.has(String(trailerId))) await Models.trailers.updateOne({ _id: trailerId, status: "In Use" }, { status: "Available" });
  }
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function buildQuery(meta, searchParams) {
  const q = {};
  const term = searchParams.get("q")?.trim();
  if (term && meta.searchFields?.length) {
    const rx = new RegExp(escapeRegex(term), "i");
    q.$or = meta.searchFields.map((f) => ({ [f]: rx }));
  }
  for (const f of meta.filters || []) {
    const v = searchParams.get(f);
    if (v) q[f] = v;
  }
  return q;
}
