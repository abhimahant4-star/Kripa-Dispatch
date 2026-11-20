import { Suspense } from "react";
import DispatchView from "@/components/DispatchView";

export default async function Page({ params }) {
  const { id } = await params;
  return (
    <Suspense>
      <DispatchView id={id} />
    </Suspense>
  );
}
