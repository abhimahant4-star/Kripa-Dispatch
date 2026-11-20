import ResourceView from "@/components/ResourceView";
import { checkResource } from "../guard";

export default async function Page({ params }) {
  const { resource, id } = await params;
  const session = await checkResource(resource);
  return <ResourceView resourceKey={resource} id={id} role={session.role} />;
}
