import { guard, json, errorResponse, syncFleet } from "@/lib/api";
import { DISPATCH_STATUSES } from "@/lib/dispatch";

// Add a check call (location / status update) to a dispatch.
export async function POST(req, { params }) {
  const { id } = await params;
  const g = await guard("dispatches", { write: true });
  if (g.error) return g.error;
  try {
    const { status, location, note } = await req.json();
    if (status && !DISPATCH_STATUSES.includes(status)) return json({ error: "Invalid status" }, 400);
    if (!status && !location && !note) return json({ error: "Add a status, location or note" }, 400);
    const doc = await g.meta.model.findById(id);
    if (!doc) return json({ error: "Not found" }, 404);
    if (status) doc.status = status;
    if (status === "Invoiced" && !doc.invoiceDate) doc.invoiceDate = new Date();
    doc.checkCalls.push({ status: status || doc.status, location, note, by: g.session.name });
    await doc.save();
    await syncFleet(doc);
    return json({ item: doc.toObject() });
  } catch (e) {
    return errorResponse(e);
  }
}
