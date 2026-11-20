import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import Shell from "@/components/Shell";

export default async function AdminLayout({ children }) {
  const session = await getSession();
  if (!session) redirect("/login");
  return <Shell user={{ name: session.name, role: session.role, id: session.sub }}>{children}</Shell>;
}
