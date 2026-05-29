import { redirect } from "next/navigation";
import { getMe } from "@/lib/server-api";

/**
 * Server-side guard for all /parent routes. Enforces the Parent role at the
 * layout level (defense-in-depth) so child accounts cannot reach parent UI,
 * complementing the API's role-based authorization.
 */
export default async function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getMe();
  if (!user || user.role !== "Parent") {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
