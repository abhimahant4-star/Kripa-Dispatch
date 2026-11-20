import ResourceList from "@/components/ResourceList";
import { checkResource } from "./guard";

export default async function Page({ params }) {
  const { resource } = await params;
  const session = await checkResource(resource);
  return <ResourceList resourceKey={resource} role={session.role} />;
}
