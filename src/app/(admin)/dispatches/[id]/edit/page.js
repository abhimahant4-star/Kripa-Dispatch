import DispatchForm from "@/components/DispatchForm";

export default async function Page({ params }) {
  const { id } = await params;
  return <DispatchForm id={id} />;
}
