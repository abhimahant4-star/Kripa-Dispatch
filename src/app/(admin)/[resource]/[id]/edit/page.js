import ResourceForm from "@/components/ResourceForm";
import { checkResource } from "../../guard";

export default async function Page({ params }) {
  const { resource, id } = await params;
  await checkResource(resource, { write: true });
  return <ResourceForm resourceKey={resource} id={id} />;
}
