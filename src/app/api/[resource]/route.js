import { guard, json, errorResponse, buildQuery, cleanBody, syncFleet } from "@/lib/api";

export async function GET(req, { params }) {
  const { resource } = await params;
  const g = await guard(resource);
  if (g.error) return g.error;
  try {
    const { meta } = g;
    const sp = req.nextUrl.searchParams;
    const limit = Math.min(parseInt(sp.get("limit") || "25", 10) || 25, 1000);
    const page = Math.max(parseInt(sp.get("page") || "1", 10) || 1, 1);
    const sort = sp.get("sort") || meta.defaultSort;
    const query = buildQuery(meta, sp);

    const [items, total] = await Promise.all([
      meta.model.find(query).sort(sort).skip((page - 1) * limit).limit(limit).populate(meta.populate).lean(),
      meta.model.countDocuments(query),
    ]);
    return json({ items, total, page, limit });
  } catch (e) {
    return errorResponse(e);
  }
}

export async function POST(req, { params }) {
  const { resource } = await params;
  const g = await guard(resource, { write: true });
  if (g.error) return g.error;
  try {
    const body = await cleanBody(resource, g.meta, await req.json());
    if (resource === "dispatches") {
      body.dispatcher = g.session.sub;
      body.checkCalls = [{ status: body.status || "Planned", note: "Dispatch created", by: g.session.name }];
    }
    const doc = await g.meta.model.create(body);
    if (resource === "dispatches") await syncFleet(doc);
    return json({ item: doc.toObject() }, 201);
  } catch (e) {
    return errorResponse(e);
  }
}
