import { notFound, redirect } from "next/navigation";
import { RESOURCES, canWrite } from "@/lib/resources";
import { getSession } from "@/lib/auth";

// Validates the [resource] segment and role, returns the session.
export async function checkResource(resource, { write = false } = {}) {
  const cfg = RESOURCES[resource];
  if (!cfg) notFound();
  const session = await getSession();
  if (cfg.adminOnly && session?.role !== "admin") redirect("/dashboard");
  if (write && !canWrite(resource, session?.role)) redirect(`/${resource}`);
  return session;
}
