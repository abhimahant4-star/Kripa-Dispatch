import { guard, json, errorResponse, cleanBody, syncFleet } from "@/lib/api";

export async function GET(_req, { params }) {
  const { resource, id } = await params;
  const g = await guard(resource);
  if (g.error) return g.error;
  try {
    const item = await g.meta.model.findById(id).populate(g.meta.populate).lean();
    if (!item) return json({ error: "Not found" }, 404);
    return json({ item });
  } catch (e) {
    return errorResponse(e);
  }
}

export async function PUT(req, { params }) {
  const { resource, id } = await params;
  const g = await guard(resource, { write: true });
  if (g.error) return g.error;
  try {
    const doc = await g.meta.model.findById(id);
    if (!doc) return json({ error: "Not found" }, 404);
    const body = await cleanBody(resource, g.meta, await req.json());
    const prevStatus = doc.status;
    doc.set(body);
    if (resource === "dispatches" && body.status && body.status !== prevStatus) {
      doc.checkCalls.push({ status: body.status, note: `Status changed from ${prevStatus}`, by: g.session.name });
    }
    await doc.save();
    if (resource === "dispatches") await syncFleet(doc);
    return json({ item: doc.toObject() });
  } catch (e) {
    return errorResponse(e);
  }
}

export async function DELETE(_req, { params }) {
  const { resource, id } = await params;
  const g = await guard(resource, { write: true });
  if (g.error) return g.error;
  try {
    if (resource === "users" && id === g.session.sub) return json({ error: "You can't delete your own account" }, 400);
    const doc = await g.meta.model.findByIdAndDelete(id);
    if (!doc) return json({ error: "Not found" }, 404);
    // Free the driver/truck/trailer if this load was still on the road.
    if (resource === "dispatches") {
      doc.status = "Cancelled";
      await syncFleet(doc);
    }
    return json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
